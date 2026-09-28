"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { updateTheme } from "@/app/actions"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { Priority, ThemeStatus } from "@/lib/types"

const PRIORITY_KEYS: Priority[] = ["high", "medium", "low"]
const STATUS_KEYS: ThemeStatus[] = ["to_review", "roadmap", "done", "discarded"]
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
  const t = useTranslations("themes.controls")
  const tPriority = useTranslations("common.priority")
  const tStatus = useTranslations("common.status")
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
        <FieldLabel htmlFor={`priority-${themeId}`}>{t("priority")}</FieldLabel>
        <NativeSelect
          id={`priority-${themeId}`}
          tone={priority ? "default" : "empty"}
          value={priority ?? ""}
          onChange={(e) =>
            save({ priority: (e.target.value || null) as Priority | null, status })
          }
        >
          <NativeSelectOption value="">{t("unset")}</NativeSelectOption>
          {PRIORITY_KEYS.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {tPriority(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field quiet>
        <FieldLabel htmlFor={`status-${themeId}`}>{t("status")}</FieldLabel>
        <NativeSelect
          id={`status-${themeId}`}
          tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "default"}
          value={status}
          onChange={(e) => save({ priority, status: e.target.value as ThemeStatus })}
        >
          {STATUS_KEYS.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {tStatus(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
    </div>
  )
}
