import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { getSettingNumber } from "@/lib/settings";

// GET - Get single PR by ID
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

        // Get PR details
        const prs = await query<any>(`
            SELECT 
                pr.*,
                u.name as requesterName,
                u.employeeId as requesterEmployeeId,
                c.name as companyName,
                c.code as companyCode,
                b.name as branchName,
                b.code as branchCode,
                d.name as departmentName
            FROM PurchaseRequests pr
            LEFT JOIN Users u ON pr.requesterId = u.id
            LEFT JOIN Companies c ON pr.companyId = c.id
            LEFT JOIN Branches b ON pr.branchId = b.id
            LEFT JOIN Departments d ON pr.departmentId = d.id
            WHERE pr.id = @id
        `, { id: parseInt(id) });

        if (prs.length === 0) {
            return NextResponse.json(
                { success: false, error: "PR not found" },
                { status: 404 }
            );
        }

        const pr = prs[0];

        // Get PR Items
        const items = await query<any>(`
            SELECT * FROM PRItems WHERE prId = @prId ORDER BY itemNo
        `, { prId: parseInt(id) });

        // Get PR Attachments
        const attachments = await query<any>(`
            SELECT * FROM PRAttachments WHERE prId = @prId ORDER BY uploadedAt
        `, { prId: parseInt(id) });

        // Get PR Approvals
        const approvals = await query<any>(`
            SELECT 
                a.*,
                u.name as approverName,
                u.employeeId as approverEmployeeId
            FROM PRApprovals a
            LEFT JOIN Users u ON a.approverId = u.id
            WHERE a.prId = @prId
            ORDER BY a.step
        `, { prId: parseInt(id) });

        return NextResponse.json({
            success: true,
            data: {
                ...pr,
                items,
                attachments,
                approvals,
            },
        });
    } catch (error: any) {
        console.error("Error fetching PR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update PR
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
                { success: false, error: "ไม่สามารถแก้ไขได้ เนื่องจากใบขอซื้อไม่ได้อยู่ในสถานะ Draft" },
                { status: 400 }
            );
        }

        // Calculate totals
        const items = body.items || [];
        const subtotal = items.reduce((sum: number, item: any) =>
            sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0);

        // Get default VAT rate from system settings
        const defaultVatRate = await getSettingNumber('VAT_RATE', 7);
        const vatRate = parseFloat(body.vatRate ?? defaultVatRate);
        const vatAmount = subtotal * (vatRate / 100);
        const discountRate = parseFloat(body.discountRate || 0);
        const discountAmount = subtotal * (discountRate / 100);
        const withholdingTaxRate = parseFloat(body.withholdingTaxRate || 0);
        const withholdingTaxAmount = subtotal * (withholdingTaxRate / 100);
        const totalAmount = subtotal + vatAmount - discountAmount - withholdingTaxAmount;

        // Update PR
        await execute(`
            UPDATE PurchaseRequests SET
                requestType = @requestType,
                purchaseMethod = @purchaseMethod,
                requiredDate = @requiredDate,
                budget = @budget,
                subtotal = @subtotal,
                vatRate = @vatRate,
                vatAmount = @vatAmount,
                discountRate = @discountRate,
                discountAmount = @discountAmount,
                withholdingTaxRate = @withholdingTaxRate,
                withholdingTaxAmount = @withholdingTaxAmount,
                totalAmount = @totalAmount,
                remarks = @remarks,
                updatedAt = GETDATE()
            WHERE id = @id
        `, {
            id: parseInt(id),
            requestType: body.requestType || '',
            purchaseMethod: body.purchaseMethod || '',
            requiredDate: body.requiredDate || null,
            budget: body.budget || 0,
            subtotal,
            vatRate,
            vatAmount,
            discountRate,
            discountAmount,
            withholdingTaxRate,
            withholdingTaxAmount,
            totalAmount,
            remarks: body.remarks || '',
        });

        // Delete old items and insert new ones
        await execute(`DELETE FROM PRItems WHERE prId = @prId`, { prId: parseInt(id) });

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await execute(`
                INSERT INTO PRItems (
                    prId, itemNo, itemName, description, 
                    quantity, unit, unitPrice, totalPrice
                ) VALUES (
                    @prId, @itemNo, @itemName, @description,
                    @quantity, @unit, @unitPrice, @totalPrice
                )
            `, {
                prId: parseInt(id),
                itemNo: i + 1,
                itemName: item.itemName || '',
                description: item.description || '',
                quantity: parseFloat(item.quantity) || 0,
                unit: item.unit || '',
                unitPrice: parseFloat(item.unitPrice) || 0,
                totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
            });
        }

        return NextResponse.json({
            success: true,
            message: "อัพเดทใบขอซื้อสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error updating PR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete PR (only Draft)
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
                { success: false, error: "ไม่สามารถลบได้ เนื่องจากใบขอซื้อไม่ได้อยู่ในสถานะ Draft" },
                { status: 400 }
            );
        }

        // Delete PR (cascade will delete items, attachments, approvals)
        await execute(`DELETE FROM PurchaseRequests WHERE id = @id`, { id: parseInt(id) });

        return NextResponse.json({
            success: true,
            message: "ลบใบขอซื้อสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error deleting PR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
