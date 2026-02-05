-- Update Document Numbering Format in SystemSettings
UPDATE SystemSettings 
SET settingValue = 'PR' 
WHERE settingKey = 'PR_PREFIX';

UPDATE SystemSettings 
SET settingValue = 'PO' 
WHERE settingKey = 'PO_PREFIX';

-- Verify
SELECT * FROM SystemSettings WHERE settingKey IN ('PR_PREFIX', 'PO_PREFIX');
