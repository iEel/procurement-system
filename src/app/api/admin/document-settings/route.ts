import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

// GET - List all document settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await query<any>(`
            SELECT ds.id, ds.companyId, ds.documentType, ds.prefix, ds.lastNumber, ds.yearMonth,
                   c.name as companyName, c.code as companyCode
            FROM DocumentSettings ds
            LEFT JOIN Companies c ON ds.companyId = c.id
            ORDER BY c.name, ds.documentType
        `);

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error("Error fetching document settings:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new document setting
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { companyId, documentType, prefix } = body;

        if (!companyId || !documentType || !prefix) {
            return NextResponse.json(
                { success: false, error: "กรุณากรอกข้อมูลให้ครบ" },
                { status: 400 }
            );
        }

        // Check duplicate
        const existing = await query<any>(`
            SELECT id FROM DocumentSettings 
            WHERE companyId = @companyId AND documentType = @documentType
        `, { companyId, documentType });

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: "การตั้งค่านี้มีอยู่แล้ว" },
                { status: 400 }
            );
        }

        // Get current year-month
        const now = new Date();
        const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;

        await execute(`
            INSERT INTO DocumentSettings (companyId, documentType, prefix, lastNumber, yearMonth, createdAt, updatedAt)
            VALUES (@companyId, @documentType, @prefix, 0, @yearMonth, GETDATE(), GETDATE())
        `, {
            companyId,
            documentType,
            prefix,
            yearMonth,
        });

        return NextResponse.json({
            success: true,
            message: "เพิ่มการตั้งค่าสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error creating document setting:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
