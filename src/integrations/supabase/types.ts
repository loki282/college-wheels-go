export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          notification_type: string
          read: boolean
          reference_id: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          notification_type: string
          read?: boolean
          reference_id?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          notification_type?: string
          read?: boolean
          reference_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          ride_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          ride_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          ride_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ride_id_fkey"
            columns: ["ride_id"]
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ride_passengers: {
        Row: {
          created_at: string
          id: string
          passenger_id: string
          ride_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          passenger_id: string
          ride_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          passenger_id?: string
          ride_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_passengers_ride_id_fkey"
            columns: ["ride_id"]
            referencedRelation: "rides"
            referencedColumns: ["id"]
          }
        ]
      }
      rides: {
        Row: {
          available_seats: number
          created_at: string
          departure_date: string
          departure_time: string
          driver_id: string
          from_location: string
          id: string
          is_quick_ride: boolean
          is_scheduled: boolean
          is_shared: boolean
          max_passengers: number
          notes: string
          price: number
          route_preview: string | null
          scheduled_for: string | null
          shared_passengers: number
          status: string
          to_location: string
        }
        Insert: {
          available_seats: number
          created_at?: string
          departure_date: string
          departure_time: string
          driver_id: string
          from_location: string
          id?: string
          is_quick_ride?: boolean
          is_scheduled?: boolean
          is_shared?: boolean
          max_passengers?: number
          notes?: string
          price: number
          route_preview?: string | null
          scheduled_for?: string | null
          shared_passengers?: number
          status?: string
          to_location: string
        }
        Update: {
          available_seats?: number
          created_at?: string
          departure_date?: string
          departure_time?: string
          driver_id?: string
          from_location?: string
          id?: string
          is_quick_ride?: boolean
          is_scheduled?: boolean
          is_shared?: boolean
          max_passengers?: number
          notes?: string
          price?: number
          route_preview?: string | null
          scheduled_for?: string | null
          shared_passengers?: number
          status?: string
          to_location?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quick_routes: {
        Row: {
          created_at: string
          distance: number
          estimated_duration: number
          from_coordinates: string
          from_location: string
          id: string
          is_active: boolean
          to_coordinates: string
          to_location: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          distance: number
          estimated_duration: number
          from_coordinates: string
          from_location: string
          id?: string
          is_active?: boolean
          to_coordinates: string
          to_location: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          distance?: number
          estimated_duration?: number
          from_coordinates?: string
          from_location?: string
          id?: string
          is_active?: boolean
          to_coordinates?: string
          to_location?: string
          updated_at?: string
        }
        Relationships: []
      }
      ride_schedules: {
        Row: {
          created_at: string
          id: string
          ride_id: string
          schedule_dates: string[] | null
          schedule_days: string[] | null
          schedule_type: "daily" | "weekly" | "custom"
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ride_id: string
          schedule_dates?: string[] | null
          schedule_days?: string[] | null
          schedule_type: "daily" | "weekly" | "custom"
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ride_id?: string
          schedule_dates?: string[] | null
          schedule_days?: string[] | null
          schedule_type?: "daily" | "weekly" | "custom"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_schedules_ride_id_fkey"
            columns: ["ride_id"]
            referencedRelation: "rides"
            referencedColumns: ["id"]
          }
        ]
      }
      ride_shares: {
        Row: {
          created_at: string
          id: string
          ride_id: string
          shared_with_id: string
          sharer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ride_id: string
          shared_with_id: string
          sharer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ride_id?: string
          shared_with_id?: string
          sharer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_shares_ride_id_fkey"
            columns: ["ride_id"]
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_shares_sharer_id_fkey"
            columns: ["sharer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
