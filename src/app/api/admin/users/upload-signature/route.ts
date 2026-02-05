import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file || !userId) {
            return NextResponse.json(
                { success: false, error: "ไม่พบไฟล์หรือ userId" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "รองรับเฉพาะไฟล์ PNG และ JPG เท่านั้น" },
                { status: 400 }
            );
        }

        // Create upload directory if not exists
        const uploadDir = path.join(process.cwd(), "public", "uploads", "signatures");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const filename = `sig_${userId}_${Date.now()}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return relative path for database storage
        const relativePath = `/uploads/signatures/${filename}`;

        return NextResponse.json({
            success: true,
            path: relativePath,
            message: "อัปโหลดลายเซ็นสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error uploading signature:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
