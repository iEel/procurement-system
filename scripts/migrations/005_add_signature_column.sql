-- ============================================
-- Migration: Add signatureImage column to Users
-- ============================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'signatureImage'
)
BEGIN
    ALTER TABLE Users ADD signatureImage NVARCHAR(500) NULL;
    PRINT 'Added signatureImage column to Users table';
END
ELSE
BEGIN
    PRINT 'signatureImage column already exists';
END
GO
