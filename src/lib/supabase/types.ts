import type { Role } from '@/lib/types/roles';
import type { InstitutionType, InstitutionMemberStatus } from '@/lib/types/institution';
import type {
  PlanCode,
  BillingInterval,
  SubscriptionStatus,
  PaymentMethodType,
  InvoiceStatus,
  GrantCategory,
} from '@/lib/types/plan';
import type { ContentType, FileFormat, AccessLevel, ContentStatus } from '@/lib/types/content';
import type { AccessRequestStatus } from '@/lib/types/access-request';
import type { AuditAction } from '@/lib/types/audit';

/**
 * Hand-written to match supabase/migrations/*.sql. Once the project is
 * linked, prefer regenerating this with the Supabase CLI
 * (`supabase gen types typescript`) so it can't drift from the real schema.
 */
export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: Role;
          is_reviewer: boolean;
          institution_id: string | null;
          organization: string | null;
          field_of_study: string | null;
          active: boolean;
          created_at: string;
          last_login_at: string | null;
          email_verified_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: Role;
          is_reviewer?: boolean;
          institution_id?: string | null;
          organization?: string | null;
          field_of_study?: string | null;
          active?: boolean;
          created_at?: string;
          last_login_at?: string | null;
          email_verified_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      institutions: {
        Row: {
          id: string;
          name: string;
          type: InstitutionType;
          country: string;
          website: string | null;
          verified: boolean;
          verified_at: string | null;
          subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: InstitutionType;
          country: string;
          website?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          subscription_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>;
        Relationships: [];
      };
      institution_members: {
        Row: {
          id: string;
          institution_id: string;
          user_id: string | null;
          email: string;
          name: string | null;
          role: 'INSTITUTION_ADMIN' | 'INSTITUTION_MEMBER';
          status: InstitutionMemberStatus;
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          institution_id: string;
          user_id?: string | null;
          email: string;
          name?: string | null;
          role: 'INSTITUTION_ADMIN' | 'INSTITUTION_MEMBER';
          status?: InstitutionMemberStatus;
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['institution_members']['Insert']>;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          code: PlanCode;
          name: string;
          description: string;
          monthly_price: number;
          annual_price: number;
          currency: string;
          seat_based: boolean;
          min_seats: number | null;
          download_limit_per_month: number | null;
          eligible_roles: string[];
          features: string[];
          active: boolean;
        };
        Insert: {
          id: string;
          code: PlanCode;
          name: string;
          description: string;
          monthly_price: number;
          annual_price: number;
          currency?: string;
          seat_based?: boolean;
          min_seats?: number | null;
          download_limit_per_month?: number | null;
          eligible_roles?: string[];
          features?: string[];
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['plans']['Insert']>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          owner_type: 'USER' | 'INSTITUTION';
          owner_id: string;
          plan_id: string;
          plan_code: PlanCode;
          billing_interval: BillingInterval;
          status: SubscriptionStatus;
          seats: number | null;
          seats_used: number | null;
          payment_method_type: PaymentMethodType | null;
          payment_reference: string | null;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          granted_by: string | null;
          grant_category: GrantCategory | null;
          grant_note: string | null;
        };
        Insert: {
          id: string;
          owner_type: 'USER' | 'INSTITUTION';
          owner_id: string;
          plan_id: string;
          plan_code: PlanCode;
          billing_interval: BillingInterval;
          status: SubscriptionStatus;
          seats?: number | null;
          seats_used?: number | null;
          payment_method_type?: PaymentMethodType | null;
          payment_reference?: string | null;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          granted_by?: string | null;
          grant_category?: GrantCategory | null;
          grant_note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          subscription_id: string;
          number: string;
          amount: number;
          currency: string;
          status: InvoiceStatus;
          issued_at: string;
          paid_at: string | null;
          period_start: string;
          period_end: string;
        };
        Insert: {
          id: string;
          subscription_id: string;
          number: string;
          amount: number;
          currency?: string;
          status: InvoiceStatus;
          issued_at: string;
          paid_at?: string | null;
          period_start: string;
          period_end: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
        Relationships: [];
      };
      content_items: {
        Row: {
          id: string;
          slug: string;
          title: string;
          short_description: string;
          full_description: string;
          content_type: ContentType;
          category: string;
          tags: string[];
          author_or_source: string;
          geographic_coverage: string;
          date_published: string;
          date_collected: string | null;
          file_format: FileFormat;
          file_size_bytes: number;
          storage_bucket: string | null;
          storage_path: string | null;
          external_url: string | null;
          license_terms: string;
          access_level: AccessLevel;
          allowed_plan_codes: PlanCode[];
          status: ContentStatus;
          is_featured: boolean;
          version_number: number;
          related_item_ids: string[];
          download_count: number;
          view_count: number;
          file_checksum_sha256: string;
          owner_user_id: string;
          owner_name: string;
          reviewer_id: string | null;
          reviewer_name: string | null;
          review_note: string | null;
          created_at: string;
          updated_at: string;
          submitted_for_review_at: string | null;
          published_at: string | null;
          archived_at: string | null;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          short_description: string;
          full_description: string;
          content_type: ContentType;
          category: string;
          tags?: string[];
          author_or_source: string;
          geographic_coverage: string;
          date_published: string;
          date_collected?: string | null;
          file_format: FileFormat;
          file_size_bytes?: number;
          storage_bucket?: string | null;
          storage_path?: string | null;
          external_url?: string | null;
          license_terms: string;
          access_level: AccessLevel;
          allowed_plan_codes?: PlanCode[];
          status?: ContentStatus;
          is_featured?: boolean;
          version_number?: number;
          related_item_ids?: string[];
          download_count?: number;
          view_count?: number;
          file_checksum_sha256?: string;
          owner_user_id: string;
          owner_name: string;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
          submitted_for_review_at?: string | null;
          published_at?: string | null;
          archived_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['content_items']['Insert']>;
        Relationships: [];
      };
      content_versions: {
        Row: {
          id: string;
          content_item_id: string;
          version_number: number;
          file_name: string;
          file_format: FileFormat;
          file_size_bytes: number;
          checksum_sha256: string;
          storage_bucket: string | null;
          storage_path: string | null;
          uploaded_by_user_id: string;
          uploaded_by_name: string;
          uploaded_at: string;
          change_note: string;
        };
        Insert: {
          id: string;
          content_item_id: string;
          version_number: number;
          file_name: string;
          file_format: FileFormat;
          file_size_bytes?: number;
          checksum_sha256?: string;
          storage_bucket?: string | null;
          storage_path?: string | null;
          uploaded_by_user_id: string;
          uploaded_by_name: string;
          uploaded_at?: string;
          change_note?: string;
        };
        Update: Partial<Database['public']['Tables']['content_versions']['Insert']>;
        Relationships: [];
      };
      access_requests: {
        Row: {
          id: string;
          content_item_id: string;
          content_title: string;
          user_id: string;
          user_name: string;
          purpose: string;
          institution: string;
          intended_use: string;
          requested_access_days: number;
          status: AccessRequestStatus;
          reviewer_id: string | null;
          reviewer_name: string | null;
          review_note: string | null;
          submitted_at: string;
          decided_at: string | null;
          access_expires_at: string | null;
        };
        Insert: {
          id: string;
          content_item_id: string;
          content_title: string;
          user_id: string;
          user_name: string;
          purpose: string;
          institution?: string;
          intended_use: string;
          requested_access_days: number;
          status?: AccessRequestStatus;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          review_note?: string | null;
          submitted_at?: string;
          decided_at?: string | null;
          access_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['access_requests']['Insert']>;
        Relationships: [];
      };
      saved_items: {
        Row: {
          id: string;
          user_id: string;
          content_item_id: string;
          saved_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          content_item_id: string;
          saved_at?: string;
        };
        Update: Partial<Database['public']['Tables']['saved_items']['Insert']>;
        Relationships: [];
      };
      download_records: {
        Row: {
          id: string;
          user_id: string;
          content_item_id: string | null;
          content_title: string;
          version_number: number;
          downloaded_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          content_item_id: string;
          content_title: string;
          version_number: number;
          downloaded_at?: string;
        };
        Update: Partial<Database['public']['Tables']['download_records']['Insert']>;
        Relationships: [];
      };
      audit_log_entries: {
        Row: {
          id: string;
          actor_id: string;
          actor_name: string;
          actor_role: string;
          action: AuditAction;
          target_type: string;
          target_id: string;
          target_label: string;
          detail: string;
          created_at: string;
        };
        Insert: {
          id: string;
          actor_id: string;
          actor_name: string;
          actor_role: string;
          action: AuditAction;
          target_type: string;
          target_id: string;
          target_label: string;
          detail: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_log_entries']['Insert']>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: boolean;
          max_upload_size_mb: number;
          require_institution_verification: boolean;
          support_email: string;
          default_access_request_days: number;
        };
        Insert: {
          id?: boolean;
          max_upload_size_mb?: number;
          require_institution_verification?: boolean;
          support_email?: string;
          default_access_request_days?: number;
        };
        Update: Partial<Database['public']['Tables']['platform_settings']['Insert']>;
        Relationships: [];
      };
    };
  };
}
