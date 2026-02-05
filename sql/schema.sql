-- Procurement System Database Schema
-- Database: ProcurementDB

-- ============================================
-- Companies (บริษัท) - ตั้งค่าได้ใน Admin
-- ============================================
CREATE TABLE Companies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(10) NOT NULL UNIQUE,
    name NVARCHAR(200) NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- Branches (สาขา) - ตั้งค่าได้ใน Admin
-- ============================================
CREATE TABLE Branches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    companyId INT NOT NULL REFERENCES Companies(id),
    code NVARCHAR(10) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UNIQUE(companyId, code)
);

-- ============================================
-- Departments (แผนก)
-- ============================================
CREATE TABLE Departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    companyId INT NOT NULL REFERENCES Companies(id),
    code NVARCHAR(10) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- Users (พนักงาน)
-- ============================================
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    employeeId NVARCHAR(20) NOT NULL UNIQUE,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(200),
    companyId INT REFERENCES Companies(id),
    branchId INT REFERENCES Branches(id),
    departmentId INT REFERENCES Departments(id),
    role NVARCHAR(50) NOT NULL DEFAULT 'employee', -- employee, manager, procurement, procurement_manager, executive, admin
    managerId INT REFERENCES Users(id),
    isADUser BIT NOT NULL DEFAULT 0,
    passwordHash NVARCHAR(255),
    status NVARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Inactive
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- Purchase Requests (ใบขอซื้อ)
-- ============================================
CREATE TABLE PurchaseRequests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    prNumber NVARCHAR(20) NOT NULL UNIQUE, -- PR-YYMM-####
    requestDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    requesterId INT NOT NULL REFERENCES Users(id),
    companyId INT NOT NULL REFERENCES Companies(id),
    branchId INT NOT NULL REFERENCES Branches(id),
    departmentId INT NOT NULL REFERENCES Departments(id),
    
    -- วัตถุประสงค์ (checkboxes - store as comma-separated or JSON)
    requestType NVARCHAR(100), -- newPurchase, replacement, repair, renewal
    
    -- ความต้องการการซื้อ
    purchaseMethod NVARCHAR(50), -- procurementHandle, selfPurchase
    
    requiredDate DATE, -- วันที่ต้องการใช้งาน
    budget DECIMAL(18,2), -- งบประมาณที่ขอซื้อ
    
    -- Summary
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    vatRate DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    vatAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    discountRate DECIMAL(5,2) DEFAULT 0,
    discountAmount DECIMAL(18,2) DEFAULT 0,
    totalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    remarks NVARCHAR(MAX),
    
    -- Workflow status
    status NVARCHAR(20) NOT NULL DEFAULT 'Draft', -- Draft, Pending, Approved, Rejected, Cancelled
    currentStep INT NOT NULL DEFAULT 1, -- 1=Created, 2=DeptHead, 3=Procurement, 4=Executive
    
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- PR Items (รายการสินค้า)
-- ============================================
CREATE TABLE PRItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    prId INT NOT NULL REFERENCES PurchaseRequests(id) ON DELETE CASCADE,
    itemNo INT NOT NULL,
    itemName NVARCHAR(200),
    description NVARCHAR(500) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    unit NVARCHAR(50),
    unitPrice DECIMAL(18,2) NOT NULL,
    totalPrice DECIMAL(18,2) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- PR Attachments (ไฟล์แนบ)
-- ============================================
CREATE TABLE PRAttachments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    prId INT NOT NULL REFERENCES PurchaseRequests(id) ON DELETE CASCADE,
    fileName NVARCHAR(255) NOT NULL,
    filePath NVARCHAR(500) NOT NULL,
    fileType NVARCHAR(50),
    fileSize INT,
    uploadedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- PR Approvals (การอนุมัติ PR)
-- ============================================
CREATE TABLE PRApprovals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    prId INT NOT NULL REFERENCES PurchaseRequests(id) ON DELETE CASCADE,
    step INT NOT NULL, -- 1=Created, 2=DeptHead, 3=Procurement, 4=Executive
    stepName NVARCHAR(100) NOT NULL, -- ผู้ขอ, หัวหน้าแผนก, พนักงานจัดซื้อ, ผู้บริหาร
    approverId INT REFERENCES Users(id),
    action NVARCHAR(20), -- Approved, Rejected, Pending
    comments NVARCHAR(500),
    actionDate DATETIME2,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- Purchase Orders (ใบสั่งซื้อ)
