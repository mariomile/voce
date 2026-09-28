import type { Plan } from "./types";

// questionsPerMonth mirrors private.questions_limit in the database, which enforces it.
export const PLAN_LIMITS: Record<Plan, { feedback: number | null; analysesPerMonth: number; questionsPerMonth: number }> = {
  free: { feedback: 100, analysesPerMonth: 3, questionsPerMonth: 10 },
  pro: { feedback: null, analysesPerMonth: 100, questionsPerMonth: 100 },
};

// The public form and the CSV import. Interview notes go up to NOTES_MAX_LENGTH, the check on feedback.text.
export const FEEDBACK_MAX_LENGTH = 2000;
export const NOTES_MAX_LENGTH = 10000;
// Same as the check on research.question and in create_research.
export const RESEARCH_QUESTION_MAX_LENGTH = 200;
export const FORM_QUESTION_MAX_LENGTH = 140;
export const CHANNEL_MAX_LENGTH = 60;
export const CUSTOMER_MAX_LENGTH = 200;
export const CSV_MAX_BYTES = 1024 * 1024;
export const CSV_MAX_ROWS = 2000;
// Same as the check on research.form_slug.
export const FORM_SLUG_PATTERN = /^[a-z0-9-]{3,60}$/;
