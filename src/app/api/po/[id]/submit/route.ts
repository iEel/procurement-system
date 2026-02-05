import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

// POST - Submit PO for approval
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

        // Check if PO exists and is in Draft status
        const pos = await query<any>(`
            SELECT * FROM PurchaseOrders WHERE id = @id
        `, { id: parseInt(id) });

        if (pos.length === 0) {
            return NextResponse.json(
                { success: false, error: "PO not found" },
                { status: 404 }
            );
        }

        if (pos[0].status !== 'Draft') {
            return NextResponse.json(
                { success: false, error: "ไม่สามารถส่งได้ เนื่องจากใบสั่งซื้อไม่ได้อยู่ในสถานะ Draft" },
                { status: 400 }
            );
        }

        // Check if PO has vendor info
        if (!pos[0].vendorName || pos[0].vendorName.trim() === '') {
            return NextResponse.json(
                { success: false, error: "กรุณากรอกชื่อบริษัทผู้ขายก่อนส่งอนุมัติ" },
                { status: 400 }
            );
        }

        // Check if PO has items
        const items = await query<any>(`
            SELECT COUNT(*) as count FROM POItems WHERE poId = @poId
        `, { poId: parseInt(id) });

        if (items[0].count === 0) {
            return NextResponse.json(
                { success: false, error: "กรุณาเพิ่มรายการสินค้าก่อนส่งอนุมัติ" },
                { status: 400 }
            );
        }

        // Update PO status to Pending and move to step 2
        await execute(`
            UPDATE PurchaseOrders SET
                status = 'Pending',
                currentStep = 2,
                updatedAt = GETDATE()
            WHERE id = @id
        `, { id: parseInt(id) });

        // Create approval record for step 2 (Procurement Head)
        await execute(`
            INSERT INTO POApprovals (poId, step, stepName, action)
            VALUES (@poId, 2, N'หัวหน้าจัดซื้อ', 'Pending')
        `, { poId: parseInt(id) });

        return NextResponse.json({
            success: true,
            message: "ส่งใบสั่งซื้อเพื่อขออนุมัติสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error submitting PO:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
