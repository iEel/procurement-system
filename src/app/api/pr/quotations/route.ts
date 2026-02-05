import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

const STORAGE_PATH = process.env.FILE_STORAGE_PATH || "C:\\procurement\\uploads";
const QUOTATIONS_FOLDER = process.env.FILE_STORAGE_QUOTATIONS || "quotations";
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "10485760"); // 10MB default
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_FILE_TYPES || ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png").split(",");

// Ensure directory exists
function ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Get file type from extension
function getFileType(ext: string): string {
    const typeMap: Record<string, string> = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    };
    return typeMap[ext.toLowerCase()] || "application/octet-stream";
}

// POST - Upload quotation file for a specific PR
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const prId = formData.get("prId") as string;
        const vendorNo = formData.get("vendorNo") as string;
        const vendorName = formData.get("vendorName") as string;
        const file = formData.get("file") as File;

        // Validate required fields
        if (!prId || !vendorNo || !vendorName || !file) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: prId, vendorNo, vendorName, file" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Validate file extension
        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { success: false, error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}` },
                { status: 400 }
            );
        }
        // Get PR number for folder naming
        const prResult = await query<any[]>(
            `SELECT prNumber FROM PurchaseRequests WHERE id = @prId`,
            { prId: parseInt(prId) }
        );

        if (!prResult || prResult.length === 0) {
            return NextResponse.json(
                { success: false, error: "PR not found" },
                { status: 404 }
            );
        }

        const prNumber = prResult[0].prNumber;

        // Create directory for this PR using PR number
        const prFolderPath = path.join(STORAGE_PATH, QUOTATIONS_FOLDER, prNumber);
        ensureDirectory(prFolderPath);

        // Generate unique filename
        const timestamp = Date.now();
        const safeFileName = `vendor${vendorNo}_${timestamp}${ext}`;
        const filePath = path.join(prFolderPath, safeFileName);

        // Save file to disk
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        // Check if record already exists for this PR and vendor
        const existingResult = await query<any[]>(
            `SELECT id FROM PRQuotations WHERE prId = @prId AND vendorNo = @vendorNo`,
            { prId: parseInt(prId), vendorNo: parseInt(vendorNo) }
        );

        const fileType = getFileType(ext);
        const isSelected = parseInt(vendorNo) === 1; // Vendor 1 is the selected vendor

        if (existingResult && existingResult.length > 0) {
            // Update existing record
            await query(
                `UPDATE PRQuotations 
                 SET vendorName = @vendorName,
                     fileName = @fileName,
                     filePath = @filePath,
                     fileType = @fileType,
                     fileSize = @fileSize,
                     uploadedAt = SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'
                 WHERE prId = @prId AND vendorNo = @vendorNo`,
                {
                    prId: parseInt(prId),
                    vendorNo: parseInt(vendorNo),
                    vendorName,
                    fileName: safeFileName,
                    filePath,
                    fileType,
                    fileSize: file.size,
                }
            );
        } else {
            // Insert new record
            await query(
                `INSERT INTO PRQuotations (prId, vendorNo, vendorName, isSelected, fileName, filePath, fileType, fileSize)
                 VALUES (@prId, @vendorNo, @vendorName, @isSelected, @fileName, @filePath, @fileType, @fileSize)`,
                {
                    prId: parseInt(prId),
                    vendorNo: parseInt(vendorNo),
                    vendorName,
                    isSelected,
                    fileName: safeFileName,
                    filePath,
                    fileType,
                    fileSize: file.size,
                }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                fileName: safeFileName,
                filePath,
                fileSize: file.size,
                fileType,
            },
        });
    } catch (error: any) {
        console.error("Error uploading quotation file:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}

// GET - Get quotations for a specific PR
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const prId = searchParams.get("prId");

        if (!prId) {
            return NextResponse.json(
                { success: false, error: "Missing prId parameter" },
                { status: 400 }
            );
        }

        const quotations = await query<any[]>(
            `SELECT id, vendorNo, vendorName, isSelected, fileName, filePath, fileType, fileSize, uploadedAt
             FROM PRQuotations
             WHERE prId = @prId
             ORDER BY vendorNo`,
            { prId: parseInt(prId) }
        );

        return NextResponse.json({
            success: true,
            data: quotations || [],
        });
    } catch (error: any) {
        console.error("Error fetching quotations:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch quotations" },
            { status: 500 }
        );
    }
}

// DELETE - Remove a single quotation file
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const prId = searchParams.get("prId");
        const vendorNo = searchParams.get("vendorNo");

        if (!prId || !vendorNo) {
            return NextResponse.json(
                { success: false, error: "Missing prId or vendorNo parameter" },
                { status: 400 }
            );
        }

        // Get the file path first
        const result = await query<any[]>(
            `SELECT filePath FROM PRQuotations WHERE prId = @prId AND vendorNo = @vendorNo`,
            { prId: parseInt(prId), vendorNo: parseInt(vendorNo) }
        );

        if (result && result.length > 0) {
            const quotation = result[0];
            const filePath = quotation.filePath;

            // Delete file from disk
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Delete from database
            await query(
                `DELETE FROM PRQuotations WHERE prId = @prId AND vendorNo = @vendorNo`,
                { prId: parseInt(prId), vendorNo: parseInt(vendorNo) }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting quotation:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete quotation" },
            { status: 500 }
        );
    }
}
