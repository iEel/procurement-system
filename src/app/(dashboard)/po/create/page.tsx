"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingCart,
    ArrowLeft,
    Save,
    Building,
    FileText,
    Truck,
    CreditCard,
    Package,
    Calendar,
    MapPin,
    Hash,
    Plus,
    Trash2,
    Percent,
    Banknote,
} from "lucide-react";
import { formatDateThai } from "@/lib/timezone";

interface ApprovedPR {
    id: number;
    prNumber: string;
    requestDate: string;
    totalAmount: number;
    requesterName: string;
    companyName: string;
    branchName: string;
    departmentName: string;
    remarks: string;
}

interface PRItem {
    id: number;
    itemNo: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

interface PaymentInstallment {
    id: number;
    type: 'percent' | 'amount';
    value: number;
    condition: string;
}

export default function POCreatePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [approvedPRs, setApprovedPRs] = useState<ApprovedPR[]>([]);
    const [selectedPR, setSelectedPR] = useState<ApprovedPR | null>(null);
    const [prItems, setPRItems] = useState<PRItem[]>([]);

    // Vendor Info
    const [vendorName, setVendorName] = useState("");
    const [vendorAddress, setVendorAddress] = useState("");
    const [vendorTaxId, setVendorTaxId] = useState("");

    // PO Details
    const [quotationNo, setQuotationNo] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliveryPlace, setDeliveryPlace] = useState("");
    const [paymentTerm, setPaymentTerm] = useState("เงินสด");
    const [remarks, setRemarks] = useState("");

    // Payment Installments
    const [paymentInstallments, setPaymentInstallments] = useState<PaymentInstallment[]>([
        { id: 1, type: 'percent', value: 50, condition: 'หลังยืนยันใบเสนอราคา' },
        { id: 2, type: 'percent', value: 50, condition: 'หลังส่งมอบงาน' },
    ]);

    const addInstallment = () => {
        const newId = Math.max(...paymentInstallments.map(p => p.id), 0) + 1;
        setPaymentInstallments([...paymentInstallments, {
            id: newId,
            type: 'percent',
            value: 0,
            condition: '',
        }]);
    };

    const removeInstallment = (id: number) => {
        if (paymentInstallments.length <= 2) return;
        setPaymentInstallments(paymentInstallments.filter(p => p.id !== id));
    };

    const updateInstallment = (id: number, field: keyof PaymentInstallment, value: any) => {
        setPaymentInstallments(paymentInstallments.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const getTotalInstallmentPercent = () => {
        return paymentInstallments
            .filter(p => p.type === 'percent')
            .reduce((sum, p) => sum + p.value, 0);
    };

    const getTotalInstallmentAmount = () => {
        return paymentInstallments
            .filter(p => p.type === 'amount')
            .reduce((sum, p) => sum + p.value, 0);
    };

    useEffect(() => {
        fetchApprovedPRs();
    }, []);

    const fetchApprovedPRs = async () => {
        try {
            const res = await fetch("/api/po/approved-prs");
            const data = await res.json();
            if (data.success) {
                setApprovedPRs(data.data);
            }
        } catch (error) {
            console.error("Error fetching approved PRs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPR = async (pr: ApprovedPR) => {
        setSelectedPR(pr);
        setRemarks(pr.remarks || "");

        // Fetch PR items
        try {
            const res = await fetch(`/api/pr/${pr.id}`);
            const data = await res.json();
            if (data.success) {
                setPRItems(data.data.items || []);
            }
        } catch (error) {
            console.error("Error fetching PR items:", error);
        }
    };

    const handleSave = async () => {
        if (!selectedPR) {
            alert("กรุณาเลือกใบขอซื้อ");
            return;
        }

        if (!vendorName.trim()) {
            alert("กรุณากรอกชื่อบริษัทผู้ขาย");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/po", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prId: selectedPR.id,
                    vendorName,
                    vendorAddress,
                    vendorTaxId,
                    quotationNo,
                    deliveryDate: deliveryDate || null,
                    deliveryPlace,
                    paymentTerm,
                    remarks,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                router.push(`/po/${data.data.id}`);
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error creating PO:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-white" />
                            </div>
                            สร้างใบสั่งซื้อใหม่
                        </h1>
                        <p className="text-gray-500 mt-1">Create New Purchase Order</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !selectedPR}
                    className="btn btn-primary bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Select PR */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Select PR Card */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h2 className="font-semibold text-gray-800">1. เลือกใบขอซื้อ</h2>
                        </div>

                        {approvedPRs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p>ไม่มีใบขอซื้อที่พร้อมสร้าง PO</p>
                                <p className="text-sm mt-1">กรุณาอนุมัติ PR ก่อน</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {approvedPRs.map((pr) => (
                                    <div
                                        key={pr.id}
                                        onClick={() => handleSelectPR(pr)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPR?.id === pr.id
                                            ? "border-teal-500 bg-teal-50"
                                            : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-indigo-600">{pr.prNumber}</span>
                                            <span className="text-sm font-bold text-gray-800">
                                                ฿{pr.totalAmount?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{pr.companyName}</p>
                                        <p className="text-xs text-gray-500">{formatDateThai(pr.requestDate)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected PR Summary */}
                    {selectedPR && (
                        <div className="card bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
                            <h3 className="font-semibold text-gray-800 mb-3">ข้อมูล PR ที่เลือก</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">เลขที่ PR:</span>
                                    <span className="font-bold text-indigo-600">{selectedPR.prNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">บริษัท:</span>
                                    <span className="font-medium">{selectedPR.companyName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">สาขา:</span>
                                    <span>{selectedPR.branchName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ผู้ขอ:</span>
                                    <span>{selectedPR.requesterName}</span>
                                </div>
                                <hr className="border-teal-200" />
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ยอดรวม:</span>
                                    <span className="font-bold text-xl text-teal-600">
                                        ฿{selectedPR.totalAmount?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Vendor Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Vendor Info Card */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                <Building className="w-4 h-4 text-teal-600" />
                            </div>
                            <h2 className="font-semibold text-gray-800">2. ข้อมูลผู้ขาย</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="form-label">ชื่อบริษัทผู้ขาย *</label>
                                <input
                                    type="text"
                                    value={vendorName}
                                    onChange={(e) => setVendorName(e.target.value)}
                                    className="form-input"
                                    placeholder="บริษัท ABC จำกัด"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label">ที่อยู่</label>
                                <textarea
                                    value={vendorAddress}
                                    onChange={(e) => setVendorAddress(e.target.value)}
                                    rows={2}
                                    className="form-input"
                                    placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                                />
                            </div>
                            <div>
                                <label className="form-label">เลขประจำตัวผู้เสียภาษี</label>
                                <input
                                    type="text"
                                    value={vendorTaxId}
                                    onChange={(e) => setVendorTaxId(e.target.value)}
                                    className="form-input"
                                    placeholder="0123456789012"
                                />
                            </div>
                            <div>
                                <label className="form-label">เลขที่ใบเสนอราคา (REF NO.)</label>
                                <input
                                    type="text"
                                    value={quotationNo}
                                    onChange={(e) => setQuotationNo(e.target.value)}
                                    className="form-input"
                                    placeholder="QT-2024-001"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info Card */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Truck className="w-4 h-4 text-orange-600" />
                            </div>
                            <h2 className="font-semibold text-gray-800">3. ข้อมูลการส่งมอบ</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">วันที่ส่งมอบ</label>
                                <input
                                    type="date"
                                    value={deliveryDate}
                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">เงื่อนไขการชำระเงิน</label>
                                <select
                                    value={paymentTerm}
                                    onChange={(e) => setPaymentTerm(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="เงินสด">เงินสด</option>
                                    <option value="เครดิต 7 วัน">เครดิต 7 วัน</option>
                                    <option value="เครดิต 15 วัน">เครดิต 15 วัน</option>
                                    <option value="เครดิต 30 วัน">เครดิต 30 วัน</option>
                                    <option value="เครดิต 45 วัน">เครดิต 45 วัน</option>
                                    <option value="เครดิต 60 วัน">เครดิต 60 วัน</option>
                                    <option value="เครดิต 90 วัน">เครดิต 90 วัน</option>
                                    <option value="แบ่งชำระ">แบ่งชำระ</option>
                                </select>
                            </div>

                            {/* Payment Installments UI */}
                            {paymentTerm === "แบ่งชำระ" && (
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="form-label flex items-center gap-2 mb-0">
                                            <CreditCard className="w-4 h-4 text-blue-500" />
                                            รายละเอียดการแบ่งชำระ
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addInstallment}
                                            className="text-sm px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            เพิ่มงวด
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {paymentInstallments.map((installment, index) => (
                                            <div
                                                key={installment.id}
                                                className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {index + 1}
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {/* Type Selection */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateInstallment(installment.id, 'type', 'percent')}
                                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${installment.type === 'percent'
                                                                    ? 'bg-blue-500 text-white shadow-md'
                                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                                                                }`}
                                                        >
                                                            <Percent className="w-4 h-4" />
                                                            %
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateInstallment(installment.id, 'type', 'amount')}
                                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${installment.type === 'amount'
                                                                    ? 'bg-green-500 text-white shadow-md'
                                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
                                                                }`}
                                                        >
                                                            <Banknote className="w-4 h-4" />
                                                            บาท
                                                        </button>
                                                    </div>

                                                    {/* Value Input */}
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={installment.value}
                                                            onChange={(e) => updateInstallment(installment.id, 'value', parseFloat(e.target.value) || 0)}
                                                            placeholder="0"
                                                            className="form-input text-right pr-10"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                            {installment.type === 'percent' ? '%' : '฿'}
                                                        </span>
                                                    </div>

                                                    {/* Condition Input */}
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={installment.condition}
                                                            onChange={(e) => updateInstallment(installment.id, 'condition', e.target.value)}
                                                            placeholder="เงื่อนไขการจ่าย..."
                                                            className="form-input flex-1"
                                                        />
                                                        {paymentInstallments.length > 2 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeInstallment(installment.id)}
                                                                className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Summary */}
                                    <div className="flex flex-wrap gap-4 p-3 bg-blue-50 rounded-lg text-sm">
                                        {getTotalInstallmentPercent() > 0 && (
                                            <span className={`font-medium ${getTotalInstallmentPercent() === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                                                รวม: {getTotalInstallmentPercent()}% {getTotalInstallmentPercent() === 100 ? '✓' : '(ควรเท่ากับ 100%)'}
                                            </span>
                                        )}
                                        {getTotalInstallmentAmount() > 0 && (
                                            <span className="font-medium text-blue-600">
                                                รวมยอดคงที่: ฿{getTotalInstallmentAmount().toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={paymentTerm === "แบ่งชำระ" ? "" : "md:col-span-2"}>
                                <label className="form-label">สถานที่ส่งมอบ</label>
                                <textarea
                                    value={deliveryPlace}
                                    onChange={(e) => setDeliveryPlace(e.target.value)}
                                    rows={2}
                                    className="form-input"
                                    placeholder="ที่อยู่ในการส่งมอบสินค้า..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items Preview */}
                    {prItems.length > 0 && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-purple-600" />
                                </div>
                                <h2 className="font-semibold text-gray-800">รายการสินค้า (จาก PR)</h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-3 py-2 text-left text-gray-600">#</th>
                                            <th className="px-3 py-2 text-left text-gray-600">รายการ</th>
                                            <th className="px-3 py-2 text-right text-gray-600">จำนวน</th>
                                            <th className="px-3 py-2 text-left text-gray-600">หน่วย</th>
                                            <th className="px-3 py-2 text-right text-gray-600">ราคา/หน่วย</th>
                                            <th className="px-3 py-2 text-right text-gray-600">รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prItems.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="px-3 py-2 text-gray-600">{item.itemNo}</td>
                                                <td className="px-3 py-2 text-gray-800">{item.description}</td>
                                                <td className="px-3 py-2 text-right text-gray-600">{item.quantity}</td>
                                                <td className="px-3 py-2 text-gray-600">{item.unit}</td>
                                                <td className="px-3 py-2 text-right text-gray-600">
                                                    {item.unitPrice?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium text-gray-800">
                                                    {item.totalPrice?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Remarks */}
                    <div className="card">
                        <label className="form-label">หมายเหตุ</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            className="form-input"
                            placeholder="หมายเหตุเพิ่มเติม..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
