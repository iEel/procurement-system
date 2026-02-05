"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingCart,
    ArrowLeft,
    Save,
    Building,
    Truck,
    CreditCard,
    Package,
    Calendar,
    MapPin,
    Hash,
} from "lucide-react";

interface POItem {
    id: number;
    itemNo: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

interface PODetail {
    id: number;
    poNumber: string;
    prNumber: string;
    prId: number;
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
    items: POItem[];
}

export default function POEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [po, setPo] = useState<PODetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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

    useEffect(() => {
        fetchPO();
    }, [resolvedParams.id]);

    const fetchPO = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/po/${resolvedParams.id}`);
            const data = await res.json();

            if (data.success) {
                const poData = data.data;
                setPo(poData);

                // Populate form fields
                setVendorName(poData.vendorName || "");
                setVendorAddress(poData.vendorAddress || "");
                setVendorTaxId(poData.vendorTaxId || "");
                setQuotationNo(poData.quotationNo || "");
                setDeliveryDate(poData.deliveryDate ? poData.deliveryDate.split("T")[0] : "");
                setDeliveryPlace(poData.deliveryPlace || "");
                setPaymentTerm(poData.paymentTerm || "เงินสด");
                setRemarks(poData.remarks || "");
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

    const handleSave = async () => {
        if (!vendorName.trim()) {
            alert("กรุณากรอกชื่อบริษัทผู้ขาย");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/po/${resolvedParams.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vendorName,
                    vendorAddress,
                    vendorTaxId,
                    quotationNo,
                    deliveryDate: deliveryDate || null,
                    deliveryPlace,
                    paymentTerm,
                    remarks,
                    items: po?.items || [],
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                router.push(`/po/${resolvedParams.id}`);
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error updating PO:", error);
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

    if (!po) return null;

    if (po.status !== "Draft") {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">ไม่สามารถแก้ไขได้ เนื่องจากใบสั่งซื้อไม่ได้อยู่ในสถานะ Draft</p>
                <button
                    onClick={() => router.push(`/po/${resolvedParams.id}`)}
                    className="btn btn-primary mt-4"
                >
                    กลับไปหน้ารายละเอียด
                </button>
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
                            แก้ไขใบสั่งซื้อ {po.poNumber}
                        </h1>
                        <p className="text-gray-500 mt-1">Edit Purchase Order</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Vendor Info Card */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                <Building className="w-4 h-4 text-teal-600" />
                            </div>
                            <h2 className="font-semibold text-gray-800">ข้อมูลผู้ขาย</h2>
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
                            <h2 className="font-semibold text-gray-800">ข้อมูลการส่งมอบ</h2>
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
                                </select>
                            </div>
                            <div className="md:col-span-2">
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
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-purple-600" />
                            </div>
                            <h2 className="font-semibold text-gray-800">รายการสินค้า</h2>
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
                                    {po.items.map((item) => (
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

                {/* Right Column - Summary */}
                <div className="space-y-6">
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
                                    <span>ส่วนลด</span>
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
        </div>
    );
}
