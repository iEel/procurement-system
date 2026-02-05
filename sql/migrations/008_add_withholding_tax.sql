-- Migration: Add withholding tax columns to PurchaseRequests
-- Date: 2026-02-05

-- Add withholding tax rate and amount columns
ALTER TABLE PurchaseRequests ADD
    withholdingTaxRate DECIMAL(5,2) NULL DEFAULT 0,
    withholdingTaxAmount DECIMAL(18,2) NULL DEFAULT 0;
GO

PRINT 'Added withholdingTaxRate and withholdingTaxAmount columns to PurchaseRequests table';
