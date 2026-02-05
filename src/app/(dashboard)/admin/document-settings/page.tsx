"use client";

import { useState, useEffect } from "react";
import {
    Hash,
    Save,
    RefreshCw,
    Building2,
    FileText,
    ShoppingCart,
} from "lucide-react";

interface DocumentSetting {
    id: number;
    companyId: number;
    companyName: string;
    companyCode: string;
    documentType: string;
    prefix: string;
    lastNumber: number;
    yearMonth: string;
}

interface Company {
    id: number;
    code: string;
    name: string;
}

const DOCUMENT_TYPES = [
    { value: "PR", label: "ใบขอซื้อ (PR)", icon: FileText, color: "indigo" },
    { value: "PO", label: "ใบสั่งซื้อ (PO)", icon: ShoppingCart, color: "teal" },
];

export default function DocumentSettingsPage() {
    const [settings, setSettings] = useState<DocumentSetting[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for new settings
    const [formData, setFormData] = useState({
        companyId: "",
        documentType: "",
        prefix: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [settingsRes, companiesRes] = await Promise.all([
                fetch("/api/admin/document-settings"),
                fetch("/api/master/companies"),
            ]);

            const [settingsData, companiesData] = await Promise.all([
                settingsRes.json(),
                companiesRes.json(),
            ]);

            if (settingsData.success) setSettings(settingsData.data);
            if (companiesData.success) setCompanies(companiesData.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSetting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyId || !formData.documentType || !formData.prefix) {
            alert("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/document-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId: parseInt(formData.companyId),
                    documentType: formData.documentType,
                    prefix: formData.prefix.toUpperCase(),
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert("เพิ่มการตั้งค่าสำเร็จ");
                fetchData();
                setFormData({ companyId: "", documentType: "", prefix: "" });
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error saving:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetCounter = async (id: number) => {
        if (!confirm("ยืนยันรีเซ็ตตัวนับ? เลขรันจะเริ่มต้นใหม่ที่ 0001")) return;

        try {
            const res = await fetch(`/api/admin/document-settings/${id}/reset`, {
                method: "PUT",
            });

            const data = await res.json();
            if (data.success) {
                alert("รีเซ็ตสำเร็จ");
                fetchData();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error resetting:", error);
            alert("เกิดข้อผิดพลาด");
        }
    };

    // Group settings by company
    const groupedSettings = settings.reduce((acc, setting) => {
        if (!acc[setting.companyId]) {
            acc[setting.companyId] = {
                companyName: setting.companyName,
                companyCode: setting.companyCode,
                settings: [],
            };
        }
        acc[setting.companyId].settings.push(setting);
        return acc;
    }, {} as Record<number, { companyName: string; companyCode: string; settings: DocumentSetting[] }>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Hash className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าเลขเอกสาร</h1>
                    <p className="text-gray-500">Document Number Settings</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">รูปแบบเลขเอกสาร</h3>
                <p className="text-blue-700 text-sm">
                    เลขเอกสารจะอยู่ในรูปแบบ: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">[รหัสบริษัท][ประเภท]YYMM####</code>
                </p>
                <p className="text-blue-600 text-sm mt-1">
                    ตัวอย่าง: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">ABCPR2602001</code> = บริษัท ABC, ใบขอซื้อ, ปี 2026 เดือน 02, เลขที่ 0001
                </p>
            </div>

            {/* Add New Setting */}
            <div className="card border-2 border-purple-200 bg-purple-50/50">
                <h3 className="font-semibold text-gray-800 mb-4">เพิ่มการตั้งค่าใหม่</h3>
                <form onSubmit={handleAddSetting} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="form-label">บริษัท</label>
                        <select
                            value={formData.companyId}
                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                            className="form-select"
                        >
                            <option value="">-- เลือกบริษัท --</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">ประเภทเอกสาร</label>
                        <select
                            value={formData.documentType}
                            onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                            className="form-select"
                        >
                            <option value="">-- เลือกประเภท --</option>
                            {DOCUMENT_TYPES.map((dt) => (
                                <option key={dt.value} value={dt.value}>{dt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Prefix (รหัสนำหน้า)</label>
                        <input
                            type="text"
                            value={formData.prefix}
                            onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                            className="form-input"
                            placeholder="เช่น ABC"
                            maxLength={10}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            เพิ่มการตั้งค่า
                        </button>
                    </div>
                </form>
            </div>

            {/* Current Settings */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">การตั้งค่าปัจจุบัน</h3>

                {isLoading ? (
                    <div className="card flex items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : Object.keys(groupedSettings).length === 0 ? (
                    <div className="card text-center py-12">
                        <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">ยังไม่มีการตั้งค่าเลขเอกสาร</p>
                    </div>
                ) : (
                    Object.entries(groupedSettings).map(([companyId, group]) => (
                        <div key={companyId} className="card">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-gray-800">{group.companyName}</h4>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-mono">
                                    {group.companyCode}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.settings.map((setting) => {
                                    const docType = DOCUMENT_TYPES.find(d => d.value === setting.documentType);
                                    const Icon = docType?.icon || FileText;

                                    return (
                                        <div
                                            key={setting.id}
                                            className={`p-4 rounded-xl border-2 ${setting.documentType === "PR"
                                                    ? "bg-indigo-50/50 border-indigo-200"
                                                    : "bg-teal-50/50 border-teal-200"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-5 h-5 ${setting.documentType === "PR" ? "text-indigo-600" : "text-teal-600"
                                                        }`} />
                                                    <span className="font-semibold text-gray-800">
                                                        {docType?.label || setting.documentType}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleResetCounter(setting.id)}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                    title="รีเซ็ตตัวนับ"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Prefix:</span>
                                                    <span className="font-mono font-semibold">{setting.prefix}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">เดือน/ปี ปัจจุบัน:</span>
                                                    <span className="font-mono">{setting.yearMonth || "-"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">เลขล่าสุด:</span>
                                                    <span className="font-mono font-semibold text-lg">
                                                        {String(setting.lastNumber).padStart(4, "0")}
                                                    </span>
                                                </div>
                                                <div className="pt-2 border-t">
                                                    <span className="text-gray-500">ตัวอย่างเลขถัดไป:</span>
                                                    <p className={`font-mono font-bold text-lg ${setting.documentType === "PR" ? "text-indigo-600" : "text-teal-600"
                                                        }`}>
                                                        {setting.prefix}{setting.documentType}{setting.yearMonth || "YYMM"}
                                                        {String(setting.lastNumber + 1).padStart(4, "0")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
