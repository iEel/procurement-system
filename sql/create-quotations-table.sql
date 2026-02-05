-- PRQuotations Table for storing vendor quotation documents
-- This table stores quotation documents from 3 vendors (1 selected + 2 comparison)

-- Create PRQuotations table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PRQuotations]') AND type in (N'U'))
BEGIN
    CREATE TABLE PRQuotations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        prId INT NOT NULL REFERENCES PurchaseRequests(id) ON DELETE CASCADE,
        vendorNo INT NOT NULL,              -- 1, 2, 3
        vendorName NVARCHAR(200) NOT NULL,  -- ชื่อบริษัทผู้เสนอราคา
        isSelected BIT NOT NULL DEFAULT 0,  -- บริษัทที่ถูกเลือก (เจ้าที่ 1)
        fileName NVARCHAR(255) NOT NULL,
        filePath NVARCHAR(500) NOT NULL,
        fileType NVARCHAR(50),
        fileSize INT,
        totalAmount DECIMAL(18,2),          -- ยอดเสนอราคา (ถ้ามี)
        uploadedAt DATETIME2 NOT NULL DEFAULT SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time',
        
        CONSTRAINT UQ_PRQuotations_Vendor UNIQUE (prId, vendorNo)
    );
    
    PRINT 'Created PRQuotations table successfully!';
END
ELSE
BEGIN
    PRINT 'PRQuotations table already exists.';
END
GO

-- Create index for faster queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PRQuotations_prId')
BEGIN
    CREATE INDEX IX_PRQuotations_prId ON PRQuotations(prId);
    PRINT 'Created index IX_PRQuotations_prId';
END
GO
