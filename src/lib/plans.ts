import type { Plan } from "./types";

export const PLAN_LIMITS: Record<Plan, { feedback: number | null; analysesPerMonth: number }> = {
  free: { feedback: 100, analysesPerMonth: 3 },
  pro: { feedback: null, analysesPerMonth: 100 },
};

export const FEEDBACK_MAX_LENGTH = 2000;
export const FORM_QUESTION_MAX_LENGTH = 140;
export const CHANNEL_MAX_LENGTH = 60;
export const CUSTOMER_MAX_LENGTH = 200;
export const CSV_MAX_BYTES = 1024 * 1024;
export const CSV_MAX_ROWS = 2000;
// Same as the check on workspaces.form_slug.
export const FORM_SLUG_PATTERN = /^[a-z0-9-]{3,60}$/;
