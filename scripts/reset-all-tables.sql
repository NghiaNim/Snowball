-- COMPLETE DATABASE RESET
-- Run this first to clean everything, then run 004_unified_schema.sql

-- Drop all tables if they exist (in correct order for dependencies)
DROP TABLE IF EXISTS monthly_update_interactions CASCADE;
DROP TABLE IF EXISTS monthly_updates CASCADE; 
DROP TABLE IF EXISTS referral_links CASCADE;
DROP TABLE IF EXISTS page_templates CASCADE;

-- Drop all functions if they exist
DROP FUNCTION IF EXISTS cleanup_expired_referral_links() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop any other tables that might exist from previous migrations
DROP TABLE IF EXISTS investor_tracking CASCADE;
DROP TABLE IF EXISTS founder_profiles CASCADE;
DROP TABLE IF EXISTS update_interactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Clean slate ready for 004_unified_schema.sql
