export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          caseId: string | null
          clientId: string
          comment: string | null
          description: string | null
          fileName: string
          fileSize: number | null
          fileType: string
          id: string
          title: string
          uploadDate: string
          url: string
          userId: string
        }
        Insert: {
          caseId?: string | null
          clientId: string
          comment?: string | null
          description?: string | null
          fileName: string
          fileSize?: number | null
          fileType: string
          id?: string
          title: string
          uploadDate?: string
          url: string
          userId: string
        }
        Update: {
          caseId?: string | null
          clientId?: string
          comment?: string | null
          description?: string | null
          fileName?: string
          fileSize?: number | null
          fileType?: string
          id?: string
          title?: string
          uploadDate?: string
          url?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_case_id_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_client_id_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          caseNumber: string | null
          category: string
          clientId: string
          createdAt: string
          description: string | null
          endDate: string | null
          id: string
          status: string
          subCategory: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          caseNumber?: string | null
          category: string
          clientId: string
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id?: string
          status: string
          subCategory?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          caseNumber?: string | null
          category?: string
          clientId?: string
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id?: string
          status?: string
          subCategory?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          addressCity: string | null
          addressNeighborhood: string | null
          addressNumber: string | null
          addressState: string | null
          addressStreet: string | null
          addressZipCode: string | null
          birthDate: string | null
          category: string
          cpf: string
          createdAt: string
          email: string | null
          gender: string | null
          govPassword: string | null
          id: string
          maritalStatus: string | null
          name: string
          nationality: string | null
          phone: string | null
          profession: string | null
          respondentAddress: string | null
          respondentCpf: string | null
          respondentName: string | null
          rgIssuingBody: string | null
          rgNumber: string | null
          status: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          addressCity?: string | null
          addressNeighborhood?: string | null
          addressNumber?: string | null
          addressState?: string | null
          addressStreet?: string | null
          addressZipCode?: string | null
          birthDate?: string | null
          category: string
          cpf: string
          createdAt?: string
          email?: string | null
          gender?: string | null
          govPassword?: string | null
          id?: string
          maritalStatus?: string | null
          name: string
          nationality?: string | null
          phone?: string | null
          profession?: string | null
          respondentAddress?: string | null
          respondentCpf?: string | null
          respondentName?: string | null
          rgIssuingBody?: string | null
          rgNumber?: string | null
          status?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          addressCity?: string | null
          addressNeighborhood?: string | null
          addressNumber?: string | null
          addressState?: string | null
          addressStreet?: string | null
          addressZipCode?: string | null
          birthDate?: string | null
          category?: string
          cpf?: string
          createdAt?: string
          email?: string | null
          gender?: string | null
          govPassword?: string | null
          id?: string
          maritalStatus?: string | null
          name?: string
          nationality?: string | null
          phone?: string | null
          profession?: string | null
          respondentAddress?: string | null
          respondentCpf?: string | null
          respondentName?: string | null
          rgIssuingBody?: string | null
          rgNumber?: string | null
          status?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: []
      }
      judicial_processes: {
        Row: {
          caseId: string | null
          clientId: string | null
          court: string | null
          dataCadastro: string | null
          defendant: string | null
          id: string
          lastResponse: string | null
          phase: string | null
          processNumber: string | null
          status: string | null
          tribunal: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          caseId?: string | null
          clientId?: string | null
          court?: string | null
          dataCadastro?: string | null
          defendant?: string | null
          id?: string
          lastResponse?: string | null
          phase?: string | null
          processNumber?: string | null
          status?: string | null
          tribunal?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          caseId?: string | null
          clientId?: string | null
          court?: string | null
          dataCadastro?: string | null
          defendant?: string | null
          id?: string
          lastResponse?: string | null
          phase?: string | null
          processNumber?: string | null
          status?: string | null
          tribunal?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "judicial_processes_case_id_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judicial_processes_client_id_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      legislacoes: {
        Row: {
          ano: string
          created_at: string
          data_publicacao: string | null
          ementa: string | null
          id: string
          link_lexml: string | null
          numero: string
          orgao_emissor: string | null
          tipo: string
          titulo: string | null
          updated_at: string
          user_id: string
          xml_bruto: string | null
        }
        Insert: {
          ano: string
          created_at?: string
          data_publicacao?: string | null
          ementa?: string | null
          id?: string
          link_lexml?: string | null
          numero: string
          orgao_emissor?: string | null
          tipo: string
          titulo?: string | null
          updated_at?: string
          user_id: string
          xml_bruto?: string | null
        }
        Update: {
          ano?: string
          created_at?: string
          data_publicacao?: string | null
          ementa?: string | null
          id?: string
          link_lexml?: string | null
          numero?: string
          orgao_emissor?: string | null
          tipo?: string
          titulo?: string | null
          updated_at?: string
          user_id?: string
          xml_bruto?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          delivery_method: string | null
          error_message: string | null
          id: string
          message_content: string | null
          notification_type: string
          sent_at: string
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          delivery_method?: string | null
          error_message?: string | null
          id?: string
          message_content?: string | null
          notification_type?: string
          sent_at?: string
          status?: string
          task_id: string
          user_id: string
        }
        Update: {
          delivery_method?: string | null
          error_message?: string | null
          id?: string
          message_content?: string | null
          notification_type?: string
          sent_at?: string
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          days_before: number
          email_enabled: boolean
          id: string
          task_id: string
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          days_before?: number
          email_enabled?: boolean
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          days_before?: number
          email_enabled?: boolean
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          assinatura_id: string | null
          created_at: string | null
          efi_charge_id: string | null
          id: string
          metodo_pagamento: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
        }
        Insert: {
          assinatura_id?: string | null
          created_at?: string | null
          efi_charge_id?: string | null
          id?: string
          metodo_pagamento?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Update: {
          assinatura_id?: string | null
          created_at?: string | null
          efi_charge_id?: string | null
          id?: string
          metodo_pagamento?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      petition_template_files: {
        Row: {
          arquivo_nome: string
          arquivo_url: string
          content_text: string | null
          file_size: number | null
          id: string
          storage_path: string | null
          template_id: string
          tipo: string
          upload_date: string
        }
        Insert: {
          arquivo_nome: string
          arquivo_url: string
          content_text?: string | null
          file_size?: number | null
          id?: string
          storage_path?: string | null
          template_id: string
          tipo: string
          upload_date?: string
        }
        Update: {
          arquivo_nome?: string
          arquivo_url?: string
          content_text?: string | null
          file_size?: number | null
          id?: string
          storage_path?: string | null
          template_id?: string
          tipo?: string
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "petition_template_files_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "petition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      petition_templates: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          ordem: string
          subtema: string
          tema: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          ordem: string
          subtema: string
          tema: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: string
          subtema?: string
          tema?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      petitions: {
        Row: {
          caseId: string | null
          clientId: string
          content: string | null
          createdAt: string
          id: string
          status: string | null
          templateId: string | null
          title: string
          type: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          caseId?: string | null
          clientId: string
          content?: string | null
          createdAt?: string
          id?: string
          status?: string | null
          templateId?: string | null
          title: string
          type?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          caseId?: string | null
          clientId?: string
          content?: string | null
          createdAt?: string
          id?: string
          status?: string | null
          templateId?: string | null
          title?: string
          type?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "petitions_case_id_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petitions_client_id_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          channels: string[] | null
          created_at: string | null
          id: string
          message_content: string | null
          notification_type: string
          scheduled_for: string
          status: string | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels?: string[] | null
          created_at?: string | null
          id?: string
          message_content?: string | null
          notification_type?: string
          scheduled_for: string
          status?: string | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels?: string[] | null
          created_at?: string | null
          id?: string
          message_content?: string | null
          notification_type?: string
          scheduled_for?: string
          status?: string | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          attachments: Json | null
          caseId: string | null
          clientId: string
          clientName: string | null
          createdAt: string
          description: string | null
          endDate: string | null
          id: string
          startDate: string | null
          status: string
          title: string
          updatedAt: string | null
          updates: Json | null
          userId: string
        }
        Insert: {
          attachments?: Json | null
          caseId?: string | null
          clientId: string
          clientName?: string | null
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id?: string
          startDate?: string | null
          status: string
          title: string
          updatedAt?: string | null
          updates?: Json | null
          userId: string
        }
        Update: {
          attachments?: Json | null
          caseId?: string | null
          clientId?: string
          clientName?: string | null
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id?: string
          startDate?: string | null
          status?: string
          title?: string
          updatedAt?: string | null
          updates?: Json | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          aprovado_por_admin: boolean | null
          aprovado_por_user_id: string | null
          assinatura_ativa: boolean | null
          assinatura_id: string | null
          city: string | null
          cpf: string | null
          created_at: string
          data_aprovacao: string | null
          data_assinatura: string | null
          id: string
          oab_number: string | null
          phone: string | null
          proximo_pagamento: string | null
          role: string | null
          state: string | null
          theme_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado_por_admin?: boolean | null
          aprovado_por_user_id?: string | null
          assinatura_ativa?: boolean | null
          assinatura_id?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_assinatura?: string | null
          id?: string
          oab_number?: string | null
          phone?: string | null
          proximo_pagamento?: string | null
          role?: string | null
          state?: string | null
          theme_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado_por_admin?: boolean | null
          aprovado_por_user_id?: string | null
          assinatura_ativa?: boolean | null
          assinatura_id?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_assinatura?: string | null
          id?: string
          oab_number?: string | null
          phone?: string | null
          proximo_pagamento?: string | null
          role?: string | null
          state?: string | null
          theme_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_expired: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      check_user_access: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_admin_user_id: string
          p_target_user_id: string
          p_action: string
          p_details?: Json
        }
        Returns: undefined
      }
      process_pending_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_payment_before_activation: {
        Args: { p_user_id: string; p_subscription_id: string }
        Returns: boolean
      }
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
