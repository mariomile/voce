import { createServer } from "node:http"

// A fake Vercel AI Gateway for the end-to-end test: the app points AI_GATEWAY_BASE_URL here.
// It answers every analysis with one theme that groups all the feedback it received, quoting the
// first two, so the output passes the checks in src/lib/analysis.ts. It answers every question
// (a prompt with <question_data>) by linking and quoting the first feedback, so the output passes
// the checks in src/lib/questions.ts. A question with FUORI_SCHEMA gets text that is not JSON, and one
// with LENTA gets its answer after 20 seconds. No real model is ever called.

const PORT = Number(process.env.FAKE_GATEWAY_PORT ?? 4010)

type PromptPart = { type: string; text?: string }
type Feedback = { n: number; text: string }

type Message = { role: string; content: PromptPart[] | string }

function userText(prompt: Message[]) {
  const user = prompt.find((m) => m.role === "user")
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
        title: "I clienti chiedono l'esportazione in PDF",
        summary: "Più clienti vogliono esportare i report in PDF per condividerli.",
        kind: "opportunity",
        sentiment: "neutral",
        feedback: feedback.map((f) => f.n),
        quotes: feedback.slice(0, 2).map((f) => ({ feedback: f.n, text: f.text })),
      },
    ],
  }
}

createServer((req, res) => {
  let body = ""
  req.on("data", (chunk) => (body += chunk))
  req.on("end", () => {
    if (req.url === "/health") {
      res.writeHead(200).end("ok")
      return
    }
    if (req.method !== "POST" || !req.url?.endsWith("/language-model")) {
      res.writeHead(404).end()
      return
    }
    const text = userText(JSON.parse(body).prompt)
    const question = text.match(/<question_data>([\s\S]*)<\/question_data>/)?.[1] ?? ""
    const output = question.includes("FUORI_SCHEMA")
      ? "Ecco la risposta, senza JSON."
      : question
        ? answerFor(text)
        : themesFor(text)
    const delay = question.includes("LENTA") ? 20_000 : 0
    setTimeout(() => {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(
        JSON.stringify({
          content: [{ type: "text", text: typeof output === "string" ? output : JSON.stringify(output) }],
          finishReason: { unified: "stop", raw: "end_turn" },
          usage: {
            inputTokens: { total: 1200, noCache: 1200 },
            outputTokens: { total: 300, text: 300 },
          },
          warnings: [],
        })
      )
    }, delay)
  })
}).listen(PORT, "127.0.0.1", () => console.log(`Fake AI Gateway on http://127.0.0.1:${PORT}`))
