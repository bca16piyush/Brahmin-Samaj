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
      accommodation_locations: {
        Row: {
          address: string | null
          category: string | null
          created_at: string | null
          description: string | null
          feeding_system: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          feeding_system?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          feeding_system?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_super_admin: boolean
          permissions: Database["public"]["Enums"]["admin_permission"][]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_super_admin?: boolean
          permissions?: Database["public"]["Enums"]["admin_permission"][]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_super_admin?: boolean
          permissions?: Database["public"]["Enums"]["admin_permission"][]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      booth_locations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      event_logs: {
        Row: {
          booth_location: string
          id: string
          scanned_at: string
          scanned_by: string
          user_id: string
        }
        Insert: {
          booth_location: string
          id?: string
          scanned_at?: string
          scanned_by: string
          user_id: string
        }
        Update: {
          booth_location?: string
          id?: string
          scanned_at?: string
          scanned_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attended: boolean | null
          event_id: string
          id: string
          registered_at: string | null
          reminder_sent: boolean | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          event_id: string
          id?: string
          registered_at?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attended?: boolean | null
          event_id?: string
          id?: string
          registered_at?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_live: boolean | null
          location: string | null
          map_url: string | null
          registration_limit: number | null
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
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_live?: boolean | null
          location?: string | null
          map_url?: string | null
          registration_limit?: number | null
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
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_live?: boolean | null
          location?: string | null
          map_url?: string | null
          registration_limit?: number | null
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
          media_type: string | null
          title: string
          video_url: string | null
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
          media_type?: string | null
          title: string
          video_url?: string | null
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
          media_type?: string | null
          title?: string
          video_url?: string | null
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
          donor_address: string | null
          donor_phone: string | null
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
          donor_address?: string | null
          donor_phone?: string | null
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
          donor_address?: string | null
          donor_phone?: string | null
          dropoff_location?: string
          id?: string
          item_type?: string
          notes?: string | null
          quantity?: string
          received_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_in_kind_donations_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: Database["public"]["Enums"]["inventory_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_stock_level: number
          name: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["inventory_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock_level?: number
          name: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["inventory_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock_level?: number
          name?: string
          unit?: string
          updated_at?: string | null
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
          {
            foreignKeyName: "pandit_bookings_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits_public"
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
          {
            foreignKeyName: "pandit_reviews_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits_public"
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
      past_event_videos: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "past_event_videos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_last4: string | null
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
          aadhaar_last4?: string | null
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
          aadhaar_last4?: string | null
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
      rate_limits: {
        Row: {
          action: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      room_allocations: {
        Row: {
          allocated_by: string | null
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          room_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allocated_by?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          room_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allocated_by?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          room_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_allocations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_bookings: {
        Row: {
          admin_notes: string | null
          check_in_date: string
          check_out_date: string
          created_at: string | null
          guest_names: string[] | null
          id: string
          num_guests: number
          room_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          guest_names?: string[] | null
          id?: string
          num_guests?: number
          room_id: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          guest_names?: string[] | null
          id?: string
          num_guests?: number
          room_id?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities: string[] | null
          capacity: number
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_per_night: number
          type: Database["public"]["Enums"]["room_type"]
          updated_at: string | null
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_per_night: number
          type: Database["public"]["Enums"]["room_type"]
          updated_at?: string | null
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_per_night?: number
          type?: Database["public"]["Enums"]["room_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          ac_type: string | null
          available_from: string | null
          available_to: string | null
          blocked_reason: string | null
          blocked_until: string | null
          capacity: number | null
          created_at: string | null
          floor: number | null
          id: string
          is_active: boolean | null
          is_blocked: boolean | null
          location_id: string | null
          notes: string | null
          room_number: string
          room_type_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ac_type?: string | null
          available_from?: string | null
          available_to?: string | null
          blocked_reason?: string | null
          blocked_until?: string | null
          capacity?: number | null
          created_at?: string | null
          floor?: number | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          location_id?: string | null
          notes?: string | null
          room_number: string
          room_type_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ac_type?: string | null
          available_from?: string | null
          available_to?: string | null
          blocked_reason?: string | null
          blocked_until?: string | null
          capacity?: number | null
          created_at?: string | null
          floor?: number | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          location_id?: string | null
          notes?: string | null
          room_number?: string
          room_type_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "accommodation_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_whatsapp_messages: {
        Row: {
          additional_media: Json | null
          created_at: string | null
          created_by: string
          delay_ms: number | null
          executed_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          message_template: string
          recipients: Json
          result: Json | null
          scheduled_at: string
          status: string
          title: string
        }
        Insert: {
          additional_media?: Json | null
          created_at?: string | null
          created_by: string
          delay_ms?: number | null
          executed_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_template: string
          recipients: Json
          result?: Json | null
          scheduled_at: string
          status?: string
          title: string
        }
        Update: {
          additional_media?: Json | null
          created_at?: string | null
          created_by?: string
          delay_ms?: number | null
          executed_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_template?: string
          recipients?: Json
          result?: Json | null
          scheduled_at?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          config_key: string
          config_value: Json
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      stock_in: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string
          notes: string | null
          purchase_date: string
          quantity: number
          supplier: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id: string
          notes?: string | null
          purchase_date?: string
          quantity: number
          supplier?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          purchase_date?: string
          quantity?: number
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_in_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_stock_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_out: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          exit_date: string
          id: string
          item_id: string
          notes: string | null
          purpose: string | null
          quantity: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          exit_date?: string
          id?: string
          item_id: string
          notes?: string | null
          purpose?: string | null
          quantity: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          exit_date?: string
          id?: string
          item_id?: string
          notes?: string | null
          purpose?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_out_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_out_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_stock_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string
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
      in_kind_donations_user: {
        Row: {
          created_at: string | null
          donor_address: string | null
          donor_phone: string | null
          dropoff_location: string | null
          id: string | null
          item_type: string | null
          notes: string | null
          quantity: string | null
          received_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          donor_address?: never
          donor_phone?: never
          dropoff_location?: string | null
          id?: string | null
          item_type?: string | null
          notes?: string | null
          quantity?: string | null
          received_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          donor_address?: never
          donor_phone?: never
          dropoff_location?: string | null
          id?: string | null
          item_type?: string | null
          notes?: string | null
          quantity?: string | null
          received_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_in_kind_donations_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock_balance: {
        Row: {
          category: Database["public"]["Enums"]["inventory_category"] | null
          current_stock: number | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_low_stock: boolean | null
          min_stock_level: number | null
          name: string | null
          total_stock_in: number | null
          total_stock_out: number | null
          unit: string | null
        }
        Relationships: []
      }
      pandits_public: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string | null
          experience_start_date: string | null
          expertise: string[] | null
          id: string | null
          is_active: boolean | null
          location: string | null
          name: string | null
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
          id?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          phone?: never
          photo_url?: string | null
          updated_at?: string | null
          weekly_availability?: Json | null
          whatsapp?: never
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          experience_start_date?: string | null
          expertise?: string[] | null
          id?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          phone?: never
          photo_url?: string | null
          updated_at?: string | null
          weekly_availability?: Json | null
          whatsapp?: never
        }
        Relationships: []
      }
    }
    Functions: {
      check_allocation_availability: {
        Args: {
          _check_in: string
          _check_out: string
          _exclude_allocation_id?: string
          _room_id: string
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _action: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      check_room_availability: {
        Args: {
          _check_in: string
          _check_out: string
          _exclude_booking_id?: string
          _room_id: string
        }
        Returns: boolean
      }
      get_notification_subscriptions_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email_notifications: boolean
          id: string
          push_subscription: Json
          user_id: string
          whatsapp_notifications: boolean
          whatsapp_number_masked: string
        }[]
      }
      get_whatsapp_recipients_for_notification: {
        Args: never
        Returns: {
          user_id: string
          whatsapp_number: string
        }[]
      }
      has_admin_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["admin_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_confirmed_booking: {
        Args: { _pandit_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_verified: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_permission:
        | "overview"
        | "verifications"
        | "users"
        | "pandits"
        | "bookings"
        | "donations"
        | "events"
        | "registrations"
        | "news"
        | "gallery"
        | "past_videos"
        | "rooms"
        | "inventory"
        | "bulk_whatsapp"
        | "security"
        | "audit_logs"
        | "site_settings"
        | "team"
      app_role: "admin" | "moderator" | "user" | "volunteer"
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
      inventory_category: "puja_materials" | "food_prasad" | "other"
      room_type: "dormitory" | "standard" | "deluxe" | "ac" | "non_ac"
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
      admin_permission: [
        "overview",
        "verifications",
        "users",
        "pandits",
        "bookings",
        "donations",
        "events",
        "registrations",
        "news",
        "gallery",
        "past_videos",
        "rooms",
        "inventory",
        "bulk_whatsapp",
        "security",
        "audit_logs",
        "site_settings",
        "team",
      ],
      app_role: ["admin", "moderator", "user", "volunteer"],
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
      ],
      inventory_category: ["puja_materials", "food_prasad", "other"],
      room_type: ["dormitory", "standard", "deluxe", "ac", "non_ac"],
      verification_status: ["none", "pending", "verified", "rejected"],
    },
  },
} as const
