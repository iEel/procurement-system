import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import puppeteer from "puppeteer";
import { formatDateThai } from "@/lib/timezone";
import fs from "fs/promises";
import path from "path";

// Helper function to convert image path to base64 data URL
async function getBase64Image(imagePath: string | null): Promise<string | null> {
    if (!imagePath) return null;
    try {
        const absolutePath = path.join(process.cwd(), "public", imagePath);
        const imageBuffer = await fs.readFile(absolutePath);
        const ext = path.extname(imagePath).toLowerCase().slice(1);
        const mimeType = ext === 'jpg' ? 'jpeg' : ext;
        return `data:image/${mimeType};base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
        console.error("Error reading image:", error);
        return null;
    }
}

interface PRItem {
    id: number;
    itemNo: number;
    itemName: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

interface PRApproval {
    step: number;
    stepName: string;
    approverId: number | null;
    approverName: string | null;
    signatureImage: string | null;
    action: string;
    actionDate: string | null;
}

interface PRData {
    id: number;
    prNumber: string;
    requestDate: string;
    requesterName: string;
    companyName: string;
    companyAddress: string | null;
    companyTaxId: string | null;
    branchName: string;
    branchAddress: string | null;
    departmentName: string;
    requestType: string;
    purchaseMethod: string;
    requiredDate: string | null;
    budget: number;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    discountRate: number;
    discountAmount: number;
    withholdingTaxRate: number;
    withholdingTaxAmount: number;
    totalAmount: number;
    remarks: string;
    headerImage: string | null;
    footerImage: string | null;
    items: PRItem[];
    approvals: PRApproval[];
    requesterSignature: string | null;
}

function generatePDFHTML(pr: PRData): string {
    const itemsHTML = pr.items.map((item, index) => {
        // itemName = ชื่อสินค้า, description = รายละเอียดเพิ่มเติม
        const name = item.itemName || "";
        const desc = item.description || "";
        const fullDescription = desc ? `${name}<br/><span style="color:#666;font-size:9pt;">${desc}</span>` : name;

        return `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${fullDescription || "-"}</td>
            <td style="text-align: center;">${item.quantity} ${item.unit}</td>
            <td style="text-align: right;">${item.unitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;">${item.totalPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
        </tr>
    `;
    }).join("");

    // Helper function to generate signature box HTML
    const getSignatureBox = (
        title: string,
        subtitle: string,
        signatureImage: string | null,
        approverName: string | null,
        actionDate: string | null,
        isApproved: boolean
    ) => {
        const hasSignature = signatureImage && isApproved;
        const dateStr = actionDate ? formatDateThai(new Date(actionDate)) : "___/___/______";

        return `
            <div class="signature-box">
                ${hasSignature ? `<img src="${signatureImage}" class="signature-image" alt="signature" />` : ''}
                <div class="signature-line ${hasSignature ? 'has-signature' : ''}"></div>
                ${approverName && isApproved ? `<div class="signature-name">${approverName}</div>` : ''}
                <div class="signature-title">${title}</div>
                <div class="signature-subtitle">${subtitle}</div>
                <div class="signature-date">Date: ${dateStr}</div>
            </div>
        `;
    };

    // Get approvals by step
    const getApprovalByStep = (step: number) => pr.approvals.find(a => a.step === step);
    const step2 = getApprovalByStep(2);
    const step3 = getApprovalByStep(3);
    const step4 = getApprovalByStep(4);

    const emptyRowsCount = Math.max(0, 5 - pr.items.length);
    const emptyRowsHTML = Array(emptyRowsCount).fill(`
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td style="text-align: right;">-</td>
            <td style="text-align: right;">-</td>
        </tr>
    `).join("");

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Sarabun', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        @page {
            size: A4;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 3px solid #4a6fa5;
        }
        
        .company-name {
            font-size: 14pt;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .company-details {
            font-size: 9pt;
            color: #555;
            margin-top: 3px;
            line-height: 1.3;
        }
        
        .company-details .branch-name {
            font-weight: 600;
            color: #4a6fa5;
        }
        
        .doc-info { text-align: right; }
        
        .doc-title {
            background: linear-gradient(135deg, #4a6fa5, #6b8cce);
            color: white;
            padding: 8px 20px;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        
        .doc-title h1 { font-size: 16pt; font-weight: 700; margin: 0; }
        .doc-title h2 { font-size: 9pt; font-weight: 400; margin: 0; opacity: 0.9; }
        
        .doc-number { font-size: 10pt; }
        .doc-number strong { color: #4a6fa5; }
        
        .info-section { margin-bottom: 12px; }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        
        .info-table td {
            padding: 6px 10px;
            border: 1px solid #ddd;
        }
        
        .info-table .label {
            background: #f8f9fa;
            font-weight: 600;
            color: #4a6fa5;
            width: 160px;
        }
        
        .items-section { margin-bottom: 12px; }
        
        .section-title {
            font-size: 11pt;
            font-weight: 600;
            color: #4a6fa5;
            margin-bottom: 6px;
            padding-left: 8px;
            border-left: 3px solid #4a6fa5;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        
        .items-table th {
            background: linear-gradient(135deg, #4a6fa5, #5a7fb5);
            color: white;
            padding: 8px 6px;
            text-align: center;
            font-weight: 600;
            border: 1px solid #4a6fa5;
        }
        
        .items-table td {
            padding: 6px;
            border: 1px solid #ddd;
        }
        
        .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
        
        /* Table header repeat on every page */
        .items-table thead { display: table-header-group; }
        
        /* Keep summary, remark and signatures together at bottom */
        .bottom-section {
            page-break-inside: avoid;
            margin-top: 20px;
        }
        
        .summary-remark-wrapper {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .remark-section {
            flex: 1;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #4a6fa5;
            min-height: 60px;
        }
        
        .remark-label { font-weight: 600; color: #4a6fa5; margin-bottom: 4px; }
        
        .summary-section {
            flex-shrink: 0;
        }
        
        .summary-table {
            width: 280px;
            border-collapse: collapse;
            font-size: 10pt;
        }
        
        .summary-table td {
            padding: 6px 10px;
            border: 1px solid #ddd;
        }
        
        .summary-table .label { background: #f8f9fa; }
        .summary-table .value { text-align: right; font-weight: 500; width: 120px; white-space: nowrap; }
        
        .summary-table .total-row td {
            background: linear-gradient(135deg, #4a6fa5, #5a7fb5);
            color: white;
            font-weight: 700;
            font-size: 11pt;
        }
        
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-top: 15px;
        }
        
        .signature-box { text-align: center; width: 22%; }
        
        .signature-image {
            height: 40px;
            max-width: 100px;
            object-fit: contain;
            margin-bottom: 3px;
        }
        
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 45px;
            margin-bottom: 5px;
            padding-top: 5px;
        }
        
        .signature-line.has-signature {
            margin-top: 0;
        }
        
        .signature-name { font-size: 9pt; color: #333; font-weight: 500; }
        .signature-title { font-weight: 600; color: #4a6fa5; font-size: 9pt; }
        .signature-subtitle { font-size: 8pt; color: #666; }
        .signature-date { font-size: 8pt; color: #999; margin-top: 3px; }
        
        .footer {
            text-align: center;
            padding-top: 12px;
            border-top: 2px solid #4a6fa5;
            font-size: 8pt;
            color: #666;
        }
        
        .footer-company { font-weight: 600; color: #4a6fa5; font-size: 10pt; margin-bottom: 3px; }
    </style>
</head>
<body>
    <div class="main-content">
    <div class="header">
        <div class="company-info">
            <div class="company-name">${pr.companyName || "GRANDLINK LOGISTICS CO.,LTD."}</div>
            <div class="company-details">
                ${pr.branchName ? `<span class="branch-name">สาขา: ${pr.branchName}</span><br>` : ''}
                ${pr.branchAddress || pr.companyAddress ? `<span>${pr.branchAddress || pr.companyAddress}</span><br>` : ''}
                ${pr.companyTaxId ? `<span>เลขประจำตัวผู้เสียภาษี: ${pr.companyTaxId}</span>` : ''}
            </div>
        </div>
        <div class="doc-info">
            <div class="doc-title">
                <h1>ใบขอซื้อ</h1>
                <h2>PURCHASE REQUEST</h2>
            </div>
            <div class="doc-number">
                <div><strong>เลขที่:</strong> ${pr.prNumber}</div>
                <div><strong>วันที่:</strong> ${formatDateThai(pr.requestDate)}</div>
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <table class="info-table">
            <tr>
                <td class="label">หน่วยงานที่ขอซื้อ / Dept.</td>
                <td class="value">${pr.departmentName}</td>
                <td class="label" style="width: 100px;">ฝ่าย / Branch</td>
                <td class="value">${pr.branchName}</td>
            </tr>
            <tr>
                <td class="label">วันที่ต้องการใช้งาน</td>
                <td class="value">${pr.requiredDate ? formatDateThai(pr.requiredDate) : "-"}</td>
                <td class="label">งบประมาณ</td>
                <td class="value">${pr.budget > 0 ? pr.budget.toLocaleString("th-TH", { minimumFractionDigits: 2 }) + " บาท" : "-"}</td>
            </tr>
            <tr>
                <td class="label">วัตถุประสงค์</td>
                <td class="value" colspan="3">
                    ${pr.requestType?.includes('newPurchase') ? '☑' : '☐'} เพื่อซื้อใหม่ &nbsp;&nbsp; 
                    ${pr.requestType?.includes('replacement') ? '☑' : '☐'} เพื่อทดแทนของเดิม &nbsp;&nbsp; 
                    ${pr.requestType?.includes('repair') ? '☑' : '☐'} เพื่อซ่อมแซม &nbsp;&nbsp; 
                    ${pr.requestType?.includes('renewal') ? '☑' : '☐'} ต่ออายุ
                </td>
            </tr>
            <tr>
                <td class="label">ความต้องการซื้อ</td>
                <td class="value" colspan="3">
                    ${pr.purchaseMethod === 'procurementHandle' ? '☑' : '☐'} ให้จัดซื้อให้ &nbsp;&nbsp; 
                    ${pr.purchaseMethod === 'selfPurchase' ? '☑' : '☐'} ขอซื้อเอง
                </td>
            </tr>
        </table>
    </div>
    
    <div class="items-section">
        <div class="section-title">รายการสินค้า / Items</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40px;">ลำดับ</th>
                    <th>รายละเอียด / Description</th>
                    <th style="width: 70px;">จำนวน</th>
                    <th style="width: 80px;">ราคา/หน่วย</th>
                    <th style="width: 90px;">รวมเงิน</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
                ${emptyRowsHTML}
            </tbody>
        </table>
    </div>
    </div><!-- end main-content -->
    
    <div class="bottom-section">
    <div class="summary-remark-wrapper">
        <div class="remark-section">
            <div class="remark-label">หมายเหตุ / Remark</div>
            <div>${pr.remarks || "-"}</div>
        </div>
        <div class="summary-section">
            <table class="summary-table">
                <tr>
                    <td class="label">ราคาก่อน VAT</td>
                    <td class="value">${pr.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                    <td class="label">VAT ${pr.vatRate}%</td>
                    <td class="value">${pr.vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                </tr>
                ${pr.withholdingTaxAmount > 0 ? `
                <tr>
                    <td class="label">หัก ภาษี ณ ที่จ่าย ${pr.withholdingTaxRate}%</td>
                    <td class="value" style="color: #dc3545;">-${pr.withholdingTaxAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td class="label">ยอดรวมทั้งสิ้น</td>
                    <td class="value">${pr.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</td>
                </tr>
            </table>
        </div>
    </div>
    
        <div class="signatures">
        ${getSignatureBox(
        'ผู้ขออนุมัติ',
        'Requested by',
        pr.requesterSignature,
        pr.requesterName,
        pr.requestDate,
        true
    )}
        ${getSignatureBox(
        'หัวหน้าแผนก',
        'Department Head',
        step2?.signatureImage || null,
        step2?.approverName || null,
        step2?.actionDate || null,
        step2?.action === 'Approved'
    )}
        ${getSignatureBox(
        'จัดซื้อ',
        'Procurement',
        step3?.signatureImage || null,
        step3?.approverName || null,
        step3?.actionDate || null,
        step3?.action === 'Approved'
    )}
        ${getSignatureBox(
        'ผู้บริหาร',
        'Management',
        step4?.signatureImage || null,
        step4?.approverName || null,
        step4?.actionDate || null,
        step4?.action === 'Approved'
    )}
    </div>
    </div><!-- end bottom-section -->
    
    ${pr.footerImage ? '' : `
    <div class="footer">
        <div class="footer-company">${pr.companyName || "GRANDLINK LOGISTICS CO.,LTD."}</div>
        <div>79/345-350 Sathuprodit Road, Chongnonsee, Yannawa, Bangkok 10120, Thailand</div>
        <div>Tel: 02 213 2566 | Fax: 02 213 2566</div>
    </div>
    `}
</body>
</html>`;
}

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

        // Fetch PR data
        const prResult = await query<PRData>(`
            SELECT 
                pr.ID as id,
                pr.PRNumber as prNumber,
                pr.RequestDate as requestDate,
                u.name as requesterName,
                c.Name as companyName,
                c.address as companyAddress,
                c.taxId as companyTaxId,
                b.Name as branchName,
                b.address as branchAddress,
                d.Name as departmentName,
                pr.RequestType as requestType,
                pr.PurchaseMethod as purchaseMethod,
                pr.RequiredDate as requiredDate,
                pr.Budget as budget,
                pr.Subtotal as subtotal,
                pr.VATRate as vatRate,
                pr.VATAmount as vatAmount,
                pr.DiscountRate as discountRate,
                pr.DiscountAmount as discountAmount,
                ISNULL(pr.withholdingTaxRate, 0) as withholdingTaxRate,
                ISNULL(pr.withholdingTaxAmount, 0) as withholdingTaxAmount,
                pr.TotalAmount as totalAmount,
                ISNULL(pr.Remarks, '') as remarks,
                b.headerImage as headerImage,
                b.footerImage as footerImage
            FROM PurchaseRequests pr
            LEFT JOIN Users u ON pr.RequesterID = u.ID
            LEFT JOIN Companies c ON pr.CompanyID = c.ID
            LEFT JOIN Branches b ON pr.BranchID = b.ID
            LEFT JOIN Departments d ON pr.DepartmentID = d.ID
            WHERE pr.ID = @id
        `, { id: parseInt(id) });

        if (!prResult || prResult.length === 0) {
            return NextResponse.json({ error: "PR not found" }, { status: 404 });
        }

        const pr = prResult[0];

        // Fetch PR items
        const itemsResult = await query<PRItem>(`
            SELECT 
                id as id,
                itemNo as itemNo,
                ISNULL(itemName, '') as itemName,
                description as description,
                quantity as quantity,
                unit as unit,
                unitPrice as unitPrice,
                totalPrice as totalPrice
            FROM PRItems
            WHERE prId = @id
            ORDER BY itemNo
        `, { id: parseInt(id) });

        pr.items = itemsResult || [];

        // Fetch PR approvals with signature images
        const approvalsResult = await query<PRApproval>(`
            SELECT 
                a.step,
                a.stepName,
                a.approverId,
                u.name as approverName,
                u.signatureImage,
                a.action,
                a.actionDate
            FROM PRApprovals a
            LEFT JOIN Users u ON a.approverId = u.id
            WHERE a.prId = @id
            ORDER BY a.step
        `, { id: parseInt(id) });

        pr.approvals = approvalsResult || [];

        // Get requester signature
        const requesterResult = await query<{ signatureImage: string | null }>(`
            SELECT u.signatureImage
            FROM Users u
            INNER JOIN PurchaseRequests pr ON pr.requesterId = u.id
            WHERE pr.id = @id
        `, { id: parseInt(id) });

        pr.requesterSignature = requesterResult[0]?.signatureImage || null;

        // Convert branch images to base64 for Puppeteer
        if (pr.headerImage) {
            pr.headerImage = await getBase64Image(pr.headerImage);
        }
        if (pr.footerImage) {
            pr.footerImage = await getBase64Image(pr.footerImage);
        }

        // Convert signature images to base64
        if (pr.requesterSignature) {
            pr.requesterSignature = await getBase64Image(pr.requesterSignature);
        }
        for (const approval of pr.approvals) {
            if (approval.signatureImage) {
                approval.signatureImage = await getBase64Image(approval.signatureImage);
            }
        }

        // Generate HTML
        const html = generatePDFHTML(pr);

        // Create header/footer templates for Puppeteer
        const headerTemplate = pr.headerImage
            ? `<div style="width: 100%; margin: 0; padding: 0;">
                 <img src="${pr.headerImage}" style="width: 100%; display: block;" />
               </div>`
            : '<div></div>';

        const footerTemplate = pr.footerImage
            ? `<div style="width: 100%; margin: 0; padding: 0;">
                 <img src="${pr.headerImage}" style="width: 100%; display: block;" />
                 <div style="text-align: center; font-size: 8pt; color: #666; padding: 5px;">หน้า <span class="pageNumber"></span> / <span class="totalPages"></span></div>
               </div>`
            : `<div style="width: 100%; text-align: center; font-size: 9pt; color: #666; font-family: 'Sarabun', sans-serif; padding: 10px 20px;">
                 <div>หน้า <span class="pageNumber"></span> / <span class="totalPages"></span></div>
               </div>`;

        // Launch Puppeteer and generate PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        // Calculate margins based on header/footer (adjust these values to match your image sizes)
        const headerMargin = pr.headerImage ? "35mm" : "15mm";
        const footerMargin = pr.footerImage ? "40mm" : "18mm"; // Increased for footer image

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            displayHeaderFooter: true, // Always show for page numbers
            headerTemplate: headerTemplate,
            footerTemplate: footerTemplate,
            margin: {
                top: headerMargin,
                right: "15mm",
                bottom: footerMargin,
                left: "15mm"
            },
        });

        await browser.close();

        // Return PDF
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${pr.prNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
