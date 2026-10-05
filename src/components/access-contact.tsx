import { useTranslations } from "next-intl"

// Access to Voce is closed: whoever wants to try it writes to Mario.
export const ACCESS_MAILTO = "mailto:mario@buildrs.xyz?subject=Voce"
const LINKEDIN = "https://www.linkedin.com/in/mariomiletta"

export function AccessContact({ className, withClosed = true }: { className?: string; withClosed?: boolean }) {
  const t = useTranslations("common.access")
  const link = "font-bold underline underline-offset-4"
  return (
    <p className={className}>
      {withClosed && `${t("closed")} `}
      {t.rich("contact", {
        email: (chunks) => (
          <a href={ACCESS_MAILTO} className={link}>
            {chunks}
          </a>
        ),
        linkedin: (chunks) => (
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className={link}>
            {chunks}
          </a>
        ),
      })}
    </p>
  )
}
