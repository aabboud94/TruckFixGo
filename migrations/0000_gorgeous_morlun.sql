CREATE TYPE "public"."amendment_status" AS ENUM('draft', 'pending_approval', 'approved', 'rejected', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."application_document_type" AS ENUM('cdl', 'insurance', 'w9', 'vehicle_registration', 'dot_medical', 'ase_certification', 'other_certification', 'reference_letter', 'portfolio_photo');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'pending', 'under_review', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."background_check_status" AS ENUM('pending', 'in_progress', 'passed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."background_check_type" AS ENUM('criminal', 'driving_record', 'business_verification', 'insurance_validation');--> statement-breakpoint
CREATE TYPE "public"."bid_auto_accept" AS ENUM('never', 'lowest', 'lowest_with_rating', 'best_value');--> statement-breakpoint
CREATE TYPE "public"."bid_status" AS ENUM('pending', 'accepted', 'rejected', 'expired', 'withdrawn', 'countered');--> statement-breakpoint
CREATE TYPE "public"."bidding_strategy" AS ENUM('lowest_price', 'best_value', 'fastest_completion', 'manual');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."billing_history_status" AS ENUM('success', 'failed', 'pending', 'processing', 'retrying');--> statement-breakpoint
CREATE TYPE "public"."check_provider" AS ENUM('efs', 'comdata');--> statement-breakpoint
CREATE TYPE "public"."check_status" AS ENUM('pending', 'authorized', 'captured', 'declined', 'voided', 'expired', 'partially_captured');--> statement-breakpoint
CREATE TYPE "public"."communication_channel" AS ENUM('sms', 'email', 'both', 'none');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending_approval', 'active', 'expired', 'cancelled', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."contract_template" AS ENUM('basic_enterprise', 'premium_enterprise', 'custom');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('insurance', 'certification', 'license', 'tax_id', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."document_verification_status" AS ENUM('pending', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."fleet_pricing_tier" AS ENUM('standard', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('new', 'assigned', 'en_route', 'on_site', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('emergency', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."payer_type" AS ENUM('carrier', 'driver', 'fleet', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('credit_card', 'efs_check', 'comdata_check', 'fleet_account', 'cash');--> statement-breakpoint
CREATE TYPE "public"."payment_split_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."penalty_status" AS ENUM('pending', 'applied', 'waived', 'disputed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."performance_tier" AS ENUM('bronze', 'silver', 'gold');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('basic', 'standard', 'enterprise', 'custom');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('requested', 'approved', 'rejected', 'processed');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('pending', 'queued', 'sent', 'delivered', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reminder_timing" AS ENUM('24hr_before', '12hr_before', '1hr_before', 'on_completion', 'invoice_delivery', 'payment_reminder');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('sms', 'email', 'both');--> statement-breakpoint
CREATE TYPE "public"."service_area_surcharge_type" AS ENUM('distance', 'zone', 'time_based');--> statement-breakpoint
CREATE TYPE "public"."sla_metric_type" AS ENUM('response_time', 'resolution_time', 'uptime', 'availability', 'first_fix_rate');--> statement-breakpoint
CREATE TYPE "public"."split_payment_status" AS ENUM('pending', 'partial', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'paused', 'cancelled', 'expired', 'pending_cancellation');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('driver', 'contractor', 'admin', 'dispatcher', 'fleet_manager');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"is_secret" boolean DEFAULT false NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "application_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"document_type" "application_document_type" NOT NULL,
	"document_name" text NOT NULL,
	"document_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"verification_status" "document_verification_status" DEFAULT 'pending' NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"verification_notes" text,
	"rejection_reason" text,
	"expiration_date" timestamp,
	"issue_date" timestamp,
	"issuing_authority" text,
	"document_number" varchar(100),
	"version" integer DEFAULT 1 NOT NULL,
	"replaced_by" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_checks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"check_type" "background_check_type" NOT NULL,
	"status" "background_check_status" DEFAULT 'pending' NOT NULL,
	"provider" varchar(50),
	"provider_ref_id" varchar(100),
	"passed" boolean,
	"score" integer,
	"risk_level" varchar(20),
	"report" jsonb,
	"flagged_items" jsonb DEFAULT '[]',
	"valid_until" timestamp,
	"expiration_warning_days" integer DEFAULT 30 NOT NULL,
	"requested_by" varchar,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bid_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type_id" varchar,
	"period" varchar(20) NOT NULL,
	"period_date" timestamp NOT NULL,
	"total_bids" integer DEFAULT 0 NOT NULL,
	"average_bid_amount" numeric(10, 2),
	"lowest_bid_amount" numeric(10, 2),
	"highest_bid_amount" numeric(10, 2),
	"winning_bids_count" integer DEFAULT 0 NOT NULL,
	"average_winning_bid_amount" numeric(10, 2),
	"average_time_to_first_bid" integer,
	"average_bids_per_job" numeric(5, 2),
	"bid_acceptance_rate" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bid_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" varchar NOT NULL,
	"service_type_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"default_message" text,
	"base_amount" numeric(10, 2),
	"per_mile_rate" numeric(6, 2),
	"estimated_time_formula" text,
	"enable_auto_bid" boolean DEFAULT false NOT NULL,
	"max_auto_bid_amount" numeric(10, 2),
	"min_auto_bid_amount" numeric(10, 2),
	"auto_bid_radius" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bidding_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_bidding_duration" integer DEFAULT 120 NOT NULL,
	"minimum_bidding_duration" integer DEFAULT 30 NOT NULL,
	"maximum_bidding_duration" integer DEFAULT 480 NOT NULL,
	"minimum_bid_increment" numeric(6, 2) DEFAULT '5.00' NOT NULL,
	"maximum_bids_per_contractor" integer DEFAULT 1 NOT NULL,
	"minimum_contractors_to_notify" integer DEFAULT 10 NOT NULL,
	"anti_sniping_extension" integer DEFAULT 5 NOT NULL,
	"anti_sniping_threshold" integer DEFAULT 5 NOT NULL,
	"platform_fee_percentage" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"minimum_platform_fee" numeric(6, 2) DEFAULT '5.00' NOT NULL,
	"no_show_penalty_amount" numeric(8, 2) DEFAULT '50.00' NOT NULL,
	"bid_retraction_penalty_amount" numeric(8, 2) DEFAULT '25.00' NOT NULL,
	"cooldown_period_days" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"billing_date" timestamp NOT NULL,
	"due_date" timestamp,
	"base_amount" numeric(10, 2) NOT NULL,
	"add_ons_amount" numeric(10, 2) DEFAULT '0',
	"overage_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"balance_due" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_method_id" varchar,
	"stripe_charge_id" varchar,
	"stripe_invoice_id" varchar,
	"stripe_payment_intent_id" varchar,
	"invoice_id" varchar,
	"invoice_number" varchar(20),
	"status" "billing_history_status" DEFAULT 'pending' NOT NULL,
	"payment_attempts" integer DEFAULT 0 NOT NULL,
	"last_payment_attempt" timestamp,
	"next_retry_at" timestamp,
	"paid_at" timestamp,
	"usage_summary" jsonb,
	"vehicles_used" integer,
	"emergency_repairs_used" integer,
	"scheduled_services_used" integer,
	"line_items" jsonb,
	"failure_reason" text,
	"failure_code" varchar(50),
	"error_details" jsonb,
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_history_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"plan_type" "plan_type" NOT NULL,
	"plan_name" text NOT NULL,
	"plan_description" text,
	"custom_plan_details" jsonb,
	"billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL,
	"base_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"discount_percentage" numeric(5, 2),
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"max_vehicles" integer,
	"max_users_per_month" integer,
	"included_emergency_repairs" integer,
	"included_scheduled_services" integer,
	"add_ons" jsonb,
	"priority_support" boolean DEFAULT false NOT NULL,
	"dedicated_account_manager" boolean DEFAULT false NOT NULL,
	"payment_method_id" varchar,
	"stripe_subscription_id" varchar,
	"stripe_customer_id" varchar,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"trial_end_date" timestamp,
	"next_billing_date" timestamp NOT NULL,
	"last_billing_date" timestamp,
	"paused_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"contract_term_months" integer,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"early_termination_fee" numeric(10, 2),
	"current_month_usage" jsonb,
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "billing_usage_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"emergency_repairs_count" integer DEFAULT 0 NOT NULL,
	"scheduled_services_count" integer DEFAULT 0 NOT NULL,
	"active_vehicles_count" integer DEFAULT 0 NOT NULL,
	"usage_alert_80_sent" boolean DEFAULT false NOT NULL,
	"usage_alert_90_sent" boolean DEFAULT false NOT NULL,
	"usage_alert_100_sent" boolean DEFAULT false NOT NULL,
	"has_overage" boolean DEFAULT false NOT NULL,
	"overage_calculated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breakdown_patterns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"issue_type" varchar(100) NOT NULL,
	"issue_category" varchar(50),
	"frequency" integer DEFAULT 1 NOT NULL,
	"avg_cost_per_incident" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"common_locations" text[],
	"time_of_day_pattern" jsonb,
	"seasonal_pattern" jsonb,
	"weather_correlation" jsonb,
	"route_type_correlation" jsonb,
	"mileage_at_first_occurrence" numeric(10, 2),
	"avg_mileage_between_occurrences" numeric(10, 2),
	"last_occurrence_date" timestamp,
	"predicted_next_occurrence" timestamp,
	"preventive_actions" text[],
	"root_cause_analysis" text,
	"confidence_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_amendments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"amendment_number" varchar(50) NOT NULL,
	"amendment_type" varchar(50) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"changes_summary" text NOT NULL,
	"previous_terms" jsonb NOT NULL,
	"new_terms" jsonb NOT NULL,
	"status" "amendment_status" DEFAULT 'draft' NOT NULL,
	"requested_by" varchar,
	"requested_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"version_number" integer NOT NULL,
	"parent_amendment_id" varchar,
	"signature_required" boolean DEFAULT true NOT NULL,
	"fleet_signature_data" jsonb,
	"fleet_signed_at" timestamp,
	"company_signature_data" jsonb,
	"company_signed_at" timestamp,
	"notes" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_penalties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"sla_metric_id" varchar,
	"job_id" varchar,
	"penalty_date" timestamp NOT NULL,
	"penalty_reason" text NOT NULL,
	"breach_details" jsonb,
	"penalty_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "penalty_status" DEFAULT 'pending' NOT NULL,
	"applied_to_invoice_id" varchar,
	"applied_at" timestamp,
	"waiver_requested" boolean DEFAULT false NOT NULL,
	"waiver_reason" text,
	"waiver_requested_by" varchar,
	"waiver_requested_at" timestamp,
	"waiver_approved_by" varchar,
	"waiver_approved_at" timestamp,
	"dispute_raised" boolean DEFAULT false NOT NULL,
	"dispute_reason" text,
	"dispute_raised_by" varchar,
	"dispute_raised_at" timestamp,
	"dispute_resolution" text,
	"dispute_resolved_by" varchar,
	"dispute_resolved_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_performance_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"sla_metric_id" varchar,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"metric_type" "sla_metric_type" NOT NULL,
	"target_value" numeric(10, 2) NOT NULL,
	"actual_value" numeric(10, 2) NOT NULL,
	"compliance_percentage" numeric(5, 2),
	"breach_occurred" boolean DEFAULT false NOT NULL,
	"breach_severity" varchar(20),
	"breach_duration" integer,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"compliant_jobs" integer DEFAULT 0 NOT NULL,
	"breached_jobs" integer DEFAULT 0 NOT NULL,
	"avg_response_time" integer,
	"min_response_time" integer,
	"max_response_time" integer,
	"p95_response_time" integer,
	"avg_resolution_time" integer,
	"min_resolution_time" integer,
	"max_resolution_time" integer,
	"total_minutes" integer,
	"uptime_minutes" integer,
	"downtime_minutes" integer,
	"downtime_incidents" integer,
	"penalty_applied" boolean DEFAULT false NOT NULL,
	"penalty_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_sla_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"metric_type" "sla_metric_type" NOT NULL,
	"metric_name" text NOT NULL,
	"description" text,
	"target_value" numeric(10, 2) NOT NULL,
	"target_unit" varchar(20) NOT NULL,
	"measurement_period" varchar(20) NOT NULL,
	"penalty_enabled" boolean DEFAULT true NOT NULL,
	"penalty_threshold" numeric(10, 2),
	"penalty_amount" numeric(10, 2),
	"penalty_type" varchar(20),
	"penalty_tiers" jsonb,
	"grace_value" numeric(10, 2),
	"grace_occurrences" integer,
	"current_value" numeric(10, 2),
	"last_measured_at" timestamp,
	"breach_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"zip" varchar(10) NOT NULL,
	"company_name" text,
	"dot_number" varchar(20),
	"mc_number" varchar(20),
	"business_type" varchar(50),
	"years_in_business" integer,
	"insurance_provider" text,
	"insurance_policy_number" varchar(100),
	"insurance_expiry_date" timestamp,
	"experience_level" varchar(20) NOT NULL,
	"total_years_experience" integer,
	"certifications" jsonb DEFAULT '[]',
	"specializations" jsonb DEFAULT '[]',
	"previous_employers" jsonb DEFAULT '[]',
	"service_types" jsonb DEFAULT '[]' NOT NULL,
	"service_radius" integer DEFAULT 50 NOT NULL,
	"coverage_areas" jsonb DEFAULT '[]',
	"has_own_tools" boolean DEFAULT false NOT NULL,
	"has_own_vehicle" boolean DEFAULT false NOT NULL,
	"vehicle_info" jsonb,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"review_started_at" timestamp,
	"review_completed_at" timestamp,
	"reviewed_by" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"review_notes" text,
	"internal_notes" text,
	"background_check_consent" boolean DEFAULT false NOT NULL,
	"background_check_consent_date" timestamp,
	"background_check_status" "background_check_status",
	"background_check_completed_at" timestamp,
	"background_check_results" jsonb,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"dot_number_verified" boolean DEFAULT false NOT NULL,
	"mc_number_verified" boolean DEFAULT false NOT NULL,
	"insurance_verified" boolean DEFAULT false NOT NULL,
	"references" jsonb DEFAULT '[]',
	"references_verified" boolean DEFAULT false NOT NULL,
	"terms_accepted" boolean DEFAULT false NOT NULL,
	"terms_accepted_at" timestamp,
	"terms_version" varchar(20),
	"ip_address" varchar(45),
	"user_agent" text,
	"source" varchar(50),
	"referral_code" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"is_on_call" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" varchar NOT NULL,
	"document_type" "document_type" NOT NULL,
	"document_name" text NOT NULL,
	"document_url" text NOT NULL,
	"expiry_date" timestamp,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_earnings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" varchar NOT NULL,
	"job_id" varchar,
	"earning_type" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"payout_batch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_performance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"cancelled_jobs" integer DEFAULT 0 NOT NULL,
	"average_response_time" integer,
	"average_completion_time" integer,
	"average_rating" numeric(3, 2),
	"total_revenue" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"company_name" text,
	"performance_tier" "performance_tier" DEFAULT 'bronze' NOT NULL,
	"service_radius" integer DEFAULT 50 NOT NULL,
	"average_response_time" integer,
	"total_jobs_completed" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"five_star_count" integer DEFAULT 0 NOT NULL,
	"four_star_count" integer DEFAULT 0 NOT NULL,
	"three_star_count" integer DEFAULT 0 NOT NULL,
	"two_star_count" integer DEFAULT 0 NOT NULL,
	"one_star_count" integer DEFAULT 0 NOT NULL,
	"average_timeliness_rating" numeric(3, 2),
	"average_professionalism_rating" numeric(3, 2),
	"average_quality_rating" numeric(3, 2),
	"average_value_rating" numeric(3, 2),
	"on_time_arrival_rate" numeric(5, 2),
	"job_completion_rate" numeric(5, 2),
	"response_rate" numeric(5, 2),
	"customer_satisfaction_score" numeric(5, 2),
	"net_promoter_score" integer,
	"last_rating_update" timestamp,
	"is_verified_contractor" boolean DEFAULT false NOT NULL,
	"is_featured_contractor" boolean DEFAULT false NOT NULL,
	"profile_completeness" integer DEFAULT 0 NOT NULL,
	"is_fleet_capable" boolean DEFAULT false NOT NULL,
	"has_mobile_water_source" boolean DEFAULT false NOT NULL,
	"has_wastewater_recovery" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"current_location" jsonb,
	"last_location_update" timestamp,
	"stripe_account_id" varchar,
	"bank_account_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contractor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "contractor_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" varchar NOT NULL,
	"service_type_id" varchar NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"custom_rate" numeric(10, 2),
	"experience_years" integer,
	"certification_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"communication_channel" "communication_channel" DEFAULT 'both' NOT NULL,
	"reminder_opt_in" boolean DEFAULT true NOT NULL,
	"marketing_opt_in" boolean DEFAULT true NOT NULL,
	"do_not_disturb_start" varchar(5),
	"do_not_disturb_end" varchar(5),
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/New_York' NOT NULL,
	"max_daily_messages" integer DEFAULT 10 NOT NULL,
	"unsubscribe_token" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_preferences_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "customer_preferences_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "driver_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"cdl_number" varchar(50),
	"cdl_state" varchar(2),
	"carrier_name" text,
	"dot_number" varchar(20),
	"fleet_account_id" varchar,
	"preferred_contact_method" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "driver_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fleet_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"dot_number" varchar(20),
	"mc_number" varchar(20),
	"pricing_tier" "fleet_pricing_tier" DEFAULT 'standard' NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"zip" varchar(10),
	"primary_contact_name" text,
	"primary_contact_phone" varchar(20),
	"primary_contact_email" text,
	"billing_email" text,
	"credit_limit" numeric(10, 2),
	"current_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_auto_authorized" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fleet_analytics_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"vehicle_id" varchar,
	"alert_type" varchar(50) NOT NULL,
	"alert_title" varchar(200) NOT NULL,
	"alert_message" text NOT NULL,
	"severity" varchar(20) NOT NULL,
	"trigger_value" numeric(10, 2),
	"threshold_value" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"notification_method" varchar(20),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fleet_checks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "check_provider" NOT NULL,
	"check_number" varchar(20) NOT NULL,
	"authorization_code" varchar(20) NOT NULL,
	"driver_code" varchar(20),
	"job_id" varchar,
	"user_id" varchar,
	"fleet_account_id" varchar,
	"authorized_amount" numeric(10, 2) NOT NULL,
	"captured_amount" numeric(10, 2) DEFAULT '0',
	"available_balance" numeric(10, 2),
	"status" "check_status" DEFAULT 'pending' NOT NULL,
	"authorized_at" timestamp,
	"captured_at" timestamp,
	"voided_at" timestamp,
	"expires_at" timestamp,
	"authorization_response" jsonb,
	"capture_response" jsonb,
	"void_response" jsonb,
	"last_error" text,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"masked_check_number" varchar(20),
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"title" text,
	"phone" varchar(20),
	"email" text,
	"is_authorized_to_book" boolean DEFAULT true NOT NULL,
	"is_primary_contact" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"contract_name" text NOT NULL,
	"template_type" "contract_template",
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"renewal_notification_days" integer DEFAULT 90,
	"contract_value" numeric(12, 2) NOT NULL,
	"billing_frequency" varchar(20) DEFAULT 'monthly' NOT NULL,
	"payment_terms" text,
	"sla_terms" jsonb NOT NULL,
	"guaranteed_response_time" integer,
	"guaranteed_resolution_time" integer,
	"uptime_commitment" numeric(5, 2),
	"coverage_zones" jsonb,
	"service_hours" jsonb,
	"exclusions" jsonb,
	"penalty_configuration" jsonb,
	"max_monthly_penalty" numeric(10, 2),
	"max_annual_penalty" numeric(10, 2),
	"priority_level" integer DEFAULT 1 NOT NULL,
	"dedicated_account_manager" boolean DEFAULT false NOT NULL,
	"account_manager_id" varchar,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"signature_required" boolean DEFAULT true NOT NULL,
	"fleet_signature_data" jsonb,
	"fleet_signed_at" timestamp,
	"company_signature_data" jsonb,
	"company_signed_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "fleet_contracts_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "fleet_pricing_overrides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"service_type_id" varchar,
	"discount_percentage" numeric(5, 2),
	"flat_rate_override" numeric(10, 2),
	"minimum_charge" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"vin" varchar(17),
	"unit_number" varchar(50),
	"year" integer,
	"make" varchar(50),
	"model" varchar(50),
	"vehicle_type" varchar(50),
	"license_plate" varchar(20),
	"current_odometer" integer,
	"last_service_date" timestamp,
	"next_service_due" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"test_mode" boolean DEFAULT false NOT NULL,
	"last_test_at" timestamp,
	"last_test_result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_config_service_unique" UNIQUE("service")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(20) NOT NULL,
	"job_id" varchar,
	"customer_id" varchar NOT NULL,
	"fleet_account_id" varchar,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"due_date" timestamp,
	"paid_at" timestamp,
	"line_items" jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "job_bids" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"contractor_id" varchar NOT NULL,
	"bid_amount" numeric(10, 2) NOT NULL,
	"estimated_completion_time" integer NOT NULL,
	"message_to_customer" text,
	"labor_cost" numeric(10, 2),
	"materials_cost" numeric(10, 2),
	"materials_description" text,
	"status" "bid_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"withdrawn_at" timestamp,
	"is_counter_offer" boolean DEFAULT false NOT NULL,
	"original_bid_id" varchar,
	"counter_offer_amount" numeric(10, 2),
	"counter_offer_message" text,
	"contractor_name" text,
	"contractor_rating" numeric(3, 2),
	"contractor_completed_jobs" integer,
	"contractor_response_time" integer,
	"is_auto_bid" boolean DEFAULT false NOT NULL,
	"auto_bid_template_id" varchar,
	"bid_score" numeric(5, 2),
	"price_rank" integer,
	"time_rank" integer,
	"quality_rank" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"is_system_message" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"photo_url" text NOT NULL,
	"photo_type" varchar(20) NOT NULL,
	"description" text,
	"is_before_photo" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_status_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"from_status" "job_status",
	"to_status" "job_status" NOT NULL,
	"changed_by" varchar,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_number" varchar(20) NOT NULL,
	"job_type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'new' NOT NULL,
	"customer_id" varchar,
	"contractor_id" varchar,
	"fleet_account_id" varchar,
	"vehicle_id" varchar,
	"service_type_id" varchar NOT NULL,
	"customer_name" text,
	"customer_phone" varchar(20),
	"location" jsonb NOT NULL,
	"location_address" text,
	"location_notes" text,
	"vin" varchar(17),
	"unit_number" varchar(50),
	"vehicle_make" varchar(50),
	"vehicle_model" varchar(50),
	"vehicle_year" integer,
	"scheduled_at" timestamp,
	"assigned_at" timestamp,
	"en_route_at" timestamp,
	"arrived_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"estimated_arrival" timestamp,
	"contractor_location" jsonb,
	"contractor_location_updated_at" timestamp,
	"description" text,
	"urgency_level" integer DEFAULT 1 NOT NULL,
	"requires_water_source" boolean DEFAULT false NOT NULL,
	"has_water_source" boolean,
	"estimated_price" numeric(10, 2),
	"final_price" numeric(10, 2),
	"labor_hours" numeric(5, 2),
	"parts_total" numeric(10, 2),
	"surcharge_total" numeric(10, 2),
	"tax_total" numeric(10, 2),
	"tip_amount" numeric(8, 2),
	"allow_bidding" boolean DEFAULT false NOT NULL,
	"bidding_deadline" timestamp,
	"minimum_bid_count" integer DEFAULT 3 NOT NULL,
	"maximum_bid_amount" numeric(10, 2),
	"reserve_price" numeric(10, 2),
	"winning_bid_id" varchar,
	"bidding_strategy" "bidding_strategy" DEFAULT 'manual',
	"auto_accept_bids" "bid_auto_accept" DEFAULT 'never',
	"bidding_duration" integer DEFAULT 120 NOT NULL,
	"bid_count" integer DEFAULT 0 NOT NULL,
	"lowest_bid_amount" numeric(10, 2),
	"average_bid_amount" numeric(10, 2),
	"ai_damage_analysis" jsonb,
	"ai_chat_history" jsonb,
	"completion_notes" text,
	"customer_signature" text,
	"rating" integer,
	"review_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_job_number_unique" UNIQUE("job_number")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"stripe_payment_method_id" varchar,
	"last4" varchar(4),
	"brand" varchar(20),
	"expiry_month" integer,
	"expiry_year" integer,
	"billing_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_splits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_payment_id" varchar NOT NULL,
	"job_id" varchar NOT NULL,
	"payer_id" varchar,
	"payer_type" "payer_type" NOT NULL,
	"payer_name" text NOT NULL,
	"payer_email" text,
	"payer_phone" varchar(20),
	"amount_assigned" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_method" "payment_method_type",
	"payment_method_id" varchar,
	"transaction_id" varchar,
	"payment_token" varchar(64),
	"payment_link_url" text,
	"token_expires_at" timestamp,
	"status" "payment_split_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"reminders_sent" integer DEFAULT 0 NOT NULL,
	"last_reminder_at" timestamp,
	"next_reminder_at" timestamp,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_splits_payment_token_unique" UNIQUE("payment_token")
);
--> statement-breakpoint
CREATE TABLE "platform_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_date" timestamp NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"metric_value" numeric(15, 2) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rule_type" varchar(50) NOT NULL,
	"conditions" jsonb NOT NULL,
	"multiplier" numeric(5, 2),
	"fixed_amount" numeric(10, 2),
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"referrer_reward" numeric(10, 2),
	"referred_reward" numeric(10, 2),
	"referrer_reward_type" varchar(20),
	"referred_reward_type" varchar(20),
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" "refund_status" DEFAULT 'requested' NOT NULL,
	"stripe_refund_id" varchar,
	"processed_by" varchar,
	"processed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_blacklist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"reason" text,
	"added_by" varchar,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_blacklist_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "reminder_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reminder_id" varchar,
	"job_id" varchar,
	"recipient_id" varchar,
	"channel" "communication_channel" NOT NULL,
	"recipient" text NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"subject" text,
	"content" text,
	"status" varchar(20) NOT NULL,
	"provider_id" varchar,
	"provider_response" jsonb,
	"cost" numeric(8, 4),
	"opened" boolean DEFAULT false NOT NULL,
	"opened_at" timestamp,
	"clicked" boolean DEFAULT false NOT NULL,
	"clicked_at" timestamp,
	"unsubscribed" boolean DEFAULT false NOT NULL,
	"unsubscribed_at" timestamp,
	"bounced" boolean DEFAULT false NOT NULL,
	"bounced_at" timestamp,
	"error_code" varchar(50),
	"error_message" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"total_delivered" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"total_opened" integer DEFAULT 0 NOT NULL,
	"total_clicked" integer DEFAULT 0 NOT NULL,
	"total_unsubscribed" integer DEFAULT 0 NOT NULL,
	"total_bounced" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"average_delivery_time" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"reminder_type" "reminder_type" NOT NULL,
	"reminder_timing" "reminder_timing" NOT NULL,
	"scheduled_send_time" timestamp NOT NULL,
	"actual_send_time" timestamp,
	"status" "reminder_status" DEFAULT 'pending' NOT NULL,
	"recipient_email" text,
	"recipient_phone" varchar(20),
	"message_subject" text,
	"message_content" text,
	"message_html" text,
	"template_code" varchar(50),
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"delivery_info" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_date" timestamp NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"gross_revenue" numeric(12, 2) NOT NULL,
	"net_revenue" numeric(12, 2) NOT NULL,
	"transaction_fees" numeric(10, 2) NOT NULL,
	"refund_total" numeric(10, 2) NOT NULL,
	"contractor_payouts" numeric(12, 2) NOT NULL,
	"breakdown" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_helpful" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"customer_id" varchar,
	"contractor_id" varchar NOT NULL,
	"overall_rating" integer NOT NULL,
	"timeliness_rating" integer,
	"professionalism_rating" integer,
	"quality_rating" integer,
	"value_rating" integer,
	"review_text" text,
	"review_title" varchar(200),
	"contractor_response" text,
	"contractor_response_at" timestamp,
	"is_verified_purchase" boolean DEFAULT true NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"customer_name" varchar(100),
	"photo_urls" jsonb DEFAULT '[]',
	"helpful_votes" integer DEFAULT 0 NOT NULL,
	"unhelpful_votes" integer DEFAULT 0 NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"flagged_by" varchar,
	"flagged_at" timestamp,
	"moderation_status" varchar(20) DEFAULT 'approved',
	"moderated_by" varchar,
	"moderated_at" timestamp,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"edit_history" jsonb DEFAULT '[]',
	"discount_code_offered" varchar(50),
	"incentive_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "service_areas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"coordinates" jsonb NOT NULL,
	"surcharge_type" "service_area_surcharge_type",
	"surcharge_amount" numeric(8, 2),
	"surcharge_percentage" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_pricing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type_id" varchar NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"per_mile_rate" numeric(6, 2),
	"per_hour_rate" numeric(8, 2),
	"emergency_surcharge" numeric(8, 2),
	"night_surcharge" numeric(8, 2),
	"weekend_surcharge" numeric(8, 2),
	"water_source_surcharge" numeric(8, 2),
	"minimum_charge" numeric(10, 2),
	"effective_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"is_schedulable" boolean DEFAULT true NOT NULL,
	"estimated_duration" integer,
	"icon_name" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sms_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sms_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "split_payment_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"split_rules" jsonb NOT NULL,
	"service_type_ids" text[],
	"conditions" jsonb,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "split_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"split_configuration" jsonb NOT NULL,
	"status" "split_payment_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"template_id" varchar,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surge_pricing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"multiplier" numeric(5, 2) NOT NULL,
	"conditions" jsonb NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"activated_at" timestamp,
	"deactivated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar,
	"user_id" varchar NOT NULL,
	"payment_method_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"stripe_charge_id" varchar,
	"stripe_payment_intent_id" varchar,
	"failure_reason" text,
	"metadata" jsonb,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'driver' NOT NULL,
	"first_name" text,
	"last_name" text,
	"password" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_guest" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"fleet_account_id" varchar NOT NULL,
	"total_miles_driven" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_maintenance_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_fuel_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cost_per_mile" numeric(6, 4) DEFAULT '0' NOT NULL,
	"fuel_cost_per_mile" numeric(6, 4) DEFAULT '0' NOT NULL,
	"maintenance_cost_per_mile" numeric(6, 4) DEFAULT '0' NOT NULL,
	"breakdown_count" integer DEFAULT 0 NOT NULL,
	"avg_time_between_breakdowns" integer,
	"next_predicted_maintenance" timestamp,
	"health_score" integer DEFAULT 100 NOT NULL,
	"risk_level" varchar(20) DEFAULT 'low' NOT NULL,
	"last_service_date" timestamp,
	"last_breakdown_date" timestamp,
	"total_downtime_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"avg_repair_time" numeric(6, 2),
	"utilization_rate" numeric(5, 2),
	"compliance_score" integer DEFAULT 100 NOT NULL,
	"performance_metrics" jsonb,
	"predictive_insights" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_contractor_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."contractor_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_replaced_by_application_documents_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."application_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_application_id_contractor_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."contractor_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_analytics" ADD CONSTRAINT "bid_analytics_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_templates" ADD CONSTRAINT "bid_templates_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_templates" ADD CONSTRAINT "bid_templates_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_usage_tracking" ADD CONSTRAINT "billing_usage_tracking_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_usage_tracking" ADD CONSTRAINT "billing_usage_tracking_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakdown_patterns" ADD CONSTRAINT "breakdown_patterns_vehicle_id_fleet_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakdown_patterns" ADD CONSTRAINT "breakdown_patterns_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_contract_id_fleet_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."fleet_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_parent_amendment_id_contract_amendments_id_fk" FOREIGN KEY ("parent_amendment_id") REFERENCES "public"."contract_amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_contract_id_fleet_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."fleet_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_sla_metric_id_contract_sla_metrics_id_fk" FOREIGN KEY ("sla_metric_id") REFERENCES "public"."contract_sla_metrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_applied_to_invoice_id_invoices_id_fk" FOREIGN KEY ("applied_to_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_waiver_requested_by_users_id_fk" FOREIGN KEY ("waiver_requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_waiver_approved_by_users_id_fk" FOREIGN KEY ("waiver_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_dispute_raised_by_users_id_fk" FOREIGN KEY ("dispute_raised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_penalties" ADD CONSTRAINT "contract_penalties_dispute_resolved_by_users_id_fk" FOREIGN KEY ("dispute_resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_performance_metrics" ADD CONSTRAINT "contract_performance_metrics_contract_id_fleet_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."fleet_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_performance_metrics" ADD CONSTRAINT "contract_performance_metrics_sla_metric_id_contract_sla_metrics_id_fk" FOREIGN KEY ("sla_metric_id") REFERENCES "public"."contract_sla_metrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_sla_metrics" ADD CONSTRAINT "contract_sla_metrics_contract_id_fleet_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."fleet_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_applications" ADD CONSTRAINT "contractor_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_applications" ADD CONSTRAINT "contractor_applications_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_availability" ADD CONSTRAINT "contractor_availability_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_documents" ADD CONSTRAINT "contractor_documents_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_documents" ADD CONSTRAINT "contractor_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_earnings" ADD CONSTRAINT "contractor_earnings_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_earnings" ADD CONSTRAINT "contractor_earnings_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_performance" ADD CONSTRAINT "contractor_performance_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_profiles" ADD CONSTRAINT "contractor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_services" ADD CONSTRAINT "contractor_services_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_services" ADD CONSTRAINT "contractor_services_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_preferences" ADD CONSTRAINT "customer_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_analytics_alerts" ADD CONSTRAINT "fleet_analytics_alerts_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_analytics_alerts" ADD CONSTRAINT "fleet_analytics_alerts_vehicle_id_fleet_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_analytics_alerts" ADD CONSTRAINT "fleet_analytics_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_checks" ADD CONSTRAINT "fleet_checks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_checks" ADD CONSTRAINT "fleet_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_checks" ADD CONSTRAINT "fleet_checks_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_contacts" ADD CONSTRAINT "fleet_contacts_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_contacts" ADD CONSTRAINT "fleet_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_contracts" ADD CONSTRAINT "fleet_contracts_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_contracts" ADD CONSTRAINT "fleet_contracts_account_manager_id_users_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_contracts" ADD CONSTRAINT "fleet_contracts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_contracts" ADD CONSTRAINT "fleet_contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_pricing_overrides" ADD CONSTRAINT "fleet_pricing_overrides_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_pricing_overrides" ADD CONSTRAINT "fleet_pricing_overrides_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_bids" ADD CONSTRAINT "job_bids_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_bids" ADD CONSTRAINT "job_bids_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_bids" ADD CONSTRAINT "job_bids_original_bid_id_job_bids_id_fk" FOREIGN KEY ("original_bid_id") REFERENCES "public"."job_bids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_messages" ADD CONSTRAINT "job_messages_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_messages" ADD CONSTRAINT "job_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_vehicle_id_fleet_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_split_payment_id_split_payments_id_fk" FOREIGN KEY ("split_payment_id") REFERENCES "public"."split_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_blacklist" ADD CONSTRAINT "reminder_blacklist_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_flagged_by_users_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_pricing" ADD CONSTRAINT "service_pricing_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_payments" ADD CONSTRAINT "split_payments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_payments" ADD CONSTRAINT "split_payments_template_id_split_payment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."split_payment_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_analytics" ADD CONSTRAINT "vehicle_analytics_vehicle_id_fleet_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_analytics" ADD CONSTRAINT "vehicle_analytics_fleet_account_id_fleet_accounts_id_fk" FOREIGN KEY ("fleet_account_id") REFERENCES "public"."fleet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_admin_settings_key" ON "admin_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_admin_settings_category" ON "admin_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_application_documents_application" ON "application_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_application_documents_type" ON "application_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_application_documents_status" ON "application_documents" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_application_documents_expiration" ON "application_documents" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "idx_application_documents_active" ON "application_documents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_background_checks_application" ON "background_checks" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_background_checks_type" ON "background_checks" USING btree ("check_type");--> statement-breakpoint
CREATE INDEX "idx_background_checks_status" ON "background_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_background_checks_valid_until" ON "background_checks" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_bid_analytics_service" ON "bid_analytics" USING btree ("service_type_id");--> statement-breakpoint
CREATE INDEX "idx_bid_analytics_period" ON "bid_analytics" USING btree ("period","period_date");--> statement-breakpoint
CREATE INDEX "idx_bid_templates_contractor" ON "bid_templates" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "idx_bid_templates_service" ON "bid_templates" USING btree ("service_type_id");--> statement-breakpoint
CREATE INDEX "idx_billing_history_subscription" ON "billing_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_billing_history_fleet" ON "billing_history" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_billing_history_status" ON "billing_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_billing_history_billing_date" ON "billing_history" USING btree ("billing_date");--> statement-breakpoint
CREATE INDEX "idx_billing_history_invoice" ON "billing_history" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_billing_history_stripe_invoice" ON "billing_history" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_billing_subscriptions_fleet" ON "billing_subscriptions" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_billing_subscriptions_status" ON "billing_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_billing_subscriptions_next_billing" ON "billing_subscriptions" USING btree ("next_billing_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_billing_subscriptions_stripe" ON "billing_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_billing_usage_subscription" ON "billing_usage_tracking" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_billing_usage_fleet" ON "billing_usage_tracking" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_billing_usage_period" ON "billing_usage_tracking" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_breakdown_patterns_vehicle" ON "breakdown_patterns" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_breakdown_patterns_fleet" ON "breakdown_patterns" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_breakdown_patterns_issue" ON "breakdown_patterns" USING btree ("issue_type");--> statement-breakpoint
CREATE INDEX "idx_breakdown_patterns_frequency" ON "breakdown_patterns" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "idx_contract_amendments_contract" ON "contract_amendments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_contract_amendments_status" ON "contract_amendments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contract_amendments_version" ON "contract_amendments" USING btree ("contract_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_contract_penalties_contract" ON "contract_penalties" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_contract_penalties_status" ON "contract_penalties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contract_penalties_date" ON "contract_penalties" USING btree ("penalty_date");--> statement-breakpoint
CREATE INDEX "idx_contract_performance_contract" ON "contract_performance_metrics" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_contract_performance_period" ON "contract_performance_metrics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_contract_performance_metric" ON "contract_performance_metrics" USING btree ("sla_metric_id");--> statement-breakpoint
CREATE INDEX "idx_contract_performance_breach" ON "contract_performance_metrics" USING btree ("breach_occurred");--> statement-breakpoint
CREATE INDEX "idx_contract_sla_metrics_contract" ON "contract_sla_metrics" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_contract_sla_metrics_type" ON "contract_sla_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_contractor_applications_email" ON "contractor_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_contractor_applications_status" ON "contractor_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contractor_applications_submitted" ON "contractor_applications" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "idx_contractor_applications_created" ON "contractor_applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contractor_availability" ON "contractor_availability" USING btree ("contractor_id","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_contractor_documents_contractor" ON "contractor_documents" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "idx_contractor_documents_type" ON "contractor_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_contractor_documents_expiry" ON "contractor_documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_contractor_earnings_contractor" ON "contractor_earnings" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "idx_contractor_earnings_job" ON "contractor_earnings" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_contractor_earnings_paid" ON "contractor_earnings" USING btree ("is_paid");--> statement-breakpoint
CREATE INDEX "idx_contractor_performance" ON "contractor_performance" USING btree ("contractor_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_contractor_profiles_user" ON "contractor_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_contractor_profiles_tier" ON "contractor_profiles" USING btree ("performance_tier");--> statement-breakpoint
CREATE INDEX "idx_contractor_profiles_available" ON "contractor_profiles" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_contractor_services" ON "contractor_services" USING btree ("contractor_id","service_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customer_preferences_user" ON "customer_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_customer_preferences_unsubscribe" ON "customer_preferences" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_driver_profiles_user" ON "driver_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_driver_profiles_fleet" ON "driver_profiles" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_email_templates_code" ON "email_templates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_fleet_accounts_company" ON "fleet_accounts" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_fleet_accounts_dot" ON "fleet_accounts" USING btree ("dot_number");--> statement-breakpoint
CREATE INDEX "idx_fleet_accounts_tier" ON "fleet_accounts" USING btree ("pricing_tier");--> statement-breakpoint
CREATE INDEX "idx_fleet_alerts_fleet" ON "fleet_analytics_alerts" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_alerts_vehicle" ON "fleet_analytics_alerts" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_alerts_type" ON "fleet_analytics_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "idx_fleet_alerts_active" ON "fleet_analytics_alerts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_fleet_checks_number" ON "fleet_checks" USING btree ("check_number");--> statement-breakpoint
CREATE INDEX "idx_fleet_checks_provider" ON "fleet_checks" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_fleet_checks_status" ON "fleet_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fleet_checks_job" ON "fleet_checks" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_checks_user" ON "fleet_checks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_checks_fleet" ON "fleet_checks" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_checks_created" ON "fleet_checks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_fleet_contacts_fleet" ON "fleet_contacts" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_contacts_user" ON "fleet_contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_contracts_fleet" ON "fleet_contracts" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_contracts_status" ON "fleet_contracts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fleet_contracts_number" ON "fleet_contracts" USING btree ("contract_number");--> statement-breakpoint
CREATE INDEX "idx_fleet_contracts_dates" ON "fleet_contracts" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_fleet_pricing_overrides" ON "fleet_pricing_overrides" USING btree ("fleet_account_id","service_type_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_vehicles_fleet" ON "fleet_vehicles" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_fleet_vehicles_vin" ON "fleet_vehicles" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "idx_fleet_vehicles_unit" ON "fleet_vehicles" USING btree ("unit_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_integrations_config_service" ON "integrations_config" USING btree ("service");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoices_number" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoices_job" ON "invoices" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_customer" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_fleet" ON "invoices" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_job" ON "job_bids" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_contractor" ON "job_bids" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_status" ON "job_bids" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_bids_expiry" ON "job_bids" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_job_bids_unique" ON "job_bids" USING btree ("job_id","contractor_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_created" ON "job_bids" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_job_messages_job" ON "job_messages" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_messages_sender" ON "job_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_job_messages_created" ON "job_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_job_photos_job" ON "job_photos" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_status_history_job" ON "job_status_history" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_status_history_created" ON "job_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_jobs_job_number" ON "jobs" USING btree ("job_number");--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_customer" ON "jobs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_contractor" ON "jobs" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_fleet" ON "jobs" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_type" ON "jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "idx_jobs_created" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_methods_user" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_methods_default" ON "payment_methods" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_payment_splits_split_payment" ON "payment_splits" USING btree ("split_payment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_splits_job" ON "payment_splits" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_payment_splits_payer" ON "payment_splits" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "idx_payment_splits_status" ON "payment_splits" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payment_splits_token" ON "payment_splits" USING btree ("payment_token");--> statement-breakpoint
CREATE INDEX "idx_payment_splits_created" ON "payment_splits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_platform_metrics" ON "platform_metrics" USING btree ("metric_date","metric_type");--> statement-breakpoint
CREATE INDEX "idx_pricing_rules_type" ON "pricing_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "idx_pricing_rules_active" ON "pricing_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_pricing_rules_priority" ON "pricing_rules" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_referral_programs_code" ON "referral_programs" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_referral_programs_active" ON "referral_programs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_refunds_transaction" ON "refunds" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_status" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reminder_blacklist_value" ON "reminder_blacklist" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_reminder_blacklist_type" ON "reminder_blacklist" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_reminder_blacklist_active" ON "reminder_blacklist" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_reminder_log_reminder" ON "reminder_log" USING btree ("reminder_id");--> statement-breakpoint
CREATE INDEX "idx_reminder_log_job" ON "reminder_log" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_reminder_log_recipient" ON "reminder_log" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_reminder_log_status" ON "reminder_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reminder_log_sent_at" ON "reminder_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_reminder_metrics_date_channel" ON "reminder_metrics" USING btree ("date","channel");--> statement-breakpoint
CREATE INDEX "idx_reminder_metrics_type" ON "reminder_metrics" USING btree ("message_type");--> statement-breakpoint
CREATE INDEX "idx_reminders_job" ON "reminders" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_reminders_recipient" ON "reminders" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_reminders_status" ON "reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reminders_scheduled_time" ON "reminders" USING btree ("scheduled_send_time");--> statement-breakpoint
CREATE INDEX "idx_reminders_type_timing" ON "reminders" USING btree ("reminder_type","reminder_timing");--> statement-breakpoint
CREATE INDEX "idx_revenue_reports" ON "revenue_reports" USING btree ("report_date","report_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_review_votes_unique" ON "review_votes" USING btree ("review_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_contractor" ON "reviews" USING btree ("contractor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reviews_job" ON "reviews" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_customer" ON "reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_overall_rating" ON "reviews" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "idx_reviews_created" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reviews_moderation" ON "reviews" USING btree ("moderation_status");--> statement-breakpoint
CREATE INDEX "idx_reviews_verified" ON "reviews" USING btree ("is_verified_purchase");--> statement-breakpoint
CREATE INDEX "idx_service_areas_name" ON "service_areas" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_service_areas_type" ON "service_areas" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_service_pricing_service" ON "service_pricing" USING btree ("service_type_id");--> statement-breakpoint
CREATE INDEX "idx_service_pricing_dates" ON "service_pricing" USING btree ("effective_date","expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_service_types_code" ON "service_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_service_types_category" ON "service_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_service_types_emergency" ON "service_types" USING btree ("is_emergency");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sms_templates_code" ON "sms_templates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_split_payment_templates_active" ON "split_payment_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_split_payment_templates_default" ON "split_payment_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_split_payment_templates_priority" ON "split_payment_templates" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_split_payments_job" ON "split_payments" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_split_payments_status" ON "split_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_split_payments_created" ON "split_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_surge_pricing_active" ON "surge_pricing" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_surge_pricing_type" ON "surge_pricing" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "idx_transactions_job" ON "transactions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_user" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_status" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_phone" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_vehicle_analytics_vehicle" ON "vehicle_analytics" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_analytics_fleet" ON "vehicle_analytics" USING btree ("fleet_account_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_analytics_health" ON "vehicle_analytics" USING btree ("health_score");--> statement-breakpoint
CREATE INDEX "idx_vehicle_analytics_risk" ON "vehicle_analytics" USING btree ("risk_level");