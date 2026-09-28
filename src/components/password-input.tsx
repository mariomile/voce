"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"

// A password field with a button that shows what was typed, and a warning while Caps Lock is on.
// The button never submits, and a click leaves the cursor in the field.
export function PasswordInput({ id, "aria-describedby": describedBy, ...props }: React.ComponentProps<"input"> & { id: string }) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const capsId = `${id}-caps`
  const checkCapsLock = (e: React.KeyboardEvent) => setCapsLock(e.getModifierState("CapsLock"))

  return (
    <>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-describedby={[describedBy, capsLock ? capsId : undefined].filter(Boolean).join(" ") || undefined}
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
          onBlur={() => setCapsLock(false)}
          className="pr-12"
        />
        <button
          type="button"
          aria-label={visible ? "Nascondi password" : "Mostra password"}
          aria-pressed={visible}
          aria-controls={id}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-1 inline-flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:text-ink"
        >
          {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
        </button>
      </div>
      <p id={capsId} aria-live="polite" className="text-sm leading-normal text-ink-muted empty:hidden">
        {capsLock ? "Bloc Maiusc è attivo." : ""}
      </p>
    </>
  )
}
