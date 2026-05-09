export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          related_settlement_id: string | null;
          related_training_id: string | null;
          severity: 'low' | 'medium' | 'high';
          status: 'open' | 'resolved';
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          related_settlement_id?: string | null;
          related_training_id?: string | null;
          severity: 'low' | 'medium' | 'high';
          status?: 'open' | 'resolved';
          title: string;
          type: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          related_settlement_id?: string | null;
          related_training_id?: string | null;
          severity?: 'low' | 'medium' | 'high';
          status?: 'open' | 'resolved';
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alerts_related_settlement_id_fkey';
            columns: ['related_settlement_id'];
            referencedRelation: 'settlements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alerts_related_training_id_fkey';
            columns: ['related_training_id'];
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_deliveries: {
        Row: {
          error_message: string | null;
          id: string;
          notification_id: string | null;
          push_token: string;
          sent_at: string;
          status: string;
          training_id: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          error_message?: string | null;
          id?: string;
          notification_id?: string | null;
          push_token: string;
          sent_at?: string;
          status?: string;
          training_id?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          error_message?: string | null;
          id?: string;
          notification_id?: string | null;
          push_token?: string;
          sent_at?: string;
          status?: string;
          training_id?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_deliveries_notification_id_fkey';
            columns: ['notification_id'];
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_deliveries_training_id_fkey';
            columns: ['training_id'];
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_params: Json | null;
          action_screen: string | null;
          body: string;
          council_id: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          read_at: string | null;
          role_scope: string | null;
          settlement_id: string | null;
          severity: 'danger' | 'info' | 'success' | 'warning';
          status: 'dismissed' | 'read' | 'unread';
          title: string;
          training_id: string | null;
          type:
            | 'general'
            | 'missing_defense_training'
            | 'missing_half_year_range'
            | 'missing_report'
            | 'new_feedback'
            | 'upcoming_training';
          user_id: string | null;
        };
        Insert: {
          action_params?: Json | null;
          action_screen?: string | null;
          body: string;
          council_id?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          read_at?: string | null;
          role_scope?: string | null;
          settlement_id?: string | null;
          severity?: 'danger' | 'info' | 'success' | 'warning';
          status?: 'dismissed' | 'read' | 'unread';
          title: string;
          training_id?: string | null;
          type:
            | 'general'
            | 'missing_defense_training'
            | 'missing_half_year_range'
            | 'missing_report'
            | 'new_feedback'
            | 'upcoming_training';
          user_id?: string | null;
        };
        Update: {
          action_params?: Json | null;
          action_screen?: string | null;
          body?: string;
          council_id?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          read_at?: string | null;
          role_scope?: string | null;
          settlement_id?: string | null;
          severity?: 'danger' | 'info' | 'success' | 'warning';
          status?: 'dismissed' | 'read' | 'unread';
          title?: string;
          training_id?: string | null;
          type?:
            | 'general'
            | 'missing_defense_training'
            | 'missing_half_year_range'
            | 'missing_report'
            | 'new_feedback'
            | 'upcoming_training';
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_settlement_id_fkey';
            columns: ['settlement_id'];
            referencedRelation: 'settlements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_council_id_fkey';
            columns: ['council_id'];
            referencedRelation: 'regional_councils';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_training_id_fkey';
            columns: ['training_id'];
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      feedbacks: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          instructor_id: string | null;
          is_legacy: boolean;
          is_training_level: boolean;
          rating: number;
          settlement_id: string;
          training_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          instructor_id?: string | null;
          is_legacy?: boolean;
          is_training_level?: boolean;
          rating: number;
          settlement_id: string;
          training_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          instructor_id?: string | null;
          is_legacy?: boolean;
          is_training_level?: boolean;
          rating?: number;
          settlement_id?: string;
          training_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedbacks_instructor_id_fkey';
            columns: ['instructor_id'];
            referencedRelation: 'users_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feedbacks_settlement_id_fkey';
            columns: ['settlement_id'];
            referencedRelation: 'settlements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feedbacks_training_id_fkey';
            columns: ['training_id'];
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      professional_content: {
        Row: {
          content_type: 'video' | 'presentation' | 'document';
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          thumbnail_url: string | null;
          title: string;
          topic: string | null;
          url: string;
        };
        Insert: {
          content_type: 'video' | 'presentation' | 'document';
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          thumbnail_url?: string | null;
          title: string;
          topic?: string | null;
          url: string;
        };
        Update: {
          content_type?: 'video' | 'presentation' | 'document';
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          thumbnail_url?: string | null;
          title?: string;
          topic?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'professional_content_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      settlement_rankings: {
        Row: {
          base_score: number;
          calculated_at: string;
          defense_completed: boolean;
          feedback_score: number;
          final_score: number;
          half_year_period: string;
          id: string;
          instructor_feedback_points: number;
          median_range_participation_percent: number | null;
          ranking_level: string;
          settlement_id: string;
          settlement_defense_participation_percent: number | null;
          shooting_completed: boolean;
          training_score: number;
        };
        Insert: {
          base_score?: number;
          calculated_at?: string;
          defense_completed?: boolean;
          feedback_score?: number;
          final_score?: number;
          half_year_period: string;
          id?: string;
          instructor_feedback_points?: number;
          median_range_participation_percent?: number | null;
          ranking_level: string;
          settlement_id: string;
          settlement_defense_participation_percent?: number | null;
          shooting_completed?: boolean;
          training_score?: number;
        };
        Update: {
          base_score?: number;
          calculated_at?: string;
          defense_completed?: boolean;
          feedback_score?: number;
          final_score?: number;
          half_year_period?: string;
          id?: string;
          instructor_feedback_points?: number;
          median_range_participation_percent?: number | null;
          ranking_level?: string;
          settlement_id?: string;
          settlement_defense_participation_percent?: number | null;
          shooting_completed?: boolean;
          training_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'settlement_rankings_settlement_id_fkey';
            columns: ['settlement_id'];
            referencedRelation: 'settlements';
            referencedColumns: ['id'];
          },
        ];
      };
      settlements: {
        Row: {
          area: string;
          council_id: string | null;
          coordinator_name: string | null;
          coordinator_phone: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          regional_council: string | null;
          total_squad_members: number | null;
        };
        Insert: {
          area: string;
          council_id?: string | null;
          coordinator_name?: string | null;
          coordinator_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          regional_council?: string | null;
          total_squad_members?: number | null;
        };
        Update: {
          area?: string;
          council_id?: string | null;
          coordinator_name?: string | null;
          coordinator_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          regional_council?: string | null;
          total_squad_members?: number | null;
        };
        Relationships: [];
      };
      regional_councils: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          plaga_name: 'פלגת לכיש' | 'פלגת נגב';
          regional_squad_name: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          plaga_name: 'פלגת לכיש' | 'פלגת נגב';
          regional_squad_name?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          plaga_name?: 'פלגת לכיש' | 'פלגת נגב';
          regional_squad_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_settlements: {
        Row: {
          created_at: string;
          id: string;
          settlement_id: string;
          training_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          settlement_id: string;
          training_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          settlement_id?: string;
          training_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'training_settlements_settlement_id_fkey';
            columns: ['settlement_id'];
            referencedRelation: 'settlements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_settlements_training_id_fkey';
            columns: ['training_id'];
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      trainings: {
        Row: {
          created_at: string;
          end_time: string | null;
          id: string;
          instructor_id: string | null;
          location: string | null;
          notes: string | null;
          settlement_attendance: Json;
          status: 'מתוכנן' | 'הושלם' | 'בוטל' | 'נדחה';
          title: string;
          training_date: string;
          training_time: string | null;
          training_type:
            | 'מטווח'
            | 'הגנת יישוב'
            | 'אימון יבש'
            | 'ריענון'
            | 'תרגיל'
            | 'אימון לילה'
            | 'חירום';
        };
        Insert: {
          created_at?: string;
          end_time?: string | null;
          id?: string;
          instructor_id?: string | null;
          location?: string | null;
          notes?: string | null;
          settlement_attendance?: Json;
          status?: 'מתוכנן' | 'הושלם' | 'בוטל' | 'נדחה';
          title: string;
          training_date: string;
          training_time?: string | null;
          training_type:
            | 'מטווח'
            | 'הגנת יישוב'
            | 'אימון יבש'
            | 'ריענון'
            | 'תרגיל'
            | 'אימון לילה'
            | 'חירום';
        };
        Update: {
          created_at?: string;
          end_time?: string | null;
          id?: string;
          instructor_id?: string | null;
          location?: string | null;
          notes?: string | null;
          settlement_attendance?: Json;
          status?: 'מתוכנן' | 'הושלם' | 'בוטל' | 'נדחה';
          title?: string;
          training_date?: string;
          training_time?: string | null;
          training_type?:
            | 'מטווח'
            | 'הגנת יישוב'
            | 'אימון יבש'
            | 'ריענון'
            | 'תרגיל'
            | 'אימון לילה'
            | 'חירום';
        };
        Relationships: [
          {
            foreignKeyName: 'trainings_instructor_id_fkey';
            columns: ['instructor_id'];
            referencedRelation: 'users_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settlements: {
        Row: {
          created_at: string;
          id: string;
          settlement_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          settlement_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          settlement_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settlements_settlement_id_fkey';
            columns: ['settlement_id'];
            referencedRelation: 'settlements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_settlements_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      user_regional_councils: {
        Row: {
          created_at: string;
          id: string;
          regional_council: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          regional_council: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          regional_council?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_regional_councils_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      user_push_tokens: {
        Row: {
          created_at: string;
          device_name: string | null;
          expo_push_token: string;
          id: string;
          is_active: boolean;
          platform: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_name?: string | null;
          expo_push_token: string;
          id?: string;
          is_active?: boolean;
          platform?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_name?: string | null;
          expo_push_token?: string;
          id?: string;
          is_active?: boolean;
          platform?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      users_profile: {
        Row: {
          approval_status: 'pending_approval' | 'approved' | 'rejected';
          assigned_plaga: 'פלגת לכיש' | 'פלגת נגב' | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          deletion_requested_at: string | null;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          requested_area: string | null;
          requested_council_id: string | null;
          requested_plaga_id: string | null;
          requested_role:
            | 'super_admin'
            | 'instructor'
            | 'machbal'
            | 'eshkol_officer'
            | 'mashkabat'
            | 'mepag'
            | 'samepag'
            | 'razar'
            | 'sarazar'
            | null;
          requested_settlement_id: string | null;
          role:
            | 'super_admin'
            | 'instructor'
            | 'machbal'
            | 'eshkol_officer'
            | 'mashkabat'
            | 'mepag'
            | 'samepag'
            | 'razar'
            | 'sarazar';
        };
        Insert: {
          approval_status?: 'pending_approval' | 'approved' | 'rejected';
          assigned_plaga?: 'פלגת לכיש' | 'פלגת נגב' | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          deletion_requested_at?: string | null;
          email?: string | null;
          full_name: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          requested_area?: string | null;
          requested_council_id?: string | null;
          requested_plaga_id?: string | null;
          requested_role?:
            | 'super_admin'
            | 'instructor'
            | 'machbal'
            | 'eshkol_officer'
            | 'mashkabat'
            | 'mepag'
            | 'samepag'
            | 'razar'
            | 'sarazar'
            | null;
          requested_settlement_id?: string | null;
          role:
            | 'super_admin'
            | 'instructor'
            | 'machbal'
            | 'eshkol_officer'
            | 'mashkabat'
            | 'mepag'
            | 'samepag'
            | 'razar'
            | 'sarazar';
        };
        Update: {
          approval_status?: 'pending_approval' | 'approved' | 'rejected';
          assigned_plaga?: 'פלגת לכיש' | 'פלגת נגב' | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          deletion_requested_at?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          requested_area?: string | null;
          requested_council_id?: string | null;
          requested_plaga_id?: string | null;
          requested_role?:
            | 'super_admin'
            | 'instructor'
            | 'machbal'
            | 'eshkol_officer'
            | 'mashkabat'
            | 'mepag'
            | 'samepag'
            | 'razar'
            | 'sarazar'
            | null;
          requested_settlement_id?: string | null;
          role?:
            | 'super_admin'
            | 'instructor'
            | 'machbal'
            | 'eshkol_officer'
            | 'mashkabat'
            | 'mepag'
            | 'samepag'
            | 'razar'
            | 'sarazar';
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_insert_feedback: {
        Args: {
          target_instructor_id: string;
        };
        Returns: boolean;
      };
      can_insert_training: {
        Args: {
          target_instructor_id: string;
        };
        Returns: boolean;
      };
      can_insert_training_settlement: {
        Args: {
          target_training_id: string;
        };
        Returns: boolean;
      };
      can_access_notification: {
        Args: {
          target_notification_id: string;
        };
        Returns: boolean;
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      delete_regional_council: {
        Args: {
          target_council_id: string;
        };
        Returns: boolean;
      };
      delete_current_user_account: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      dismiss_notification: {
        Args: {
          target_notification_id: string;
        };
        Returns: boolean;
      };
      mark_notification_as_read: {
        Args: {
          target_notification_id: string;
        };
        Returns: boolean;
      };
      admin_delete_user_account: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
      complete_phone_registration: {
        Args: {
          requested_council_id_input: string | null;
          requested_plaga_id_input: string | null;
          requested_role_input: string;
          requested_settlement_id_input: string | null;
          user_full_name: string;
        };
        Returns: boolean;
      };
      complete_email_registration: {
        Args: {
          requested_council_id_input: string | null;
          requested_plaga_id_input: string | null;
          requested_role_input: string;
          requested_settlement_id_input: string | null;
          user_full_name: string;
        };
        Returns: boolean;
      };
      list_phone_registration_options: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      list_email_registration_options: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      list_global_settlement_rankings: {
        Args: {
          period_key: string;
        };
        Returns: {
          base_score: number;
          calculated_at: string;
          council_id: string | null;
          council_name: string | null;
          defense_completed: boolean;
          feedback_score: number;
          final_score: number;
          half_year_period: string;
          instructor_feedback_points: number;
          median_range_participation_percent: number | null;
          plaga_name: string | null;
          ranking_level: string;
          regional_council: string | null;
          regional_squad_name: string | null;
          settlement_id: string;
          settlement_defense_participation_percent: number | null;
          settlement_name: string;
          shooting_completed: boolean;
          training_score: number;
        }[];
      };
      has_any_role: {
        Args: {
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      has_plaga_access: {
        Args: {
          target_plaga: string;
        };
        Returns: boolean;
      };
      has_regional_council_access: {
        Args: {
          target_regional_council: string;
        };
        Returns: boolean;
      };
      has_settlement_access: {
        Args: {
          target_settlement_id: string;
        };
        Returns: boolean;
      };
      has_training_access: {
        Args: {
          target_training_id: string;
        };
        Returns: boolean;
      };
      is_active_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_instructor: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_mashkabat: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database['public'];

export type Tables<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Row'];

export type TablesInsert<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Insert'];

export type TablesUpdate<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Update'];

export type Alert = Tables<'alerts'>;
export type Feedback = Tables<'feedbacks'>;
export type Notification = Tables<'notifications'>;
export type NotificationDelivery = Tables<'notification_deliveries'>;
export type ProfessionalContent = Tables<'professional_content'>;
export type RegionalCouncil = Tables<'regional_councils'>;
export type Council = RegionalCouncil;
export type Settlement = Tables<'settlements'>;
export type SettlementRanking = Tables<'settlement_rankings'>;
export type Training = Tables<'trainings'>;
export type TrainingSettlement = Tables<'training_settlements'>;
export type UserProfile = Tables<'users_profile'>;
export type UserPushToken = Tables<'user_push_tokens'>;
export type UserRegionalCouncil = Tables<'user_regional_councils'>;
export type UserSettlement = Tables<'user_settlements'>;

export type UserRole = UserProfile['role'];
export type ProfessionalContentType = ProfessionalContent['content_type'];
export type TrainingStatus = Training['status'];
export type TrainingType = Training['training_type'];
export type AlertSeverity = Alert['severity'];
export type AlertStatus = Alert['status'];
export type TrainingSettlementAttendance = {
  participation_rate: number | null;
  settlement_id: string;
  settlement_name: string;
  total_squad_members_snapshot: number | null;
  trained_count: number;
};
export type TrainingParticipationSummary = {
  overall_participation_rate: number | null;
  total_squad_overall: number;
  total_trained_overall: number;
};

export type LinkedSettlement = Pick<
  Settlement,
  'area' | 'council_id' | 'id' | 'name' | 'regional_council'
> & {
  plaga_name?: string | null;
};

export type AuthProfile = UserProfile & {
  linkedRegionalCouncils: string[];
  linkedSettlementIds: string[];
  linkedSettlements: LinkedSettlement[];
};
