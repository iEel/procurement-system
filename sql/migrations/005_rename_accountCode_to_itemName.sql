-- Migration: Rename accountCode to itemName
-- Date: 2026-02-05

-- Rename column in PRItems
EXEC sp_rename 'PRItems.accountCode', 'itemName', 'COLUMN';
GO

-- Rename column in POItems
EXEC sp_rename 'POItems.accountCode', 'itemName', 'COLUMN';
GO

PRINT 'Migration completed: accountCode renamed to itemName';
