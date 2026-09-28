"use client"

import { createContext, useContext, useState } from "react"

// What the Sintesi needs to share between the analyze button and the Ipotesi section: whether the last
// verdict the PM started from this page failed (S6). The note lives with the hypotheses, the click may not.
const VerdictFailure = createContext<{ failed: boolean; setFailed: (failed: boolean) => void }>({
  failed: false,
  setFailed: () => {},
})

export function SynthesisOutcome({ children }: { children: React.ReactNode }) {
  const [failed, setFailed] = useState(false)
  return <VerdictFailure value={{ failed, setFailed }}>{children}</VerdictFailure>
}

export const useVerdictFailure = () => useContext(VerdictFailure)
