"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Save,
    Mail,
    FileText,
    AlertCircle,
    CheckCircle,
    Info,
    Building2,
    Calculator,
    Hash,
    Percent,
} from "lucide-react";

interface SystemSetting {
    id: number;
    key: string;
    value: string;
    description: string;
    category: string;
}

const CATEGORIES = [
    { key: "general", label: "ทั่วไป", icon: Building2, color: "indigo" },
    { key: "document", label: "เลขเอกสาร", icon: FileText, color: "purple" },
    { key: "email", label: "อีเมล", icon: Mail, color: "sky" },
    { key: "approval", label: "การอนุมัติ", icon: CheckCircle, color: "emerald" },
];

const DEFAULT_SETTINGS = [
    { key: "CURRENCY", description: "สกุลเงิน", hint: "", category: "general", defaultValue: "THB", inputType: "text" },
    { key: "VAT_RATE", description: "อัตรา VAT", hint: "%", category: "general", defaultValue: "7", inputType: "number" },
    { key: "WHT_RATE", description: "อัตราหัก ณ ที่จ่าย", hint: "%", category: "general", defaultValue: "3", inputType: "number" },
    { key: "DEFAULT_COMPANY_ID", description: "บริษัทเริ่มต้น", hint: "ID", category: "general", defaultValue: "1", inputType: "number" },
    { key: "DEFAULT_BRANCH_ID", description: "สาขาเริ่มต้น", hint: "ID", category: "general", defaultValue: "1", inputType: "number" },
    { key: "PR_NUMBER_FORMAT", description: "รูปแบบเลขใบขอซื้อ", hint: "ตัวอย่าง: PRYYMM####", category: "document", defaultValue: "PRYYMM####", inputType: "text" },
    { key: "PO_NUMBER_FORMAT", description: "รูปแบบเลขใบสั่งซื้อ", hint: "ตัวอย่าง: POYYMM####", category: "document", defaultValue: "POYYMM####", inputType: "text" },
    { key: "SMTP_HOST", description: "SMTP Server", hint: "", category: "email", defaultValue: "", inputType: "text" },
    { key: "SMTP_PORT", description: "SMTP Port", hint: "", category: "email", defaultValue: "587", inputType: "number" },
    { key: "SMTP_USER", description: "SMTP Username", hint: "", category: "email", defaultValue: "", inputType: "text" },
    { key: "SMTP_FROM", description: "อีเมลผู้ส่ง", hint: "", category: "email", defaultValue: "", inputType: "text" },
    { key: "EMAIL_NOTIFICATIONS", description: "ส่งอีเมลแจ้งเตือน", hint: "", category: "email", defaultValue: "true", inputType: "boolean" },
    { key: "APPROVAL_REQUIRED_PR", description: "ต้องอนุมัติใบขอซื้อ", hint: "", category: "approval", defaultValue: "true", inputType: "boolean" },
    { key: "APPROVAL_REQUIRED_PO", description: "ต้องอนุมัติใบสั่งซื้อ", hint: "", category: "approval", defaultValue: "true", inputType: "boolean" },
    { key: "AUTO_APPROVE_UNDER", description: "อนุมัติอัตโนมัติเมื่อยอดไม่เกิน", hint: "บาท (0 = ปิดใช้งาน)", category: "approval", defaultValue: "0", inputType: "number" },
];

