"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    FileText,
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    Calendar,
    Package,
    Calculator,
    Building2,
    GitBranch,
    Users,
    Sparkles,
    RefreshCw,
    Wrench,
    CalendarCheck,
    Receipt,
} from "lucide-react";
import { QuotationUpload, defaultQuotations, type QuotationVendor } from "@/components/ui/QuotationUpload";

interface PRItem {
    id?: number;
    itemNo: number;
    itemName: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

interface Company {
    id: number;
    code: string;
    name: string;
}

interface Branch {
    id: number;
    companyId: number;
    code: string;
    name: string;
}

interface Department {
    id: number;
    code: string;
    name: string;
}

export default function CreatePRPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user as any;

    const [isSaving, setIsSaving] = useState(false);

    // Form data
    const [companyId, setCompanyId] = useState<number>(user?.companyId || 1);
    const [branchId, setBranchId] = useState<number>(user?.branchId || 1);
    const [departmentId, setDepartmentId] = useState<number>(user?.departmentId || 1);
    const [requestType, setRequestType] = useState<string>("");
    const [purchaseMethod, setPurchaseMethod] = useState<string>("procurementHandle");
    const [requiredDate, setRequiredDate] = useState<string>("");
    const [budget, setBudget] = useState<string>("");
    const [remarks, setRemarks] = useState<string>("");

    // Quotations (for selfPurchase)
    const [quotations, setQuotations] = useState<QuotationVendor[]>(defaultQuotations);

