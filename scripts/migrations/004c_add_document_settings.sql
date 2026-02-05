-- Insert new settings (only if not exists)
-- Run this after initial migration to add document format settings

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE settingKey = 'PR_NUMBER_FORMAT')
BEGIN
    INSERT INTO SystemSettings (settingKey, settingValue, description, category, createdAt, updatedAt)
    VALUES ('PR_NUMBER_FORMAT', 'PRYYMM####', N'รูปแบบเลขใบขอซื้อ (PR=Prefix, YY=ปี, MM=เดือน, ####=ลำดับ)', 'document', GETDATE(), GETDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE settingKey = 'PO_NUMBER_FORMAT')
BEGIN
    INSERT INTO SystemSettings (settingKey, settingValue, description, category, createdAt, updatedAt)
    VALUES ('PO_NUMBER_FORMAT', 'POYYMM####', N'รูปแบบเลขใบสั่งซื้อ (PO=Prefix, YY=ปี, MM=เดือน, ####=ลำดับ)', 'document', GETDATE(), GETDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE settingKey = 'DEFAULT_COMPANY_ID')
BEGIN
    INSERT INTO SystemSettings (settingKey, settingValue, description, category, createdAt, updatedAt)
    VALUES ('DEFAULT_COMPANY_ID', '1', N'บริษัทเริ่มต้น', 'general', GETDATE(), GETDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE settingKey = 'DEFAULT_BRANCH_ID')
BEGIN
    INSERT INTO SystemSettings (settingKey, settingValue, description, category, createdAt, updatedAt)
    VALUES ('DEFAULT_BRANCH_ID', '1', N'สาขาเริ่มต้น', 'general', GETDATE(), GETDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE settingKey = 'WHT_RATE')
BEGIN
    INSERT INTO SystemSettings (settingKey, settingValue, description, category, createdAt, updatedAt)
    VALUES ('WHT_RATE', '3', N'อัตราหัก ณ ที่จ่าย (%)', 'general', GETDATE(), GETDATE());
END
GO

PRINT 'New settings inserted successfully';
