/**
 * File Storage Utility
 * Handles file uploads to SMB network share or local storage
 */

import fs from 'fs';
import path from 'path';

// Storage configuration from environment
const STORAGE_TYPE = process.env.FILE_STORAGE_TYPE || 'local';
const STORAGE_PATH = process.env.FILE_STORAGE_PATH || './uploads';
const QUOTATIONS_FOLDER = process.env.FILE_STORAGE_QUOTATIONS || 'quotations';

export interface FileUploadResult {
    success: boolean;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    error?: string;
}

/**
 * Get the base storage path
 */
export function getStoragePath(): string {
    return STORAGE_PATH;
}

/**
 * Get quotations storage path for a PR
 */
export function getQuotationsPath(prId: number): string {
    return path.join(STORAGE_PATH, QUOTATIONS_FOLDER, `pr-${prId}`);
}

/**
 * Ensure directory exists (creates if not)
 */
export async function ensureDirectory(dirPath: string): Promise<boolean> {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    } catch (error) {
        console.error('Error creating directory:', error);
        return false;
    }
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext)
        .replace(/[^a-zA-Z0-9ก-๙]/g, '_') // Allow Thai characters
        .substring(0, 50);
    return `${baseName}_${timestamp}${ext}`;
}

/**
 * Save uploaded file to storage
 */
export async function saveFile(
    fileBuffer: Buffer,
    originalFileName: string,
    subFolder: string
): Promise<FileUploadResult> {
    try {
        const dirPath = path.join(STORAGE_PATH, subFolder);
        await ensureDirectory(dirPath);

        const uniqueFileName = generateUniqueFileName(originalFileName);
        const filePath = path.join(dirPath, uniqueFileName);

        fs.writeFileSync(filePath, fileBuffer);

        const ext = path.extname(originalFileName).toLowerCase();
        const fileType = getFileType(ext);

        return {
            success: true,
            fileName: uniqueFileName,
            filePath: filePath,
            fileSize: fileBuffer.length,
            fileType: fileType,
        };
    } catch (error: any) {
        console.error('Error saving file:', error);
        return {
            success: false,
            fileName: '',
            filePath: '',
            fileSize: 0,
            fileType: '',
            error: error.message,
        };
    }
}

/**
 * Save quotation file for a PR
 */
export async function saveQuotationFile(
    fileBuffer: Buffer,
    originalFileName: string,
    prId: number,
    vendorNo: number
): Promise<FileUploadResult> {
    try {
        const dirPath = getQuotationsPath(prId);
        await ensureDirectory(dirPath);

        const ext = path.extname(originalFileName);
        const uniqueFileName = `vendor${vendorNo}_${Date.now()}${ext}`;
        const filePath = path.join(dirPath, uniqueFileName);

        fs.writeFileSync(filePath, fileBuffer);

        const fileType = getFileType(ext.toLowerCase());

        return {
            success: true,
            fileName: uniqueFileName,
            filePath: filePath,
            fileSize: fileBuffer.length,
            fileType: fileType,
        };
    } catch (error: any) {
        console.error('Error saving quotation file:', error);
        return {
            success: false,
            fileName: '',
            filePath: '',
            fileSize: 0,
            fileType: '',
            error: error.message,
        };
    }
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Get file type from extension
 */
function getFileType(ext: string): string {
    const typeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
    };
    return typeMap[ext] || 'application/octet-stream';
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(fileName: string): boolean {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png')
        .split(',')
        .map(t => t.trim().toLowerCase());
    const ext = path.extname(fileName).toLowerCase();
    return allowedTypes.includes(ext);
}

/**
 * Check if file size is within limit
 */
export function isFileSizeAllowed(fileSize: number): boolean {
    const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE || '10485760'); // 10MB default
    return fileSize <= maxSize;
}
