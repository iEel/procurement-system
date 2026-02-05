-- Migration: Add header/footer image columns to Branches
-- Date: 2026-02-05

ALTER TABLE Branches ADD
    headerImage NVARCHAR(500) NULL,
    footerImage NVARCHAR(500) NULL;
GO

PRINT 'Added headerImage and footerImage columns to Branches table';
