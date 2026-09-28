# whynow-anthropic-citations

**Class:** doc
**Captured:** 2026-09-26 · **By:** Claude Code (problem-framer, ricerca web) · **Where:** https://claude.com/blog/introducing-citations-api

"Today, we're launching Citations, a new API feature that lets Claude ground its answers in source documents. Claude can now provide detailed references to the exact sentences and passages it uses to generate responses, leading to more verifiable, trustworthy outputs."

"Citations is generally available on the Anthropic API and Google Cloud's Vertex AI."

"Previously, developers relied on complex prompts that instruct Claude to include source information, often resulting in inconsistent performance and significant time investment in prompt engineering and testing. With Citations, users can now add source documents to the context window, and when querying the model, Claude automatically cites claims in its output that are inferred from those sources."

"Our internal evaluations show that Claude's built-in citation capabilities outperform most custom implementations, increasing recall accuracy by up to 15%."

"With Citations, developers can create AI solutions that offer enhanced accountability across use cases like: Document summarization ... Complex Q&A: Provide detailed answers to user queries across a large corpus of documents, like financial statements, with each response element traced back to specific sections of relevant texts. Customer support: Create support systems that can answer complex queries by referencing multiple product manuals, FAQs, and support tickets, always citing the exact source of information."

"When Citations is enabled, the API processes user-provided source documents (PDF documents and plain text files) by chunking them into sentences. These chunked sentences, along with user-provided context, are then passed to the model with the user's query. ... Cited text will reference source documents to minimize hallucinations."

"Citations is now available for the new Claude 3.5 Sonnet and Claude 3.5 Haiku."

Update note visible on page: "Update: Now available in Amazon Bedrock. (June 30, 2025)"

Original announcement date confirmed by independent reporting (TechCrunch, "Anthropic's new Citations feature aims to reduce AI errors," published 2025-01-23; Simon Willison's blog post dated 2025-01-24) as January 23, 2025.

Nota: conferma che dal 23 gennaio 2025 l'API di Claude offre nativamente citazioni verificabili su passaggi esatti di documenti forniti (Q&A su corpus di documenti, referenziando ticket di supporto), la capacità tecnica esatta che serve per "chiedi e ricevi risposte con citazioni a feedback specifici" in Voce: prima si doveva costruire a mano con prompt engineering fragile.
