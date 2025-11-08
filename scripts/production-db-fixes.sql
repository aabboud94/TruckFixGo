-- Comprehensive Database Fix Script for Production
-- This script ensures production database matches development
-- Run this on production to fix all guest booking issues

-- 1. Add missing columns to jobs table (if they don't exist)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS maximum_bid_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS reserve_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS winning_bid_id VARCHAR,
ADD COLUMN IF NOT EXISTS bidding_strategy VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS auto_accept_bids VARCHAR(20) DEFAULT 'never',
ADD COLUMN IF NOT EXISTS bidding_duration INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS bid_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lowest_bid_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS average_bid_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS review_text TEXT;

-- 2. Ensure all required service types exist with proper data
INSERT INTO service_types (id, code, name, category, description, is_emergency, is_schedulable, estimated_duration, is_active) VALUES 
('emergency-repair', 'REPAIR', 'Emergency Repair', 'repair', 'General emergency roadside repair', true, false, 120, true),
('flat-tire', 'TIRE', 'Flat Tire Repair', 'tire', 'Tire repair or replacement', true, false, 60, true),
('fuel-delivery', 'FUEL', 'Fuel Delivery', 'delivery', 'Emergency fuel delivery', true, false, 30, true),
('jump-start', 'JUMP', 'Jump Start', 'battery', 'Battery jump start service', true, false, 30, true),
('towing', 'TOW', 'Heavy-Duty Towing', 'towing', 'Heavy-duty truck towing service', true, false, 180, true)
ON CONFLICT (id) DO UPDATE 
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_emergency = EXCLUDED.is_emergency,
    is_schedulable = EXCLUDED.is_schedulable,
    estimated_duration = EXCLUDED.estimated_duration,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. Add service pricing for the service types (if table exists and needs it)
INSERT INTO service_pricing (service_type_id, base_price, price_per_mile, emergency_surcharge, is_active) VALUES
('emergency-repair', 150.00, 2.50, 50.00, true),
('flat-tire', 200.00, 2.50, 50.00, true),
('fuel-delivery', 100.00, 2.50, 25.00, true),
('jump-start', 75.00, 2.50, 25.00, true),
('towing', 300.00, 5.00, 100.00, true)
ON CONFLICT (service_type_id) DO UPDATE
SET base_price = EXCLUDED.base_price,
    price_per_mile = EXCLUDED.price_per_mile,
    emergency_surcharge = EXCLUDED.emergency_surcharge,
    is_active = EXCLUDED.is_active;

-- 4. Verify the data was inserted correctly
SELECT 'Service Types:' as info;
SELECT id, name, is_emergency, is_active FROM service_types WHERE id IN ('emergency-repair', 'flat-tire', 'fuel-delivery', 'jump-start', 'towing');

SELECT 'Service Pricing:' as info;
SELECT service_type_id, base_price, emergency_surcharge FROM service_pricing WHERE service_type_id IN ('emergency-repair', 'flat-tire', 'fuel-delivery', 'jump-start', 'towing');

SELECT 'Jobs Table Columns (bidding-related):' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs' AND column_name IN ('maximum_bid_amount', 'reserve_price', 'winning_bid_id', 'bidding_strategy', 'auto_accept_bids', 'bidding_duration', 'bid_count', 'lowest_bid_amount', 'average_bid_amount', 'review_text') ORDER BY column_name;