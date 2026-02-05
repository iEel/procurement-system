import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import path from "path";
import fs from "fs/promises";

// POST - Upload header or footer image
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const branchId = parseInt(id);

        // Check if branch exists
        const branches = await query<any>(`
            SELECT id, code, companyId FROM Branches WHERE id = @id
        `, { id: branchId });

        if (branches.length === 0) {
            return NextResponse.json(
                { success: false, error: "ไม่พบสาขา" },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const imageType = formData.get("type") as string; // "header" or "footer"
        const file = formData.get("file") as File;

        if (!imageType || !["header", "footer"].includes(imageType)) {
            return NextResponse.json(
                { success: false, error: "กรุณาระบุประเภทรูปภาพ (header หรือ footer)" },
                { status: 400 }
            );
        }

        if (!file) {
            return NextResponse.json(
                { success: false, error: "กรุณาเลือกไฟล์รูปภาพ" },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "รองรับเฉพาะไฟล์ PNG, JPG, WEBP" },
                { status: 400 }
            );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), "public", "branch-assets", `branch-${branchId}`);
        await fs.mkdir(uploadDir, { recursive: true });

        // Generate filename
        const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
        const fileName = `${imageType}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        // Save file
        const bytes = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(bytes));

        // Update database
        const relativePath = `/branch-assets/branch-${branchId}/${fileName}`;
        const column = imageType === "header" ? "headerImage" : "footerImage";

        await execute(`
            UPDATE Branches SET ${column} = @path, updatedAt = GETDATE() WHERE id = @id
        `, { path: relativePath, id: branchId });

        return NextResponse.json({
            success: true,
            message: `อัพโหลดรูป ${imageType === "header" ? "หัวกระดาษ" : "ท้ายกระดาษ"} สำเร็จ`,
            data: { path: relativePath },
        });
    } catch (error: any) {
        console.error("Error uploading branch image:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Remove header or footer image
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const branchId = parseInt(id);
        const { searchParams } = new URL(request.url);
        const imageType = searchParams.get("type"); // "header" or "footer"

        if (!imageType || !["header", "footer"].includes(imageType)) {
            return NextResponse.json(
                { success: false, error: "กรุณาระบุประเภทรูปภาพ" },
                { status: 400 }
            );
        }

        // Get current image path
        const column = imageType === "header" ? "headerImage" : "footerImage";
        const branches = await query<any>(`
            SELECT ${column} as imagePath FROM Branches WHERE id = @id
        `, { id: branchId });

        if (branches.length === 0) {
            return NextResponse.json(
                { success: false, error: "ไม่พบสาขา" },
                { status: 404 }
            );
        }

        // Delete file if exists
        if (branches[0].imagePath) {
            const filePath = path.join(process.cwd(), "public", branches[0].imagePath);
            try {
                await fs.unlink(filePath);
            } catch {
                // File may not exist, continue
            }
        }

        // Update database
        await execute(`
            UPDATE Branches SET ${column} = NULL, updatedAt = GETDATE() WHERE id = @id
        `, { id: branchId });

        return NextResponse.json({
            success: true,
            message: `ลบรูป ${imageType === "header" ? "หัวกระดาษ" : "ท้ายกระดาษ"} สำเร็จ`,
        });
    } catch (error: any) {
        console.error("Error deleting branch image:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
