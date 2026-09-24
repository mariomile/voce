"use client"

import { useState, useTransition } from "react"
import { updateTheme } from "@/app/actions"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/format"
import type { Priority, ThemeStatus } from "@/lib/types"

const STATUS_TONE = { roadmap: "strong", done: "positive" } as const

export function ThemeControls({
  themeId,
  priority: initialPriority,
  status: initialStatus,
}: {
  themeId: string
  priority: Priority | null
  status: ThemeStatus
}) {
  const [priority, setPriority] = useState(initialPriority)
  const [status, setStatus] = useState(initialStatus)
  const [, startTransition] = useTransition()

  function save(next: { priority: Priority | null; status: ThemeStatus }) {
    const previous = { priority, status }
    setPriority(next.priority)
    setStatus(next.status)
    startTransition(async () => {
      const result = await updateTheme({ themeId, ...next })
      if (!result.ok) {
        setPriority(previous.priority)
        setStatus(previous.status)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field quiet>
        <FieldLabel htmlFor={`priority-${themeId}`}>Priorità</FieldLabel>
        <NativeSelect
          id={`priority-${themeId}`}
          tone={priority ? "default" : "empty"}
          value={priority ?? ""}
          onChange={(e) =>
            save({ priority: (e.target.value || null) as Priority | null, status })
          }
        >
          <NativeSelectOption value="">Da impostare</NativeSelectOption>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field quiet>
        <FieldLabel htmlFor={`status-${themeId}`}>Stato</FieldLabel>
        <NativeSelect
          id={`status-${themeId}`}
          tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "default"}
          value={status}
          onChange={(e) => save({ priority, status: e.target.value as ThemeStatus })}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
    </div>
  )
}
