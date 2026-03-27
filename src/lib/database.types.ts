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
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          listing_id: string | null
          metadata: Json | null
          session_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_listings: {
        Row: {
          accepts_new_clients: boolean | null
          address: string
          badges: string[] | null
          booking_url: string | null
          breeds: string[] | null
          city: string
          city_slug: string
          created_at: string
          description: string
          email: string | null
          grooms_cats: boolean | null
          hours: Json[] | null
          id: string
          images: string[] | null
          is_best_in_show: boolean | null
          is_featured: boolean | null
          is_paw_verified: boolean | null
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          pet_types: string[] | null
          phone: string
          price_max: number
          price_min: number
          price_range: string
          rating: number | null
          review_count: number | null
          service_categories: string[] | null
          services: string[] | null
          short_description: string
          slug: string
          specialties: string[] | null
          state: string
          subscription_tier: string | null
          team_size: number | null
          transparent_pricing: boolean | null
          waitlist_status: string | null
          website: string | null
          year_established: number | null
          zip: string
        }
        Insert: {
          accepts_new_clients?: boolean | null
          address: string
          badges?: string[] | null
          booking_url?: string | null
          breeds?: string[] | null
          city: string
          city_slug: string
          created_at?: string
          description: string
          email?: string | null
          grooms_cats?: boolean | null
          hours?: Json[] | null
          id: string
          images?: string[] | null
          is_best_in_show?: boolean | null
          is_featured?: boolean | null
          is_paw_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          pet_types?: string[] | null
          phone: string
          price_max: number
          price_min: number
          price_range: string
          rating?: number | null
          review_count?: number | null
          service_categories?: string[] | null
          services?: string[] | null
          short_description: string
          slug: string
          specialties?: string[] | null
          state: string
          subscription_tier?: string | null
          team_size?: number | null
          transparent_pricing?: boolean | null
          waitlist_status?: string | null
          website?: string | null
          year_established?: number | null
          zip: string
        }
        Update: {
          accepts_new_clients?: boolean | null
          address?: string
          badges?: string[] | null
          booking_url?: string | null
          breeds?: string[] | null
          city?: string
          city_slug?: string
          created_at?: string
          description?: string
          email?: string | null
          grooms_cats?: boolean | null
          hours?: Json[] | null
          id?: string
          images?: string[] | null
          is_best_in_show?: boolean | null
          is_featured?: boolean | null
          is_paw_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          pet_types?: string[] | null
          phone?: string
          price_max?: number
          price_min?: number
          price_range?: string
          rating?: number | null
          review_count?: number | null
          service_categories?: string[] | null
          services?: string[] | null
          short_description?: string
          slug?: string
          specialties?: string[] | null
          state?: string
          subscription_tier?: string | null
          team_size?: number | null
          transparent_pricing?: boolean | null
          waitlist_status?: string | null
          website?: string | null
          year_established?: number | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_listings_city_slug_fkey"
            columns: ["city_slug"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          description: string
          groomer_count: number | null
          image: string
          name: string
          popular_breeds: string[] | null
          slug: string
          state: string
          state_abbr: string
        }
        Insert: {
          created_at?: string
          description: string
          groomer_count?: number | null
          image: string
          name: string
          popular_breeds?: string[] | null
          slug: string
          state: string
          state_abbr: string
        }
        Update: {
          created_at?: string
          description?: string
          groomer_count?: number | null
          image?: string
          name?: string
          popular_breeds?: string[] | null
          slug?: string
          state?: string
          state_abbr?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          message: string
          sender_email: string
          sender_name: string
          sender_phone: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          message: string
          sender_email: string
          sender_name: string
          sender_phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          message?: string
          sender_email?: string
          sender_name?: string
          sender_phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accepts_new_clients: boolean | null
          address: string | null
          badges: string[] | null
          booking_url: string | null
          breeds: string[] | null
          city: string | null
          created_at: string | null
          description: string | null
          email: string | null
          grooms_cats: boolean | null
          hours: Json | null
          id: string
          images: string[] | null
          is_best_in_show: boolean | null
          is_featured: boolean | null
          is_paw_verified: boolean | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          price_max: number | null
          price_min: number | null
          price_range: string | null
          rating: number | null
          review_count: number | null
          service_categories: string[] | null
          services: string[] | null
          short_description: string | null
          slug: string
          specialties: string[] | null
          state: string | null
          team_size: number | null
          transparent_pricing: boolean | null
          updated_at: string | null
          waitlist_status: string | null
          website: string | null
          year_established: number | null
          zip: string | null
        }
        Insert: {
          accepts_new_clients?: boolean | null
          address?: string | null
          badges?: string[] | null
          booking_url?: string | null
          breeds?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          grooms_cats?: boolean | null
          hours?: Json | null
          id?: string
          images?: string[] | null
          is_best_in_show?: boolean | null
          is_featured?: boolean | null
          is_paw_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          price_max?: number | null
          price_min?: number | null
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          service_categories?: string[] | null
          services?: string[] | null
          short_description?: string | null
          slug: string
          specialties?: string[] | null
          state?: string | null
          team_size?: number | null
          transparent_pricing?: boolean | null
          updated_at?: string | null
          waitlist_status?: string | null
          website?: string | null
          year_established?: number | null
          zip?: string | null
        }
        Update: {
          accepts_new_clients?: boolean | null
          address?: string | null
          badges?: string[] | null
          booking_url?: string | null
          breeds?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          grooms_cats?: boolean | null
          hours?: Json | null
          id?: string
          images?: string[] | null
          is_best_in_show?: boolean | null
          is_featured?: boolean | null
          is_paw_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          price_max?: number | null
          price_min?: number | null
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          service_categories?: string[] | null
          services?: string[] | null
          short_description?: string | null
          slug?: string
          specialties?: string[] | null
          state?: string | null
          team_size?: number | null
          transparent_pricing?: boolean | null
          updated_at?: string | null
          waitlist_status?: string | null
          website?: string | null
          year_established?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      listings_staging: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          scraped_data: Json | null
          source_url: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          scraped_data?: Json | null
          source_url?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          scraped_data?: Json | null
          source_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          location: string | null
          query: string
          results_count: number | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          query: string
          results_count?: number | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          query?: string
          results_count?: number | null
          session_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
