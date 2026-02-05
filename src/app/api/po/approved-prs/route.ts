import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET - List approved PRs that can be converted to PO
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get approved PRs that don't have a PO yet
        const prs = await query<any>(`
            SELECT 
                pr.id,
                pr.prNumber,
                pr.requestDate,
                pr.totalAmount,
                pr.remarks,
                u.name as requesterName,
                c.name as companyName,
                b.name as branchName,
                d.name as departmentName
            FROM PurchaseRequests pr
            LEFT JOIN Users u ON pr.requesterId = u.id
            LEFT JOIN Companies c ON pr.companyId = c.id
            LEFT JOIN Branches b ON pr.branchId = b.id
            LEFT JOIN Departments d ON pr.departmentId = d.id
            WHERE pr.status = 'Approved'
            AND NOT EXISTS (
                SELECT 1 FROM PurchaseOrders po WHERE po.prId = pr.id
            )
            ORDER BY pr.prNumber DESC
        `);

        return NextResponse.json({
            success: true,
            data: prs,
        });
    } catch (error: any) {
        console.error("Error fetching approved PRs:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
