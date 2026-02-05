"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    GitBranch,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Save,
    Power,
    PowerOff,
    Building2,
    Phone,
    MapPin,
    Filter,
    Image,
    Upload,
    Trash,
} from "lucide-react";

interface Branch {
    id: number;
    companyId: number;
    companyName: string;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    isActive: boolean;
    headerImage?: string;
    footerImage?: string;
}

interface Company {
    id: number;
    code: string;
    name: string;
}

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCompany, setFilterCompany] = useState<number | "">("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        companyId: "",
        code: "",
        name: "",
        address: "",
        phone: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [branchRes, companyRes] = await Promise.all([
                fetch("/api/admin/branches"),
                fetch("/api/master/companies"),
            ]);

            const [branchData, companyData] = await Promise.all([
                branchRes.json(),
                companyRes.json(),
            ]);

            if (branchData.success) setBranches(branchData.data);
            if (companyData.success) setCompanies(companyData.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyId || !formData.code || !formData.name) {
            alert("กรุณากรอกข้อมูลที่จำเป็น");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingId
                ? `/api/admin/branches/${editingId}`
                : "/api/admin/branches";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    companyId: parseInt(formData.companyId),
                }),
            });

            const data = await res.json();
            if (data.success) {
                fetchData();
                resetForm();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error saving branch:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (branch: Branch) => {
        setEditingId(branch.id);
        setFormData({
            companyId: branch.companyId.toString(),
            code: branch.code,
            name: branch.name,
            address: branch.address || "",
            phone: branch.phone || "",
        });
        setShowModal(true);
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        if (!confirm(currentStatus ? "ยืนยันปิดการใช้งาน?" : "ยืนยันเปิดการใช้งาน?")) return;

        try {
            const res = await fetch(`/api/admin/branches/${id}/toggle`, {
                method: "PUT",
            });

            const data = await res.json();
            if (data.success) {
                fetchData();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error toggling branch:", error);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("ยืนยันลบสาขานี้? การลบจะไม่สามารถกู้คืนได้")) return;

        try {
            const res = await fetch(`/api/admin/branches/${id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (data.success) {
                fetchData();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error deleting branch:", error);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const resetForm = () => {
        setFormData({ companyId: "", code: "", name: "", address: "", phone: "" });
        setEditingId(null);
        setShowModal(false);
    };

    const handleImageManage = (branch: Branch) => {
        setSelectedBranch(branch);
        setShowImageModal(true);
    };

    const handleImageUpload = async (type: "header" | "footer", file: File) => {
        if (!selectedBranch) return;
        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("type", type);
            formData.append("file", file);

            const res = await fetch(`/api/admin/branches/${selectedBranch.id}/images`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                fetchData();
                // Update selected branch locally
                setSelectedBranch(prev => prev ? {
                    ...prev,
                    [type === "header" ? "headerImage" : "footerImage"]: data.data.path
                } : null);
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleImageDelete = async (type: "header" | "footer") => {
        if (!selectedBranch) return;
        if (!confirm(`ยืนยันลบรูป${type === "header" ? "หัวกระดาษ" : "ท้ายกระดาษ"}?`)) return;

        try {
            const res = await fetch(`/api/admin/branches/${selectedBranch.id}/images?type=${type}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (data.success) {
                fetchData();
                setSelectedBranch(prev => prev ? {
                    ...prev,
                    [type === "header" ? "headerImage" : "footerImage"]: undefined
                } : null);
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const filteredBranches = branches.filter((b) => {
        const matchesSearch =
            b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === "" || b.companyId === filterCompany;
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && b.isActive) ||
            (filterStatus === "inactive" && !b.isActive);
        return matchesSearch && matchesCompany && matchesStatus;
    });

    const stats = {
        total: branches.length,
        active: branches.filter((b) => b.isActive).length,
        inactive: branches.filter((b) => !b.isActive).length,
    };

    // Group branches by company for display
    const branchesByCompany = filteredBranches.reduce((acc, branch) => {
        if (!acc[branch.companyId]) {
            acc[branch.companyId] = {
                companyName: branch.companyName,
                branches: [],
            };
        }
        acc[branch.companyId].branches.push(branch);
        return acc;
    }, {} as Record<number, { companyName: string; branches: Branch[] }>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                        <GitBranch className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            จัดการสาขา
                        </h1>
                        <p className="text-gray-500">Branch Management</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    เพิ่มสาขา
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setFilterStatus("all")}
                    className={`card hover:shadow-lg transition-all ${filterStatus === "all" ? "ring-2 ring-emerald-500" : ""}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                            <GitBranch className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                            <p className="text-gray-500 text-sm">สาขาทั้งหมด</p>
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

            {/* Search & Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-1">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาสาขา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input w-full"
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                    <div className="relative">
                        <Building2 className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value ? parseInt(e.target.value) : "")}
                            className="form-select w-full"
                            style={{ paddingLeft: '3rem' }}
                        >
                            <option value="">ทุกบริษัท</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <Filter className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="form-select w-full"
                            style={{ paddingLeft: '3rem' }}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="active">ใช้งานอยู่</option>
                            <option value="inactive">ปิดใช้งาน</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Branch Cards */}
            {isLoading ? (
                <div className="card flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="card text-center py-16">
                    <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบข้อมูลสาขา</h3>
                    <p className="text-gray-400">
                        {searchTerm || filterCompany ? "ลองปรับเงื่อนไขการค้นหา" : "คลิกปุ่ม \"เพิ่มสาขา\" เพื่อเริ่มต้น"}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(branchesByCompany).map(([companyId, group]) => (
                        <div key={companyId}>
                            {/* Company Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{group.companyName}</h3>
                                    <p className="text-sm text-gray-500">{group.branches.length} สาขา</p>
                                </div>
                            </div>

                            {/* Branch Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-0 md:ml-13">
                                {group.branches.map((branch) => (
                                    <div
                                        key={branch.id}
                                        className={`card hover:shadow-xl transition-all duration-300 relative overflow-hidden border-l-4 ${branch.isActive
                                            ? "border-l-emerald-500"
                                            : "border-l-gray-300 opacity-70"
                                            }`}
                                    >
                                        {/* Status Badge */}
                                        <div
                                            className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-bl-lg ${branch.isActive
                                                ? "bg-emerald-500 text-white"
                                                : "bg-gray-400 text-white"
                                                }`}
                                        >
                                            {branch.isActive ? "ใช้งาน" : "ปิด"}
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg ${branch.isActive
                                                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                                : "bg-gradient-to-br from-gray-400 to-gray-500"
                                                }`}>
                                                {branch.code.substring(0, 2)}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <p className="font-mono text-sm text-emerald-600 font-semibold">{branch.code}</p>
                                                <h4 className="font-bold text-gray-800 truncate">{branch.name}</h4>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm mb-4">
                                            {branch.phone && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span>{branch.phone}</span>
                                                </div>
                                            )}
                                            {branch.address && (
                                                <div className="flex items-start gap-2 text-gray-600">
                                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span className={`${expandedCard === branch.id ? "" : "line-clamp-2"}`}>
                                                        {branch.address}
                                                    </span>
                                                </div>
                                            )}
                                            {branch.address && branch.address.length > 40 && (
                                                <button
                                                    onClick={() => setExpandedCard(expandedCard === branch.id ? null : branch.id)}
                                                    className="text-emerald-600 text-xs hover:underline ml-6"
                                                >
                                                    {expandedCard === branch.id ? "ย่อ" : "ดูเพิ่มเติม"}
                                                </button>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleEdit(branch)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all font-medium text-sm"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => handleImageManage(branch)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm"
                                            >
                                                <Image className="w-4 h-4" />
                                                รูป
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(branch.id, branch.isActive)}
                                                className={`p-2 rounded-lg transition-all ${branch.isActive
                                                    ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                                                    }`}
                                                title={branch.isActive ? "ปิด" : "เปิด"}
                                            >
                                                {branch.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(branch.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                    {editingId ? (
                                        <Edit2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {editingId ? "แก้ไขสาขา" : "เพิ่มสาขาใหม่"}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {editingId ? "แก้ไขข้อมูลสาขา" : "กรอกข้อมูลเพื่อสร้างสาขาใหม่"}
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
                                {/* Company Selection */}
                                <div>
                                    <label className="form-label">
                                        บริษัท <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select
                                            value={formData.companyId}
                                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                            className="form-select w-full"
                                            style={{ paddingLeft: '2.75rem' }}
                                        >
                                            <option value="">-- เลือกบริษัท --</option>
                                            {companies.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Code & Name */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="form-label">
                                            รหัสสาขา <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, code: e.target.value.toUpperCase() })
                                            }
                                            className="form-input text-center font-mono font-bold text-lg tracking-wider"
                                            placeholder="HQ"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="form-label">
                                            ชื่อสาขา <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="form-input"
                                            placeholder="สำนักงานใหญ่"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
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
                                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    {editingId ? "บันทึกการแก้ไข" : "เพิ่มสาขา"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Image Modal */}
            {showImageModal && selectedBranch && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowImageModal(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <Image className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        จัดการรูปหัว/ท้ายกระดาษ
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {selectedBranch.name} ({selectedBranch.code})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Header Image */}
                            <div className="bg-gray-50 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Upload className="w-4 h-4 text-blue-600" />
                                        </div>
                                        รูปหัวกระดาษ (Header)
                                    </h3>
                                    {selectedBranch.headerImage && (
                                        <button
                                            onClick={() => handleImageDelete("header")}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm flex items-center gap-1"
                                        >
                                            <Trash className="w-4 h-4" />
                                            ลบ
                                        </button>
                                    )}
                                </div>
                                {selectedBranch.headerImage ? (
                                    <div className="relative">
                                        <img
                                            src={selectedBranch.headerImage}
                                            alt="Header"
                                            className="w-full rounded-lg border border-gray-200"
                                        />
                                        <p className="text-xs text-gray-500 mt-2 text-center">รูปปัจจุบัน</p>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                        <p className="text-gray-600 font-medium">คลิกเพื่ออัพโหลดรูปหัวกระดาษ</p>
                                        <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP (ขนาดแนะนำ 2480 x 300-400 px)</p>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload("header", file);
                                            }}
                                        />
                                    </label>
                                )}
                                {selectedBranch.headerImage && (
                                    <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all cursor-pointer text-sm font-medium">
                                        <Upload className="w-4 h-4" />
                                        เปลี่ยนรูป
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload("header", file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Footer Image */}
                            <div className="bg-gray-50 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                            <Upload className="w-4 h-4 text-teal-600" />
                                        </div>
                                        รูปท้ายกระดาษ (Footer)
                                    </h3>
                                    {selectedBranch.footerImage && (
                                        <button
                                            onClick={() => handleImageDelete("footer")}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm flex items-center gap-1"
                                        >
                                            <Trash className="w-4 h-4" />
                                            ลบ
                                        </button>
                                    )}
                                </div>
                                {selectedBranch.footerImage ? (
                                    <div className="relative">
                                        <img
                                            src={selectedBranch.footerImage}
                                            alt="Footer"
                                            className="w-full rounded-lg border border-gray-200"
                                        />
                                        <p className="text-xs text-gray-500 mt-2 text-center">รูปปัจจุบัน</p>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all">
                                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                        <p className="text-gray-600 font-medium">คลิกเพื่ออัพโหลดรูปท้ายกระดาษ</p>
                                        <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP (ขนาดแนะนำ 2480 x 200-300 px)</p>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload("footer", file);
                                            }}
                                        />
                                    </label>
                                )}
                                {selectedBranch.footerImage && (
                                    <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all cursor-pointer text-sm font-medium">
                                        <Upload className="w-4 h-4" />
                                        เปลี่ยนรูป
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload("footer", file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>

                            {isUploadingImage && (
                                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-xl p-6 flex items-center gap-3">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span>กำลังอัพโหลด...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t flex justify-end">
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

