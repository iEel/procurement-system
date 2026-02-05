import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

// POST - Submit PR for approval
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

        // Check if PR exists and is in Draft status
        const prs = await query<any>(`
            SELECT * FROM PurchaseRequests WHERE id = @id
        `, { id: parseInt(id) });

        if (prs.length === 0) {
            return NextResponse.json(
                { success: false, error: "PR not found" },
                { status: 404 }
            );
        }

        if (prs[0].status !== 'Draft') {
            return NextResponse.json(
                { success: false, error: "ไม่สามารถส่งได้ เนื่องจากใบขอซื้อไม่ได้อยู่ในสถานะ Draft" },
                { status: 400 }
            );
        }

        // Check if PR has items
        const items = await query<any>(`
            SELECT COUNT(*) as count FROM PRItems WHERE prId = @prId
        `, { prId: parseInt(id) });

        if (items[0].count === 0) {
            return NextResponse.json(
                { success: false, error: "กรุณาเพิ่มรายการสินค้าก่อนส่งอนุมัติ" },
                { status: 400 }
            );
        }

        // Update PR status to Pending and move to step 2
        await execute(`
            UPDATE PurchaseRequests SET
                status = 'Pending',
                currentStep = 2,
                updatedAt = GETDATE()
            WHERE id = @id
        `, { id: parseInt(id) });

        // Create approval record for step 2 (Department Head)
        await execute(`
            INSERT INTO PRApprovals (prId, step, stepName, action)
            VALUES (@prId, 2, N'หัวหน้าแผนก', 'Pending')
        `, { prId: parseInt(id) });

        // TODO: Send email notification to Department Head

        return NextResponse.json({
            success: true,
            message: "ส่งใบขอซื้อเพื่อขออนุมัติสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error submitting PR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
