export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      allowed_signup_ips: {
        Row: {
          added_by_admin_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: string
        }
        Insert: {
          added_by_admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          added_by_admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "allowed_signup_ips_added_by_admin_id_fkey"
            columns: ["added_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_revenue: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          mailer_id: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          mailer_id: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          mailer_id?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_revenue_mailer_id_fkey"
            columns: ["mailer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_revenue_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_revenues: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          mailer_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          mailer_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          mailer_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_revenues_mailer_id_fkey"
            columns: ["mailer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_revenues_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actual_salary: number | null
          address: string | null
          age: number | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          entry_date: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          isp_focus: string[] | null
          last_name: string | null
          name: string | null
          phone: string | null
          role: string | null
          team_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          actual_salary?: number | null
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          entry_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          isp_focus?: string[] | null
          last_name?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          actual_salary?: number | null
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          entry_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          isp_focus?: string[] | null
          last_name?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      proxies: {
        Row: {
          added_by_mailer_id: string | null
          created_at: string
          id: string
          proxy_string: string
          status: string
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          added_by_mailer_id?: string | null
          created_at?: string
          id?: string
          proxy_string: string
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          added_by_mailer_id?: string | null
          created_at?: string
          id?: string
          proxy_string?: string
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proxies_added_by_mailer_id_fkey"
            columns: ["added_by_mailer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxies_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rdps: {
        Row: {
          added_by_mailer_id: string | null
          created_at: string
          entry_date: string | null
          id: string
          ip_address: string | null
          password_alias: string
          status: string
          team_id: string | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          added_by_mailer_id?: string | null
          created_at?: string
          entry_date?: string | null
          id?: string
          ip_address?: string | null
          password_alias: string
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          added_by_mailer_id?: string | null
          created_at?: string
          entry_date?: string | null
          id?: string
          ip_address?: string | null
          password_alias?: string
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rdps_added_by_mailer_id_fkey"
            columns: ["added_by_mailer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdps_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_emails: {
        Row: {
          added_by_mailer_id: string | null
          created_at: string
          email_address: string
          group_name: string | null
          id: string
          isp: string
          password_alias: string
          recovery_email: string | null
          status: string
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          added_by_mailer_id?: string | null
          created_at?: string
          email_address: string
          group_name?: string | null
          id?: string
          isp: string
          password_alias: string
          recovery_email?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          added_by_mailer_id?: string | null
          created_at?: string
          email_address?: string
          group_name?: string | null
          id?: string
          isp?: string
          password_alias?: string
          recovery_email?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seed_emails_added_by_mailer_id_fkey"
            columns: ["added_by_mailer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seed_emails_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seed_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      server_groups: {
        Row: {
          created_at: string | null
          id: string
          name: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "server_groups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          added_by_mailer_id: string | null
          created_at: string
          id: string
          ip_address: string
          provider: string
          server_group_id: string | null
          status: Database["public"]["Enums"]["server_status"]
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          added_by_mailer_id?: string | null
          created_at?: string
          id?: string
          ip_address: string
          provider: string
          server_group_id?: string | null
          status?: Database["public"]["Enums"]["server_status"]
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          added_by_mailer_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          provider?: string
          server_group_id?: string | null
          status?: Database["public"]["Enums"]["server_status"]
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servers_added_by_mailer_id_fkey"
            columns: ["added_by_mailer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servers_server_group_id_fkey"
            columns: ["server_group_id"]
            isOneToOne: false
            referencedRelation: "server_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
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
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pending_approval_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          profile_id: string
          profile_name: string
          profile_email: string
          profile_role: string
          user_created_at: string
        }[]
      }
    }
    Enums: {
      server_status:
        | "active"
        | "maintenance"
        | "problem"
        | "returned"
        | "pending_return_approval"
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
    Enums: {
      server_status: [
        "active",
        "maintenance",
        "problem",
        "returned",
        "pending_return_approval",
      ],
    },
  },
} as const
