export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          created_at: string
          feedback_count: number
          id: string
          kind: Database["public"]["Enums"]["analysis_kind"]
          period_start: string
          research_id: string | null
          status: Database["public"]["Enums"]["analysis_status"]
          workspace_id: string
        }
        Insert: {
          created_at?: string
          feedback_count: number
          id?: string
          kind?: Database["public"]["Enums"]["analysis_kind"]
          period_start: string
          research_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          workspace_id: string
        }
        Update: {
          created_at?: string
          feedback_count?: number
          id?: string
          kind?: Database["public"]["Enums"]["analysis_kind"]
          period_start?: string
          research_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_research_fkey"
            columns: ["workspace_id", "research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "analyses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_runs: {
        Row: {
          analysis_id: string
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          input: Json
          input_tokens: number | null
          issues: Json | null
          model: string
          output: Json | null
          output_tokens: number | null
          workspace_id: string
        }
        Insert: {
          analysis_id: string
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          input: Json
          input_tokens?: number | null
          issues?: Json | null
          model: string
          output?: Json | null
          output_tokens?: number | null
          workspace_id: string
        }
        Update: {
          analysis_id?: string
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          input?: Json
          input_tokens?: number | null
          issues?: Json | null
          model?: string
          output?: Json | null
          output_tokens?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_milestones: {
        Row: {
          event: string
          sent_at: string
          workspace_id: string
        }
        Insert: {
          event: string
          sent_at?: string
          workspace_id: string
        }
        Update: {
          event?: string
          sent_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_milestones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          channel: string
          created_at: string
          customer: string | null
          email: string | null
          id: string
          received_at: string
          research_id: string
          text: string
          workspace_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          customer?: string | null
          email?: string | null
          id?: string
          received_at?: string
          research_id: string
          text: string
          workspace_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          customer?: string | null
          email?: string | null
          id?: string
          received_at?: string
          research_id?: string
          text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_research_fkey"
            columns: ["workspace_id", "research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      question_runs: {
        Row: {
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          input: Json
          input_tokens: number | null
          issues: Json | null
          model: string
          output: Json | null
          output_tokens: number | null
          question_id: string
          workspace_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          input: Json
          input_tokens?: number | null
          issues?: Json | null
          model: string
          output?: Json | null
          output_tokens?: number | null
          question_id: string
          workspace_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          input?: Json
          input_tokens?: number | null
          issues?: Json | null
          model?: string
          output?: Json | null
          output_tokens?: number | null
          question_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_runs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          citation_count: number | null
          created_at: string
          feedback_considered: number
          feedback_count: number | null
          id: string
          outcome: Database["public"]["Enums"]["question_outcome"] | null
          status: Database["public"]["Enums"]["question_status"]
          workspace_id: string
        }
        Insert: {
          citation_count?: number | null
          created_at?: string
          feedback_considered: number
          feedback_count?: number | null
          id?: string
          outcome?: Database["public"]["Enums"]["question_outcome"] | null
          status?: Database["public"]["Enums"]["question_status"]
          workspace_id: string
        }
        Update: {
          citation_count?: number | null
          created_at?: string
          feedback_considered?: number
          feedback_count?: number | null
          id?: string
          outcome?: Database["public"]["Enums"]["question_outcome"] | null
          status?: Database["public"]["Enums"]["question_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      research: {
        Row: {
          created_at: string
          form_enabled: boolean
          form_question: string | null
          form_slug: string
          id: string
          question: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          form_enabled?: boolean
          form_question?: string | null
          form_slug: string
          id?: string
          question: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          form_enabled?: boolean
          form_question?: string | null
          form_slug?: string
          id?: string
          question?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          current_period_end: string | null
          plan: Database["public"]["Enums"]["plan"]
          stripe_customer_id: string | null
          stripe_status: string | null
          stripe_subscription_id: string | null
          stripe_synced_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cancel_at?: string | null
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["plan"]
          stripe_customer_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          stripe_synced_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cancel_at?: string | null
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["plan"]
          stripe_customer_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          stripe_synced_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_feedback: {
        Row: {
          feedback_id: string
          highlight: string | null
          quote_rank: number | null
          theme_id: string
          workspace_id: string
        }
        Insert: {
          feedback_id: string
          highlight?: string | null
          quote_rank?: number | null
          theme_id: string
          workspace_id: string
        }
        Update: {
          feedback_id?: string
          highlight?: string | null
          quote_rank?: number | null
          theme_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_feedback_workspace_id_feedback_id_fkey"
            columns: ["workspace_id", "feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "theme_feedback_workspace_id_theme_id_fkey"
            columns: ["workspace_id", "theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      themes: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["theme_kind"]
          priority: Database["public"]["Enums"]["theme_priority"] | null
          research_id: string
          sentiment: Database["public"]["Enums"]["theme_sentiment"]
          status: Database["public"]["Enums"]["theme_status"]
          summary: string
          title: string
          workspace_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["theme_kind"]
          priority?: Database["public"]["Enums"]["theme_priority"] | null
          research_id: string
          sentiment: Database["public"]["Enums"]["theme_sentiment"]
          status?: Database["public"]["Enums"]["theme_status"]
          summary: string
          title: string
          workspace_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["theme_kind"]
          priority?: Database["public"]["Enums"]["theme_priority"] | null
          research_id?: string
          sentiment?: Database["public"]["Enums"]["theme_sentiment"]
          status?: Database["public"]["Enums"]["theme_status"]
          summary?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_research_fkey"
            columns: ["workspace_id", "research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "themes_workspace_id_analysis_id_fkey"
            columns: ["workspace_id", "analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      feedback_channels: {
        Row: {
          channel: string | null
          feedback_count: number | null
          research_id: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_research_fkey"
            columns: ["workspace_id", "research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      research_feedback_stats: {
        Row: {
          channel_count: number | null
          feedback_count: number | null
          first_received_at: string | null
          last_received_at: string | null
          research_id: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_research_fkey"
            columns: ["workspace_id", "research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_stats: {
        Row: {
          feedback_count: number | null
          received_dates: string[] | null
          theme_id: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "theme_feedback_workspace_id_theme_id_fkey"
            columns: ["workspace_id", "theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
    }
    Functions: {
      create_research: {
        Args: { question: string; ws: string }
        Returns: string
      }
      fail_analysis: {
        Args: { analysis: string; error: string; run?: Json }
        Returns: undefined
      }
      fail_question: {
        Args: { error: string; question: string; run?: Json }
        Returns: undefined
      }
      finish_analysis: {
        Args: { analysis: string; run: Json; themes: Json }
        Returns: number
      }
      finish_question: {
        Args: {
          feedback_count: number
          question: string
          quotes: Json
          run: Json
        }
        Returns: Json
      }
      get_public_form: {
        Args: { slug: string }
        Returns: {
          accepting: boolean
          question: string
          workspace_name: string
        }[]
      }
      import_feedback: {
        Args: { dry_run?: boolean; research: string; rows: Json; ws: string }
        Returns: string[]
      }
      question_usage: {
        Args: { ws: string }
        Returns: {
          quota: number
          used: number
        }[]
      }
      regenerate_form_link: { Args: { research: string }; Returns: string }
      start_analysis: {
        Args: {
          feedback_count: number
          inputs: Json
          kinds: Database["public"]["Enums"]["analysis_kind"][]
          model: string
          period_start: string
          research: string
          ws: string
        }
        Returns: {
          analysis_id: string
          kind: Database["public"]["Enums"]["analysis_kind"]
          outcome: string
        }[]
      }
      start_question: {
        Args: {
          feedback_considered: number
          input: Json
          model: string
          ws: string
        }
        Returns: {
          outcome: string
          question_id: string
        }[]
      }
      submit_public_feedback: {
        Args: {
          client_ip: string
          email: string
          feedback_text: string
          slug: string
        }
        Returns: string
      }
    }
    Enums: {
      analysis_kind: "themes" | "verdict"
      analysis_status: "running" | "done" | "failed"
      member_role: "owner" | "member"
      plan: "free" | "pro"
      question_outcome: "answered" | "no_evidence"
      question_status: "running" | "done" | "failed"
      theme_kind: "problem" | "opportunity" | "praise"
      theme_priority: "high" | "medium" | "low"
      theme_sentiment: "positive" | "neutral" | "negative" | "mixed"
      theme_status: "to_review" | "roadmap" | "done" | "discarded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      analysis_kind: ["themes", "verdict"],
      analysis_status: ["running", "done", "failed"],
      member_role: ["owner", "member"],
      plan: ["free", "pro"],
      question_outcome: ["answered", "no_evidence"],
      question_status: ["running", "done", "failed"],
      theme_kind: ["problem", "opportunity", "praise"],
      theme_priority: ["high", "medium", "low"],
      theme_sentiment: ["positive", "neutral", "negative", "mixed"],
      theme_status: ["to_review", "roadmap", "done", "discarded"],
    },
  },
} as const

