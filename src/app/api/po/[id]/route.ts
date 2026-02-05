import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { getSettingNumber } from "@/lib/settings";

// GET - Get single PO by ID
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

        // Get PO details
        const pos = await query<any>(`
            SELECT 
                po.*,
                pr.prNumber,
                c.name as companyName,
                c.code as companyCode,
                b.name as branchName,
                b.code as branchCode
            FROM PurchaseOrders po
            LEFT JOIN PurchaseRequests pr ON po.prId = pr.id
            LEFT JOIN Companies c ON po.companyId = c.id
            LEFT JOIN Branches b ON po.branchId = b.id
            WHERE po.id = @id
        `, { id: parseInt(id) });

        if (pos.length === 0) {
            return NextResponse.json(
                { success: false, error: "PO not found" },
                { status: 404 }
            );
        }

        const po = pos[0];

        // Get PO Items
        const items = await query<any>(`
            SELECT * FROM POItems WHERE poId = @poId ORDER BY itemNo
        `, { poId: parseInt(id) });

        // Get PO Approvals
        const approvals = await query<any>(`
            SELECT 
                a.*,
                u.name as approverName,
                u.employeeId as approverEmployeeId
            FROM POApprovals a
            LEFT JOIN Users u ON a.approverId = u.id
            WHERE a.poId = @poId
            ORDER BY a.step
        `, { poId: parseInt(id) });

        return NextResponse.json({
            success: true,
            data: {
                ...po,
                items,
                approvals,
            },
        });
    } catch (error: any) {
        console.error("Error fetching PO:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update PO
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
                { success: false, error: "ไม่สามารถแก้ไขได้ เนื่องจากใบสั่งซื้อไม่ได้อยู่ในสถานะ Draft" },
                { status: 400 }
            );
        }

        // Calculate totals from items
        const items = body.items || [];
        const subtotal = items.reduce((sum: number, item: any) =>
            sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0);

        // Get default VAT rate from system settings
        const defaultVatRate = await getSettingNumber('VAT_RATE', 7);
        const vatRate = parseFloat(body.vatRate ?? pos[0].vatRate ?? defaultVatRate);
        const vatAmount = subtotal * (vatRate / 100);
        const discountRate = parseFloat(body.discountRate ?? pos[0].discountRate ?? 0);
        const discountAmount = subtotal * (discountRate / 100);
        const grandTotal = subtotal + vatAmount - discountAmount;

        // Update PO
        await execute(`
            UPDATE PurchaseOrders SET
                vendorName = @vendorName,
                vendorAddress = @vendorAddress,
                vendorTaxId = @vendorTaxId,
                quotationNo = @quotationNo,
                deliveryDate = @deliveryDate,
                deliveryPlace = @deliveryPlace,
                paymentTerm = @paymentTerm,
                subtotal = @subtotal,
                vatRate = @vatRate,
                vatAmount = @vatAmount,
                discountRate = @discountRate,
                discountAmount = @discountAmount,
                grandTotal = @grandTotal,
                remarks = @remarks,
                updatedAt = GETDATE()
            WHERE id = @id
        `, {
            id: parseInt(id),
            vendorName: body.vendorName || '',
            vendorAddress: body.vendorAddress || '',
            vendorTaxId: body.vendorTaxId || '',
            quotationNo: body.quotationNo || '',
            deliveryDate: body.deliveryDate || null,
            deliveryPlace: body.deliveryPlace || '',
            paymentTerm: body.paymentTerm || '',
            subtotal,
            vatRate,
            vatAmount,
            discountRate,
            discountAmount,
            grandTotal,
            remarks: body.remarks || '',
        });

        // Update items if provided
        if (items.length > 0) {
            await execute(`DELETE FROM POItems WHERE poId = @poId`, { poId: parseInt(id) });

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                await execute(`
                    INSERT INTO POItems (
                        poId, itemNo, description, 
                        quantity, unit, unitPrice, totalPrice
                    ) VALUES (
                        @poId, @itemNo, @description,
                        @quantity, @unit, @unitPrice, @totalPrice
                    )
                `, {
                    poId: parseInt(id),
                    itemNo: i + 1,
                    description: item.description || '',
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || '',
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "อัพเดทใบสั่งซื้อสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error updating PO:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete PO (only Draft)
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
                { success: false, error: "ไม่สามารถลบได้ เนื่องจากใบสั่งซื้อไม่ได้อยู่ในสถานะ Draft" },
                { status: 400 }
            );
        }

        // Delete PO (cascade will delete items and approvals)
        await execute(`DELETE FROM PurchaseOrders WHERE id = @id`, { id: parseInt(id) });

        return NextResponse.json({
            success: true,
            message: "ลบใบสั่งซื้อสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error deleting PO:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
