import type { Plan } from "./types";

export const PLAN_LIMITS: Record<Plan, { feedback: number | null; analysesPerMonth: number }> = {
  free: { feedback: 100, analysesPerMonth: 3 },
  pro: { feedback: null, analysesPerMonth: 100 },
};

export const FEEDBACK_MAX_LENGTH = 2000;
export const FORM_QUESTION_MAX_LENGTH = 140;
