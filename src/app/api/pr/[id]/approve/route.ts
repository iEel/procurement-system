import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";

const APPROVAL_STEPS = [
    { step: 1, name: 'ผู้ขอ' },
    { step: 2, name: 'หัวหน้าแผนก' },
    { step: 3, name: 'พนักงานจัดซื้อ' },
    { step: 4, name: 'ผู้บริหาร' },
];

// POST - Approve, Reject, or Return PR
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

        // Check if PR exists and is Pending
        const prs = await query<any>(`
            SELECT * FROM PurchaseRequests WHERE id = @id
        `, { id: parseInt(id) });

        if (prs.length === 0) {
            return NextResponse.json(
                { success: false, error: "PR not found" },
                { status: 404 }
            );
        }

        const pr = prs[0];

        if (pr.status !== 'Pending') {
            return NextResponse.json(
                { success: false, error: "ไม่สามารถดำเนินการได้ เนื่องจากใบขอซื้อไม่ได้อยู่ในสถานะรออนุมัติ" },
                { status: 400 }
            );
        }

        const currentStep = pr.currentStep;

        // Update current approval record
        await execute(`
            UPDATE PRApprovals SET
                approverId = @approverId,
                action = @action,
                comments = @comments,
                actionDate = GETDATE()
            WHERE prId = @prId AND step = @step
        `, {
            prId: parseInt(id),
            step: currentStep,
            approverId: parseInt(user.id),
            action,
            comments: comments || null,
        });

        // Handle Returned action - send back to requester for revision
        if (action === 'Returned') {
            // Reset PR status to Draft and currentStep to 1
            await execute(`
                UPDATE PurchaseRequests SET
                    status = 'Draft',
                    currentStep = 1,
                    updatedAt = GETDATE()
                WHERE id = @id
            `, { id: parseInt(id) });

            // TODO: Send email notification to requester about revision request

            return NextResponse.json({
                success: true,
                message: "ส่งกลับให้แก้ไขเรียบร้อยแล้ว",
            });
        }

        if (action === 'Rejected') {
            // Reject: Update PR status
            await execute(`
                UPDATE PurchaseRequests SET
                    status = 'Rejected',
                    updatedAt = GETDATE()
                WHERE id = @id
            `, { id: parseInt(id) });

            // TODO: Send email notification to requester

            return NextResponse.json({
                success: true,
                message: "ไม่อนุมัติใบขอซื้อเรียบร้อยแล้ว",
            });
        }

        // Approved: Check if this is the last step
        if (currentStep >= 4) {
            // Final approval
            await execute(`
                UPDATE PurchaseRequests SET
                    status = 'Approved',
                    updatedAt = GETDATE()
                WHERE id = @id
            `, { id: parseInt(id) });

            // TODO: Send email notification to requester

            return NextResponse.json({
                success: true,
                message: "อนุมัติใบขอซื้อขั้นสุดท้ายเรียบร้อยแล้ว",
            });
        }

        // Move to next step
        const nextStep = currentStep + 1;
        const nextStepInfo = APPROVAL_STEPS.find(s => s.step === nextStep);

        await execute(`
            UPDATE PurchaseRequests SET
                currentStep = @nextStep,
                updatedAt = GETDATE()
            WHERE id = @id
        `, { id: parseInt(id), nextStep });

        // Create approval record for next step
        await execute(`
            INSERT INTO PRApprovals (prId, step, stepName, action)
            VALUES (@prId, @step, @stepName, 'Pending')
        `, {
            prId: parseInt(id),
            step: nextStep,
            stepName: nextStepInfo?.name || `Step ${nextStep}`,
        });

        // TODO: Send email notification to next approver

        return NextResponse.json({
            success: true,
            message: `อนุมัติเรียบร้อย ส่งต่อให้ ${nextStepInfo?.name} แล้ว`,
        });
    } catch (error: any) {
        console.error("Error approving PR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
