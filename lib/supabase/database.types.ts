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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_request_steps: {
        Row: {
          access_request_id: string
          decided_at: string | null
          decided_by: string | null
          id: string
          required_role_key: string
          status: string
          step_order: number
        }
        Insert: {
          access_request_id: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          required_role_key: string
          status?: string
          step_order: number
        }
        Update: {
          access_request_id?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          required_role_key?: string
          status?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "access_request_steps_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      access_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          match_status: string
          matched_person_id: string | null
          organization_id: string
          reason: string | null
          requested_birth_date: string | null
          requested_email: string | null
          requested_full_name: string | null
          requested_ministry_id: string | null
          requested_phone: string | null
          requested_role_id: string
          requested_unit_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          match_status?: string
          matched_person_id?: string | null
          organization_id: string
          reason?: string | null
          requested_birth_date?: string | null
          requested_email?: string | null
          requested_full_name?: string | null
          requested_ministry_id?: string | null
          requested_phone?: string | null
          requested_role_id: string
          requested_unit_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          match_status?: string
          matched_person_id?: string | null
          organization_id?: string
          reason?: string | null
          requested_birth_date?: string | null
          requested_email?: string | null
          requested_full_name?: string | null
          requested_ministry_id?: string | null
          requested_phone?: string | null
          requested_role_id?: string
          requested_unit_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_matched_person_id_fkey"
            columns: ["matched_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_requested_ministry_id_fkey"
            columns: ["requested_ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_requested_role_id_fkey"
            columns: ["requested_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_requested_unit_id_fkey"
            columns: ["requested_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_rules: {
        Row: {
          active: boolean
          id: string
          organization_id: string
          requested_role_id: string
          requested_unit_type: string | null
          required_approver_role_key: string
          step_order: number
        }
        Insert: {
          active?: boolean
          id?: string
          organization_id: string
          requested_role_id: string
          requested_unit_type?: string | null
          required_approver_role_key: string
          step_order: number
        }
        Update: {
          active?: boolean
          id?: string
          organization_id?: string
          requested_role_id?: string
          requested_unit_type?: string | null
          required_approver_role_key?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_rules_requested_role_id_fkey"
            columns: ["requested_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_sources: {
        Row: {
          abbreviation: string
          active: boolean
          id: string
          language: string
          license_reference: string | null
          license_status: string
          name: string
          provider: string | null
        }
        Insert: {
          abbreviation: string
          active?: boolean
          id?: string
          language?: string
          license_reference?: string | null
          license_status?: string
          name: string
          provider?: string | null
        }
        Update: {
          abbreviation?: string
          active?: boolean
          id?: string
          language?: string
          license_reference?: string | null
          license_status?: string
          name?: string
          provider?: string | null
        }
        Relationships: []
      }
      hymnals: {
        Row: {
          active: boolean
          id: string
          license_reference: string | null
          license_status: string
          name: string
          publisher: string | null
        }
        Insert: {
          active?: boolean
          id?: string
          license_reference?: string | null
          license_status?: string
          name: string
          publisher?: string | null
        }
        Update: {
          active?: boolean
          id?: string
          license_reference?: string | null
          license_status?: string
          name?: string
          publisher?: string | null
        }
        Relationships: []
      }
      hymns: {
        Row: {
          external_reference: string | null
          hymn_number: number | null
          hymnal_id: string
          id: string
          is_public: boolean
          lyrics_text: string | null
          title: string
        }
        Insert: {
          external_reference?: string | null
          hymn_number?: number | null
          hymnal_id: string
          id?: string
          is_public?: boolean
          lyrics_text?: string | null
          title: string
        }
        Update: {
          external_reference?: string | null
          hymn_number?: number | null
          hymnal_id?: string
          id?: string
          is_public?: boolean
          lyrics_text?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hymns_hymnal_id_fkey"
            columns: ["hymnal_id"]
            isOneToOne: false
            referencedRelation: "hymnals"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_type: string
          id: string
          matched_rows: number
          organization_id: string
          original_filename: string | null
          purged_at: string | null
          rejected_rows: number
          review_rows: number
          scope_unit_id: string | null
          source_name: string | null
          status: string
          total_rows: number
          uploaded_by: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_type: string
          id?: string
          matched_rows?: number
          organization_id: string
          original_filename?: string | null
          purged_at?: string | null
          rejected_rows?: number
          review_rows?: number
          scope_unit_id?: string | null
          source_name?: string | null
          status?: string
          total_rows?: number
          uploaded_by: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_type?: string
          id?: string
          matched_rows?: number
          organization_id?: string
          original_filename?: string | null
          purged_at?: string | null
          rejected_rows?: number
          review_rows?: number
          scope_unit_id?: string | null
          source_name?: string | null
          status?: string
          total_rows?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_scope_unit_id_fkey"
            columns: ["scope_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      member_import_rows: {
        Row: {
          batch_id: string
          birth_date: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: string
          email: string | null
          full_name: string
          id: string
          match_score: number | null
          match_status: string
          matched_person_id: string | null
          phone: string | null
          raw_data: Json
          row_number: number
          source_member_code: string | null
          unit_name: string | null
          unit_slug: string | null
        }
        Insert: {
          batch_id: string
          birth_date?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          email?: string | null
          full_name: string
          id?: string
          match_score?: number | null
          match_status?: string
          matched_person_id?: string | null
          phone?: string | null
          raw_data?: Json
          row_number: number
          source_member_code?: string | null
          unit_name?: string | null
          unit_slug?: string | null
        }
        Update: {
          batch_id?: string
          birth_date?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          email?: string | null
          full_name?: string
          id?: string
          match_score?: number | null
          match_status?: string
          matched_person_id?: string | null
          phone?: string | null
          raw_data?: Json
          row_number?: number
          source_member_code?: string | null
          unit_name?: string | null
          unit_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_import_rows_matched_person_id_fkey"
            columns: ["matched_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          membership_type: string
          person_id: string
          status: string
          unit_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          membership_type?: string
          person_id: string
          status?: string
          unit_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          membership_type?: string
          person_id?: string
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          active: boolean
          id: string
          name: string
          organization_id: string
          slug: string
          unit_id: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          organization_id: string
          slug: string
          unit_id: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      online_meetings: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          join_url: string
          ministry_id: string | null
          organization_id: string
          platform: string
          starts_at: string
          status: string
          title: string
          unit_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          join_url: string
          ministry_id?: string | null
          organization_id: string
          platform: string
          starts_at: string
          status?: string
          title: string
          unit_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          join_url?: string
          ministry_id?: string | null
          organization_id?: string
          platform?: string
          starts_at?: string
          status?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_meetings_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_meetings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          organization_id: string
          phone: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          organization_id: string
          phone?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          organization_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          id: string
          key: string
        }
        Insert: {
          description: string
          id?: string
          key: string
        }
        Update: {
          description?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          person_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          person_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          person_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      role_assignments: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          organization_id: string
          role_id: string
          scope_ministry_id: string | null
          scope_unit_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id: string
          role_id: string
          scope_ministry_id?: string | null
          scope_unit_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          role_id?: string
          scope_ministry_id?: string | null
          scope_unit_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_scope_ministry_id_fkey"
            columns: ["scope_ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_scope_unit_id_fkey"
            columns: ["scope_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      role_invitations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          organization_id: string
          role_id: string
          scope_ministry_id: string | null
          scope_unit_id: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          organization_id: string
          role_id: string
          scope_ministry_id?: string | null
          scope_unit_id?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          organization_id?: string
          role_id?: string
          scope_ministry_id?: string | null
          scope_unit_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_invitations_scope_ministry_id_fkey"
            columns: ["scope_ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_invitations_scope_unit_id_fkey"
            columns: ["scope_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          authority_rank: number
          id: string
          key: string
          level: string
          name: string
        }
        Insert: {
          authority_rank?: number
          id?: string
          key: string
          level: string
          name: string
        }
        Update: {
          authority_rank?: number
          id?: string
          key?: string
          level?: string
          name?: string
        }
        Relationships: []
      }
      scripture_passages: {
        Row: {
          bible_source_id: string
          book: string
          chapter: number
          content_text: string | null
          external_reference: string | null
          id: string
          is_public: boolean
          verse_end: number | null
          verse_start: number | null
        }
        Insert: {
          bible_source_id: string
          book: string
          chapter: number
          content_text?: string | null
          external_reference?: string | null
          id?: string
          is_public?: boolean
          verse_end?: number | null
          verse_start?: number | null
        }
        Update: {
          bible_source_id?: string
          book?: string
          chapter?: number
          content_text?: string | null
          external_reference?: string | null
          id?: string
          is_public?: boolean
          verse_end?: number | null
          verse_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scripture_passages_bible_source_id_fkey"
            columns: ["bible_source_id"]
            isOneToOne: false
            referencedRelation: "bible_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_import_rows: {
        Row: {
          address_line: string | null
          batch_id: string
          city: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: string
          id: string
          name: string
          parent_slug: string | null
          raw_data: Json
          row_number: number
          slug: string | null
          state: string | null
          unit_type: string
        }
        Insert: {
          address_line?: string | null
          batch_id: string
          city?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          id?: string
          name: string
          parent_slug?: string | null
          raw_data?: Json
          row_number: number
          slug?: string | null
          state?: string | null
          unit_type?: string
        }
        Update: {
          address_line?: string | null
          batch_id?: string
          city?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          id?: string
          name?: string
          parent_slug?: string | null
          raw_data?: Json
          row_number?: number
          slug?: string | null
          state?: string | null
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          active: boolean
          address_line: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_unit_id: string | null
          slug: string
          state: string | null
          unit_type: string
        }
        Insert: {
          active?: boolean
          address_line?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_unit_id?: string | null
          slug: string
          state?: string | null
          unit_type: string
        }
        Update: {
          active?: boolean
          address_line?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_unit_id?: string | null
          slug?: string
          state?: string | null
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_parent_unit_id_fkey"
            columns: ["parent_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_items: {
        Row: {
          created_at: string
          hymn_id: string | null
          id: string
          is_current: boolean
          item_type: string
          label: string | null
          scripture_passage_id: string | null
          sequence: number
          worship_session_id: string
        }
        Insert: {
          created_at?: string
          hymn_id?: string | null
          id?: string
          is_current?: boolean
          item_type: string
          label?: string | null
          scripture_passage_id?: string | null
          sequence?: number
          worship_session_id: string
        }
        Update: {
          created_at?: string
          hymn_id?: string | null
          id?: string
          is_current?: boolean
          item_type?: string
          label?: string | null
          scripture_passage_id?: string | null
          sequence?: number
          worship_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_items_hymn_id_fkey"
            columns: ["hymn_id"]
            isOneToOne: false
            referencedRelation: "hymns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_items_scripture_passage_id_fkey"
            columns: ["scripture_passage_id"]
            isOneToOne: false
            referencedRelation: "scripture_passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_items_worship_session_id_fkey"
            columns: ["worship_session_id"]
            isOneToOne: false
            referencedRelation: "worship_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          public_slug: string
          starts_at: string
          status: string
          title: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          public_slug: string
          starts_at: string
          status?: string
          title: string
          unit_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          public_slug?: string
          starts_at?: string
          status?: string
          title?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_sessions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_member_import_batch: {
        Args: { target_batch_id: string }
        Returns: Json
      }
      apply_unit_import_batch: {
        Args: { target_batch_id: string }
        Returns: Json
      }
      claim_initial_admin: { Args: never; Returns: Json }
      claim_role_invitations: { Args: never; Returns: Json }
      create_person_with_membership: {
        Args: {
          person_birth_date?: string
          person_email?: string
          person_full_name: string
          person_phone?: string
          target_membership_type?: string
          target_organization_id: string
          target_unit_id: string
        }
        Returns: string
      }
      create_role_invitation: {
        Args: {
          target_email: string
          target_ministry_id?: string
          target_organization_id: string
          target_role_id: string
          target_unit_id?: string
        }
        Returns: string
      }
      decide_access_request_step: {
        Args: { decision: string; target_request_id: string }
        Returns: string
      }
      decide_role_invitation: {
        Args: { decision: string; target_invitation_id: string }
        Returns: string
      }
      list_manageable_people: {
        Args: {
          result_limit?: number
          search_text?: string
          target_organization_id: string
          target_unit_id?: string
        }
        Returns: {
          birth_date: string
          created_at: string
          email: string
          full_name: string
          has_user_account: boolean
          membership_id: string
          membership_status: string
          membership_type: string
          person_id: string
          phone: string
          unit_id: string
          unit_name: string
        }[]
      }
      list_manageable_team: {
        Args: { target_organization_id: string }
        Returns: {
          assignment_id: string
          authority_rank: number
          email: string
          granted_at: string
          ministry_name: string
          role_id: string
          role_key: string
          role_name: string
          scope_ministry_id: string
          scope_unit_id: string
          status: string
          unit_name: string
          user_id: string
        }[]
      }
      reconcile_member_import_batch: {
        Args: { target_batch_id: string }
        Returns: Json
      }
      set_membership_details: {
        Args: {
          target_membership_id: string
          target_membership_type: string
          target_status: string
        }
        Returns: string
      }
      set_role_assignment_status: {
        Args: { new_status: string; target_assignment_id: string }
        Returns: string
      }
      transfer_membership: {
        Args: { target_membership_id: string; target_unit_id: string }
        Returns: string
      }
      update_person_record: {
        Args: {
          person_birth_date?: string
          person_email?: string
          person_full_name: string
          person_phone?: string
          target_person_id: string
        }
        Returns: string
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
  public: {
    Enums: {},
  },
} as const
