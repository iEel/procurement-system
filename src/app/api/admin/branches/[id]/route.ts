import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

// PUT - Update branch
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
        const { companyId, code, name, address, phone } = body;

        if (!companyId || !code || !name) {
            return NextResponse.json(
                { success: false, error: "กรุณากรอกข้อมูลที่จำเป็น" },
                { status: 400 }
            );
        }

        // Check duplicate code (excluding current)
        const existing = await query<any>(`
            SELECT id FROM Branches WHERE companyId = @companyId AND code = @code AND id != @id
        `, { companyId, code, id: parseInt(id) });

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: "รหัสสาขานี้มีอยู่แล้วในบริษัทนี้" },
                { status: 400 }
            );
        }

        await execute(`
            UPDATE Branches SET
                companyId = @companyId,
                code = @code,
                name = @name,
                address = @address,
                phone = @phone,
                updatedAt = GETDATE()
            WHERE id = @id
        `, {
            id: parseInt(id),
            companyId,
            code,
            name,
            address: address || null,
            phone: phone || null,
        });

        return NextResponse.json({
            success: true,
            message: "แก้ไขสาขาสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error updating branch:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete branch
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

        // Check if branch has related data
        const prs = await query<any>(`
            SELECT COUNT(*) as count FROM PurchaseRequests WHERE branchId = @id
        `, { id: parseInt(id) });

        if (prs[0].count > 0) {
            return NextResponse.json(
                { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีใบขอซื้อที่ผูกกับสาขานี้" },
                { status: 400 }
            );
        }

        await execute(`DELETE FROM Branches WHERE id = @id`, { id: parseInt(id) });

        return NextResponse.json({
            success: true,
            message: "ลบสาขาสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error deleting branch:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
