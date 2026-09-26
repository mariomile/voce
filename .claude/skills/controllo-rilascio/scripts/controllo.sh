#!/usr/bin/env bash
# Runs the pre-release checks for Voce and prints one summary line per check:
#   RISULTATO|<check>|<OK|FALLITO|NON VERIFICABILE>|<detail>
# Full output of each check goes to $LOG_DIR/<check>.log.
# Never prints secret values: env checks compare variable names only.

set -u
cd "$(git rev-parse --show-toplevel)" || exit 2

LOG_DIR="$(mktemp -d -t controllo-rilascio)"
echo "LOG_DIR|$LOG_DIR"

result() { echo "RISULTATO|$1|$2|$3"; }

# Runs a command, logs its output, reports OK or FALLITO with the last meaningful line.
run() {
  local name="$1"; shift
  local log="$LOG_DIR/$name.log"
  if "$@" >"$log" 2>&1; then
    # Vitest summary line when there is one, otherwise the last non-empty line.
    local summary
    summary="$(grep -E '^ +Tests +[0-9]' "$log" | tail -1)"
    # pg_prove summary for the SQL database tests.
    [ -z "$summary" ] && summary="$(grep -E '^Files=' "$log" | tail -1)"
    [ -z "$summary" ] && summary="$(grep -v '^\s*$' "$log" | tail -1)"
    result "$name" "OK" "$(echo "$summary" | sed 's/^ *//' | cut -c1-160)"
  else
    result "$name" "FALLITO" "exit $?, vedi $log"
  fi
}

# --- Database: migrations from zero on the local stack, then the RLS access tests (API and SQL).
db_ok=1
if ! supabase status >/dev/null 2>&1; then
  db_ok=0
  result "test-database" "NON VERIFICABILE" "Supabase locale non attivo (supabase start)"
elif ! supabase db reset >"$LOG_DIR/db-reset.log" 2>&1; then
  db_ok=0
  result "test-database" "FALLITO" "supabase db reset fallito, vedi $LOG_DIR/db-reset.log"
else
  run "test-database" pnpm exec vitest run src/test/rls.test.ts
  run "test-database-sql" supabase test db
fi

run "typecheck" pnpm typecheck
run "lint" pnpm lint
if [ "$db_ok" = 1 ]; then
  run "test" pnpm exec vitest run --exclude src/test/rls.test.ts
else
  result "test" "NON VERIFICABILE" "i test leggono dal database locale, che non è pronto"
fi
run "build" pnpm build

# --- Secrets: committed history plus uncommitted changes, and no env file tracked by git.
secrets_log="$LOG_DIR/segreti.log"
tracked_env="$(git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$' || true)"
gitleaks git --no-banner --redact -v >"$secrets_log" 2>&1; history_rc=$?
gitleaks git --no-banner --redact -v --pre-commit >>"$secrets_log" 2>&1; diff_rc=$?
if [ -n "$tracked_env" ]; then
  result "segreti" "FALLITO" "file env tracciati da git: $(echo $tracked_env)"
elif [ "$history_rc" = 1 ] || [ "$diff_rc" = 1 ]; then
  result "segreti" "FALLITO" "gitleaks ha trovato possibili segreti, vedi $secrets_log"
elif [ "$history_rc" != 0 ] || [ "$diff_rc" != 0 ]; then
  result "segreti" "NON VERIFICABILE" "gitleaks non è riuscito a completare, vedi $secrets_log"
else
  result "segreti" "OK" "nessun segreto nella storia git né nelle modifiche non committate"
fi

# --- Migrations: every file in supabase/migrations applied locally and on the linked remote project.
mig_log="$LOG_DIR/migrazioni.log"
files="$(ls supabase/migrations/*.sql 2>/dev/null | xargs -n1 basename | cut -d_ -f1 | sort)"
# `migration list -o pretty` prints a table (the default format changes with the environment): the second column holds the versions applied to the database.
applied() { awk -F'|' '/`[0-9]+`/ { gsub(/[ `]/, "", $2); if ($2 != "") print $2 }' | sort; }
local_applied="$(supabase migration list --local -o pretty 2>>"$mig_log" | tee -a "$mig_log" | applied)"
missing_local="$(comm -23 <(echo "$files") <(echo "$local_applied") | tr '\n' ' ')"
if [ ! -f supabase/.temp/project-ref ]; then
  result "migrazioni" "NON VERIFICABILE" "nessun progetto Supabase remoto collegato (supabase link); locale: ${missing_local:-tutte applicate}"
else
  remote_applied="$(supabase migration list --linked -o pretty 2>>"$mig_log" | tee -a "$mig_log" | applied)"
  missing_remote="$(comm -23 <(echo "$files") <(echo "$remote_applied") | tr '\n' ' ')"
  if [ -z "$remote_applied" ]; then
    result "migrazioni" "NON VERIFICABILE" "impossibile leggere le migrazioni remote, vedi $mig_log"
  elif [ -n "$missing_remote$missing_local" ]; then
    result "migrazioni" "FALLITO" "non applicate. remoto: ${missing_remote:-nessuna}; locale: ${missing_local:-nessuna}"
  else
    result "migrazioni" "OK" "$(echo "$files" | wc -l | tr -d ' ') migrazioni applicate in locale e in remoto"
  fi
fi

# --- Environment: names in .env.example vs Vercel production, and code vars missing from .env.example.
env_log="$LOG_DIR/variabili.log"
if [ ! -f .env.example ]; then
  result "variabili-ambiente" "NON VERIFICABILE" ".env.example non esiste"
else
  required="$(grep -oE '^[A-Z][A-Z0-9_]*=' .env.example | tr -d '=' | sort -u)"
  documented="$(grep -oE '^#? *[A-Z][A-Z0-9_]*=' .env.example | tr -d '#= ' | sort -u)"
  in_code="$(grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' src evals 2>/dev/null | sed 's/process\.env\.//' | sort -u)"
  undocumented="$(comm -23 <(echo "$in_code") <(echo "$documented") | tr '\n' ' ')"
  if ! vercel env ls production >"$env_log" 2>&1; then
    result "variabili-ambiente" "NON VERIFICABILE" "vercel env ls non riuscito, vedi $env_log"
  else
    on_vercel="$(grep -oE '^ +[A-Z][A-Z0-9_]* ' "$env_log" | tr -d ' ' | sort -u)"
    missing="$(comm -23 <(echo "$required") <(echo "$on_vercel") | tr '\n' ' ')"
    if [ -n "$missing$undocumented" ]; then
      result "variabili-ambiente" "FALLITO" "mancanti su Vercel production: ${missing:-nessuna}; usate nel codice ma assenti da .env.example: ${undocumented:-nessuna}"
    else
      result "variabili-ambiente" "OK" "tutte le $(echo "$required" | wc -l | tr -d ' ') variabili di .env.example presenti su Vercel production"
    fi
  fi
fi
