-- Full sync migration - ADDITIVE ONLY
-- This migration adds all missing tables and columns without dropping anything
-- Generated to synchronize database with schema.ts

-- ====================
-- MISSING TABLES
-- ====================

-- 1. bid_templates table
CREATE TABLE IF NOT EXISTS "bid_templates" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractor_id" varchar NOT NULL REFERENCES "users"("id"),
  "service_type_id" varchar REFERENCES "service_types"("id"),
  "name" text NOT NULL,
  "description" text,
  "default_message" text,
  "base_amount" numeric(10, 2),
  "per_mile_rate" numeric(6, 2),
  "estimated_time_formula" text,
  "enable_auto_bid" boolean NOT NULL DEFAULT false,
  "max_auto_bid_amount" numeric(10, 2),
  "min_auto_bid_amount" numeric(10, 2),
  "auto_bid_radius" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_bid_templates_contractor" ON "bid_templates"("contractor_id");
CREATE INDEX IF NOT EXISTS "idx_bid_templates_service" ON "bid_templates"("service_type_id");

-- 2. bidding_config table
CREATE TABLE IF NOT EXISTS "bidding_config" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "default_bidding_duration" integer NOT NULL DEFAULT 120,
  "minimum_bidding_duration" integer NOT NULL DEFAULT 30,
  "maximum_bidding_duration" integer NOT NULL DEFAULT 480,
  "minimum_bid_increment" numeric(6, 2) NOT NULL DEFAULT 5.00,
  "maximum_bids_per_contractor" integer NOT NULL DEFAULT 1,
  "minimum_contractors_to_notify" integer NOT NULL DEFAULT 10,
  "anti_sniping_extension" integer NOT NULL DEFAULT 5,
  "anti_sniping_threshold" integer NOT NULL DEFAULT 5,
  "platform_fee_percentage" numeric(5, 2) NOT NULL DEFAULT 10.00,
  "minimum_platform_fee" numeric(6, 2) NOT NULL DEFAULT 5.00,
  "no_show_penalty_amount" numeric(8, 2) NOT NULL DEFAULT 50.00,
  "bid_retraction_penalty_amount" numeric(8, 2) NOT NULL DEFAULT 25.00,
  "cooldown_period_days" integer NOT NULL DEFAULT 7,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- 3. job_bids table
CREATE TABLE IF NOT EXISTS "job_bids" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" varchar NOT NULL REFERENCES "jobs"("id"),
  "contractor_id" varchar NOT NULL REFERENCES "users"("id"),
  "bid_amount" numeric(10, 2) NOT NULL,
  "estimated_completion_time" integer NOT NULL,
  "message_to_customer" text,
  "labor_cost" numeric(10, 2),
  "materials_cost" numeric(10, 2),
  "materials_description" text,
  "status" varchar DEFAULT 'pending',
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "rejected_at" timestamp,
  "withdrawn_at" timestamp,
  "is_counter_offer" boolean NOT NULL DEFAULT false,
  "original_bid_id" varchar REFERENCES "job_bids"("id"),
  "counter_offer_amount" numeric(10, 2),
  "counter_offer_message" text,
  "contractor_name" text,
  "contractor_rating" numeric(3, 2),
  "contractor_completed_jobs" integer,
  "contractor_response_time" integer,
  "is_auto_bid" boolean NOT NULL DEFAULT false,
  "auto_bid_template_id" varchar,
  "bid_score" numeric(5, 2),
  "price_rank" integer,
  "time_rank" integer,
  "quality_rank" integer,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_job_bids_job" ON "job_bids"("job_id");
