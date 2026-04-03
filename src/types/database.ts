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
      feedbacks: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          instructor_id: string | null;
          rating: number;
          settlement_id: string;
          training_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          instructor_id?: string | null;
          rating: number;
          settlement_id: string;
          training_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          instructor_id?: string | null;
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
      settlement_rankings: {
        Row: {
          calculated_at: string;
          defense_completed: boolean;
          feedback_score: number;
          final_score: number;
          half_year_period: string;
          id: string;
          ranking_level: string;
          settlement_id: string;
          shooting_completed: boolean;
          training_score: number;
        };
        Insert: {
          calculated_at?: string;
          defense_completed?: boolean;
          feedback_score?: number;
          final_score?: number;
          half_year_period: string;
          id?: string;
          ranking_level: string;
          settlement_id: string;
          shooting_completed?: boolean;
          training_score?: number;
        };
        Update: {
          calculated_at?: string;
          defense_completed?: boolean;
          feedback_score?: number;
          final_score?: number;
          half_year_period?: string;
          id?: string;
          ranking_level?: string;
          settlement_id?: string;
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
          coordinator_name: string | null;
          coordinator_phone: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          regional_council: string | null;
        };
        Insert: {
          area: string;
          coordinator_name?: string | null;
          coordinator_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          regional_council?: string | null;
        };
        Update: {
          area?: string;
          coordinator_name?: string | null;
          coordinator_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          regional_council?: string | null;
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
          id: string;
          instructor_id: string | null;
          location: string | null;
          notes: string | null;
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
          id?: string;
          instructor_id?: string | null;
          location?: string | null;
          notes?: string | null;
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
          id?: string;
          instructor_id?: string | null;
          location?: string | null;
          notes?: string | null;
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
      users_profile: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          requested_area: string | null;
          requested_role: 'super_admin' | 'instructor' | 'mashkabat' | 'viewer' | null;
          role: 'super_admin' | 'instructor' | 'mashkabat' | 'viewer';
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          requested_area?: string | null;
          requested_role?: 'super_admin' | 'instructor' | 'mashkabat' | 'viewer' | null;
          role: 'super_admin' | 'instructor' | 'mashkabat' | 'viewer';
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          requested_area?: string | null;
          requested_role?: 'super_admin' | 'instructor' | 'mashkabat' | 'viewer' | null;
          role?: 'super_admin' | 'instructor' | 'mashkabat' | 'viewer';
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
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      has_any_role: {
        Args: {
          allowed_roles: string[];
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
export type Settlement = Tables<'settlements'>;
export type SettlementRanking = Tables<'settlement_rankings'>;
export type Training = Tables<'trainings'>;
export type TrainingSettlement = Tables<'training_settlements'>;
export type UserProfile = Tables<'users_profile'>;
export type UserSettlement = Tables<'user_settlements'>;

export type UserRole = UserProfile['role'];
export type TrainingStatus = Training['status'];
export type TrainingType = Training['training_type'];
export type AlertSeverity = Alert['severity'];
export type AlertStatus = Alert['status'];

export type LinkedSettlement = Pick<
  Settlement,
  'area' | 'id' | 'name' | 'regional_council'
>;

export type AuthProfile = UserProfile & {
  linkedSettlementIds: string[];
  linkedSettlements: LinkedSettlement[];
};
