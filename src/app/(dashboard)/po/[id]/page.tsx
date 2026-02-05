"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShoppingCart,
    ArrowLeft,
    Send,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Calendar,
    Package,
    Building,
    FileText,
    Truck,
    CreditCard,
    Hash,
    MapPin,
    RotateCcw,
} from "lucide-react";
import { formatDateThai } from "@/lib/timezone";
import ProgressStatusBar from "@/components/ui/ProgressStatusBar";

interface POItem {
    id: number;
    itemNo: number;
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

interface PODetail {
    id: number;
    poNumber: string;
    prNumber: string;
    prId: number;
    issueDate: string;
    companyId: number;
    companyName: string;
    companyCode: string;
    branchId: number;
    branchName: string;
    branchCode: string;
    vendorName: string;
    vendorAddress: string;
    vendorTaxId: string;
    quotationNo: string;
    deliveryDate: string | null;
    deliveryPlace: string;
    paymentTerm: string;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    discountRate: number;
    discountAmount: number;
    grandTotal: number;
    remarks: string;
    status: string;
    currentStep: number;
    items: POItem[];
    approvals: Approval[];
}

export default function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [po, setPo] = useState<PODetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approveComment, setApproveComment] = useState("");
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveAction, setApproveAction] = useState<"Approved" | "Rejected" | "Returned">("Approved");

    useEffect(() => {
        fetchPO();
    }, [resolvedParams.id]);

    const fetchPO = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/po/${resolvedParams.id}`);
            const data = await res.json();

            if (data.success) {
                setPo(data.data);
            } else {
                alert(data.error || "ไม่พบใบสั่งซื้อ");
                router.push("/po");
            }
        } catch (error) {
            console.error("Error fetching PO:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!confirm("ยืนยันการส่งใบสั่งซื้อเพื่อขออนุมัติ?")) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/po/${resolvedParams.id}/submit`, {
                method: "POST",
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                fetchPO();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error submitting PO:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/po/${resolvedParams.id}/approve`, {
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
                fetchPO();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error approving PO:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("ยืนยันการลบใบสั่งซื้อนี้?")) return;

        try {
            const res = await fetch(`/api/po/${resolvedParams.id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                router.push("/po");
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error deleting PO:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!po) return null;

    return (
        <div className="space-y-6">
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
                            <ShoppingCart className="w-6 h-6 text-teal-600" />
                            {po.poNumber}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            ใบสั่งซื้อ | อ้างอิง PR:
                            <Link href={`/pr/${po.prId}`} className="text-indigo-600 hover:underline ml-1">
                                {po.prNumber}
                            </Link>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {po.status === "Draft" && (
                        <>
                            <button
                                onClick={() => router.push(`/po/${po.id}/edit`)}
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
                                className="btn btn-primary bg-gradient-to-r from-teal-500 to-emerald-600"
                            >
                                <Send className="w-4 h-4" />
                                ส่งอนุมัติ
                            </button>
                        </>
                    )}
                    {po.status === "Pending" && (
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

            {/* Progress Status Bar */}
            <ProgressStatusBar
                steps={[
                    { step: 1, name: "พนักงานจัดซื้อ", description: "สร้างใบสั่งซื้อ" },
                    { step: 2, name: "หัวหน้าจัดซื้อ", description: "อนุมัติ" },
                    { step: 3, name: "ผู้บริหาร", description: "อนุมัติ" },
                ]}
                currentStep={po.currentStep}
                status={po.status}
                approvals={po.approvals}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Vendor Info Card */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                <Building className="w-4 h-4 text-teal-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">ข้อมูลผู้ขาย</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <p className="text-sm text-gray-500">ชื่อบริษัท</p>
                                <p className="font-medium text-gray-800">{po.vendorName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">เลขประจำตัวผู้เสียภาษี</p>
                                <p className="font-medium text-gray-800">{po.vendorTaxId || "-"}</p>
                            </div>
                            <div className="col-span-3">
                                <p className="text-sm text-gray-500">ที่อยู่</p>
                                <p className="font-medium text-gray-800">{po.vendorAddress || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* PO Info Card */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Truck className="w-4 h-4 text-orange-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">ข้อมูลการส่งมอบ</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Hash className="w-4 h-4" />
                                    เลขที่ใบเสนอราคา
                                </p>
                                <p className="font-medium">{po.quotationNo || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    วันที่ออก PO
                                </p>
                                <p className="font-medium">{formatDateThai(po.issueDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    วันที่ส่งมอบ
                                </p>
                                <p className="font-medium">{po.deliveryDate ? formatDateThai(po.deliveryDate) : "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <CreditCard className="w-4 h-4" />
                                    เงื่อนไขการชำระเงิน
                                </p>
                                <p className="font-medium">{po.paymentTerm || "-"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    สถานที่ส่งมอบ
                                </p>
                                <p className="font-medium">{po.deliveryPlace || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-purple-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">รายการสินค้า</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">รายการ</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">จำนวน</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">หน่วย</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">ราคา/หน่วย</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-4 py-3 text-gray-600">{item.itemNo}</td>
                                            <td className="px-4 py-3 text-gray-800">{item.description}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {item.unitPrice?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                {item.totalPrice?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Remarks */}
                    {po.remarks && (
                        <div className="card">
                            <h3 className="font-semibold text-gray-800 mb-2">หมายเหตุ</h3>
                            <p className="text-gray-600">{po.remarks}</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    {/* Company Info */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Building className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h2 className="font-semibold text-gray-800">ข้อมูลบริษัท</h2>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">บริษัท</p>
                                <p className="font-medium text-gray-800">{po.companyName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">สาขา</p>
                                <p className="font-medium text-gray-800">{po.branchName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="card bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
                        <h3 className="font-semibold text-gray-800 mb-4">สรุปยอด</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ยอดรวมก่อน VAT</span>
                                <span className="font-medium">
                                    ฿{po.subtotal?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {po.discountAmount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>ส่วนลด ({po.discountRate}%)</span>
                                    <span>-฿{po.discountAmount?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">VAT ({po.vatRate}%)</span>
                                <span className="font-medium">
                                    ฿{po.vatAmount?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <hr className="border-teal-200" />
                            <div className="flex justify-between">
                                <span className="font-bold text-gray-800">ยอดรวมสุทธิ</span>
                                <span className="font-bold text-2xl text-teal-600">
                                    ฿{po.grandTotal?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            {approveAction === "Approved"
                                ? "อนุมัติใบสั่งซื้อ"
                                : approveAction === "Returned"
                                    ? "ส่งกลับให้แก้ไข"
                                    : "ไม่อนุมัติใบสั่งซื้อ"}
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
    );
}
