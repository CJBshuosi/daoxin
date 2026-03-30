export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          nickname: string | null;
          avatar_url: string | null;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          nickname?: string | null;
          avatar_url?: string | null;
          plan?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      tracks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          color: string;
          banned: string;
          few_shot: string;
          ref_accounts: string[];
          knowledge_id: string | null;
          knowledge_seeded: boolean;
          profile_completed: boolean;
          target_audience: string;
          persona: string;
          product: string;
          content_goal: string;
          count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tracks']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tracks']['Insert']>;
      };
      memories: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          type: string;
          content: string;
          source: string;
          confidence: number;
          hit_count: number;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memories']['Row'], 'created_at' | 'updated_at' | 'embedding'> & { embedding?: number[] | null };
        Update: Partial<Database['public']['Tables']['memories']['Insert']>;
      };
      history_items: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          track_name: string;
          track_color: string;
          prompt: string;
          result: Json;
          strategy: string | null;
          used_memory_ids: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['history_items']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['history_items']['Insert']>;
      };
      performances: {
        Row: {
          id: string;
          history_item_id: string;
          track_id: string;
          user_id: string;
          platform: string;
          published_at: string | null;
          views: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          followers: number;
          completion_rate: number | null;
          avg_watch_time: number | null;
          sales: number | null;
          revenue: number | null;
          click_rate: number | null;
          strategy: string | null;
          source: string;
          recorded_at: string;
          updated_at: string;
          calibrated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['performances']['Row'], 'recorded_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['performances']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          quota_total: number;
          quota_used: number;
          quota_reset_at: string;
          started_at: string;
          expires_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
    };
  };
}