export default function SystemSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState("general");
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/system-settings");
            const data = await res.json();
            if (data.success) {
                const settingsMap: Record<string, string> = {};
                data.data.forEach((s: SystemSetting) => {
                    settingsMap[s.key] = s.value;
                });
                DEFAULT_SETTINGS.forEach((ds) => {
                    if (!(ds.key in settingsMap)) {
                        settingsMap[ds.key] = ds.defaultValue;
                    }
                });
                setSettings(settingsMap);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const res = await fetch("/api/admin/system-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings }),
            });

            const data = await res.json();
            if (data.success) {
                setHasChanges(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    const currentCategorySettings = DEFAULT_SETTINGS.filter(
        (s) => s.category === activeCategory
    );

    const renderInput = (setting: typeof DEFAULT_SETTINGS[0]) => {
        const value = settings[setting.key] || "";

        if (setting.inputType === "boolean") {
            return (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleChange(setting.key, "true")}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${value === "true"
                            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        เปิดใช้งาน
                    </button>
                    <button
                        type="button"
                        onClick={() => handleChange(setting.key, "false")}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${value === "false"
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        ปิดใช้งาน
                    </button>
                </div>
            );
        }

        if (setting.inputType === "number") {
            return (
                <div className="relative">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="form-input pr-12"
                        min="0"
                    />
                    {setting.hint && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            {setting.hint}
                        </span>
                    )}
                </div>
            );
        }

        if (setting.inputType === "textarea") {
            return (
                <textarea
                    value={value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="form-input resize-none"
                    rows={3}
                    placeholder={setting.hint || ""}
                />
            );
        }

        return (
            <div className="relative">
                <input
                    type={setting.key.includes("PASSWORD") ? "password" : "text"}
                    value={value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="form-input"
                    placeholder={setting.hint || ""}
                />
            </div>
        );
    };

    const activeTab = CATEGORIES.find(c => c.key === activeCategory);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าระบบ</h1>
                        <p className="text-gray-500">จัดการการตั้งค่าทั้งหมดของระบบ</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={`px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 font-medium ${hasChanges
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    บันทึกการตั้งค่า
                </button>
            </div>

            {/* Status Messages */}
            {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-800 font-medium">บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
                </div>
            )}

            {hasChanges && !saveSuccess && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <div className="card p-2 space-y-1">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveCategory(cat.key)}
                                    className={`w-full px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-all ${isActive
                                        ? `bg-gradient-to-r from-${cat.color}-500 to-${cat.color}-600 text-white shadow-md`
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                    style={isActive ? {
                                        background: cat.color === "indigo" ? "linear-gradient(to right, #6366f1, #8b5cf6)" :
                                            cat.color === "purple" ? "linear-gradient(to right, #a855f7, #d946ef)" :
                                                cat.color === "sky" ? "linear-gradient(to right, #0ea5e9, #06b6d4)" :
                                                    "linear-gradient(to right, #10b981, #059669)"
                                    } : {}}
                                >
                                    <Icon className="w-5 h-5" />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Info Card */}
                    <div className="card mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-700 space-y-1">
                                <p>• การเปลี่ยนแปลงจะมีผลทันทีหลังบันทึก</p>
                                <p>• รหัสผ่านอีเมลต้องตั้งใน .env</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="lg:col-span-3">
                    <div className="card">
                        {/* Category Header */}
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                            {activeTab && (
                                <>
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                        style={{
                                            background: activeTab.color === "indigo" ? "linear-gradient(to right, #6366f1, #8b5cf6)" :
                                                activeTab.color === "purple" ? "linear-gradient(to right, #a855f7, #d946ef)" :
                                                    activeTab.color === "sky" ? "linear-gradient(to right, #0ea5e9, #06b6d4)" :
                                                        "linear-gradient(to right, #10b981, #059669)"
                                        }}
                                    >
                                        <activeTab.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">{activeTab.label}</h2>
                                        <p className="text-sm text-gray-500">
                                            {activeCategory === "general" && "ข้อมูลบริษัทและการตั้งค่าทั่วไป"}
                                            {activeCategory === "document" && "รูปแบบการออกเลขเอกสาร"}
                                            {activeCategory === "email" && "การตั้งค่าส่งอีเมลแจ้งเตือน"}
                                            {activeCategory === "approval" && "การตั้งค่าขั้นตอนการอนุมัติ"}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Settings List */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {currentCategorySettings.map((setting) => (
                                    <div key={setting.key} className="group">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <label className="w-full sm:w-48 flex-shrink-0">
                                                <span className="font-medium text-gray-700">{setting.description}</span>
                                                {setting.hint && setting.inputType !== "number" && (
                                                    <span className="text-xs text-gray-400 ml-2">{setting.hint}</span>
                                                )}
                                            </label>
                                            <div className="flex-1 max-w-md">
                                                {renderInput(setting)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
