-- ==========================================
-- SAFE MIGRATION: Add new booking statuses
-- ==========================================
-- This migration safely adds support for:
-- - on_the_way
-- - arrival_approval_pending
-- - rework_requested
-- ==========================================

-- STEP 1: Create new enum type with all values (MySQL doesn't have true ALTER ENUM)
-- We must modify the column by changing the enum values

ALTER TABLE bookings 
MODIFY COLUMN status ENUM(
    'submitted',
    'approved',
    'assigned',
    'on_the_way',
    'arrival_approval_pending',
    'in_progress',
    'customer_review_pending',
    'admin_review_pending',
    'completed',
    'rework_requested',
    'rejection_requested',
    'rejected'
) DEFAULT 'submitted';

-- Verification: Check the updated column
-- SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME='bookings' AND COLUMN_NAME='status';

-- ROLLBACK (if needed):
-- ALTER TABLE bookings 
-- MODIFY COLUMN status ENUM(
--     'submitted',
--     'approved',
--     'assigned',
--     'in_progress',
--     'customer_review_pending',
--     'admin_review_pending',
--     'completed',
--     'rejection_requested',
--     'rejected'
-- ) DEFAULT 'submitted';
