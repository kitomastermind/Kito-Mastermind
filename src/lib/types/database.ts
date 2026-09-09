export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accountability_actions: {
        Row: {
          chapter_id: string
          completed_at: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          nudged_at: string | null
          owner_id: string
          partner_id: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["action_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          nudged_at?: string | null
          owner_id: string
          partner_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          nudged_at?: string | null
          owner_id?: string
          partner_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountability_actions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountability_actions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountability_actions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountability_actions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mastermind_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountability_actions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          aliases: string[]
          city: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          aliases?: string[]
          city: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          aliases?: string[]
          city?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          id: number
          ip_address: unknown
          metadata: Json
          occurred_at: string
          subject_id: string | null
          subject_type: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          id?: number
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          subject_id?: string | null
          subject_type: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          id?: number
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          subject_id?: string | null
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          region: string | null
          timezone: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          region?: string | null
          timezone?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          region?: string | null
          timezone?: string
        }
        Relationships: []
      }
      closed_business: {
        Row: {
          chapter_id: string
          closed_at: string
          created_at: string
          created_by: string
          id: string
          lead_id: string | null
          sale_volume: number
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          chapter_id: string
          closed_at: string
          created_at?: string
          created_by: string
          id?: string
          lead_id?: string | null
          sale_volume: number
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          chapter_id?: string
          closed_at?: string
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string | null
          sale_volume?: number
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "closed_business_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_business_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_business_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_business_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_business_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      closed_business_participants: {
        Row: {
          closed_business_id: string
          confirmed_at: string | null
          credit_share: number
          id: string
          participant_role: string
          profile_id: string
        }
        Insert: {
          closed_business_id: string
          confirmed_at?: string | null
          credit_share: number
          id?: string
          participant_role: string
          profile_id: string
        }
        Update: {
          closed_business_id?: string
          confirmed_at?: string | null
          credit_share?: number
          id?: string
          participant_role?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closed_business_participants_closed_business_id_fkey"
            columns: ["closed_business_id"]
            isOneToOne: false
            referencedRelation: "closed_business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_business_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_access_requests: {
        Row: {
          decline_reason: string | null
          expires_at: string
          id: string
          lead_id: string
          match_id: string | null
          message: string | null
          owner_id: string
          requested_at: string
          requester_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          decline_reason?: string | null
          expires_at: string
          id?: string
          lead_id: string
          match_id?: string | null
          message?: string | null
          owner_id: string
          requested_at?: string
          requester_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          decline_reason?: string | null
          expires_at?: string
          id?: string
          lead_id?: string
          match_id?: string | null
          message?: string | null
          owner_id?: string
          requested_at?: string
          requester_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "contact_access_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_access_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_access_requests_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "lead_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_access_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_access_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          chapter_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          period_key: string | null
          profile_id: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["contribution_type"]
          updated_at: string
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          amount: number
          chapter_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          period_key?: string | null
          profile_id: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["contribution_type"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          amount?: number
          chapter_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          period_key?: string | null
          profile_id?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["contribution_type"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_connections: {
        Row: {
          access_token_enc: string
          connected: boolean
          connected_at: string | null
          id: string
          profile_id: string
          provider: Database["public"]["Enums"]["crm_provider"]
          refresh_token_enc: string | null
        }
        Insert: {
          access_token_enc: string
          connected?: boolean
          connected_at?: string | null
          id?: string
          profile_id: string
          provider: Database["public"]["Enums"]["crm_provider"]
          refresh_token_enc?: string | null
        }
        Update: {
          access_token_enc?: string
          connected?: boolean
          connected_at?: string | null
          id?: string
          profile_id?: string
          provider?: Database["public"]["Enums"]["crm_provider"]
          refresh_token_enc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          chapter_id: string
          created_at: string
          end_date: string
          id: string
          name: string
          points_cap: number
          start_date: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          points_cap?: number
          start_date: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          points_cap?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      dues_schedules: {
        Row: {
          amount: number
          chapter_id: string
          day_of_month: number
          effective_from: string
          effective_to: string | null
          id: string
        }
        Insert: {
          amount: number
          chapter_id: string
          day_of_month: number
          effective_from: string
          effective_to?: string | null
          id?: string
        }
        Update: {
          amount?: number
          chapter_id?: string
          day_of_month?: number
          effective_from?: string
          effective_to?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dues_schedules_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          edited_at: string | null
          headline: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          topic_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          edited_at?: string | null
          headline: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          topic_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          headline?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_hidden_by_fkey"
            columns: ["hidden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_ratings: {
        Row: {
          created_at: string
          id: string
          post_id: string
          profile_id: string
          stars: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          profile_id: string
          stars: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          profile_id?: string
          stars?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_post_stats"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "forum_ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_ratings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          hidden_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_post_stats"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          chapter_id: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          month: string
          opens_at: string
          title: string
          voting_closes_at: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          month: string
          opens_at: string
          title: string
          voting_closes_at: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          month?: string
          opens_at?: string
          title?: string
          voting_closes_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          chapter_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          chapter_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          chapter_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activity: {
        Row: {
          actor_id: string
          from_status: Database["public"]["Enums"]["lead_status"] | null
          id: number
          kind: string
          lead_id: string
          occurred_at: string
          to_status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          actor_id: string
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: number
          kind: string
          lead_id: string
          occurred_at?: string
          to_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          actor_id?: string
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: number
          kind?: string
          lead_id?: string
          occurred_at?: string
          to_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contact_grants: {
        Row: {
          expires_at: string | null
          granted_at: string
          grantee_id: string
          grantor_id: string
          id: string
          last_viewed_at: string | null
          lead_id: string
          request_id: string | null
          revoked_at: string | null
          revoked_reason: string | null
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          grantee_id: string
          grantor_id: string
          id?: string
          last_viewed_at?: string | null
          lead_id: string
          request_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          grantee_id?: string
          grantor_id?: string
          id?: string
          last_viewed_at?: string | null
          lead_id?: string
          request_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_contact_grants_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contact_grants_grantor_id_fkey"
            columns: ["grantor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contact_grants_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contact_grants_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contact_grants_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "contact_access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_matches: {
        Row: {
          created_at: string
          id: string
          lead_a_id: string
          lead_b_id: string
          matched_facets: Json
          score: number
          status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          lead_a_id: string
          lead_b_id: string
          matched_facets?: Json
          score: number
          status?: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          created_at?: string
          id?: string
          lead_a_id?: string
          lead_b_id?: string
          matched_facets?: Json
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_matches_lead_a_id_fkey"
            columns: ["lead_a_id"]
            isOneToOne: false
            referencedRelation: "lead_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_matches_lead_a_id_fkey"
            columns: ["lead_a_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_matches_lead_b_id_fkey"
            columns: ["lead_b_id"]
            isOneToOne: false
            referencedRelation: "lead_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_matches_lead_b_id_fkey"
            columns: ["lead_b_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          area_free_text: string | null
          area_id: string | null
          budget_max: number | null
          budget_min: number | null
          chapter_id: string
          client_email: string | null
          client_name: string
          client_phone: string
          closed_at: string | null
          consent_confirmed: boolean
          created_at: string
          crm_external_id: string | null
          crm_sync_target: Database["public"]["Enums"]["crm_provider"]
          first_touch_at: string | null
          id: string
          lead_type: Database["public"]["Enums"]["lead_type"]
          notes: string | null
          owner_id: string
          pii_purged_at: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          source: Database["public"]["Enums"]["lead_source"] | null
          status: Database["public"]["Enums"]["lead_status"]
          timeline: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at: string
        }
        Insert: {
          area_free_text?: string | null
          area_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          chapter_id: string
          client_email?: string | null
          client_name: string
          client_phone: string
          closed_at?: string | null
          consent_confirmed?: boolean
          created_at?: string
          crm_external_id?: string | null
          crm_sync_target?: Database["public"]["Enums"]["crm_provider"]
          first_touch_at?: string | null
          id?: string
          lead_type: Database["public"]["Enums"]["lead_type"]
          notes?: string | null
          owner_id: string
          pii_purged_at?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at?: string
        }
        Update: {
          area_free_text?: string | null
          area_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          chapter_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string
          closed_at?: string | null
          consent_confirmed?: boolean
          created_at?: string
          crm_external_id?: string | null
          crm_sync_target?: Database["public"]["Enums"]["crm_provider"]
          first_touch_at?: string | null
          id?: string
          lead_type?: Database["public"]["Enums"]["lead_type"]
          notes?: string | null
          owner_id?: string
          pii_purged_at?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          email: string
          id: number
          ip_address: unknown
          occurred_at: string
          succeeded: boolean
        }
        Insert: {
          email: string
          id?: number
          ip_address?: unknown
          occurred_at?: string
          succeeded: boolean
        }
        Update: {
          email?: string
          id?: number
          ip_address?: unknown
          occurred_at?: string
          succeeded?: boolean
        }
        Relationships: []
      }
      mastermind_sessions: {
        Row: {
          chapter_id: string
          created_at: string
          created_by: string
          held_at: string
          id: string
          notes: string | null
          topic_id: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          created_by: string
          held_at: string
          id?: string
          notes?: string | null
          topic_id?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          created_by?: string
          held_at?: string
          id?: string
          notes?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mastermind_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mastermind_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_topic_fk"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      match_messages: {
        Row: {
          author_id: string
          body: string
          id: string
          read_at: string | null
          sent_at: string
          thread_id: string
        }
        Insert: {
          author_id: string
          body: string
          id?: string
          read_at?: string | null
          sent_at?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string
          id?: string
          read_at?: string | null
          sent_at?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "match_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      match_threads: {
        Row: {
          created_at: string
          id: string
          match_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_threads_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "lead_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_payments: {
        Row: {
          account_reference: string | null
          allocated_at: string | null
          allocated_by: string | null
          amount: number
          chapter_id: string | null
          checkout_request_id: string | null
          completed_at: string | null
          contribution_id: string | null
          created_at: string
          id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          phone_number: string
          profile_id: string | null
          raw_callback: Json | null
          result_code: number | null
          result_desc: string | null
        }
        Insert: {
          account_reference?: string | null
          allocated_at?: string | null
          allocated_by?: string | null
          amount: number
          chapter_id?: string | null
          checkout_request_id?: string | null
          completed_at?: string | null
          contribution_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number: string
          profile_id?: string | null
          raw_callback?: Json | null
          result_code?: number | null
          result_desc?: string | null
        }
        Update: {
          account_reference?: string | null
          allocated_at?: string | null
          allocated_by?: string | null
          amount?: number
          chapter_id?: string | null
          checkout_request_id?: string | null
          completed_at?: string | null
          contribution_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number?: string
          profile_id?: string | null
          raw_callback?: Json | null
          result_code?: number | null
          result_desc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_payments_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_payments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_payments_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: true
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_digest: boolean
          email_immediate: Database["public"]["Enums"]["notification_type"][]
          profile_id: string
          updated_at: string
        }
        Insert: {
          email_digest?: boolean
          email_immediate?: Database["public"]["Enums"]["notification_type"][]
          profile_id: string
          updated_at?: string
        }
        Update: {
          email_digest?: boolean
          email_immediate?: Database["public"]["Enums"]["notification_type"][]
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          emailed_at: string | null
          id: string
          link_path: string | null
          profile_id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body: string
          created_at?: string
          emailed_at?: string | null
          id?: string
          link_path?: string | null
          profile_id: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string
          created_at?: string
          emailed_at?: string | null
          id?: string
          link_path?: string | null
          profile_id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pairing_requests: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          profile_id: string
          reason: string | null
          resolved_at: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          profile_id: string
          reason?: string | null
          resolved_at?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          reason?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairing_requests_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pairings: {
        Row: {
          chapter_id: string
          cycle_id: string
          ended_at: string | null
          id: string
          profile_a: string
          profile_b: string
          started_at: string
        }
        Insert: {
          chapter_id: string
          cycle_id: string
          ended_at?: string | null
          id?: string
          profile_a: string
          profile_b: string
          started_at?: string
        }
        Update: {
          chapter_id?: string
          cycle_id?: string
          ended_at?: string | null
          id?: string
          profile_a?: string
          profile_b?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairings_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_profile_a_fkey"
            columns: ["profile_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_profile_b_fkey"
            columns: ["profile_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_config: {
        Row: {
          cap: number
          category: Database["public"]["Enums"]["points_category"]
          chapter_id: string | null
          id: string
          params: Json
        }
        Insert: {
          cap: number
          category: Database["public"]["Enums"]["points_category"]
          chapter_id?: string | null
          id?: string
          params?: Json
        }
        Update: {
          cap?: number
          category?: Database["public"]["Enums"]["points_category"]
          chapter_id?: string | null
          id?: string
          params?: Json
        }
        Relationships: [
          {
            foreignKeyName: "points_config_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      points_entries: {
        Row: {
          awarded_at: string
          category: Database["public"]["Enums"]["points_category"]
          cycle_id: string
          id: string
          points: number
          profile_id: string
          reason: string
          source_id: string | null
          source_type: string
        }
        Insert: {
          awarded_at?: string
          category: Database["public"]["Enums"]["points_category"]
          cycle_id: string
          id?: string
          points: number
          profile_id: string
          reason: string
          source_id?: string | null
          source_type: string
        }
        Update: {
          awarded_at?: string
          category?: Database["public"]["Enums"]["points_category"]
          cycle_id?: string
          id?: string
          points?: number
          profile_id?: string
          reason?: string
          source_id?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_entries_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          agreement_accepted_at: string | null
          agreement_version: string | null
          brokerage: string | null
          chapter_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          joined_at: string
          last_seen_at: string | null
          phone: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          agreement_accepted_at?: string | null
          agreement_version?: string | null
          brokerage?: string | null
          chapter_id: string
          created_at?: string
          email: string
          full_name: string
          id: string
          joined_at?: string
          last_seen_at?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          agreement_accepted_at?: string | null
          agreement_version?: string | null
          brokerage?: string | null
          chapter_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          joined_at?: string
          last_seen_at?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          id: string
          late: boolean
          marked_at: string
          marked_by: string
          present: boolean
          profile_id: string
          session_id: string
        }
        Insert: {
          id?: string
          late?: boolean
          marked_at?: string
          marked_by: string
          present?: boolean
          profile_id: string
          session_id: string
        }
        Update: {
          id?: string
          late?: boolean
          marked_at?: string
          marked_by?: string
          present?: boolean
          profile_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mastermind_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      statements: {
        Row: {
          file_key: string
          format: string
          generated_at: string
          id: string
          period_end: string
          period_start: string
          profile_id: string
          reference: string
        }
        Insert: {
          file_key: string
          format: string
          generated_at?: string
          id?: string
          period_end: string
          period_start: string
          profile_id: string
          reference: string
        }
        Update: {
          file_key?: string
          format?: string
          generated_at?: string
          id?: string
          period_end?: string
          period_start?: string
          profile_id?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "statements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      chapter_monthly_contributions: {
        Row: {
          chapter_id: string | null
          month: string | null
          payment_count: number | null
          total_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_stats: {
        Row: {
          average_rating: number | null
          post_id: string | null
          rating_count: number | null
          reply_count: number | null
        }
        Relationships: []
      }
      lead_pool: {
        Row: {
          area_id: string | null
          area_label: string | null
          budget_max: number | null
          budget_min: number | null
          chapter_id: string | null
          created_at: string | null
          has_been_touched: boolean | null
          id: string | null
          lead_type: Database["public"]["Enums"]["lead_type"] | null
          owner_id: string | null
          owner_name: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          status: Database["public"]["Enums"]["lead_status"] | null
          timeline: Database["public"]["Enums"]["lead_timeline"] | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_points_summary: {
        Row: {
          category: Database["public"]["Enums"]["points_category"] | null
          cycle_id: string | null
          points: number | null
          profile_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_entries_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_response_times: {
        Row: {
          median_minutes: number | null
          profile_id: string | null
          touched_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_access_request: {
        Args: { p_request_id: string }
        Returns: string
      }
      current_chapter_id: { Args: never; Returns: string }
      current_cycle_id: { Args: { target_chapter: string }; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      decline_access_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: undefined
      }
      expire_pending_access_requests: { Args: never; Returns: number }
      has_lead_contact_access: {
        Args: { target_lead: string }
        Returns: boolean
      }
      in_same_chapter: { Args: { target_chapter: string }; Returns: boolean }
      is_active_member: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_chapter_lead: { Args: { target_chapter: string }; Returns: boolean }
      is_lead_owner: { Args: { target_lead: string }; Returns: boolean }
      is_thread_participant: {
        Args: { target_thread: string }
        Returns: boolean
      }
      is_treasurer: { Args: { target_chapter: string }; Returns: boolean }
      record_lead_contact_view: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      request_contact_access: {
        Args: { p_lead_id: string; p_match_id: string; p_message: string }
        Returns: string
      }
      revoke_lead_grant: {
        Args: { p_grant_id: string; p_reason: string }
        Returns: undefined
      }
      search_areas: {
        Args: { p_query: string }
        Returns: {
          city: string
          id: string
          name: string
          parent_id: string
          score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      write_audit: {
        Args: {
          p_action: Database["public"]["Enums"]["audit_action"]
          p_metadata?: Json
          p_subject_id: string
          p_subject_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      action_status:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "VERIFIED"
        | "OVERDUE"
      app_role: "MEMBER" | "TREASURER" | "CHAPTER_LEAD" | "ADMIN"
      audit_action:
        | "GRANT_CREATED"
        | "GRANT_REVOKED"
        | "ACCESS_REQUESTED"
        | "ACCESS_APPROVED"
        | "ACCESS_DENIED"
        | "LEAD_CONTACT_VIEWED"
        | "LEAD_CREATED"
        | "LEAD_DELETED"
        | "ROLE_CHANGED"
        | "MEMBER_INVITED"
        | "MEMBER_ACCEPTED"
        | "MEMBER_DEACTIVATED"
        | "MEMBER_REACTIVATED"
        | "CONTRIBUTION_RECORDED"
        | "CONTRIBUTION_VOIDED"
        | "PAYMENT_ALLOCATED"
        | "STATEMENT_GENERATED"
        | "FORUM_POST_HIDDEN"
        | "DEAL_VERIFIED"
        | "THREAD_CREATED"
        | "LOGIN_FAILED"
        | "LOGIN_LOCKED"
      contribution_type: "DUES" | "FINE" | "EVENT_FEE" | "DONATION"
      crm_provider: "NONE" | "FOLLOW_UP_BOSS" | "HUBSPOT" | "KVCORE" | "ZOHO"
      lead_source:
        | "REFERRAL"
        | "WEBSITE"
        | "WALK_IN"
        | "SOCIAL_MEDIA"
        | "MEMBER_REFERRAL"
      lead_status:
        | "NEW"
        | "CONTACTED"
        | "QUALIFIED"
        | "UNDER_CONTRACT"
        | "CLOSED"
        | "LOST"
      lead_timeline:
        | "IMMEDIATE"
        | "ONE_TO_THREE_MONTHS"
        | "THREE_TO_SIX_MONTHS"
        | "BROWSING"
      lead_type: "BUYER" | "SELLER" | "RENTAL_SEEKER" | "RENTAL_LISTER"
      match_status:
        | "PENDING"
        | "ACCESS_REQUESTED"
        | "ACCESS_GRANTED"
        | "DECLINED"
        | "CLOSED"
      notification_type:
        | "LEAD_MATCH"
        | "ACCESS_REQUESTED"
        | "ACCESS_GRANTED"
        | "ACCESS_DENIED"
        | "ACCESS_REVOKED"
        | "ACCOUNTABILITY_DUE"
        | "ACCOUNTABILITY_OVERDUE"
        | "VERIFICATION_NEEDED"
        | "ACTION_VERIFIED"
        | "NUDGE"
        | "CONTRIBUTION_DUE"
        | "CONTRIBUTION_RECEIVED"
        | "FORUM_TOPIC_OPENED"
        | "FORUM_REPLY"
        | "MATCH_MESSAGE"
        | "DEAL_CONFIRMATION_NEEDED"
        | "POINTS_AWARDED"
      payment_method: "MPESA" | "CASH" | "BANK_TRANSFER"
      payment_status: "PENDING" | "PAID" | "FAILED" | "REVERSED"
      points_category:
        | "ATTENDANCE"
        | "REFERRALS"
        | "CONTRIBUTIONS"
        | "RESPONSE_TIME"
        | "PRODUCTION"
      property_type: "APARTMENT" | "TOWNHOUSE" | "STANDALONE_HOUSE" | "LAND"
      request_status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "REVOKED"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      action_status: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "COMPLETED",
        "VERIFIED",
        "OVERDUE",
      ],
      app_role: ["MEMBER", "TREASURER", "CHAPTER_LEAD", "ADMIN"],
      audit_action: [
        "GRANT_CREATED",
        "GRANT_REVOKED",
        "ACCESS_REQUESTED",
        "ACCESS_APPROVED",
        "ACCESS_DENIED",
        "LEAD_CONTACT_VIEWED",
        "LEAD_CREATED",
        "LEAD_DELETED",
        "ROLE_CHANGED",
        "MEMBER_INVITED",
        "MEMBER_ACCEPTED",
        "MEMBER_DEACTIVATED",
        "MEMBER_REACTIVATED",
        "CONTRIBUTION_RECORDED",
        "CONTRIBUTION_VOIDED",
        "PAYMENT_ALLOCATED",
        "STATEMENT_GENERATED",
        "FORUM_POST_HIDDEN",
        "DEAL_VERIFIED",
        "THREAD_CREATED",
        "LOGIN_FAILED",
        "LOGIN_LOCKED",
      ],
      contribution_type: ["DUES", "FINE", "EVENT_FEE", "DONATION"],
      crm_provider: ["NONE", "FOLLOW_UP_BOSS", "HUBSPOT", "KVCORE", "ZOHO"],
      lead_source: [
        "REFERRAL",
        "WEBSITE",
        "WALK_IN",
        "SOCIAL_MEDIA",
        "MEMBER_REFERRAL",
      ],
      lead_status: [
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "UNDER_CONTRACT",
        "CLOSED",
        "LOST",
      ],
      lead_timeline: [
        "IMMEDIATE",
        "ONE_TO_THREE_MONTHS",
        "THREE_TO_SIX_MONTHS",
        "BROWSING",
      ],
      lead_type: ["BUYER", "SELLER", "RENTAL_SEEKER", "RENTAL_LISTER"],
      match_status: [
        "PENDING",
        "ACCESS_REQUESTED",
        "ACCESS_GRANTED",
        "DECLINED",
        "CLOSED",
      ],
      notification_type: [
        "LEAD_MATCH",
        "ACCESS_REQUESTED",
        "ACCESS_GRANTED",
        "ACCESS_DENIED",
        "ACCESS_REVOKED",
        "ACCOUNTABILITY_DUE",
        "ACCOUNTABILITY_OVERDUE",
        "VERIFICATION_NEEDED",
        "ACTION_VERIFIED",
        "NUDGE",
        "CONTRIBUTION_DUE",
        "CONTRIBUTION_RECEIVED",
        "FORUM_TOPIC_OPENED",
        "FORUM_REPLY",
        "MATCH_MESSAGE",
        "DEAL_CONFIRMATION_NEEDED",
        "POINTS_AWARDED",
      ],
      payment_method: ["MPESA", "CASH", "BANK_TRANSFER"],
      payment_status: ["PENDING", "PAID", "FAILED", "REVERSED"],
      points_category: [
        "ATTENDANCE",
        "REFERRALS",
        "CONTRIBUTIONS",
        "RESPONSE_TIME",
        "PRODUCTION",
      ],
      property_type: ["APARTMENT", "TOWNHOUSE", "STANDALONE_HOUSE", "LAND"],
      request_status: ["PENDING", "APPROVED", "DENIED", "EXPIRED", "REVOKED"],
    },
  },
} as const

