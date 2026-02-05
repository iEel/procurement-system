-- Fix timezone for existing PR records
-- This script converts UTC createdAt to Bangkok timezone (UTC+7)

-- Option 1: Add 7 hours to existing UTC timestamps
UPDATE PurchaseRequests 
SET createdAt = DATEADD(HOUR, 7, createdAt)
WHERE createdAt IS NOT NULL;

-- Also update PRApprovals
UPDATE PRApprovals
SET actionDate = DATEADD(HOUR, 7, actionDate)
WHERE actionDate IS NOT NULL;

-- Verify the update
SELECT id, prNumber, createdAt, 
       FORMAT(createdAt, 'dd/MM/yyyy HH:mm:ss') as formattedDate
FROM PurchaseRequests
ORDER BY createdAt DESC;
