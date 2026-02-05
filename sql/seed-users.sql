-- ===========================================
-- Seed Data: Test Users for Procurement System
-- ===========================================

-- First, delete existing test users (if any)
DELETE FROM Users WHERE employeeId IN ('ADMIN001', 'MGR001', 'EMP001');

-- Password: 123456 
-- Hash generated with bcryptjs (cost 10)
-- $2a$10$rDkPvvAFV8kqwvKJzwQGAeSxH5f.ERFmBJGjGpOyMGvMR9Ccbqbf6

-- Admin User
INSERT INTO Users (
    employeeId, name, email, 
    role, departmentId, companyId, branchId, 
    passwordHash, status
) VALUES (
    'ADMIN001', 
    'Admin System',
    'admin@company.com',
    'admin',
    1,
    1,
    1,
    '$2a$10$rDkPvvAFV8kqwvKJzwQGAeSxH5f.ERFmBJGjGpOyMGvMR9Ccbqbf6',
    'Active'
);

-- Manager User (Approver Level 1)
INSERT INTO Users (
    employeeId, name, email, 
    role, departmentId, companyId, branchId, 
    passwordHash, status
) VALUES (
    'MGR001', 
    'Manager Test',
    'manager@company.com',
    'manager',
    1,
    1,
    1,
    '$2a$10$rDkPvvAFV8kqwvKJzwQGAeSxH5f.ERFmBJGjGpOyMGvMR9Ccbqbf6',
    'Active'
);

-- Normal User (Requester)
INSERT INTO Users (
    employeeId, name, email, 
    role, departmentId, companyId, branchId, 
    passwordHash, status
) VALUES (
    'EMP001', 
    'User Test',
    'user@company.com',
    'employee',
    1,
    1,
    1,
    '$2a$10$rDkPvvAFV8kqwvKJzwQGAeSxH5f.ERFmBJGjGpOyMGvMR9Ccbqbf6',
    'Active'
);

-- Verify inserted users
SELECT id, employeeId, name, role, status, passwordHash
FROM Users;
