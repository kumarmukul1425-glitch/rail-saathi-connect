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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          id: string
          journey_date: string
          pnr: string
          seat_class: string
          status: string
          total_fare: number
          train_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          journey_date: string
          pnr: string
          seat_class: string
          status?: string
          total_fare: number
          train_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          journey_date?: string
          pnr?: string
          seat_class?: string
          status?: string
          total_fare?: number
          train_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "trains"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          booking_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      food_orders: {
        Row: {
          created_at: string
          delivery_station: string | null
          id: string
          items: Json
          pnr: string
          status: string
          total_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_station?: string | null
          id?: string
          items?: Json
          pnr: string
          status?: string
          total_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_station?: string | null
          id?: string
          items?: Json
          pnr?: string
          status?: string
          total_price?: number
          user_id?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          age: number
          booking_id: string
          gender: string
          id: string
          name: string
        }
        Insert: {
          age: number
          booking_id: string
          gender: string
          id?: string
          name: string
        }
        Update: {
          age?: number
          booking_id?: string
          gender?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          food_order_id: string | null
          id: string
          payment_method: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          food_order_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          food_order_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_food_order_id_fkey"
            columns: ["food_order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stations: {
        Row: {
          city: string
          code: string
          id: string
          name: string
          state: string
        }
        Insert: {
          city: string
          code: string
          id?: string
          name: string
          state: string
        }
        Update: {
          city?: string
          code?: string
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
      trains: {
        Row: {
          ac1_price: number | null
          ac1_seats: number | null
          ac2_price: number | null
          ac2_seats: number | null
          ac3_price: number | null
          ac3_seats: number | null
          arrival_time: string
          departure_time: string
          destination_code: string
          destination_station: string
          id: string
          intermediate_stops: string[] | null
          journey_duration: string
          runs_on: string[] | null
          sleeper_price: number | null
          sleeper_seats: number | null
          source_code: string
          source_station: string
          train_name: string
          train_number: string
          train_type: string
        }
        Insert: {
          ac1_price?: number | null
          ac1_seats?: number | null
          ac2_price?: number | null
          ac2_seats?: number | null
          ac3_price?: number | null
          ac3_seats?: number | null
          arrival_time: string
          departure_time: string
          destination_code: string
          destination_station: string
          id?: string
          intermediate_stops?: string[] | null
          journey_duration: string
          runs_on?: string[] | null
          sleeper_price?: number | null
          sleeper_seats?: number | null
          source_code: string
          source_station: string
          train_name: string
          train_number: string
          train_type: string
        }
        Update: {
          ac1_price?: number | null
          ac1_seats?: number | null
          ac2_price?: number | null
          ac2_seats?: number | null
          ac3_price?: number | null
          ac3_seats?: number | null
          arrival_time?: string
          departure_time?: string
          destination_code?: string
          destination_station?: string
          id?: string
          intermediate_stops?: string[] | null
          journey_duration?: string
          runs_on?: string[] | null
          sleeper_price?: number | null
          sleeper_seats?: number | null
          source_code?: string
          source_station?: string
          train_name?: string
          train_number?: string
          train_type?: string
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
      is_booking_owner: { Args: { _booking_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
