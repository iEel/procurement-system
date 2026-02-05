// User Types
export interface User {
    id: number;
    employeeId: string;
    name: string;
    email?: string;
    companyId?: number;
    branchId?: number;
    departmentId?: number;
    role: 'employee' | 'manager' | 'procurement' | 'procurement_manager' | 'executive' | 'admin';
    managerId?: number;
    isADUser: boolean;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

// Company & Branch Types
export interface Company {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Branch {
    id: number;
    companyId: number;
    code: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Department {
    id: number;
    companyId: number;
    code: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
}

// Purchase Request Types
export type PRRequestType = 'newPurchase' | 'replacement' | 'repair' | 'renewal';
export type PRPurchaseMethod = 'procurementHandle' | 'selfPurchase';
export type PRStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface PurchaseRequest {
    id: number;
    prNumber: string;
    requestDate: Date;
    requesterId: number;
    companyId: number;
    branchId: number;
    departmentId: number;
    requestType?: string;
    purchaseMethod?: string;
    requiredDate?: Date;
    budget?: number;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    discountRate?: number;
    discountAmount?: number;
    totalAmount: number;
    remarks?: string;
    status: PRStatus;
    currentStep: number;
    createdAt: Date;
    updatedAt: Date;

    // Joined fields
    requester?: User;
    company?: Company;
    branch?: Branch;
    department?: Department;
    items?: PRItem[];
    attachments?: PRAttachment[];
    approvals?: PRApproval[];
}

export interface PRItem {
    id: number;
    prId: number;
    itemNo: number;
    itemName?: string;
    description: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    totalPrice: number;
    createdAt: Date;
}

export interface PRAttachment {
    id: number;
    prId: number;
    fileName: string;
    filePath: string;
    fileType?: string;
    fileSize?: number;
    uploadedAt: Date;
}

export interface PRApproval {
    id: number;
    prId: number;
    step: number;
    stepName: string;
    approverId?: number;
    action?: 'Approved' | 'Rejected' | 'Pending';
    comments?: string;
    actionDate?: Date;
    createdAt: Date;

    // Joined fields
    approver?: User;
}

// Purchase Order Types
export type POStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface PurchaseOrder {
    id: number;
    poNumber: string;
    prId?: number;
    companyId: number;
    branchId: number;
    vendorName: string;
    vendorAddress?: string;
    vendorTaxId?: string;
    quotationNo?: string;
    issueDate: Date;
    deliveryDate?: Date;
    deliveryPlace?: string;
    paymentTerm?: string;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    discountRate?: number;
    discountAmount?: number;
    grandTotal: number;
    remarks?: string;
    status: POStatus;
    currentStep: number;
    createdAt: Date;
    updatedAt: Date;

    // Joined fields
    purchaseRequest?: PurchaseRequest;
    company?: Company;
    branch?: Branch;
    items?: POItem[];
    approvals?: POApproval[];
}

export interface POItem {
    id: number;
    poId: number;
    itemNo: number;
    description: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    totalPrice: number;
    createdAt: Date;
}

export interface POApproval {
    id: number;
    poId: number;
    step: number;
    stepName: string;
    approverId?: number;
    action?: 'Approved' | 'Rejected' | 'Pending';
    comments?: string;
    actionDate?: Date;
    createdAt: Date;

    // Joined fields
    approver?: User;
}

// System Settings
export interface SystemSetting {
    id: number;
    settingKey: string;
    settingValue: string;
    description?: string;
    updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
