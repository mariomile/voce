import type { Locale } from "./locale"
import type { Messages } from "./messages/index"

// Message keys and locales are checked by TypeScript.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}
