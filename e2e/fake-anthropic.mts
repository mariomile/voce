import { createServer } from "node:http"

// A fake Anthropic Messages API for the end-to-end test: the app points ANTHROPIC_BASE_URL here.
// It answers every analysis with one theme that groups all the feedback it received, quoting the
// first two, so the output passes the checks in src/lib/analysis.ts. It answers every question
// (a prompt with <question_data>) by linking and quoting the first feedback, so the output passes
// the checks in src/lib/questions.ts. A question with FUORI_SCHEMA gets text that is not JSON, and one
// with LENTA gets its answer after 20 seconds. It answers every verdict (a prompt with <hypotheses_data>)
// by confirming each hypothesis with the first feedback, linked and quoted in full, so the output passes
// the checks in src/lib/verdict.ts; a hypothesis with FUORI_SCHEMA gets text that is not JSON for the whole
// verdict. It answers every report (a prompt with <report_data>) with the three biggest themes, each quoting the
// start of its first quoted feedback, numbers only as placeholders, and one decision on the first theme, so the
// output passes the checks in src/lib/report.ts. No real model is ever called.
// Both calls ask for structured output (output_config.format): a request without it is rejected,
// so the test notices if the provider stops sending the schema.
// GET /calls?marker=X counts how many prompts received so far contain X: how a test proves the
// model was called once for a given question, even across submits that raced on the client.

const PORT = Number(process.env.FAKE_ANTHROPIC_PORT ?? 4010)

const prompts: string[] = []

type ContentBlock = { type: string; text?: string }
type Message = { role: string; content: ContentBlock[] | string }
type Feedback = { n: number; text: string }

function userText(messages: Message[]) {
  const user = messages.find((m) => m.role === "user")
  return Array.isArray(user?.content) ? user.content.map((p) => p.text ?? "").join("") : (user?.content ?? "")
}

function feedbackIn(text: string): Feedback[] {
  return JSON.parse(text.match(/<feedback_data>([\s\S]*)<\/feedback_data>/)?.[1] ?? "[]")
}

function answerFor(text: string) {
  const [first] = feedbackIn(text)
  return {
    answer: "I clienti chiedono di esportare i report in PDF.",
    feedback: [first.n],
    quotes: [{ feedback: first.n, text: first.text }],
  }
}

function themesFor(text: string) {
  const feedback = feedbackIn(text)
  return {
    themes: [
      {
        n: 1,
        title: "I clienti chiedono l'esportazione in PDF",
        summary: "Più clienti vogliono esportare i report in PDF per condividerli.",
        kind: "opportunity",
        sentiment: "neutral",
        quotes: feedback.slice(0, 2).map((f) => ({ feedback: f.n, text: f.text })),
      },
    ],
    assignments: feedback.map((f) => ({ feedback: f.n, themes: [1] })),
  }
}

function hypothesesIn(text: string): { n: number; text: string }[] {
  return JSON.parse(text.match(/<hypotheses_data>([\s\S]*)<\/hypotheses_data>/)?.[1] ?? "[]")
}

function verdictsFor(text: string) {
  const feedback = feedbackIn(text)
  const [first] = feedback
  const hypotheses = hypothesesIn(text)
  return {
    evidence: feedback.map((f) => ({ feedback: f.n, for: f.n === first.n ? hypotheses.map((h) => h.n) : [], against: [] })),
    hypotheses: hypotheses.map((h) => ({
      hypothesis: h.n,
      verdict: "confirmed",
      reasoning: "I clienti lo chiedono in modo esplicito.",
      quotes: [{ feedback: first.n, stance: "for", text: first.text }],
    })),
  }
}

type ReportData = {
  themes: { id: string }[]
  hypotheses: { id: string; verdict: string }[]
  quotes: { n: number; themes: string[]; text: string }[]
}

function reportFor(text: string) {
  const data: ReportData = JSON.parse(text.match(/<report_data>([\s\S]*)<\/report_data>/)?.[1] ?? "{}")
  const judged = data.hypotheses.filter((h) => h.verdict !== "none")
  return {
    summary: [
      "Il tema più grande raccoglie {T1.count} feedback su {read}.",
      ...judged.map((h) => `Un'ipotesi ha {${h.id}.for} feedback a favore e {${h.id}.against} contro.`),
      "Gli altri temi completano il quadro.",
    ],
    findings: data.themes.slice(0, 3).map((t) => {
      const quote = data.quotes.find((q) => q.themes.includes(t.id))
      return {
        theme: t.id,
        headline: `{${t.id}.count} feedback su {read} ne parlano.`,
        why: "Conta per la decisione.",
        quotes: quote ? [{ feedback: quote.n, text: quote.text.slice(0, 40).trim() }] : [],
      }
    }),
    limits: ["Nessuno ha scritto dopo aver lasciato il prodotto."],
    decisions: [{ decision: "Approfondisci il tema più grande", why: "È quello di cui si parla di più.", evidence: ["T1"] }],
  }
}

function send(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" })
  res.end(JSON.stringify(body))
}

createServer((req, res) => {
  let body = ""
  req.on("data", (chunk) => (body += chunk))
  req.on("end", () => {
    if (req.url === "/health") {
      res.writeHead(200).end("ok")
      return
    }
    if (req.method === "GET" && req.url?.startsWith("/calls")) {
      const marker = new URL(req.url, "http://localhost").searchParams.get("marker") ?? ""
      send(res, 200, { count: prompts.filter((p) => p.includes(marker)).length })
      return
    }
    if (req.method !== "POST" || req.url !== "/v1/messages") {
      res.writeHead(404).end()
      return
    }
    const request = JSON.parse(body)
    if (request.output_config?.format?.type !== "json_schema") {
      send(res, 400, {
        type: "error",
        error: { type: "invalid_request_error", message: "fake Anthropic API: expected output_config.format" },
      })
      return
    }
    const text = userText(request.messages)
    prompts.push(text)
    const question = text.match(/<question_data>([\s\S]*)<\/question_data>/)?.[1] ?? ""
    const hypotheses = text.match(/<hypotheses_data>([\s\S]*)<\/hypotheses_data>/)?.[1] ?? ""
    const output =
      question.includes("FUORI_SCHEMA") || hypotheses.includes("FUORI_SCHEMA")
        ? "Ecco la risposta, senza JSON."
        : JSON.stringify(
            question
              ? answerFor(text)
              : hypotheses
                ? verdictsFor(text)
                : text.includes("<report_data>")
                  ? reportFor(text)
                  : themesFor(text)
          )
    const delay = question.includes("LENTA") ? 20_000 : 0
    setTimeout(() => {
      send(res, 200, {
        id: "msg_fake",
        type: "message",
        role: "assistant",
        model: request.model,
        content: [{ type: "text", text: output }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 300 },
      })
    }, delay)
  })
}).listen(PORT, "127.0.0.1", () => console.log(`Fake Anthropic API on http://127.0.0.1:${PORT}`))