    // VAT & Withholding Tax & Discount
    const [vatRate, setVatRate] = useState<number>(7);
    const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);

    // Default rates from settings (for button options)
    const [defaultVatRate, setDefaultVatRate] = useState<number>(7);
    const [defaultWhtRate, setDefaultWhtRate] = useState<number>(3);

    // Items
    const [items, setItems] = useState<PRItem[]>([
        { itemNo: 1, itemName: "", description: "", quantity: 1, unit: "ชิ้น", unitPrice: 0, totalPrice: 0 },
    ]);

    // Master data
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Fetch master data
    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [compRes, branchRes, deptRes, settingsRes] = await Promise.all([
                fetch("/api/master/companies"),
                fetch("/api/master/branches"),
                fetch("/api/master/departments"),
                fetch("/api/settings"),
            ]);

            const [compData, branchData, deptData, settingsData] = await Promise.all([
                compRes.json(),
                branchRes.json(),
                deptRes.json(),
                settingsRes.json(),
            ]);

            if (compData.success) setCompanies(compData.data);
            if (branchData.success) setBranches(branchData.data);
            if (deptData.success) setDepartments(deptData.data);

            // Apply system settings
            if (settingsData.success && settingsData.data) {
                const settings = settingsData.data;
                if (settings.VAT_RATE) {
                    const vat = parseFloat(settings.VAT_RATE);
                    setDefaultVatRate(vat);
                    setVatRate(vat);
                }
                if (settings.WHT_RATE) {
                    const wht = parseFloat(settings.WHT_RATE);
                    setDefaultWhtRate(wht);
                    // Note: WHT is not selected by default (starts at 0)
                }
            }
        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    };

    // Filter branches by company
    const filteredBranches = branches.filter((b) => b.companyId === companyId);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = subtotal * (vatRate / 100);
    const withholdingTaxAmount = subtotal * (withholdingTaxRate / 100);
    const totalAmount = subtotal + vatAmount - withholdingTaxAmount - discountAmount;

    // Add new item
    const addItem = () => {
        setItems([
            ...items,
            {
                itemNo: items.length + 1,
                itemName: "",
                description: "",
                quantity: 1,
                unit: "ชิ้น",
                unitPrice: 0,
                totalPrice: 0,
            },
        ]);
    };

    // Remove item
    const removeItem = (index: number) => {
        if (items.length === 1) return;
        const newItems = items.filter((_, i) => i !== index);
        newItems.forEach((item, i) => (item.itemNo = i + 1));
        setItems(newItems);
    };

    // Update item
    const updateItem = (index: number, field: keyof PRItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;

        if (field === "quantity" || field === "unitPrice") {
            newItems[index].totalPrice =
                Number(newItems[index].quantity) * Number(newItems[index].unitPrice);
        }

        setItems(newItems);
    };

    // Upload quotation files
    const uploadQuotationFiles = async (prId: number) => {
        const uploadPromises = quotations
            .filter(q => q.file && q.vendorName) // Only upload if file and vendor name exist
            .map(async (q) => {
                const formData = new FormData();
                formData.append("prId", prId.toString());
                formData.append("vendorNo", q.vendorNo.toString());
                formData.append("vendorName", q.vendorName);
                formData.append("file", q.file!);

                const res = await fetch("/api/pr/quotations", {
                    method: "POST",
                    body: formData,
                });
                return res.json();
            });

        return Promise.all(uploadPromises);
    };

    // Save PR (Draft)
    const savePR = async () => {
        // Validation
        if (!requestType) {
            alert("กรุณาเลือกวัตถุประสงค์การจัดซื้อ");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/pr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId,
                    branchId,
                    departmentId,
                    requestType,
                    purchaseMethod,
                    requiredDate: requiredDate || null,
                    budget: parseFloat(budget) || 0,
                    vatRate,
                    withholdingTaxRate,
                    discountAmount,
                    remarks,
                    items,
                }),
            });

            const data = await res.json();
            if (data.success) {
                // If selfPurchase and has quotation files, upload them
                if (purchaseMethod === "selfPurchase") {
                    const hasFiles = quotations.some(q => q.file && q.vendorName);
                    if (hasFiles) {
                        await uploadQuotationFiles(data.data.id);
                    }
                }

                alert(`บันทึกใบขอซื้อสำเร็จ: ${data.data.prNumber}`);
                router.push(`/pr/${data.data.id}`);
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error saving PR:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsSaving(false);
        }
    };

    const requestTypeOptions = [
        { value: "newPurchase", label: "ซื้อใหม่", icon: Sparkles, color: "from-blue-500 to-indigo-600" },
        { value: "replacement", label: "ซื้อทดแทน", icon: RefreshCw, color: "from-emerald-500 to-teal-600" },
        { value: "repair", label: "ซ่อมแซม", icon: Wrench, color: "from-orange-500 to-amber-600" },
        { value: "renewal", label: "ต่อสัญญา", icon: CalendarCheck, color: "from-purple-500 to-pink-600" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span>สร้างใบขอซื้อใหม่</span>
                        </h1>
                        <p className="text-gray-500 mt-1 ml-16">Purchase Request</p>
                    </div>
                </div>

                {/* Save Button - Top Right */}
                <button
                    onClick={savePR}
                    disabled={isSaving}
                    className="btn btn-primary py-3 px-6 text-base font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                >
                    {isSaving ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            กำลังบันทึก...
                        </div>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            บันทึกร่างใบขอซื้อ
                        </>
                    )}
                </button>
            </div>

            {/* Main Form - Single Column */}
            <div className="space-y-6">

                {/* Step 1: Organization Info */}
                <div className="card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            1
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">ข้อมูลองค์กร</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="group">
                            <label className="form-label flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                บริษัท
                            </label>
                            <select
                                value={companyId}
                                onChange={(e) => setCompanyId(parseInt(e.target.value))}
                                className="form-select group-hover:border-indigo-300"
                            >
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="group">
                            <label className="form-label flex items-center gap-2 mb-2">
                                <GitBranch className="w-4 h-4 text-emerald-500" />
                                สาขา
                            </label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(parseInt(e.target.value))}
                                className="form-select group-hover:border-emerald-300"
                            >
                                {filteredBranches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="group">
                            <label className="form-label flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-purple-500" />
                                แผนก
                            </label>
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(parseInt(e.target.value))}
                                className="form-select group-hover:border-purple-300"
                            >
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Step 2: Request Type - Card Selection */}
                <div className="card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-600"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                            2
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">วัตถุประสงค์การจัดซื้อ</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {requestTypeOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = requestType === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setRequestType(option.value)}
                                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-center group ${isSelected
                                        ? `border-transparent bg-gradient-to-br ${option.color} text-white shadow-lg scale-[1.02]`
                                        : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white/60"
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                        </div>
                                    )}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all ${isSelected
                                        ? "bg-white/20"
                                        : `bg-gradient-to-br ${option.color} text-white shadow-md group-hover:scale-110`
                                        }`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className={`font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}>
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Step 3: Purchase Details */}
                <div className="card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-amber-600"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                            3
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">รายละเอียดการจัดซื้อ</h2>
                    </div>

                    {/* Purchase Method */}
                    <div className="mb-6">
                        <label className="form-label mb-3">ความต้องการการซื้อ</label>
                        <div className="flex flex-wrap gap-4">
                            <label className={`flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all ${purchaseMethod === "procurementHandle"
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                : "bg-white/60 border border-gray-200 hover:border-indigo-300"
                                }`}>
                                <input
                                    type="radio"
                                    name="purchaseMethod"
                                    value="procurementHandle"
                                    checked={purchaseMethod === "procurementHandle"}
                                    onChange={(e) => setPurchaseMethod(e.target.value)}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseMethod === "procurementHandle" ? "border-white" : "border-gray-400"
                                    }`}>
                                    {purchaseMethod === "procurementHandle" && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <span className="font-medium">ให้จัดซื้อดำเนินการ</span>
                            </label>

                            <label className={`flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all ${purchaseMethod === "selfPurchase"
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                : "bg-white/60 border border-gray-200 hover:border-indigo-300"
                                }`}>
                                <input
                                    type="radio"
                                    name="purchaseMethod"
                                    value="selfPurchase"
                                    checked={purchaseMethod === "selfPurchase"}
                                    onChange={(e) => setPurchaseMethod(e.target.value)}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseMethod === "selfPurchase" ? "border-white" : "border-gray-400"
                                    }`}>
                                    {purchaseMethod === "selfPurchase" && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <span className="font-medium">ดำเนินการซื้อเอง</span>
                            </label>
                        </div>
                    </div>

                    {/* Date & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="group">
                            <label className="form-label flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                วันที่ต้องการใช้งาน
                            </label>
                            <input
                                type="date"
                                value={requiredDate}
                                onChange={(e) => setRequiredDate(e.target.value)}
                                className="form-input group-hover:border-orange-300"
                            />
                        </div>
                        <div className="group">
                            <label className="form-label flex items-center gap-2 mb-2">
                                <Calculator className="w-4 h-4 text-amber-500" />
                                งบประมาณที่ขอซื้อ (บาท)
                            </label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="0.00"
                                className="form-input group-hover:border-amber-300"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 4: Items */}
                <div className="card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-600"></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                                4
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Package className="w-5 h-5 text-purple-500" />
                                รายการสินค้า/บริการ
                            </h2>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-t-xl text-white">
                        <div className="grid grid-cols-12 gap-2 px-4 py-3">
                            <div className="col-span-1 text-sm font-bold">ลำดับ</div>
                            <div className="col-span-5 text-sm font-bold">ชื่อสินค้า /รายละเอียด</div>
                            <div className="col-span-1 text-sm font-bold text-center">จำนวน</div>
                            <div className="col-span-1 text-sm font-bold text-center">หน่วย</div>
                            <div className="col-span-2 text-sm font-bold text-center">ราคาต่อหน่วย</div>
                            <div className="col-span-2 text-sm font-bold text-right">ราคารวม</div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="border border-gray-200 border-t-0 rounded-b-xl divide-y divide-gray-100">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 px-4 py-4 hover:bg-gray-50/50 transition-colors">
                                {/* ลำดับ */}
                                <div className="col-span-1 flex items-start pt-2">
                                    <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 font-bold text-sm flex items-center justify-center">
                                        {item.itemNo}
                                    </span>
                                </div>

                                {/* ชื่อสินค้า + รายละเอียด */}
                                <div className="col-span-5 space-y-2">
                                    <input
                                        type="text"
                                        value={item.itemName}
                                        onChange={(e) => updateItem(index, "itemName", e.target.value)}
                                        placeholder="ชื่อสินค้า"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                    />
                                    <textarea
                                        value={item.description}
                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                        placeholder="รายละเอียด (กด Shift+Enter เพื่อขึ้นบรรทัดใหม่)"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all resize-none text-gray-500"
                                    />
                                </div>

                                {/* จำนวน */}
                                <div className="col-span-1">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                    />
                                </div>

                                {/* หน่วย */}
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        value={item.unit}
                                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                    />
                                </div>

                                {/* ราคาต่อหน่วย */}
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-right focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                    />
                                </div>

                                {/* ราคารวม + ปุ่มลบ */}
                                <div className="col-span-2 flex items-start justify-end gap-2">
                                    <span className="py-2 font-bold text-gray-800">
                                        {item.totalPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={addItem}
                        className="mt-4 flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-sky-300 text-sky-600 hover:bg-sky-50 rounded-xl transition-all font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มแถวรายการ
                    </button>
                </div>

                {/* Step 5: Quotations (only for selfPurchase) */}
                {purchaseMethod === "selfPurchase" && (
                    <div className="card relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-600"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                5
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-emerald-500" />
                                    เอกสารใบเสนอราคา
                                </h2>
                                <p className="text-sm text-gray-500">กรุณา Upload ใบเสนอราคาจาก 3 บริษัท (1 เจ้าที่ซื้อ + 2 คู่เทียบ)</p>
                            </div>
                        </div>

                        <QuotationUpload
                            quotations={quotations}
                            onChange={setQuotations}
                        />
                    </div>
                )}

                {/* Step: Remarks (Step 5 if procurementHandle, Step 6 if selfPurchase) */}
                <div className="card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {purchaseMethod === "selfPurchase" ? 6 : 5}
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">หมายเหตุเพิ่มเติม</h2>
                    </div>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                        placeholder="ระบุหมายเหตุหรือข้อมูลเพิ่มเติม (ไม่บังคับ)"
                        className="form-input resize-none"
                    />
                </div>

                {/* Step: Summary (Step 6 if procurementHandle, Step 7 if selfPurchase) */}
                <div className="card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-600"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                            {purchaseMethod === "selfPurchase" ? 7 : 6}
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-amber-500" />
                            สรุปยอดเงิน
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* VAT & WHT Controls */}
                        <div className="space-y-4">
                            {/* VAT Selection */}
                            <div>
                                <label className="form-label mb-2">ภาษีมูลค่าเพิ่ม (VAT)</label>
                                <div className="flex gap-2">
                                    {[0, defaultVatRate].map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => setVatRate(rate)}
                                            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all text-sm ${vatRate === rate
                                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            {rate === 0 ? "ไม่มี" : `${rate}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Withholding Tax */}
                            <div>
                                <label className="form-label mb-2">หัก ณ ที่จ่าย</label>
                                <div className="flex gap-2">
                                    {[0, defaultWhtRate].map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => setWithholdingTaxRate(rate)}
                                            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all text-sm ${withholdingTaxRate === rate
                                                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            {rate === 0 ? "ไม่หัก" : `${rate}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="form-label mb-2">ส่วนลด (บาท)</label>
                                <input
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="0.00"
                                    className="form-input text-right font-semibold"
                                />
                            </div>
                        </div>

                        {/* Summary Details */}
                        <div className="space-y-3 text-sm md:col-span-2">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">ราคาก่อน VAT</span>
                                <span className="font-semibold text-gray-800 text-lg">{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                            </div>
                            {vatRate > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">VAT {vatRate}%</span>
                                    <span className="font-semibold text-blue-600 text-lg">+{vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                            )}
                            {withholdingTaxRate > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-orange-600">หัก ณ ที่จ่าย {withholdingTaxRate}%</span>
                                    <span className="font-semibold text-orange-600 text-lg">-{withholdingTaxAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                            )}
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-red-500">ส่วนลด</span>
                                    <span className="font-semibold text-red-500 text-lg">-{discountAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-500 to-purple-600 -mx-4 px-4 rounded-xl mt-4">
                                <span className="text-white text-lg font-semibold">รวมทั้งสิ้น</span>
                                <span className="text-white text-2xl font-bold">฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
