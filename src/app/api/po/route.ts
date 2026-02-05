import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { generateDocumentNumber } from "@/lib/documentNumber";

// GET - List all POs
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        let whereClause = "WHERE 1=1";
        if (status) {
            whereClause += ` AND po.status = '${status}'`;
        }

        const pos = await query<any>(`
            SELECT 
                po.*,
                pr.prNumber,
                c.name as companyName,
                b.name as branchName
            FROM PurchaseOrders po
            LEFT JOIN PurchaseRequests pr ON po.prId = pr.id
            LEFT JOIN Companies c ON po.companyId = c.id
            LEFT JOIN Branches b ON po.branchId = b.id
            ${whereClause}
            ORDER BY po.poNumber DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
        `);

        // Get total count
        const countResult = await query<any>(`
            SELECT COUNT(*) as total FROM PurchaseOrders po ${whereClause}
        `);

        return NextResponse.json({
            success: true,
            data: pos,
            pagination: {
                page,
                limit,
                total: countResult[0]?.total || 0,
            },
        });
    } catch (error: any) {
        console.error("Error fetching POs:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new PO from PR
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const user = session.user as any;

        // Verify PR exists and is approved
        const prResult = await query<any>(`
            SELECT pr.*, 
                   c.name as companyName, 
                   b.name as branchName
            FROM PurchaseRequests pr
            LEFT JOIN Companies c ON pr.companyId = c.id
            LEFT JOIN Branches b ON pr.branchId = b.id
            WHERE pr.id = @prId AND pr.status = 'Approved'
        `, { prId: body.prId });

        if (prResult.length === 0) {
            return NextResponse.json(
                { success: false, error: "ไม่พบใบขอซื้อที่อนุมัติแล้ว" },
                { status: 400 }
            );
        }

        const pr = prResult[0];

        // Generate PO Number using format from settings
        const { number: poNumber } = await generateDocumentNumber('PO');

        // Insert PO
        const result = await execute(`
            INSERT INTO PurchaseOrders (
                poNumber, prId, companyId, branchId,
                vendorName, vendorAddress, vendorTaxId,
                quotationNo, issueDate, deliveryDate, deliveryPlace, paymentTerm,
                subtotal, vatRate, vatAmount, discountRate, discountAmount, grandTotal,
                remarks, status, currentStep, createdAt
            ) VALUES (
                @poNumber, @prId, @companyId, @branchId,
                @vendorName, @vendorAddress, @vendorTaxId,
                @quotationNo, SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time', @deliveryDate, @deliveryPlace, @paymentTerm,
                @subtotal, @vatRate, @vatAmount, @discountRate, @discountAmount, @grandTotal,
                @remarks, 'Draft', 1, SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'
            );
            SELECT SCOPE_IDENTITY() as id;
        `, {
            poNumber,
            prId: body.prId,
            companyId: pr.companyId,
            branchId: pr.branchId,
            vendorName: body.vendorName || '',
            vendorAddress: body.vendorAddress || '',
            vendorTaxId: body.vendorTaxId || '',
            quotationNo: body.quotationNo || '',
            deliveryDate: body.deliveryDate || null,
            deliveryPlace: body.deliveryPlace || '',
            paymentTerm: body.paymentTerm || '',
            subtotal: pr.subtotal,
            vatRate: pr.vatRate,
            vatAmount: pr.vatAmount,
            discountRate: pr.discountRate,
            discountAmount: pr.discountAmount,
            grandTotal: pr.totalAmount,
            remarks: body.remarks || pr.remarks || '',
        });

        const poId = result.recordset[0].id;

        // Copy items from PR to PO
        const prItems = await query<any>(`
            SELECT * FROM PRItems WHERE prId = @prId ORDER BY itemNo
        `, { prId: body.prId });

        for (const item of prItems) {
            await execute(`
                INSERT INTO POItems (
                    poId, itemNo, description, 
                    quantity, unit, unitPrice, totalPrice
                ) VALUES (
                    @poId, @itemNo, @description,
                    @quantity, @unit, @unitPrice, @totalPrice
                )
            `, {
                poId,
                itemNo: item.itemNo,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            });
        }

        // Create initial approval record
        await execute(`
            INSERT INTO POApprovals (poId, step, stepName, approverId, action, actionDate)
            VALUES (@poId, 1, N'พนักงานจัดซื้อ', @userId, 'Approved', SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')
        `, { poId, userId: parseInt(user.id) });

        return NextResponse.json({
            success: true,
            data: {
                id: poId,
                poNumber,
            },
            message: "สร้างใบสั่งซื้อสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error creating PO:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
