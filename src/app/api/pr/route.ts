import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute, sql } from "@/lib/db";
import { getSettingNumber } from "@/lib/settings";
import { generateDocumentNumber } from "@/lib/documentNumber";

// GET - List all PRs
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
            whereClause += ` AND pr.status = '${status}'`;
        }

        const prs = await query<any>(`
            SELECT 
                pr.*,
                u.name as requesterName,
                c.name as companyName,
                b.name as branchName,
                d.name as departmentName
            FROM PurchaseRequests pr
            LEFT JOIN Users u ON pr.requesterId = u.id
            LEFT JOIN Companies c ON pr.companyId = c.id
            LEFT JOIN Branches b ON pr.branchId = b.id
            LEFT JOIN Departments d ON pr.departmentId = d.id
            ${whereClause}
            ORDER BY pr.prNumber DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
        `);

        // Get total count
        const countResult = await query<any>(`
            SELECT COUNT(*) as total FROM PurchaseRequests pr ${whereClause}
        `);

        return NextResponse.json({
            success: true,
            data: prs,
            pagination: {
                page,
                limit,
                total: countResult[0]?.total || 0,
            },
        });
    } catch (error: any) {
        console.error("Error fetching PRs:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new PR
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const user = session.user as any;

        // Generate PR Number using format from settings
        const { number: prNumber } = await generateDocumentNumber('PR');

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

        // Insert PR with Bangkok timezone
        const result = await execute(`
            INSERT INTO PurchaseRequests (
                prNumber, requesterId, companyId, branchId, departmentId,
                requestType, purchaseMethod, requiredDate, budget,
                subtotal, vatRate, vatAmount, discountRate, discountAmount,
                withholdingTaxRate, withholdingTaxAmount, totalAmount,
                remarks, status, currentStep, createdAt
            ) VALUES (
                @prNumber, @requesterId, @companyId, @branchId, @departmentId,
                @requestType, @purchaseMethod, @requiredDate, @budget,
                @subtotal, @vatRate, @vatAmount, @discountRate, @discountAmount,
                @withholdingTaxRate, @withholdingTaxAmount, @totalAmount,
                @remarks, 'Draft', 1, SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'
            );
            SELECT SCOPE_IDENTITY() as id;
        `, {
            prNumber,
            requesterId: parseInt(user.id),
            companyId: body.companyId || user.companyId,
            branchId: body.branchId || user.branchId,
            departmentId: body.departmentId || user.departmentId,
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

        const prId = result.recordset[0].id;

        // Insert Items
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
                prId,
                itemNo: i + 1,
                itemName: item.itemName || '',
                description: item.description || '',
                quantity: parseFloat(item.quantity) || 0,
                unit: item.unit || '',
                unitPrice: parseFloat(item.unitPrice) || 0,
                totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
            });
        }

        // Create initial approval record
        await execute(`
            INSERT INTO PRApprovals (prId, step, stepName, action)
            VALUES (@prId, 1, N'ผู้ขอ', 'Approved')
        `, { prId });

        return NextResponse.json({
            success: true,
            data: {
                id: prId,
                prNumber,
            },
            message: "สร้างใบขอซื้อสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error creating PR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
