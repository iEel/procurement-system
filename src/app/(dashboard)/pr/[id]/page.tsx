"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    ArrowLeft,
    Send,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Building,
    Calendar,
    Package,
    MessageSquare,
    Download,
    Receipt,
    Star,
    RotateCcw,
    Printer,
    FileDown,
} from "lucide-react";
import { formatDateTime, formatDateThai } from "@/lib/timezone";
import ProgressStatusBar from "@/components/ui/ProgressStatusBar";
import PRPrintTemplate from "@/components/print/PRPrintTemplate";

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

interface Approval {
    id: number;
    step: number;
    stepName: string;
    approverId: number | null;
    approverName: string | null;
    action: string;
    comments: string | null;
    actionDate: string | null;
}

interface Quotation {
    id: number;
    vendorNo: number;
    vendorName: string;
    isSelected: boolean;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
}

interface PRDetail {
    id: number;
    prNumber: string;
    requestDate: string;
    requesterId: number;
    requesterName: string;
    requesterEmployeeId: string;
    companyId: number;
    companyName: string;
    companyCode: string;
    branchId: number;
    branchName: string;
    branchCode: string;
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
    status: string;
    currentStep: number;
    items: PRItem[];
    approvals: Approval[];
}

export default function PRDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const [pr, setPr] = useState<PRDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approveComment, setApproveComment] = useState("");
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveAction, setApproveAction] = useState<"Approved" | "Rejected" | "Returned">("Approved");
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    // Print handler - Opens PDF in new tab for proper printing
    const handlePrint = async () => {
        if (!pr) return;

        setIsPdfLoading(true);
        try {
            const response = await fetch(`/api/pr/${pr.id}/pdf`);

            if (!response.ok) {
                throw new Error("Failed to generate PDF");
            }

            // Open PDF in new tab for printing
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("เกิดข้อผิดพลาดในการสร้าง PDF");
        } finally {
            setIsPdfLoading(false);
        }
    };

    // PDF handler - Use Puppeteer API
    const handlePDF = async () => {
        if (!pr) return;

        setIsPdfLoading(true);
        try {
            const response = await fetch(`/api/pr/${pr.id}/pdf`);

            if (!response.ok) {
                throw new Error("Failed to generate PDF");
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${pr.prNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("เกิดข้อผิดพลาดในการสร้าง PDF");
        } finally {
            setIsPdfLoading(false);
        }
    };
    useEffect(() => {
        fetchPR();
    }, [resolvedParams.id]);

    const fetchPR = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/pr/${resolvedParams.id}`);
            const data = await res.json();

            if (data.success) {
                setPr(data.data);
                // Fetch quotations if selfPurchase
                if (data.data.purchaseMethod === "selfPurchase") {
                    fetchQuotations(data.data.id);
                }
            } else {
                alert(data.error || "ไม่พบใบขอซื้อ");
                router.push("/pr");
            }
        } catch (error) {
            console.error("Error fetching PR:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuotations = async (prId: number) => {
        try {
            const res = await fetch(`/api/pr/quotations?prId=${prId}`);
            const data = await res.json();
            if (data.success) {
                setQuotations(data.data);
            }
        } catch (error) {
            console.error("Error fetching quotations:", error);
        }
    };

    const handleSubmit = async () => {
        if (!confirm("ยืนยันการส่งใบขอซื้อเพื่อขออนุมัติ?")) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/pr/${resolvedParams.id}/submit`, {
                method: "POST",
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                fetchPR();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error submitting PR:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/pr/${resolvedParams.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: approveAction,
                    comments: approveComment,
                }),
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                setShowApproveModal(false);
                setApproveComment("");
                fetchPR();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error approving PR:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("ยืนยันการลบใบขอซื้อนี้?")) return;

        try {
            const res = await fetch(`/api/pr/${resolvedParams.id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                router.push("/pr");
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error deleting PR:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!pr) return null;

    const requestTypes = pr.requestType?.split(",").filter(Boolean) || [];

    return (
        <>
            {/* Print Template - Only visible when printing */}
            <div className="hidden print:block">
                <PRPrintTemplate pr={pr} />
            </div>

            {/* Screen Content - Hidden when printing */}
            <div className="space-y-6 print:hidden">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                                {pr.prNumber}
                            </h1>
                            <p className="text-gray-500 text-sm">ใบขอซื้อ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Print & PDF Buttons - Always visible */}
                        <button
                            onClick={handlePrint}
                            className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 print:hidden"
                            title="พิมพ์"
                        >
                            <Printer className="w-4 h-4" />
                            พิมพ์
                        </button>
                        <button
                            onClick={handlePDF}
                            disabled={isPdfLoading}
                            className="btn bg-red-50 hover:bg-red-100 text-red-600 print:hidden"
                            title="บันทึก PDF"
                        >
                            {isPdfLoading ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FileDown className="w-4 h-4" />
                            )}
                            PDF
                        </button>
                        {pr.status === "Draft" && (
                            <>
                                <button
                                    onClick={() => router.push(`/pr/${pr.id}/edit`)}
                                    className="btn btn-secondary"
                                >
                                    <Edit className="w-4 h-4" />
                                    แก้ไข
                                </button>
                                <button onClick={handleDelete} className="btn btn-danger">
                                    <Trash2 className="w-4 h-4" />
                                    ลบ
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                >
                                    <Send className="w-4 h-4" />
                                    ส่งอนุมัติ
                                </button>
                            </>
                        )}
                        {pr.status === "Pending" && (
                            <>
                                <button
                                    onClick={() => {
                                        setApproveAction("Rejected");
                                        setShowApproveModal(true);
                                    }}
                                    className="btn btn-danger"
                                >
                                    <XCircle className="w-4 h-4" />
                                    ไม่อนุมัติ
                                </button>
                                <button
                                    onClick={() => {
                                        setApproveAction("Returned");
                                        setShowApproveModal(true);
                                    }}
                                    className="btn bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    ส่งกลับแก้ไข
                                </button>
                                <button
                                    onClick={() => {
                                        setApproveAction("Approved");
                                        setShowApproveModal(true);
                                    }}
                                    className="btn btn-success"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    อนุมัติ
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress Status Bar - Hidden in print */}
                <div className="print:hidden">
                    <ProgressStatusBar
                        steps={[
                            { step: 1, name: "ผู้ขอ", description: "สร้างใบขอซื้อ" },
                            { step: 2, name: "หัวหน้าแผนก", description: "อนุมัติ" },
                            { step: 3, name: "จัดซื้อ", description: "ตรวจสอบ" },
                            { step: 4, name: "ผู้บริหาร", description: "อนุมัติ" },
                        ]}
                        currentStep={pr.currentStep}
                        status={pr.status}
                        approvals={pr.approvals}
                    />
                </div>

                {/* Printable Content */}
                <div ref={printRef} className="print:p-0">
                    {/* Print Header - Only visible in print */}
                    <div className="hidden print:block print:mb-6">
                        <div className="text-center border-b-2 border-black pb-4 mb-4">
                            <h1 className="text-2xl font-bold">ใบขอซื้อ (Purchase Request)</h1>
                            <p className="text-lg font-semibold mt-2">{pr.prNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Info Card */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลทั่วไป</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            วันที่
                                        </p>
                                        <p className="font-medium">{formatDateThai(pr.requestDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            ผู้ขอ
                                        </p>
                                        <p className="font-medium">{pr.requesterName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Building className="w-4 h-4" />
                                            บริษัท
                                        </p>
                                        <p className="font-medium">{pr.companyName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">สาขา</p>
                                        <p className="font-medium">{pr.branchName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">แผนก</p>
                                        <p className="font-medium">{pr.departmentName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">วันที่ต้องการใช้งาน</p>
                                        <p className="font-medium">
                                            {pr.requiredDate ? formatDateThai(pr.requiredDate) : "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Request Type & Method */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2">วัตถุประสงค์</p>
                                            <div className="flex flex-wrap gap-2">
                                                {requestTypes.map((type) => (
                                                    <span key={type} className="badge bg-blue-100 text-blue-700">
                                                        {type === "newPurchase" && "ซื้อใหม่"}
                                                        {type === "replacement" && "ซื้อทดแทน"}
                                                        {type === "repair" && "ซ่อมแซม"}
                                                        {type === "renewal" && "ต่อสัญญา"}
                                                    </span>
                                                ))}
                                                {requestTypes.length === 0 && "-"}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2">ความต้องการการซื้อ</p>
                                            <span className="badge bg-purple-100 text-purple-700">
                                                {pr.purchaseMethod === "procurementHandle"
                                                    ? "ให้จัดซื้อดำเนินการ"
                                                    : "ดำเนินการซื้อเอง"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    รายการสินค้า/บริการ
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-12">#</th>
                                                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-24">Acct. Code</th>
                                                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">รายการ</th>
                                                <th className="px-3 py-3 text-right text-sm font-semibold text-gray-700 w-20">จำนวน</th>
                                                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 w-16">หน่วย</th>
                                                <th className="px-3 py-3 text-right text-sm font-semibold text-gray-700 w-28">ราคา/หน่วย</th>
                                                <th className="px-3 py-3 text-right text-sm font-semibold text-gray-700 w-28">จำนวนเงิน</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pr.items.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-100">
                                                    <td className="px-3 py-3 text-center text-gray-600">{item.itemNo}</td>
                                                    <td className="px-3 py-3 text-gray-600">{item.itemName || "-"}</td>
                                                    <td className="px-3 py-3 text-gray-800">{item.description}</td>
                                                    <td className="px-3 py-3 text-right text-gray-600">{item.quantity}</td>
                                                    <td className="px-3 py-3 text-gray-600">{item.unit}</td>
                                                    <td className="px-3 py-3 text-right text-gray-600">
                                                        {item.unitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-medium text-gray-800">
                                                        {item.totalPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Remarks */}
                            {pr.remarks && (
                                <div className="card">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                        หมายเหตุ
                                    </h2>
                                    <p className="text-gray-600 whitespace-pre-wrap">{pr.remarks}</p>
                                </div>
                            )}

                            {/* Quotation Documents - Show only for selfPurchase */}
                            {pr.purchaseMethod === "selfPurchase" && quotations.length > 0 && (
                                <div className="card">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-green-600" />
                                        เอกสารใบเสนอราคา
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {quotations.map((q) => (
                                            <div
                                                key={q.id}
                                                className={`p-4 rounded-lg border-2 ${q.isSelected
                                                    ? "border-green-500 bg-green-50"
                                                    : "border-gray-200 bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-gray-600">
                                                        บริษัทที่ {q.vendorNo}
                                                    </span>
                                                    {q.isSelected && (
                                                        <span className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                                            <Star className="w-3 h-3" />
                                                            เจ้าที่ซื้อ
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-medium text-gray-800 mb-2 truncate" title={q.vendorName}>
                                                    {q.vendorName}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500 truncate max-w-[120px]" title={q.fileName}>
                                                        {q.fileName}
                                                    </span>
                                                    <a
                                                        href={`/api/pr/quotations/${q.id}`}
                                                        download
                                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        ดาวน์โหลด
                                                    </a>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {(q.fileSize / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Summary */}
                        <div className="space-y-6">
                            <div className="card sticky top-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">สรุปยอด</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>ราคาก่อน VAT</span>
                                        <span>{pr.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>VAT {pr.vatRate}%</span>
                                        <span>{pr.vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {pr.discountRate > 0 && (
                                        <div className="flex justify-between text-red-500">
                                            <span>ส่วนลด {pr.discountRate}%</span>
                                            <span>-{pr.discountAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    {pr.withholdingTaxRate > 0 && (
                                        <div className="flex justify-between text-orange-500">
                                            <span>หัก ณ ที่จ่าย {pr.withholdingTaxRate}%</span>
                                            <span>-{pr.withholdingTaxAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <hr className="border-gray-200" />
                                    <div className="flex justify-between text-xl font-bold text-gray-800">
                                        <span>รวมทั้งสิ้น</span>
                                        <span className="text-blue-600">
                                            ฿{pr.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {pr.budget > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex justify-between text-gray-600">
                                            <span>งบประมาณที่ขอ</span>
                                            <span>฿{pr.budget.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Approve Modal */}
                {showApproveModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
                        <div className="card max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                {approveAction === "Approved"
                                    ? "อนุมัติใบขอซื้อ"
                                    : approveAction === "Returned"
                                        ? "ส่งกลับให้แก้ไข"
                                        : "ไม่อนุมัติใบขอซื้อ"}
                            </h3>
                            <div className="mb-4">
                                <label className="form-label">
                                    {approveAction === "Returned" ? "หมายเหตุ (กรุณาระบุสิ่งที่ต้องแก้ไข)" : "ความคิดเห็น (ถ้ามี)"}
                                </label>
                                <textarea
                                    value={approveComment}
                                    onChange={(e) => setApproveComment(e.target.value)}
                                    rows={3}
                                    className="form-input"
                                    placeholder={approveAction === "Returned" ? "กรุณาระบุสิ่งที่ต้องแก้ไข..." : "ความคิดเห็นเพิ่มเติม..."}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowApproveModal(false)}
                                    className="btn btn-secondary"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                    className={
                                        approveAction === "Approved"
                                            ? "btn btn-success"
                                            : approveAction === "Returned"
                                                ? "btn bg-amber-500 hover:bg-amber-600 text-white"
                                                : "btn btn-danger"
                                    }
                                >
                                    {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยัน"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
