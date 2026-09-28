import { createServer } from "node:http"

// A fake Anthropic Messages API for the end-to-end test: the app points ANTHROPIC_BASE_URL here.
// It answers every analysis with one theme that groups all the feedback it received, quoting the
// first two, so the output passes the checks in src/lib/analysis.ts. No real model is ever called.
// The analysis asks for structured output (output_config.format): a request without it is rejected,
// so the test notices if the provider stops sending the schema.

const PORT = Number(process.env.FAKE_ANTHROPIC_PORT ?? 4010)

type ContentBlock = { type: string; text?: string }
type Message = { role: string; content: ContentBlock[] | string }
type Feedback = { n: number; text: string }

function themesFor(messages: Message[]) {
  const user = messages.find((m) => m.role === "user")
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
    send(res, 200, {
      id: "msg_fake",
      type: "message",
      role: "assistant",
      model: request.model,
      content: [{ type: "text", text: JSON.stringify(themesFor(request.messages)) }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 1200, output_tokens: 300 },
    })
  })
}).listen(PORT, "127.0.0.1", () => console.log(`Fake Anthropic API on http://127.0.0.1:${PORT}`))
