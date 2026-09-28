#!/usr/bin/env bash
# Tests the research migration on the data it has to move. The pgTAP files in supabase/tests run on a
# database that is already migrated, where the state "before" no longer exists: here the local database
# goes back to the last migration before the research one, gets the fixture, then migrates.
# Ends with a full reset (migrations and seed), so the database is as `supabase db reset` leaves it.
#
# Usage: supabase/migration-tests/run.sh [workdir]   (workdir: the folder that holds supabase/, default the repo)
set -euo pipefail

WORKDIR="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
BEFORE=20260927120000
DIR="$WORKDIR/supabase/migration-tests"

supabase db reset --local --workdir "$WORKDIR" --version "$BEFORE" --no-seed
supabase db query --local --workdir "$WORKDIR" -f "$DIR/research_before.sql" > /dev/null
supabase migration up --local --workdir "$WORKDIR"
status=0
supabase test db --local --workdir "$WORKDIR" "$DIR/research_after.test.sql" || status=$?
supabase db reset --local --workdir "$WORKDIR"
exit "$status"
