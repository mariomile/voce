import enApp from "./en/app.json"
import enAsk from "./en/ask.json"
import enAuth from "./en/auth.json"
import enBilling from "./en/billing.json"
import enCollect from "./en/collect.json"
import enCommon from "./en/common.json"
import enFeedback from "./en/feedback.json"
import enForm from "./en/form.json"
import enLanding from "./en/landing.json"
import enReport from "./en/report.json"
import enResearch from "./en/research.json"
import enRoom from "./en/room.json"
import enThemes from "./en/themes.json"
import itApp from "./it/app.json"
import itAsk from "./it/ask.json"
import itAuth from "./it/auth.json"
import itBilling from "./it/billing.json"
import itCollect from "./it/collect.json"
import itCommon from "./it/common.json"
import itFeedback from "./it/feedback.json"
import itForm from "./it/form.json"
import itLanding from "./it/landing.json"
import itReport from "./it/report.json"
import itResearch from "./it/research.json"
import itRoom from "./it/room.json"
import itThemes from "./it/themes.json"
import type { Locale } from "../locale"

// One file per area of the product, one namespace per file. Italian is the source: the English
// catalog has the same keys and placeholders (checked in messages.test.ts).
const it = {
  common: itCommon,
  landing: itLanding,
  auth: itAuth,
  app: itApp,
  research: itResearch,
  themes: itThemes,
  ask: itAsk,
  report: itReport,
  feedback: itFeedback,
  collect: itCollect,
  billing: itBilling,
  room: itRoom,
  form: itForm,
}

export type Messages = typeof it

export const messages: Record<Locale, Messages> = {
  it,
  en: {
    common: enCommon,
    landing: enLanding,
    auth: enAuth,
    app: enApp,
    research: enResearch,
    themes: enThemes,
    ask: enAsk,
    report: enReport,
    feedback: enFeedback,
    collect: enCollect,
    billing: enBilling,
    room: enRoom,
    form: enForm,
  } as Messages,
}
