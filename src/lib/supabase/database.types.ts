// Generated from the real Supabase project (qwotvzwzwurvzdqzaknh) via the
// Supabase MCP connector's generate_typescript_types. Do not hand-edit --
// regenerate after schema changes instead.
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
      asset_categories: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_category_id: string | null
          created_at: string
          created_by: string
          id: string
          installed_on: string | null
          location_note: string | null
          manufacturer: string | null
          model_number: string | null
          name: string
          notes: string | null
          organization_id: string
          property_id: string
          purchase_price: number | null
          purchased_on: string | null
          serial_number: string | null
          space_id: string | null
          unit_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          asset_category_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          installed_on?: string | null
          location_note?: string | null
          manufacturer?: string | null
          model_number?: string | null
          name: string
          notes?: string | null
          organization_id: string
          property_id: string
          purchase_price?: number | null
          purchased_on?: string | null
          serial_number?: string | null
          space_id?: string | null
          unit_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          asset_category_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          installed_on?: string | null
          location_note?: string | null
          manufacturer?: string | null
          model_number?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          property_id?: string
          purchase_price?: number | null
          purchased_on?: string | null
          serial_number?: string | null
          space_id?: string | null
          unit_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_asset_category_id_fkey"
            columns: ["asset_category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          asset_id: string | null
          created_at: string
          file_name: string
          height_px: number | null
          id: string
          is_cover: boolean
          mime_type: string
          organization_id: string
          property_id: string | null
          record_id: string | null
          role: string
          size_bytes: number
          space_id: string | null
          storage_path: string
          uploaded_by: string
          warranty_id: string | null
          width_px: number | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          file_name: string
          height_px?: number | null
          id?: string
          is_cover?: boolean
          mime_type: string
          organization_id: string
          property_id?: string | null
          record_id?: string | null
          role?: string
          size_bytes: number
          space_id?: string | null
          storage_path: string
          uploaded_by: string
          warranty_id?: string | null
          width_px?: number | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          file_name?: string
          height_px?: number | null
          id?: string
          is_cover?: boolean
          mime_type?: string
          organization_id?: string
          property_id?: string | null
          record_id?: string | null
          role?: string
          size_bytes?: number
          space_id?: string | null
          storage_path?: string
          uploaded_by?: string
          warranty_id?: string | null
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          attachment_id: string | null
          category: string
          created_at: string
          created_by: string
          currency: string
          expense_date: string
          id: string
          notes: string | null
          organization_id: string
          property_id: string
          record_id: string | null
          tax_amount: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          attachment_id?: string | null
          category?: string
          created_at?: string
          created_by: string
          currency?: string
          expense_date?: string
          id?: string
          notes?: string | null
          organization_id: string
          property_id: string
          record_id?: string | null
          tax_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          attachment_id?: string | null
          category?: string
          created_at?: string
          created_by?: string
          currency?: string
          expense_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          property_id?: string
          record_id?: string | null
          tax_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_jobs: {
        Row: {
          completed_at: string | null
          confidence: number | null
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          input_attachment_id: string | null
          kind: string
          organization_id: string
          provider: string
          raw_result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          input_attachment_id?: string | null
          kind: string
          organization_id: string
          provider: string
          raw_result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          input_attachment_id?: string | null
          kind?: string
          organization_id?: string
          provider?: string
          raw_result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_input_attachment_id_fkey"
            columns: ["input_attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          postal_code: string | null
          property_type: string
          region: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          postal_code?: string | null
          property_type?: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          postal_code?: string | null
          property_type?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_transfers: {
        Row: {
          accepted_by_user_id: string | null
          accepted_organization_id: string | null
          created_at: string
          expires_at: string
          id: string
          included_scope: Json
          initiated_by: string
          organization_id: string
          property_id: string
          recipient_email: string
          responded_at: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_by_user_id?: string | null
          accepted_organization_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          included_scope?: Json
          initiated_by: string
          organization_id: string
          property_id: string
          recipient_email: string
          responded_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_by_user_id?: string | null
          accepted_organization_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          included_scope?: Json
          initiated_by?: string
          organization_id?: string
          property_id?: string
          recipient_email?: string
          responded_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_transfers_accepted_organization_id_fkey"
            columns: ["accepted_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transfers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      record_tags: {
        Row: {
          created_at: string
          organization_id: string
          record_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          record_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          record_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_tags_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      record_types: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "record_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      records: {
        Row: {
          asset_id: string | null
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          occurred_on: string
          organization_id: string
          property_id: string
          record_type_id: string
          space_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          asset_id?: string | null
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          occurred_on?: string
          organization_id: string
          property_id: string
          record_type_id: string
          space_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          asset_id?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          occurred_on?: string
          organization_id?: string
          property_id?: string
          record_type_id?: string
          space_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_record_type_id_fkey"
            columns: ["record_type_id"]
            isOneToOne: false
            referencedRelation: "record_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          asset_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_on: string
          id: string
          is_active: boolean
          is_recurring: boolean
          last_completed_on: string | null
          organization_id: string
          property_id: string
          recurrence_interval: string | null
          title: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_on: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_completed_on?: string | null
          organization_id: string
          property_id: string
          recurrence_interval?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_on?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_completed_on?: string | null
          organization_id?: string
          property_id?: string
          recurrence_interval?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          property_id: string
          space_type: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          property_id: string
          space_type?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          property_id?: string
          space_type?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          property_id?: string
          updated_at?: string
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
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_annotations: {
        Row: {
          annotation_type: string
          asset_id: string | null
          attachment_id: string
          coordinates: Json
          created_at: string
          created_by: string
          id: string
          label: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          annotation_type: string
          asset_id?: string | null
          attachment_id: string
          coordinates: Json
          created_at?: string
          created_by: string
          id?: string
          label: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          annotation_type?: string
          asset_id?: string | null
          attachment_id?: string
          coordinates?: Json
          created_at?: string
          created_by?: string
          id?: string
          label?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_annotations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_annotations_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_annotations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warranties: {
        Row: {
          asset_id: string | null
          claim_reference: string | null
          created_at: string
          created_by: string
          expires_on: string
          id: string
          notes: string | null
          organization_id: string
          policy_number: string | null
          property_id: string
          provider: string
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          claim_reference?: string | null
          created_at?: string
          created_by: string
          expires_on: string
          id?: string
          notes?: string | null
          organization_id: string
          policy_number?: string | null
          property_id: string
          provider: string
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          claim_reference?: string | null
          created_at?: string
          created_by?: string
          expires_on?: string
          id?: string
          notes?: string | null
          organization_id?: string
          policy_number?: string | null
          property_id?: string
          provider?: string
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: { p_name: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_org_admin: { Args: { target_org_id: string }; Returns: boolean }
      is_org_member: { Args: { target_org_id: string }; Returns: boolean }
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