CREATE INDEX IF NOT EXISTS "idx_job_bids_contractor" ON "job_bids"("contractor_id");
CREATE INDEX IF NOT EXISTS "idx_job_bids_status" ON "job_bids"("status");
CREATE INDEX IF NOT EXISTS "idx_job_bids_expiry" ON "job_bids"("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_job_bids_unique" ON "job_bids"("job_id", "contractor_id");
CREATE INDEX IF NOT EXISTS "idx_job_bids_created" ON "job_bids"("created_at");

-- 4. pm_schedules table
CREATE TABLE IF NOT EXISTS "pm_schedules" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "fleet_account_id" varchar NOT NULL REFERENCES "fleet_accounts"("id"),
  "vehicle_id" varchar NOT NULL REFERENCES "fleet_vehicles"("id"),
  "service_type" varchar(100) NOT NULL,
  "frequency" varchar NOT NULL,
  "next_service_date" timestamp NOT NULL,
  "last_service_date" timestamp,
  "is_active" boolean NOT NULL DEFAULT true,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_pm_schedules_fleet" ON "pm_schedules"("fleet_account_id");
CREATE INDEX IF NOT EXISTS "idx_pm_schedules_vehicle" ON "pm_schedules"("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_pm_schedules_next_service" ON "pm_schedules"("next_service_date");
CREATE INDEX IF NOT EXISTS "idx_pm_schedules_active" ON "pm_schedules"("is_active");

-- 5. job_reassignment_history table
CREATE TABLE IF NOT EXISTS "job_reassignment_history" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" varchar NOT NULL REFERENCES "jobs"("id"),
  "from_contractor_id" varchar REFERENCES "users"("id"),
  "to_contractor_id" varchar NOT NULL REFERENCES "users"("id"),
  "reassigned_by" varchar NOT NULL REFERENCES "users"("id"),
  "reason" text,
  "reassignment_type" varchar(50),
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_job_reassignment_job" ON "job_reassignment_history"("job_id");
CREATE INDEX IF NOT EXISTS "idx_job_reassignment_from" ON "job_reassignment_history"("from_contractor_id");
CREATE INDEX IF NOT EXISTS "idx_job_reassignment_to" ON "job_reassignment_history"("to_contractor_id");

-- 6. location_tracking table
CREATE TABLE IF NOT EXISTS "location_tracking" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractor_id" varchar NOT NULL REFERENCES "users"("id"),
  "job_id" varchar REFERENCES "jobs"("id"),
  "latitude" numeric(10, 8) NOT NULL,
  "longitude" numeric(11, 8) NOT NULL,
  "accuracy" numeric(10, 2),
  "altitude" numeric(10, 2),
  "heading" numeric(5, 2),
  "speed" numeric(6, 2),
  "battery_level" integer,
  "is_charging" boolean,
  "network_type" varchar(20),
  "update_frequency" varchar NOT NULL DEFAULT 'normal',
  "tracking_status" varchar NOT NULL DEFAULT 'active',
  "last_movement_at" timestamp,
  "is_stationary" boolean NOT NULL DEFAULT false,
  "stationary_duration" integer,
  "is_paused" boolean NOT NULL DEFAULT false,
  "paused_at" timestamp,
  "paused_reason" text,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_location_tracking_contractor" ON "location_tracking"("contractor_id");
CREATE INDEX IF NOT EXISTS "idx_location_tracking_job" ON "location_tracking"("job_id");
CREATE INDEX IF NOT EXISTS "idx_location_tracking_status" ON "location_tracking"("tracking_status");
CREATE INDEX IF NOT EXISTS "idx_location_tracking_updated" ON "location_tracking"("updated_at");

-- 7. tracking_sessions table
CREATE TABLE IF NOT EXISTS "tracking_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractor_id" varchar NOT NULL REFERENCES "users"("id"),
  "job_id" varchar REFERENCES "jobs"("id"),
  "started_at" timestamp NOT NULL DEFAULT NOW(),
  "ended_at" timestamp,
  "duration" integer,
  "distance_traveled" numeric(10, 2),
  "average_speed" numeric(6, 2),
  "max_speed" numeric(6, 2),
  "stops_count" integer DEFAULT 0,
  "total_stop_duration" integer DEFAULT 0,
  "route_geometry" jsonb,
  "start_location" jsonb,
  "end_location" jsonb,
  "key_waypoints" jsonb DEFAULT '[]',
  "battery_start" integer,
  "battery_end" integer,
  "data_points_collected" integer DEFAULT 0,
  "data_quality_score" numeric(5, 2),
  "is_active" boolean NOT NULL DEFAULT true,
  "end_reason" varchar(50),
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_tracking_sessions_contractor" ON "tracking_sessions"("contractor_id");
CREATE INDEX IF NOT EXISTS "idx_tracking_sessions_job" ON "tracking_sessions"("job_id");
CREATE INDEX IF NOT EXISTS "idx_tracking_sessions_active" ON "tracking_sessions"("is_active");
CREATE INDEX IF NOT EXISTS "idx_tracking_sessions_started" ON "tracking_sessions"("started_at");

-- 8. location_history table
CREATE TABLE IF NOT EXISTS "location_history" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractor_id" varchar NOT NULL REFERENCES "users"("id"),
  "job_id" varchar REFERENCES "jobs"("id"),
  "session_id" varchar REFERENCES "tracking_sessions"("id"),
  "latitude" numeric(10, 8) NOT NULL,
  "longitude" numeric(11, 8) NOT NULL,
  "accuracy" numeric(10, 2),
  "altitude" numeric(10, 2),
  "heading" numeric(5, 2),
  "speed" numeric(6, 2),
  "battery_level" integer,
  "is_charging" boolean,
  "network_type" varchar(20),
  "activity_type" varchar(50),
  "confidence" integer,
  "is_mock_location" boolean DEFAULT false,
  "provider" varchar(20),
  "satellite_count" integer,
  "recorded_at" timestamp NOT NULL DEFAULT NOW(),
  "server_received_at" timestamp DEFAULT NOW(),
  "processing_delay" integer,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_location_history_contractor" ON "location_history"("contractor_id");
CREATE INDEX IF NOT EXISTS "idx_location_history_job" ON "location_history"("job_id");
CREATE INDEX IF NOT EXISTS "idx_location_history_session" ON "location_history"("session_id");
CREATE INDEX IF NOT EXISTS "idx_location_history_recorded" ON "location_history"("recorded_at");

-- 9. geofence_events table
CREATE TABLE IF NOT EXISTS "geofence_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractor_id" varchar NOT NULL REFERENCES "users"("id"),
  "job_id" varchar NOT NULL REFERENCES "jobs"("id"),
  "session_id" varchar REFERENCES "tracking_sessions"("id"),
  "event_type" varchar NOT NULL,
  "latitude" numeric(10, 8) NOT NULL,
  "longitude" numeric(11, 8) NOT NULL,
  "radius" integer NOT NULL DEFAULT 100,
  "job_latitude" numeric(10, 8) NOT NULL,
  "job_longitude" numeric(11, 8) NOT NULL,
  "distance_from_site" numeric(10, 2),
  "triggered_at" timestamp NOT NULL DEFAULT NOW(),
  "dwell_time" integer,
  "notification_sent" boolean NOT NULL DEFAULT false,
  "notification_sent_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_geofence_events_contractor" ON "geofence_events"("contractor_id");
CREATE INDEX IF NOT EXISTS "idx_geofence_events_job" ON "geofence_events"("job_id");
CREATE INDEX IF NOT EXISTS "idx_geofence_events_session" ON "geofence_events"("session_id");
CREATE INDEX IF NOT EXISTS "idx_geofence_events_type" ON "geofence_events"("event_type");
CREATE INDEX IF NOT EXISTS "idx_geofence_events_triggered" ON "geofence_events"("triggered_at");

-- 10. invoice_defaults table
CREATE TABLE IF NOT EXISTS "invoice_defaults" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "type" varchar NOT NULL,
  "description" text,
  "amount" numeric(10, 2),
  "percentage" numeric(5, 2),
  "is_taxable" boolean NOT NULL DEFAULT false,
  "apply_to_all" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_invoice_defaults_type" ON "invoice_defaults"("type");
CREATE INDEX IF NOT EXISTS "idx_invoice_defaults_active" ON "invoice_defaults"("is_active");

-- 11. invoice_line_items table
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" varchar NOT NULL REFERENCES "invoices"("id"),
  "type" varchar NOT NULL,
  "description" text NOT NULL,
  "quantity" numeric(10, 2) NOT NULL DEFAULT 1,
  "unit_price" numeric(10, 2) NOT NULL,
  "total" numeric(10, 2) NOT NULL,
  "tax_rate" numeric(5, 2) DEFAULT 0,
  "tax_amount" numeric(10, 2) DEFAULT 0,
  "is_taxable" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_invoice_line_items_invoice" ON "invoice_line_items"("invoice_id");

-- 12. billing_usage_tracking table
CREATE TABLE IF NOT EXISTS "billing_usage_tracking" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "subscription_id" varchar NOT NULL REFERENCES "billing_subscriptions"("id"),
  "metric_type" varchar(50) NOT NULL,
  "period_start" timestamp NOT NULL,
  "period_end" timestamp NOT NULL,
  "usage_count" integer NOT NULL DEFAULT 0,
  "included_count" integer NOT NULL DEFAULT 0,
  "overage_count" integer NOT NULL DEFAULT 0,
  "unit_price" numeric(10, 4),
  "overage_price" numeric(10, 4),
  "total_charge" numeric(10, 2),
  "metadata" jsonb,
  "billed" boolean NOT NULL DEFAULT false,
  "billed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_billing_usage_subscription" ON "billing_usage_tracking"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_billing_usage_period" ON "billing_usage_tracking"("period_start", "period_end");
CREATE INDEX IF NOT EXISTS "idx_billing_usage_metric" ON "billing_usage_tracking"("metric_type");
CREATE INDEX IF NOT EXISTS "idx_billing_usage_billed" ON "billing_usage_tracking"("billed");

-- 13. booking_settings table
CREATE TABLE IF NOT EXISTS "booking_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "setting_key" varchar(100) NOT NULL UNIQUE,
  "setting_value" jsonb NOT NULL,
  "description" text,
  "category" varchar(50),
  "is_active" boolean NOT NULL DEFAULT true,
  "updated_by" varchar REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_booking_settings_key" ON "booking_settings"("setting_key");
CREATE INDEX IF NOT EXISTS "idx_booking_settings_category" ON "booking_settings"("category");

-- 14. booking_blacklist table
CREATE TABLE IF NOT EXISTS "booking_blacklist" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(20),
  "email" text,
  "ip_address" varchar(45),
  "reason" text,
  "blocked_by" varchar NOT NULL REFERENCES "users"("id"),
  "expires_at" timestamp,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_booking_blacklist_phone" ON "booking_blacklist"("phone");
CREATE INDEX IF NOT EXISTS "idx_booking_blacklist_email" ON "booking_blacklist"("email");
CREATE INDEX IF NOT EXISTS "idx_booking_blacklist_ip" ON "booking_blacklist"("ip_address");
CREATE INDEX IF NOT EXISTS "idx_booking_blacklist_active" ON "booking_blacklist"("is_active");

-- 15. contract_sla_metrics table
CREATE TABLE IF NOT EXISTS "contract_sla_metrics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contract_id" varchar NOT NULL REFERENCES "fleet_contracts"("id"),
  "metric_type" varchar(50) NOT NULL,
  "target_value" numeric(10, 2) NOT NULL,
  "actual_value" numeric(10, 2),
  "measurement_period_start" timestamp NOT NULL,
  "measurement_period_end" timestamp NOT NULL,
  "is_compliant" boolean,
  "compliance_percentage" numeric(5, 2),
  "penalty_amount" numeric(10, 2),
  "penalty_applied" boolean NOT NULL DEFAULT false,
  "notes" text,
  "calculated_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_sla_metrics_contract" ON "contract_sla_metrics"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_sla_metrics_type" ON "contract_sla_metrics"("metric_type");
CREATE INDEX IF NOT EXISTS "idx_sla_metrics_period" ON "contract_sla_metrics"("measurement_period_start", "measurement_period_end");
CREATE INDEX IF NOT EXISTS "idx_sla_metrics_compliance" ON "contract_sla_metrics"("is_compliant");

-- 16. contract_penalties table
CREATE TABLE IF NOT EXISTS "contract_penalties" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contract_id" varchar NOT NULL REFERENCES "fleet_contracts"("id"),
  "sla_metric_id" varchar REFERENCES "contract_sla_metrics"("id"),
  "penalty_type" varchar(50) NOT NULL,
  "penalty_reason" text NOT NULL,
  "base_amount" numeric(10, 2) NOT NULL,
  "multiplier" numeric(5, 2) DEFAULT 1,
  "final_amount" numeric(10, 2) NOT NULL,
  "penalty_date" timestamp NOT NULL,
  "due_date" timestamp,
  "invoice_id" varchar REFERENCES "invoices"("id"),
  "waived" boolean NOT NULL DEFAULT false,
  "waived_by" varchar REFERENCES "users"("id"),
  "waived_at" timestamp,
  "waiver_reason" text,
  "paid" boolean NOT NULL DEFAULT false,
  "paid_at" timestamp,
  "payment_reference" varchar(100),
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_penalties_contract" ON "contract_penalties"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_penalties_metric" ON "contract_penalties"("sla_metric_id");
CREATE INDEX IF NOT EXISTS "idx_penalties_date" ON "contract_penalties"("penalty_date");
CREATE INDEX IF NOT EXISTS "idx_penalties_waived" ON "contract_penalties"("waived");
CREATE INDEX IF NOT EXISTS "idx_penalties_paid" ON "contract_penalties"("paid");

-- 17. contract_amendments table
CREATE TABLE IF NOT EXISTS "contract_amendments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contract_id" varchar NOT NULL REFERENCES "fleet_contracts"("id"),
  "amendment_number" integer NOT NULL,
  "amendment_type" varchar(50) NOT NULL,
  "description" text NOT NULL,
  "changes_summary" jsonb NOT NULL,
  "effective_date" timestamp NOT NULL,
  "expiry_date" timestamp,
  "approved_by_fleet" boolean NOT NULL DEFAULT false,
  "approved_by_fleet_at" timestamp,
  "approved_by_fleet_user" varchar REFERENCES "users"("id"),
  "approved_by_platform" boolean NOT NULL DEFAULT false,
  "approved_by_platform_at" timestamp,
  "approved_by_platform_user" varchar REFERENCES "users"("id"),
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "document_url" text,
  "notes" text,
  "created_by" varchar NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_amendments_contract" ON "contract_amendments"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_amendments_number" ON "contract_amendments"("amendment_number");
CREATE INDEX IF NOT EXISTS "idx_amendments_status" ON "contract_amendments"("status");
CREATE INDEX IF NOT EXISTS "idx_amendments_effective" ON "contract_amendments"("effective_date");

-- 18. contract_performance_metrics table
CREATE TABLE IF NOT EXISTS "contract_performance_metrics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "contract_id" varchar NOT NULL REFERENCES "fleet_contracts"("id"),
  "measurement_date" timestamp NOT NULL,
  "total_services_requested" integer NOT NULL DEFAULT 0,
  "total_services_completed" integer NOT NULL DEFAULT 0,
  "total_services_cancelled" integer NOT NULL DEFAULT 0,
  "average_response_time" numeric(10, 2),
  "average_completion_time" numeric(10, 2),
  "on_time_completion_rate" numeric(5, 2),
  "customer_satisfaction_score" numeric(3, 2),
  "total_spend" numeric(12, 2) NOT NULL DEFAULT 0,
  "total_savings" numeric(10, 2) DEFAULT 0,
  "discount_applied" numeric(10, 2) DEFAULT 0,
  "sla_compliance_rate" numeric(5, 2),
  "total_sla_breaches" integer DEFAULT 0,
  "total_penalties" numeric(10, 2) DEFAULT 0,
  "cost_per_service" numeric(10, 2),
  "service_type_breakdown" jsonb,
  "location_breakdown" jsonb,
  "time_of_day_breakdown" jsonb,
  "top_issues" jsonb,
  "contractor_performance" jsonb,
  "notes" text,
  "generated_at" timestamp NOT NULL DEFAULT NOW(),
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_perf_metrics_contract" ON "contract_performance_metrics"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_perf_metrics_date" ON "contract_performance_metrics"("measurement_date");
CREATE INDEX IF NOT EXISTS "idx_perf_metrics_generated" ON "contract_performance_metrics"("generated_at");

-- 19. split_payments table
CREATE TABLE IF NOT EXISTS "split_payments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" varchar NOT NULL REFERENCES "jobs"("id"),
  "total_amount" numeric(10, 2) NOT NULL,
  "initiator_id" varchar NOT NULL REFERENCES "users"("id"),
  "initiator_type" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "payment_method" varchar(50),
  "stripe_payment_intent_id" varchar(255),
  "expires_at" timestamp NOT NULL,
  "completed_at" timestamp,
  "cancelled_at" timestamp,
  "cancellation_reason" text,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_split_payments_job" ON "split_payments"("job_id");
CREATE INDEX IF NOT EXISTS "idx_split_payments_initiator" ON "split_payments"("initiator_id");
CREATE INDEX IF NOT EXISTS "idx_split_payments_status" ON "split_payments"("status");
CREATE INDEX IF NOT EXISTS "idx_split_payments_expires" ON "split_payments"("expires_at");

-- 20. payment_splits table
CREATE TABLE IF NOT EXISTS "payment_splits" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "split_payment_id" varchar NOT NULL REFERENCES "split_payments"("id"),
  "participant_name" text NOT NULL,
  "participant_phone" varchar(20),
  "participant_email" text,
  "amount" numeric(10, 2) NOT NULL,
  "percentage" numeric(5, 2),
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "payment_link" text,
  "payment_link_expires_at" timestamp,
  "stripe_checkout_session_id" varchar(255),
  "stripe_payment_intent_id" varchar(255),
  "paid_at" timestamp,
  "reminder_sent_at" timestamp,
  "reminder_count" integer NOT NULL DEFAULT 0,
  "last_reminder_at" timestamp,
  "verification_code" varchar(20),
  "verification_attempts" integer NOT NULL DEFAULT 0,
  "verified_at" timestamp,
  "refunded_at" timestamp,
  "refund_reason" text,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_payment_splits_split_payment" ON "payment_splits"("split_payment_id");
CREATE INDEX IF NOT EXISTS "idx_payment_splits_status" ON "payment_splits"("status");
CREATE INDEX IF NOT EXISTS "idx_payment_splits_phone" ON "payment_splits"("participant_phone");
CREATE INDEX IF NOT EXISTS "idx_payment_splits_email" ON "payment_splits"("participant_email");

-- 21. split_payment_templates table
CREATE TABLE IF NOT EXISTS "split_payment_templates" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "name" text NOT NULL,
  "description" text,
  "default_splits" jsonb NOT NULL DEFAULT '[]',
  "is_percentage_based" boolean NOT NULL DEFAULT true,
  "is_default" boolean NOT NULL DEFAULT false,
  "usage_count" integer NOT NULL DEFAULT 0,
  "last_used_at" timestamp,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_split_templates_user" ON "split_payment_templates"("user_id");
CREATE INDEX IF NOT EXISTS "idx_split_templates_default" ON "split_payment_templates"("is_default");
CREATE INDEX IF NOT EXISTS "idx_split_templates_active" ON "split_payment_templates"("is_active");

-- 22. vehicle_analytics table
CREATE TABLE IF NOT EXISTS "vehicle_analytics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "fleet_account_id" varchar NOT NULL REFERENCES "fleet_accounts"("id"),
  "vehicle_id" varchar NOT NULL REFERENCES "fleet_vehicles"("id"),
  "analysis_date" timestamp NOT NULL,
  "total_services" integer NOT NULL DEFAULT 0,
  "emergency_services" integer NOT NULL DEFAULT 0,
  "scheduled_services" integer NOT NULL DEFAULT 0,
  "breakdown_frequency" numeric(5, 2),
  "average_repair_cost" numeric(10, 2),
  "total_repair_cost" numeric(12, 2),
  "most_common_issues" jsonb,
  "service_locations" jsonb,
  "time_between_services" numeric(10, 2),
  "predicted_next_service" timestamp,
  "risk_score" numeric(5, 2),
  "recommendations" jsonb,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_vehicle_analytics_fleet" ON "vehicle_analytics"("fleet_account_id");
CREATE INDEX IF NOT EXISTS "idx_vehicle_analytics_vehicle" ON "vehicle_analytics"("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_vehicle_analytics_date" ON "vehicle_analytics"("analysis_date");
CREATE INDEX IF NOT EXISTS "idx_vehicle_analytics_risk" ON "vehicle_analytics"("risk_score");

-- 23. breakdown_patterns table
CREATE TABLE IF NOT EXISTS "breakdown_patterns" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "pattern_type" varchar(50) NOT NULL,
  "vehicle_make" varchar(50),
  "vehicle_model" varchar(50),
  "vehicle_year_min" integer,
  "vehicle_year_max" integer,
  "service_type_id" varchar REFERENCES "service_types"("id"),
  "frequency" numeric(10, 2),
  "average_cost" numeric(10, 2),
  "common_mileage" integer,
  "seasonal_factor" jsonb,
  "confidence_score" numeric(5, 2),
  "sample_size" integer,
  "last_calculated" timestamp,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_breakdown_patterns_type" ON "breakdown_patterns"("pattern_type");
CREATE INDEX IF NOT EXISTS "idx_breakdown_patterns_vehicle" ON "breakdown_patterns"("vehicle_make", "vehicle_model");
CREATE INDEX IF NOT EXISTS "idx_breakdown_patterns_service" ON "breakdown_patterns"("service_type_id");

-- 24. fleet_analytics_alerts table
CREATE TABLE IF NOT EXISTS "fleet_analytics_alerts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "fleet_account_id" varchar NOT NULL REFERENCES "fleet_accounts"("id"),
  "vehicle_id" varchar REFERENCES "fleet_vehicles"("id"),
  "alert_type" varchar(50) NOT NULL,
  "severity" varchar(20) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "recommendations" jsonb,
  "threshold_value" numeric(10, 2),
  "actual_value" numeric(10, 2),
  "triggered_at" timestamp NOT NULL,
  "acknowledged" boolean NOT NULL DEFAULT false,
  "acknowledged_by" varchar REFERENCES "users"("id"),
  "acknowledged_at" timestamp,
  "resolved" boolean NOT NULL DEFAULT false,
  "resolved_at" timestamp,
  "resolution_notes" text,
  "notification_sent" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_analytics_alerts_fleet" ON "fleet_analytics_alerts"("fleet_account_id");
CREATE INDEX IF NOT EXISTS "idx_analytics_alerts_vehicle" ON "fleet_analytics_alerts"("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_analytics_alerts_type" ON "fleet_analytics_alerts"("alert_type");
CREATE INDEX IF NOT EXISTS "idx_analytics_alerts_severity" ON "fleet_analytics_alerts"("severity");
CREATE INDEX IF NOT EXISTS "idx_analytics_alerts_triggered" ON "fleet_analytics_alerts"("triggered_at");
CREATE INDEX IF NOT EXISTS "idx_analytics_alerts_resolved" ON "fleet_analytics_alerts"("resolved");

-- ====================
-- COMMIT TRANSACTION
-- ====================
-- Note: This migration only adds missing tables and columns
-- No DROP operations are included to preserve existing data

