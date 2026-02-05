"use client";

import { formatDateThai } from "@/lib/timezone";

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

interface PRPrintData {
    id: number;
    prNumber: string;
    requestDate: string;
    requesterName: string;
    requesterEmployeeId?: string;
    companyName: string;
    companyCode?: string;
    companyAddress?: string;
    companyTaxId?: string;
    branchName: string;
    branchCode?: string;
    branchAddress?: string;
    departmentName: string;
    requestType: string;
    purchaseMethod: string;
    requiredDate: string | null;
    budget: number;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    withholdingTaxRate?: number;
    withholdingTaxAmount?: number;
    discountRate: number;
    discountAmount: number;
    totalAmount: number;
    remarks: string;
    items: PRItem[];
}

interface PRPrintTemplateProps {
    pr: PRPrintData;
}

export default function PRPrintTemplate({ pr }: PRPrintTemplateProps) {
    const requestTypes = pr.requestType?.split(",").filter(Boolean) || [];
    const purchaseMethods = pr.purchaseMethod?.split(",").filter(Boolean) || [];

    return (
        <>
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm 15mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
            <div
                style={{
                    width: "100%",
                    maxWidth: "210mm",
                    padding: "0",
                    margin: "0 auto",
                    backgroundColor: "white",
                    fontFamily: "Sarabun, sans-serif",
                    fontSize: "11pt",
                    lineHeight: "1.4",
                    color: "#333",
                    boxSizing: "border-box",
                }}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "15px",
                    paddingBottom: "12px",
                    borderBottom: "3px solid #4a6fa5"
                }}>
                    <div>
                        <div style={{ fontSize: "14pt", fontWeight: 700, color: "#2c3e50" }}>
                            {pr.companyName || "GRANDLINK LOGISTICS CO.,LTD."}
                        </div>
                        <div style={{ fontSize: "9pt", color: "#555", marginTop: "3px", lineHeight: 1.3 }}>
                            {pr.branchName && <><span style={{ fontWeight: 600, color: "#4a6fa5" }}>สาขา: {pr.branchName}</span><br /></>}
                            {(pr.branchAddress || pr.companyAddress) && <><span>{pr.branchAddress || pr.companyAddress}</span><br /></>}
                            {pr.companyTaxId && <span>เลขประจำตัวผู้เสียภาษี: {pr.companyTaxId}</span>}
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{
                            background: "linear-gradient(135deg, #4a6fa5, #6b8cce)",
                            color: "white",
                            padding: "8px 20px",
                            borderRadius: "4px",
                            marginBottom: "8px"
                        }}>
                            <div style={{ fontSize: "16pt", fontWeight: 700, margin: 0 }}>ใบขอซื้อ</div>
                            <div style={{ fontSize: "9pt", fontWeight: 400, margin: 0, opacity: 0.9 }}>PURCHASE REQUEST</div>
                        </div>
                        <div style={{ fontSize: "10pt" }}>
                            <div><strong style={{ color: "#4a6fa5" }}>เลขที่:</strong> {pr.prNumber}</div>
                            <div><strong style={{ color: "#4a6fa5" }}>วันที่:</strong> {formatDateThai(pr.requestDate)}</div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div style={{ marginBottom: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa", fontWeight: 600, color: "#4a6fa5", width: "160px" }}>
                                    หน่วยงานที่ขอซื้อ / Dept.
                                </td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{pr.departmentName}</td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa", fontWeight: 600, color: "#4a6fa5", width: "160px" }}>
                                    ผู้ขอ / Requester
                                </td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{pr.requesterName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa", fontWeight: 600, color: "#4a6fa5" }}>
                                    วันที่ต้องการใช้
                                </td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>
                                    {pr.requiredDate ? formatDateThai(pr.requiredDate) : "-"}
                                </td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa", fontWeight: 600, color: "#4a6fa5" }}>
                                    งบประมาณ / Budget
                                </td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>
                                    {pr.budget > 0 ? `฿${pr.budget.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "-"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Purpose & Procurement Needs */}
                <div style={{ marginBottom: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa", fontWeight: 600, color: "#4a6fa5", width: "160px", verticalAlign: "top" }}>
                                    วัตถุประสงค์ / Purpose
                                </td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                                        <span>{requestTypes.includes("newPurchase") ? "☑" : "☐"} เพื่อซื้อใหม่</span>
                                        <span>{requestTypes.includes("replacement") ? "☑" : "☐"} เพื่อทดแทนของเดิม</span>
                                        <span>{requestTypes.includes("repair") ? "☑" : "☐"} เพื่อซ่อมแซม</span>
                                        <span>{requestTypes.includes("renewal") ? "☑" : "☐"} ต่ออายุ</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa", fontWeight: 600, color: "#4a6fa5", verticalAlign: "top" }}>
                                    ความต้องการจัดซื้อ
                                </td>
                                <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                                        <span>{pr.purchaseMethod === "procurementHandle" ? "☑" : "☐"} ให้จัดซื้อให้</span>
                                        <span>{pr.purchaseMethod === "selfPurchase" ? "☑" : "☐"} ขอซื้อเอง</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Items Section */}
                <div style={{ marginBottom: "12px" }}>
                    <div style={{
                        fontSize: "11pt",
                        fontWeight: 600,
                        color: "#4a6fa5",
                        marginBottom: "6px",
                        paddingLeft: "8px",
                        borderLeft: "3px solid #4a6fa5"
                    }}>
                        รายการสินค้า / Items
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
                        <thead>
                            <tr>
                                <th style={{
                                    background: "linear-gradient(135deg, #4a6fa5, #5a7fb5)",
                                    color: "white",
                                    padding: "8px 6px",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    border: "1px solid #4a6fa5",
                                    width: "40px"
                                }}>ลำดับ</th>
                                <th style={{
                                    background: "linear-gradient(135deg, #4a6fa5, #5a7fb5)",
                                    color: "white",
                                    padding: "8px 6px",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    border: "1px solid #4a6fa5"
                                }}>รายละเอียด / Description</th>
                                <th style={{
                                    background: "linear-gradient(135deg, #4a6fa5, #5a7fb5)",
                                    color: "white",
                                    padding: "8px 6px",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    border: "1px solid #4a6fa5",
                                    width: "70px"
                                }}>จำนวน</th>
                                <th style={{
                                    background: "linear-gradient(135deg, #4a6fa5, #5a7fb5)",
                                    color: "white",
                                    padding: "8px 6px",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    border: "1px solid #4a6fa5",
                                    width: "80px"
                                }}>ราคา/หน่วย</th>
                                <th style={{
                                    background: "linear-gradient(135deg, #4a6fa5, #5a7fb5)",
                                    color: "white",
                                    padding: "8px 6px",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    border: "1px solid #4a6fa5",
                                    width: "90px"
                                }}>รวมเงิน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pr.items.map((item, index) => (
                                <tr key={item.id} style={{ background: index % 2 === 1 ? "#f8f9fa" : "white" }}>
                                    <td style={{ padding: "6px", border: "1px solid #ddd", textAlign: "center" }}>{index + 1}</td>
                                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                                        {item.itemName || item.description}
                                        {item.itemName && item.description && (
                                            <><br /><span style={{ color: "#666", fontSize: "9pt" }}>{item.description}</span></>
                                        )}
                                    </td>
                                    <td style={{ padding: "6px", border: "1px solid #ddd", textAlign: "center" }}>{item.quantity} {item.unit}</td>
                                    <td style={{ padding: "6px", border: "1px solid #ddd", textAlign: "right" }}>
                                        {item.unitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: "6px", border: "1px solid #ddd", textAlign: "right" }}>
                                        {item.totalPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary & Remark */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "15px" }}>
                    {/* Remark */}
                    <div style={{
                        flex: 1,
                        padding: "10px",
                        background: "#f8f9fa",
                        borderRadius: "4px",
                        borderLeft: "3px solid #4a6fa5",
                        minHeight: "60px"
                    }}>
                        <div style={{ fontWeight: 600, color: "#4a6fa5", marginBottom: "4px" }}>หมายเหตุ / Remark</div>
                        <div>{pr.remarks || "-"}</div>
                    </div>

                    {/* Summary */}
                    <div style={{ flexShrink: 0 }}>
                        <table style={{ width: "280px", borderCollapse: "collapse", fontSize: "10pt" }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa" }}>ราคาก่อน VAT</td>
                                    <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 500, width: "120px" }}>
                                        {pr.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa" }}>VAT {pr.vatRate}%</td>
                                    <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 500 }}>
                                        {pr.vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                {pr.discountRate > 0 && (
                                    <tr>
                                        <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa" }}>ส่วนลด {pr.discountRate}%</td>
                                        <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 500, color: "#dc3545" }}>
                                            -{pr.discountAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                                {(pr.withholdingTaxRate ?? 0) > 0 && (
                                    <tr>
                                        <td style={{ padding: "6px 10px", border: "1px solid #ddd", background: "#f8f9fa" }}>หัก ณ ที่จ่าย {pr.withholdingTaxRate}%</td>
                                        <td style={{ padding: "6px 10px", border: "1px solid #ddd", textAlign: "right", fontWeight: 500, color: "#dc3545" }}>
                                            -{(pr.withholdingTaxAmount ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                                <tr>
                                    <td style={{
                                        padding: "6px 10px",
                                        border: "1px solid #4a6fa5",
                                        background: "linear-gradient(135deg, #4a6fa5, #5a7fb5)",
                                        color: "white",
                                        fontWeight: 700,
                                        fontSize: "11pt"
                                    }}>ยอดรวมทั้งสิ้น</td>
                                    <td style={{
                                        padding: "6px 10px",
                                        border: "1px solid #4a6fa5",
                                        background: "linear-gradient(135deg, #4a6fa5, #5a7fb5)",
                                        color: "white",
                                        textAlign: "right",
                                        fontWeight: 700,
                                        fontSize: "11pt"
                                    }}>
                                        {pr.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", paddingTop: "15px" }}>
                    <div style={{ textAlign: "center", width: "22%" }}>
                        <div style={{ borderTop: "1px solid #333", marginTop: "45px", marginBottom: "5px", paddingTop: "5px" }}></div>
                        <div style={{ fontWeight: 600, color: "#4a6fa5", fontSize: "9pt" }}>ผู้ขออนุมัติ</div>
                        <div style={{ fontSize: "8pt", color: "#666" }}>Requested by</div>
                        <div style={{ fontSize: "8pt", color: "#999", marginTop: "3px" }}>Date: ___/___/______</div>
                    </div>
                    <div style={{ textAlign: "center", width: "22%" }}>
                        <div style={{ borderTop: "1px solid #333", marginTop: "45px", marginBottom: "5px", paddingTop: "5px" }}></div>
                        <div style={{ fontWeight: 600, color: "#4a6fa5", fontSize: "9pt" }}>หัวหน้าแผนก</div>
                        <div style={{ fontSize: "8pt", color: "#666" }}>Department Head</div>
                        <div style={{ fontSize: "8pt", color: "#999", marginTop: "3px" }}>Date: ___/___/______</div>
                    </div>
                    <div style={{ textAlign: "center", width: "22%" }}>
                        <div style={{ borderTop: "1px solid #333", marginTop: "45px", marginBottom: "5px", paddingTop: "5px" }}></div>
                        <div style={{ fontWeight: 600, color: "#4a6fa5", fontSize: "9pt" }}>จัดซื้อ</div>
                        <div style={{ fontSize: "8pt", color: "#666" }}>Procurement</div>
                        <div style={{ fontSize: "8pt", color: "#999", marginTop: "3px" }}>Date: ___/___/______</div>
                    </div>
                    <div style={{ textAlign: "center", width: "22%" }}>
                        <div style={{ borderTop: "1px solid #333", marginTop: "45px", marginBottom: "5px", paddingTop: "5px" }}></div>
                        <div style={{ fontWeight: 600, color: "#4a6fa5", fontSize: "9pt" }}>ผู้บริหาร</div>
                        <div style={{ fontSize: "8pt", color: "#666" }}>Management</div>
                        <div style={{ fontSize: "8pt", color: "#999", marginTop: "3px" }}>Date: ___/___/______</div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: "center", paddingTop: "12px", borderTop: "2px solid #4a6fa5", fontSize: "8pt", color: "#666" }}>
                    <div style={{ fontWeight: 600, color: "#4a6fa5", fontSize: "10pt", marginBottom: "3px" }}>
                        {pr.companyName || "GRANDLINK LOGISTICS CO.,LTD."}
                    </div>
                    <div>79/345-350 Sathuprodit Road, Chongnonsee, Yannawa, Bangkok 10120, Thailand</div>
                    <div>Tel: 02 213 2566 | Fax: 02 213 2566</div>
                </div>
            </div>
        </>
    );
}
