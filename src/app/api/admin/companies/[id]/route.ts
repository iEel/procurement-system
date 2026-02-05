import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

// GET - Get single company
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const companies = await query<any>(`
            SELECT id, code, name, address, taxId, phone, isActive
            FROM Companies WHERE id = @id
        `, { id: parseInt(id) });

        if (companies.length === 0) {
            return NextResponse.json(
                { success: false, error: "ไม่พบบริษัท" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: companies[0],
        });
    } catch (error: any) {
        console.error("Error fetching company:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update company
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { code, name, address, taxId, phone } = body;

        if (!code || !name) {
            return NextResponse.json(
                { success: false, error: "รหัสและชื่อบริษัทจำเป็นต้องกรอก" },
                { status: 400 }
            );
        }

        // Check duplicate code (excluding current)
        const existing = await query<any>(`
            SELECT id FROM Companies WHERE code = @code AND id != @id
        `, { code, id: parseInt(id) });

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: "รหัสบริษัทนี้มีอยู่แล้ว" },
                { status: 400 }
            );
        }

        await execute(`
            UPDATE Companies SET
                code = @code,
                name = @name,
                address = @address,
                taxId = @taxId,
                phone = @phone,
                updatedAt = GETDATE()
            WHERE id = @id
        `, {
            id: parseInt(id),
            code,
            name,
            address: address || null,
            taxId: taxId || null,
            phone: phone || null,
        });

        return NextResponse.json({
            success: true,
            message: "แก้ไขบริษัทสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error updating company:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete company
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

        // Check if company has related data
        const branches = await query<any>(`
            SELECT COUNT(*) as count FROM Branches WHERE companyId = @id
        `, { id: parseInt(id) });

        if (branches[0].count > 0) {
            return NextResponse.json(
                { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีสาขาที่ผูกกับบริษัทนี้" },
                { status: 400 }
            );
        }

        await execute(`DELETE FROM Companies WHERE id = @id`, { id: parseInt(id) });

        return NextResponse.json({
            success: true,
            message: "ลบบริษัทสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error deleting company:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
