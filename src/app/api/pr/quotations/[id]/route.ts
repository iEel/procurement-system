import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

// GET - Download a quotation file
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get the quotation record
        const result = await query<any[]>(
            `SELECT fileName, filePath, fileType FROM PRQuotations WHERE id = @id`,
            { id: parseInt(id) }
        );

        if (!result || result.length === 0) {
            return NextResponse.json(
                { success: false, error: "Quotation not found" },
                { status: 404 }
            );
        }

        const quotation = result[0];
        const filePath = quotation.filePath;

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { success: false, error: "File not found on server" },
                { status: 404 }
            );
        }

        // Read file and return as response
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = quotation.fileName;
        const fileType = quotation.fileType;

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": quotation.fileType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
                "Content-Length": fileBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error("Error downloading quotation file:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to download file" },
            { status: 500 }
        );
    }
}
