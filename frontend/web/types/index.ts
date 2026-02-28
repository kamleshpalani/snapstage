export type StagingStyle =
  | "modern"
  | "scandinavian"
  | "luxury"
  | "coastal"
  | "industrial"
  | "traditional";

export type ProjectStatus = "pending" | "processing" | "completed" | "failed";

export type Plan = "free" | "pro" | "agency" | "payg";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  credits_remaining: number;
  credits_used: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  original_image_url: string;
  staged_image_url: string | null;
  style: StagingStyle;
  status: ProjectStatus;
  replicate_prediction_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  project_id: string | null;
  amount: number; // negative = debit, positive = credit
  description: string;
  created_at: string;
}
