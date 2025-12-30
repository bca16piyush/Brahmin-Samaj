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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_live: boolean | null
          location: string | null
          title: string
          updated_at: string | null
          youtube_live_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_live?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
          youtube_live_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_live?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
          youtube_live_url?: string | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          id: string
          image_url: string
          is_public: boolean | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          image_url: string
          is_public?: boolean | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          image_url?: string
          is_public?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      in_kind_donations: {
        Row: {
          created_at: string | null
          dropoff_location: string
          id: string
          item_type: string
          notes: string | null
          quantity: string
          received_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dropoff_location: string
          id?: string
          item_type: string
          notes?: string | null
          quantity: string
          received_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dropoff_location?: string
          id?: string
          item_type?: string
          notes?: string | null
          quantity?: string
          received_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monetary_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_urgent: boolean | null
          send_notification: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_urgent?: boolean | null
          send_notification?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_urgent?: boolean | null
          send_notification?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_subscriptions: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          push_subscription: Json | null
          user_id: string | null
          whatsapp_notifications: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          push_subscription?: Json | null
          user_id?: string | null
          whatsapp_notifications?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          push_subscription?: Json | null
          user_id?: string | null
          whatsapp_notifications?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      pandit_bookings: {
        Row: {
          admin_notes: string | null
          booking_date: string
          booking_time: string | null
          ceremony_type: string
          created_at: string | null
          id: string
          location: string | null
          message: string | null
          pandit_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          booking_date: string
          booking_time?: string | null
          ceremony_type: string
          created_at?: string | null
          id?: string
          location?: string | null
          message?: string | null
          pandit_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          booking_date?: string
          booking_time?: string | null
          ceremony_type?: string
          created_at?: string | null
          id?: string
          location?: string | null
          message?: string | null
          pandit_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pandit_bookings_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
        ]
      }
      pandit_expertise_options: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pandit_reviews: {
        Row: {
          ceremony_type: string | null
          created_at: string | null
          id: string
          pandit_id: string
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          ceremony_type?: string | null
          created_at?: string | null
          id?: string
          pandit_id: string
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          ceremony_type?: string | null
          created_at?: string | null
          id?: string
          pandit_id?: string
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pandit_reviews_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
        ]
      }
      pandits: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string | null
          experience_start_date: string | null
          expertise: string[] | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string | null
          weekly_availability: Json | null
          whatsapp: string | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          experience_start_date?: string | null
          expertise?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
          weekly_availability?: Json | null
          whatsapp?: string | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          experience_start_date?: string | null
          expertise?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
          weekly_availability?: Json | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          father_name: string | null
          gotra: string | null
          id: string
          mobile: string
          name: string
          native_village: string | null
          reference_mobile: string | null
          reference_person: string | null
          rejection_reason: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          father_name?: string | null
          gotra?: string | null
          id: string
          mobile: string
          name: string
          native_village?: string | null
          reference_mobile?: string | null
          reference_person?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          father_name?: string | null
          gotra?: string | null
          id?: string
          mobile?: string
          name?: string
          native_village?: string | null
          reference_mobile?: string | null
          reference_person?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      is_verified: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      verification_status: "none" | "pending" | "verified" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      verification_status: ["none", "pending", "verified", "rejected"],
    },
  },
} as const