-- ============================================
CREATE TABLE PurchaseOrders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    poNumber NVARCHAR(20) NOT NULL UNIQUE, -- PO-YYMM-####
    prId INT REFERENCES PurchaseRequests(id),
    
    companyId INT NOT NULL REFERENCES Companies(id),
    branchId INT NOT NULL REFERENCES Branches(id),
    
    -- Vendor Info (พิมพ์เอง)
    vendorName NVARCHAR(200) NOT NULL,
    vendorAddress NVARCHAR(500),
    vendorTaxId NVARCHAR(20),
    
    quotationNo NVARCHAR(50), -- เลขที่ใบเสนอราคา (REF NO)
    issueDate DATE NOT NULL DEFAULT GETDATE(),
    deliveryDate DATE,
    deliveryPlace NVARCHAR(500),
    paymentTerm NVARCHAR(100), -- เช่น เครดิต 30 วัน
    
    -- Summary
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    vatRate DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    vatAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    discountRate DECIMAL(5,2) DEFAULT 0,
    discountAmount DECIMAL(18,2) DEFAULT 0,
    grandTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    remarks NVARCHAR(MAX),
    
    -- Workflow status
    status NVARCHAR(20) NOT NULL DEFAULT 'Draft', -- Draft, Pending, Approved, Rejected, Cancelled
    currentStep INT NOT NULL DEFAULT 1, -- 1=Created, 2=ProcurementHead, 3=Executive
    
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- PO Items (รายการสินค้า PO)
-- ============================================
CREATE TABLE POItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    poId INT NOT NULL REFERENCES PurchaseOrders(id) ON DELETE CASCADE,
    itemNo INT NOT NULL,
    description NVARCHAR(500) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    unit NVARCHAR(50),
    unitPrice DECIMAL(18,2) NOT NULL,
    totalPrice DECIMAL(18,2) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- PO Approvals (การอนุมัติ PO)
-- ============================================
CREATE TABLE POApprovals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    poId INT NOT NULL REFERENCES PurchaseOrders(id) ON DELETE CASCADE,
    step INT NOT NULL, -- 1=Created, 2=ProcurementHead, 3=Executive
    stepName NVARCHAR(100) NOT NULL, -- พนักงานจัดซื้อ, หัวหน้าจัดซื้อ, ผู้บริหาร
    approverId INT REFERENCES Users(id),
    action NVARCHAR(20), -- Approved, Rejected, Pending
    comments NVARCHAR(500),
    actionDate DATETIME2,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- System Settings (ตั้งค่าระบบ)
-- ============================================
CREATE TABLE SystemSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    settingKey NVARCHAR(50) NOT NULL UNIQUE,
    settingValue NVARCHAR(500) NOT NULL,
    description NVARCHAR(200),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- Document Number Sequences (เลขที่เอกสาร)
-- ============================================
CREATE TABLE DocumentSequences (
    id INT IDENTITY(1,1) PRIMARY KEY,
    documentType NVARCHAR(10) NOT NULL, -- PR, PO
    prefix NVARCHAR(10) NOT NULL, -- PR-, PO-
    yearMonth NVARCHAR(4) NOT NULL, -- YYMM
    lastNumber INT NOT NULL DEFAULT 0,
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UNIQUE(documentType, yearMonth)
);

-- ============================================
-- Insert Default Data
-- ============================================
-- Default System Settings
INSERT INTO SystemSettings (settingKey, settingValue, description) VALUES
('DEFAULT_VAT_RATE', '7', 'อัตรา VAT เริ่มต้น (%)'),
('ALLOW_DISCOUNT_IN_PR', 'true', 'อนุญาตให้มีส่วนลดในใบขอซื้อ'),
('PR_PREFIX', 'PR-', 'Prefix สำหรับเลขที่ใบขอซื้อ'),
('PO_PREFIX', 'PO-', 'Prefix สำหรับเลขที่ใบสั่งซื้อ'),
('PR_NUMBER_DIGITS', '4', 'จำนวนหลักเลขที่ใบขอซื้อ'),
('PO_NUMBER_DIGITS', '4', 'จำนวนหลักเลขที่ใบสั่งซื้อ');

-- Sample Companies
INSERT INTO Companies (code, name) VALUES
('GL', 'GRANDLINK LOGISTICS CO.,LTD.'),
('SN', 'SONIC INTERFREIGHT CO.,LTD.'),
('SA', 'SONIC-AUTOLOGIS CO.,LTD.');

-- Sample Branches for GRANDLINK
INSERT INTO Branches (companyId, code, name) VALUES
(1, 'HQ', 'สำนักงานใหญ่'),
(1, 'SR', 'สาขาศรีราชา'),
(1, 'LC', 'สาขาแหลมฉบัง');

-- Sample Branches for SONIC
INSERT INTO Branches (companyId, code, name) VALUES
(2, 'HQ', 'สำนักงานใหญ่');

-- Sample Branches for SONIC-AUTOLOGIS
INSERT INTO Branches (companyId, code, name) VALUES
(3, 'HQ', 'สำนักงานใหญ่');

-- Sample Departments
INSERT INTO Departments (companyId, code, name) VALUES
(1, 'IT', 'แผนกเทคโนโลยีสารสนเทศ'),
(1, 'HR', 'แผนกทรัพยากรบุคคล'),
(1, 'ACC', 'แผนกบัญชี'),
(1, 'PUR', 'แผนกจัดซื้อ'),
(1, 'OPS', 'แผนกปฏิบัติการ');

PRINT 'Database schema created successfully!';
