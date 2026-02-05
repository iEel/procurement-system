import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

// GET - List all companies (including inactive for admin)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const companies = await query<any>(`
            SELECT id, code, name, address, taxId, phone, isActive, createdAt, updatedAt
            FROM Companies
            ORDER BY name
        `);

        return NextResponse.json({
            success: true,
            data: companies,
        });
    } catch (error: any) {
        console.error("Error fetching companies:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new company
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { code, name, address, taxId, phone } = body;

        if (!code || !name) {
            return NextResponse.json(
                { success: false, error: "รหัสและชื่อบริษัทจำเป็นต้องกรอก" },
                { status: 400 }
            );
        }

        // Check duplicate code
        const existing = await query<any>(`
            SELECT id FROM Companies WHERE code = @code
        `, { code });

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: "รหัสบริษัทนี้มีอยู่แล้ว" },
                { status: 400 }
            );
        }

        await execute(`
            INSERT INTO Companies (code, name, address, taxId, phone, isActive, createdAt, updatedAt)
            VALUES (@code, @name, @address, @taxId, @phone, 1, GETDATE(), GETDATE())
        `, {
            code,
            name,
            address: address || null,
            taxId: taxId || null,
            phone: phone || null,
        });

        return NextResponse.json({
            success: true,
            message: "เพิ่มบริษัทสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error creating company:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
