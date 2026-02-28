export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StagingStyle =
  | "modern"
  | "scandinavian"
  | "luxury"
  | "coastal"
  | "industrial"
  | "traditional";

export type ProjectStatus = "pending" | "processing" | "completed" | "failed";

export type Plan = "free" | "pro" | "agency" | "payg";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        > & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      projects: {
        Row: {
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
        };
        Insert: Omit<
          Database["public"]["Tables"]["projects"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          amount: number;
          description: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["credit_transactions"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      staging_style: StagingStyle;
      project_status: ProjectStatus;
      plan: Plan;
    };
  };
}
