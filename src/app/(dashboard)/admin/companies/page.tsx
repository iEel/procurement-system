"use client";

import { useState, useEffect } from "react";
import {
    Building2,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Save,
    Power,
    PowerOff,
    Phone,
    MapPin,
    FileText,
    Filter,
    MoreVertical,
    AlertCircle,
} from "lucide-react";

interface Company {
    id: number;
    code: string;
    name: string;
    address?: string;
    taxId?: string;
    phone?: string;
    isActive: boolean;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        address: "",
        taxId: "",
        phone: "",
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/companies");
            const data = await res.json();
            if (data.success) {
                setCompanies(data.data);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.name) {
            alert("กรุณากรอกรหัสและชื่อบริษัท");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingId
                ? `/api/admin/companies/${editingId}`
                : "/api/admin/companies";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                fetchCompanies();
                resetForm();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error saving company:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (company: Company) => {
        setEditingId(company.id);
        setFormData({
            code: company.code,
            name: company.name,
            address: company.address || "",
            taxId: company.taxId || "",
            phone: company.phone || "",
        });
        setShowModal(true);
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        if (!confirm(currentStatus ? "ยืนยันปิดการใช้งาน?" : "ยืนยันเปิดการใช้งาน?")) return;

        try {
            const res = await fetch(`/api/admin/companies/${id}/toggle`, {
                method: "PUT",
            });

            const data = await res.json();
            if (data.success) {
                fetchCompanies();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error toggling company:", error);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("ยืนยันลบบริษัทนี้? การลบจะไม่สามารถกู้คืนได้")) return;

        try {
            const res = await fetch(`/api/admin/companies/${id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (data.success) {
                fetchCompanies();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error deleting company:", error);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const resetForm = () => {
        setFormData({ code: "", name: "", address: "", taxId: "", phone: "" });
        setEditingId(null);
        setShowModal(false);
    };

    const filteredCompanies = companies.filter((c) => {
        const matchesSearch =
            c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && c.isActive) ||
            (filterStatus === "inactive" && !c.isActive);
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: companies.length,
        active: companies.filter((c) => c.isActive).length,
        inactive: companies.filter((c) => !c.isActive).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse-slow">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            จัดการบริษัท
                        </h1>
                        <p className="text-gray-500">Company Management</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    เพิ่มบริษัท
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setFilterStatus("all")}
                    className={`card hover:shadow-lg transition-all ${filterStatus === "all" ? "ring-2 ring-blue-500" : ""}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                            <p className="text-gray-500 text-sm">บริษัททั้งหมด</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterStatus("active")}
                    className={`card hover:shadow-lg transition-all ${filterStatus === "active" ? "ring-2 ring-green-500" : ""}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            <p className="text-gray-500 text-sm">ใช้งานอยู่</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterStatus("inactive")}
                    className={`card hover:shadow-lg transition-all ${filterStatus === "inactive" ? "ring-2 ring-gray-500" : ""}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center">
                            <PowerOff className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
                            <p className="text-gray-500 text-sm">ปิดใช้งาน</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Search & Filter */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหารหัสหรือชื่อบริษัท..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input w-full"
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="form-select"
                            style={{ paddingLeft: '3rem', minWidth: '180px' }}
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="active">ใช้งานอยู่</option>
                            <option value="inactive">ปิดใช้งาน</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Company Cards */}
            {isLoading ? (
                <div className="card flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="card text-center py-16">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบข้อมูลบริษัท</h3>
                    <p className="text-gray-400">
                        {searchTerm ? "ลองค้นหาด้วยคำค้นหาอื่น" : "คลิกปุ่ม \"เพิ่มบริษัท\" เพื่อเริ่มต้น"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            className={`card hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${!company.isActive ? "opacity-70" : ""
                                }`}
                        >
                            {/* Status Ribbon */}
                            <div
                                className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-bl-lg ${company.isActive
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-400 text-white"
                                    }`}
                            >
                                {company.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg ${company.isActive
                                        ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                        : "bg-gradient-to-br from-gray-400 to-gray-500"
                                    }`}>
                                    {company.code.substring(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <p className="font-mono text-sm text-blue-600 font-semibold">{company.code}</p>
                                    <h3 className="font-bold text-gray-800 truncate text-lg">{company.name}</h3>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-sm mb-4">
                                {company.taxId && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{company.taxId}</span>
                                    </div>
                                )}
                                {company.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span>{company.phone}</span>
                                    </div>
                                )}
                                {company.address && (
                                    <div className="flex items-start gap-2 text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <span className={`${expandedCard === company.id ? "" : "line-clamp-2"}`}>
                                            {company.address}
                                        </span>
                                    </div>
                                )}
                                {company.address && company.address.length > 50 && (
                                    <button
                                        onClick={() => setExpandedCard(expandedCard === company.id ? null : company.id)}
                                        className="text-blue-600 text-xs hover:underline ml-6"
                                    >
                                        {expandedCard === company.id ? "ย่อ" : "ดูเพิ่มเติม"}
                                    </button>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => handleEdit(company)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    แก้ไข
                                </button>
                                <button
                                    onClick={() => handleToggleActive(company.id, company.isActive)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm ${company.isActive
                                            ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                            : "bg-green-50 text-green-600 hover:bg-green-100"
                                        }`}
                                >
                                    {company.isActive ? (
                                        <>
                                            <PowerOff className="w-4 h-4" />
                                            ปิด
                                        </>
                                    ) : (
                                        <>
                                            <Power className="w-4 h-4" />
                                            เปิด
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDelete(company.id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                    title="ลบ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={resetForm}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    {editingId ? (
                                        <Edit2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {editingId ? "แก้ไขบริษัท" : "เพิ่มบริษัทใหม่"}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {editingId ? "แก้ไขข้อมูลบริษัท" : "กรอกข้อมูลเพื่อสร้างบริษัทใหม่"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={resetForm}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5">
                                {/* Code & Name */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="form-label">
                                            รหัสบริษัท <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, code: e.target.value.toUpperCase() })
                                            }
                                            className="form-input text-center font-mono font-bold text-lg tracking-wider"
                                            placeholder="ABC"
                                            maxLength={10}
                                            disabled={!!editingId}
                                        />
                                        {editingId && (
                                            <p className="text-xs text-gray-400 mt-1">ไม่สามารถแก้ไขรหัสได้</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="form-label">
                                            ชื่อบริษัท <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="form-input"
                                            placeholder="บริษัท ตัวอย่าง จำกัด"
                                        />
                                    </div>
                                </div>

                                {/* Tax ID & Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">เลขประจำตัวผู้เสียภาษี</label>
                                        <div className="relative">
                                            <FileText className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.taxId}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, taxId: e.target.value.replace(/\D/g, "") })
                                                }
                                                className="form-input"
                                                placeholder="0000000000000"
                                                maxLength={13}
                                                style={{ paddingLeft: '2.75rem' }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">13 หลัก (ไม่ต้องใส่ขีด)</p>
                                    </div>
                                    <div>
                                        <label className="form-label">เบอร์โทรศัพท์</label>
                                        <div className="relative">
                                            <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="form-input"
                                                placeholder="02-XXX-XXXX"
                                                style={{ paddingLeft: '2.75rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="form-label">ที่อยู่</label>
                                    <div className="relative">
                                        <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="form-input"
                                            rows={3}
                                            placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                                            style={{ paddingLeft: '2.75rem' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all font-medium"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    {editingId ? "บันทึกการแก้ไข" : "เพิ่มบริษัท"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
