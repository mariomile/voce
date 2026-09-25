import { createServer } from "node:http"

// A fake Vercel AI Gateway for the end-to-end test: the app points AI_GATEWAY_BASE_URL here.
// It answers every analysis with one theme that groups all the feedback it received, quoting the
// first two, so the output passes the checks in src/lib/analysis.ts. No real model is ever called.

const PORT = Number(process.env.FAKE_GATEWAY_PORT ?? 4010)

type PromptPart = { type: string; text?: string }
type Feedback = { n: number; text: string }

function themesFor(prompt: { role: string; content: PromptPart[] | string }[]) {
  const user = prompt.find((m) => m.role === "user")
  const text = Array.isArray(user?.content) ? user.content.map((p) => p.text ?? "").join("") : (user?.content ?? "")
  const data = text.match(/<feedback_data>([\s\S]*)<\/feedback_data>/)?.[1] ?? "[]"
  const feedback: Feedback[] = JSON.parse(data)
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
    const output = themesFor(JSON.parse(body).prompt)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(
      JSON.stringify({
        content: [{ type: "text", text: JSON.stringify(output) }],
        finishReason: { unified: "stop", raw: "end_turn" },
        usage: {
          inputTokens: { total: 1200, noCache: 1200 },
          outputTokens: { total: 300, text: 300 },
        },
        warnings: [],
      })
    )
  })
}).listen(PORT, "127.0.0.1", () => console.log(`Fake AI Gateway on http://127.0.0.1:${PORT}`))
