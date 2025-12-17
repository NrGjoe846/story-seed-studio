export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_read: boolean | null
          reference_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          about: string | null
          competition_updates: boolean | null
          created_at: string
          id: string
          judge_alerts: boolean | null
          login_alerts: boolean | null
          two_factor_auth: boolean | null
          updated_at: string
          user_id: string
          user_registrations: boolean | null
        }
        Insert: {
          about?: string | null
          competition_updates?: boolean | null
          created_at?: string
          id?: string
          judge_alerts?: boolean | null
          login_alerts?: boolean | null
          two_factor_auth?: boolean | null
          updated_at?: string
          user_id: string
          user_registrations?: boolean | null
        }
        Update: {
          about?: string | null
          competition_updates?: boolean | null
          created_at?: string
          id?: string
          judge_alerts?: boolean | null
          login_alerts?: boolean | null
          two_factor_auth?: boolean | null
          updated_at?: string
          user_id?: string
          user_registrations?: boolean | null
        }
        Relationships: []
      }
      clg_registrations: {
        Row: {
          age: number
          branch: string | null
          category: string
          city: string
          college_name: string | null
          created_at: string
          degree: string | null
          email: string
          event_id: string | null
          first_name: string
          id: string
          last_name: string
          overall_views: number
          overall_votes: number
          pdf_url: string | null
          phone: string
          story_description: string
          story_title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age: number
          branch?: string | null
          category: string
          city: string
          college_name?: string | null
          created_at?: string
          degree?: string | null
          email: string
          event_id?: string | null
          first_name: string
          id?: string
          last_name: string
          overall_views?: number
          overall_votes?: number
          pdf_url?: string | null
          phone: string
          story_description: string
          story_title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: number
          branch?: string | null
          category?: string
          city?: string
          college_name?: string | null
          created_at?: string
          degree?: string | null
          email?: string
          event_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          overall_views?: number
          overall_votes?: number
          pdf_url?: string | null
          phone?: string
          story_description?: string
          story_title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clg_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      clg_votes: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          registration_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          registration_id: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          registration_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clg_votes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "clg_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          registration_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          registration_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          registration_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          banner_image: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          is_active: boolean | null
          is_payment_enabled: boolean | null
          name: string
          qr_code_url: string | null
          registration_deadline: string | null
          registration_open: boolean | null
          results_announced: boolean | null
          runner_up_id: string | null
          second_runner_up_id: string | null
          start_date: string | null
          updated_at: string | null
          voting_open: boolean | null
          winner_id: string | null
        }
        Insert: {
          banner_image?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          is_payment_enabled?: boolean | null
          name: string
          qr_code_url?: string | null
          registration_deadline?: string | null
          registration_open?: boolean | null
          results_announced?: boolean | null
          runner_up_id?: string | null
          second_runner_up_id?: string | null
          start_date?: string | null
          updated_at?: string | null
          voting_open?: boolean | null
          winner_id?: string | null
        }
        Update: {
          banner_image?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          is_payment_enabled?: boolean | null
          name?: string
          qr_code_url?: string | null
          registration_deadline?: string | null
          registration_open?: boolean | null
          results_announced?: boolean | null
          runner_up_id?: string | null
          second_runner_up_id?: string | null
          start_date?: string | null
          updated_at?: string | null
          voting_open?: boolean | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_runner_up_id_fkey"
            columns: ["runner_up_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_second_runner_up_id_fkey"
            columns: ["second_runner_up_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_date: string | null
          event_images: string[] | null
          featured: boolean | null
          id: string
          image_url: string
          participants: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_images?: string[] | null
          featured?: boolean | null
          id?: string
          image_url: string
          participants?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_images?: string[] | null
          featured?: boolean | null
          id?: string
          image_url?: string
          participants?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      judge_settings: {
        Row: {
          bio: string | null
          created_at: string
          expertise: string | null
          id: string
          review_reminders: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          expertise?: string | null
          id?: string
          review_reminders?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          expertise?: string | null
          id?: string
          review_reminders?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          grade: string | null
          guardian_contact: string | null
          guardian_name: string | null
          id: string
          institution: string | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          grade?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id: string
          institution?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          grade?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id?: string
          institution?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          age: number
          category: string
          city: string
          class_level: string | null
          cover_page_url: string | null
          created_at: string
          email: string
          event_id: string | null
          first_name: string
          id: string
          last_name: string
          overall_views: number
          overall_votes: number
          pdf_url: string | null
          phone: string
          story_description: string
          story_title: string
          updated_at: string
          user_id: string | null
          yt_link: string | null
        }
        Insert: {
          age: number
          category: string
          city: string
          class_level?: string | null
          cover_page_url?: string | null
          created_at?: string
          email: string
          event_id?: string | null
          first_name: string
          id?: string
          last_name: string
          overall_views?: number
          overall_votes?: number
          pdf_url?: string | null
          phone: string
          story_description: string
          story_title: string
          updated_at?: string
          user_id?: string | null
          yt_link?: string | null
        }
        Update: {
          age?: number
          category?: string
          city?: string
          class_level?: string | null
          cover_page_url?: string | null
          created_at?: string
          email?: string
          event_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          overall_views?: number
          overall_votes?: number
          pdf_url?: string | null
          phone?: string
          story_description?: string
          story_title?: string
          updated_at?: string
          user_id?: string | null
          yt_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          registration_id: string
          searched_user_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type?: string
          registration_id: string
          searched_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          registration_id?: string
          searched_user_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          event_updates: boolean | null
          id: string
          language: string | null
          push_notifications: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          voting_reminders: boolean | null
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          event_updates?: boolean | null
          id?: string
          language?: string | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          voting_reminders?: boolean | null
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          event_updates?: boolean | null
          id?: string
          language?: string | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          voting_reminders?: boolean | null
        }
        Relationships: []
      }
      views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          registration_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          registration_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          registration_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "views_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      voter_details: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          registration_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          registration_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voter_details_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          registration_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          registration_id: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          registration_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "judge" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "judge", "admin"],
    },
  },
} as const
