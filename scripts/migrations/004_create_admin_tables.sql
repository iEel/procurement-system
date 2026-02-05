-- Migration: Create Admin Tables
-- Date: 2026-02-04
-- Description: Create tables for document settings and system settings

-- DocumentSettings Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DocumentSettings' AND xtype='U')
BEGIN
    CREATE TABLE DocumentSettings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        companyId INT NOT NULL,
        documentType NVARCHAR(10) NOT NULL,
        prefix NVARCHAR(20) NOT NULL,
        lastNumber INT DEFAULT 0,
        yearMonth NVARCHAR(4),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_DocumentSettings_Company FOREIGN KEY (companyId) REFERENCES Companies(id),
        CONSTRAINT UQ_DocumentSettings_CompanyType UNIQUE (companyId, documentType)
    );
    
    PRINT 'Created DocumentSettings table';
END
GO

-- SystemSettings Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemSettings' AND xtype='U')
BEGIN
    CREATE TABLE SystemSettings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        [key] NVARCHAR(100) NOT NULL UNIQUE,
        value NVARCHAR(MAX),
        description NVARCHAR(500),
        category NVARCHAR(50),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
    
    PRINT 'Created SystemSettings table';
END
GO

-- Add missing columns to Companies table (if not exist)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'address')
BEGIN
    ALTER TABLE Companies ADD address NVARCHAR(500);
    PRINT 'Added address column to Companies';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'taxId')
BEGIN
    ALTER TABLE Companies ADD taxId NVARCHAR(20);
    PRINT 'Added taxId column to Companies';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'phone')
BEGIN
    ALTER TABLE Companies ADD phone NVARCHAR(50);
    PRINT 'Added phone column to Companies';
END
GO

-- Add missing columns to Branches table (if not exist)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'address')
BEGIN
    ALTER TABLE Branches ADD address NVARCHAR(500);
    PRINT 'Added address column to Branches';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'phone')
BEGIN
    ALTER TABLE Branches ADD phone NVARCHAR(50);
    PRINT 'Added phone column to Branches';
END
GO

-- Insert default system settings
IF NOT EXISTS (SELECT * FROM SystemSettings WHERE [key] = 'VAT_RATE')
BEGIN
    INSERT INTO SystemSettings ([key], value, description, category)
    VALUES 
        ('VAT_RATE', '7', 'อัตรา VAT (%)', 'general'),
        ('CURRENCY', 'THB', 'สกุลเงิน', 'general'),
        ('EMAIL_NOTIFICATIONS', 'true', 'ส่งอีเมลแจ้งเตือน', 'email'),
        ('APPROVAL_REQUIRED_PR', 'true', 'ต้องอนุมัติใบขอซื้อ', 'approval'),
        ('APPROVAL_REQUIRED_PO', 'true', 'ต้องอนุมัติใบสั่งซื้อ', 'approval');
    
    PRINT 'Inserted default system settings';
END
GO

PRINT 'Migration completed successfully';
