import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

// GET - List all branches (including inactive for admin)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const branches = await query<any>(`
            SELECT b.id, b.companyId, b.code, b.name, b.address, b.phone, b.isActive,
                   b.headerImage, b.footerImage,
                   c.name as companyName
            FROM Branches b
            LEFT JOIN Companies c ON b.companyId = c.id
            ORDER BY c.name, b.name
        `);

        return NextResponse.json({
            success: true,
            data: branches,
        });
    } catch (error: any) {
        console.error("Error fetching branches:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new branch
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { companyId, code, name, address, phone } = body;

        if (!companyId || !code || !name) {
            return NextResponse.json(
                { success: false, error: "กรุณากรอกข้อมูลที่จำเป็น" },
                { status: 400 }
            );
        }

        // Check duplicate code within same company
        const existing = await query<any>(`
            SELECT id FROM Branches WHERE companyId = @companyId AND code = @code
        `, { companyId, code });

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: "รหัสสาขานี้มีอยู่แล้วในบริษัทนี้" },
                { status: 400 }
            );
        }

        await execute(`
            INSERT INTO Branches (companyId, code, name, address, phone, isActive, createdAt, updatedAt)
            VALUES (@companyId, @code, @name, @address, @phone, 1, GETDATE(), GETDATE())
        `, {
            companyId,
            code,
            name,
            address: address || null,
            phone: phone || null,
        });

        return NextResponse.json({
            success: true,
            message: "เพิ่มสาขาสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error creating branch:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
