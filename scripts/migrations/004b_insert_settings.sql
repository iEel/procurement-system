-- Step 1: Drop existing table
DROP TABLE IF EXISTS SystemSettings;
GO

-- Step 2: Create new table
CREATE TABLE SystemSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    settingKey NVARCHAR(100) NOT NULL UNIQUE,
    settingValue NVARCHAR(MAX),
    description NVARCHAR(500),
    category NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Step 3: Insert default values
INSERT INTO SystemSettings (settingKey, settingValue, description, category)
VALUES 
    ('VAT_RATE', '7', N'อัตรา VAT (%)', 'general'),
    ('CURRENCY', 'THB', N'สกุลเงิน', 'general'),
    ('DEFAULT_COMPANY_ID', '1', N'บริษัทเริ่มต้น', 'general'),
    ('DEFAULT_BRANCH_ID', '1', N'สาขาเริ่มต้น', 'general'),
    ('PR_NUMBER_FORMAT', 'PRYYMM####', N'รูปแบบเลขใบขอซื้อ (PR=Prefix, YY=ปี, MM=เดือน, ####=ลำดับ)', 'document'),
    ('PO_NUMBER_FORMAT', 'POYYMM####', N'รูปแบบเลขใบสั่งซื้อ (PO=Prefix, YY=ปี, MM=เดือน, ####=ลำดับ)', 'document'),
    ('EMAIL_NOTIFICATIONS', 'true', N'ส่งอีเมลแจ้งเตือน', 'email'),
    ('APPROVAL_REQUIRED_PR', 'true', N'ต้องอนุมัติใบขอซื้อ', 'approval'),
    ('APPROVAL_REQUIRED_PO', 'true', N'ต้องอนุมัติใบสั่งซื้อ', 'approval');
GO

PRINT 'SystemSettings table created and populated successfully';
