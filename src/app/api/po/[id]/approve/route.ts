import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

const APPROVAL_STEPS = [
    { step: 1, name: 'พนักงานจัดซื้อ' },
    { step: 2, name: 'หัวหน้าจัดซื้อ' },
    { step: 3, name: 'ผู้บริหาร' },
];

// POST - Approve, Reject, or Return PO
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
        const body = await request.json();
        const { action, comments } = body; // action: 'Approved' | 'Rejected' | 'Returned'
        const user = session.user as any;

        if (!action || !['Approved', 'Rejected', 'Returned'].includes(action)) {
            return NextResponse.json(
                { success: false, error: "Invalid action" },
                { status: 400 }
            );
        }

        // Check if PO exists and is Pending
        const pos = await query<any>(`
            SELECT * FROM PurchaseOrders WHERE id = @id
        `, { id: parseInt(id) });

        if (pos.length === 0) {
            return NextResponse.json(
                { success: false, error: "PO not found" },
                { status: 404 }
            );
        }

        const po = pos[0];

        if (po.status !== 'Pending') {
            return NextResponse.json(
                { success: false, error: "ไม่สามารถดำเนินการได้ เนื่องจากใบสั่งซื้อไม่ได้อยู่ในสถานะรออนุมัติ" },
                { status: 400 }
            );
        }

        const currentStep = po.currentStep;

        // Update current approval record
        await execute(`
            UPDATE POApprovals SET
                approverId = @approverId,
                action = @action,
                comments = @comments,
                actionDate = GETDATE()
            WHERE poId = @poId AND step = @step
        `, {
            poId: parseInt(id),
            step: currentStep,
            approverId: parseInt(user.id),
            action,
            comments: comments || null,
        });

        // Handle Returned action - send back to procurement staff for revision
        if (action === 'Returned') {
            // Reset PO status to Draft and currentStep to 1
            await execute(`
                UPDATE PurchaseOrders SET
                    status = 'Draft',
                    currentStep = 1,
                    updatedAt = GETDATE()
                WHERE id = @id
            `, { id: parseInt(id) });

            return NextResponse.json({
                success: true,
                message: "ส่งกลับให้แก้ไขเรียบร้อยแล้ว",
            });
        }

        if (action === 'Rejected') {
            // Reject: Update PO status
            await execute(`
                UPDATE PurchaseOrders SET
                    status = 'Rejected',
                    updatedAt = GETDATE()
                WHERE id = @id
            `, { id: parseInt(id) });

            return NextResponse.json({
                success: true,
                message: "ไม่อนุมัติใบสั่งซื้อเรียบร้อยแล้ว",
            });
        }

        // Approved: Check if this is the last step (step 3 for PO)
        if (currentStep >= 3) {
            // Final approval
            await execute(`
                UPDATE PurchaseOrders SET
                    status = 'Approved',
                    updatedAt = GETDATE()
                WHERE id = @id
            `, { id: parseInt(id) });

            return NextResponse.json({
                success: true,
                message: "อนุมัติใบสั่งซื้อขั้นสุดท้ายเรียบร้อยแล้ว",
            });
        }

        // Move to next step
        const nextStep = currentStep + 1;
        const nextStepInfo = APPROVAL_STEPS.find(s => s.step === nextStep);

        await execute(`
            UPDATE PurchaseOrders SET
                currentStep = @nextStep,
                updatedAt = GETDATE()
            WHERE id = @id
        `, { id: parseInt(id), nextStep });

        // Create approval record for next step
        await execute(`
            INSERT INTO POApprovals (poId, step, stepName, action)
            VALUES (@poId, @step, @stepName, 'Pending')
        `, {
            poId: parseInt(id),
            step: nextStep,
            stepName: nextStepInfo?.name || `Step ${nextStep}`,
        });

        return NextResponse.json({
            success: true,
            message: `อนุมัติเรียบร้อย ส่งต่อให้ ${nextStepInfo?.name} แล้ว`,
        });
    } catch (error: any) {
        console.error("Error approving PO:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
