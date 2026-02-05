"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Save,
    Key,
    Building2,
    Shield,
    CheckCircle,
    XCircle,
    Upload,
    PenLine,
} from "lucide-react";

interface User {
    id: number;
    employeeId: string;
    name: string;
    email: string | null;
    companyId: number | null;
    branchId: number | null;
    departmentId: number | null;
    role: string;
    managerId: number | null;
    isADUser: boolean;
    status: string;
    signatureImage: string | null;
    companyName: string | null;
    branchName: string | null;
    departmentName: string | null;
    managerName: string | null;
}

interface Company {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
    companyId: number;
}

interface Department {
    id: number;
    name: string;
    companyId: number;
}

const ROLES = [
    { value: "employee", label: "พนักงาน" },
    { value: "manager", label: "หัวหน้าแผนก" },
    { value: "procurement", label: "เจ้าหน้าที่จัดซื้อ" },
    { value: "procurement_manager", label: "หัวหน้าจัดซื้อ" },
    { value: "executive", label: "ผู้บริหาร" },
    { value: "admin", label: "ผู้ดูแลระบบ" },
];

const STATUS_OPTIONS = [
    { value: "Active", label: "ใช้งาน" },
    { value: "Inactive", label: "ปิดการใช้งาน" },
];

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form state
    const [form, setForm] = useState({
        employeeId: "",
        name: "",
        email: "",
        companyId: "",
        branchId: "",
        departmentId: "",
        role: "employee",
        managerId: "",
        status: "Active",
        password: "",
        signatureImage: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, companiesRes, branchesRes, deptsRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/admin/companies"),
                fetch("/api/master/branches"),
                fetch("/api/master/departments"),
            ]);

            const [usersData, companiesData, branchesData, deptsData] = await Promise.all([
                usersRes.json(),
                companiesRes.json(),
                branchesRes.json(),
                deptsRes.json(),
            ]);

            if (usersData.success) setUsers(usersData.data);
            if (companiesData.success) setCompanies(companiesData.data);
            if (branchesData.success) setBranches(branchesData.data);
            if (deptsData.success) setDepartments(deptsData.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openAddModal = () => {
        setEditingUser(null);
        setForm({
            employeeId: "",
            name: "",
            email: "",
            companyId: "",
            branchId: "",
            departmentId: "",
            role: "employee",
            managerId: "",
            status: "Active",
            password: "",
            signatureImage: "",
        });
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setForm({
            employeeId: user.employeeId,
            name: user.name,
            email: user.email || "",
            companyId: user.companyId?.toString() || "",
            branchId: user.branchId?.toString() || "",
            departmentId: user.departmentId?.toString() || "",
            role: user.role,
            managerId: user.managerId?.toString() || "",
            status: user.status,
            password: "",
            signatureImage: user.signatureImage || "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.employeeId || !form.name) {
            setMessage({ type: "error", text: "กรุณากรอกรหัสพนักงานและชื่อ" });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...form,
                companyId: form.companyId ? parseInt(form.companyId) : null,
                branchId: form.branchId ? parseInt(form.branchId) : null,
                departmentId: form.departmentId ? parseInt(form.departmentId) : null,
                managerId: form.managerId ? parseInt(form.managerId) : null,
            };

            const url = editingUser
                ? `/api/admin/users/${editingUser.id}`
                : "/api/admin/users";

            const res = await fetch(url, {
                method: editingUser ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: data.message });
                setShowModal(false);
                fetchData();
            } else {
                setMessage({ type: "error", text: data.error });
            }
        } catch (error) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`ต้องการลบผู้ใช้ "${user.name}" หรือไม่?`)) return;

        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: data.message });
                fetchData();
            } else {
                setMessage({ type: "error", text: data.error });
            }
        } catch (error) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
        }
    };

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // For new users, we need to save first or use temp ID
        const userId = editingUser?.id || "temp";

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", userId.toString());

            const res = await fetch("/api/admin/users/upload-signature", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setForm({ ...form, signatureImage: data.path });
                setMessage({ type: "success", text: "อัปโหลดลายเซ็นสำเร็จ" });
            } else {
                setMessage({ type: "error", text: data.error });
            }
        } catch (error) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการอัปโหลด" });
        } finally {
            setIsUploading(false);
        }
    };

    const getRoleLabel = (role: string) => {
        return ROLES.find((r) => r.value === role)?.label || role;
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin": return "bg-red-100 text-red-700";
            case "executive": return "bg-purple-100 text-purple-700";
            case "procurement_manager": return "bg-blue-100 text-blue-700";
            case "procurement": return "bg-cyan-100 text-cyan-700";
            case "manager": return "bg-amber-100 text-amber-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    // Filter branches/departments by selected company
    const filteredBranches = branches.filter(b => !form.companyId || b.companyId === parseInt(form.companyId));
    const filteredDepartments = departments.filter(d => !form.companyId || d.companyId === parseInt(form.companyId));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>
                        <p className="text-gray-500">จัดการบัญชีผู้ใช้งานในระบบ</p>
                    </div>
                </div>

                <button
                    onClick={openAddModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    เพิ่มผู้ใช้
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                    }`}>
                    {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="card">
                <div className="relative max-w-md">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาด้วยรหัส, ชื่อ หรืออีเมล..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input !pl-12"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">รหัสพนักงาน</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">ชื่อ</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">อีเมล</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">บริษัท/สาขา</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">บทบาท</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold">สถานะ</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold w-24">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-medium text-violet-600">{user.employeeId}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800">{user.name}</div>
                                            {user.managerName && (
                                                <div className="text-xs text-gray-400">หัวหน้า: {user.managerName}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{user.email || "-"}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">{user.companyName || "-"}</div>
                                            {user.branchName && (
                                                <div className="text-xs text-gray-400">{user.branchName}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.status === "Active"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-gray-100 text-gray-600"
                                                }`}>
                                                {user.status === "Active" ? "ใช้งาน" : "ปิดการใช้งาน"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            {searchTerm ? "ไม่พบผู้ใช้ที่ค้นหา" : "ยังไม่มีข้อมูลผู้ใช้"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header - Gradient */}
                        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                                        <Users className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {editingUser ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
                                        </h2>
                                        <p className="text-violet-200 text-sm">
                                            {editingUser ? `${editingUser.employeeId} - ${editingUser.name}` : "กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">

                            {/* Section 1: Basic Info */}
                            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-200/80">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/30">
                                        1
                                    </div>
                                    <h3 className="font-semibold text-gray-800">ข้อมูลพื้นฐาน</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">รหัสพนักงาน <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={form.employeeId}
                                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                                            className="form-input"
                                            placeholder="เช่น EMP001"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="form-input"
                                            placeholder="ชื่อ นามสกุล"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="form-label">อีเมล</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="form-input"
                                            placeholder="example@company.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Organization */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-5 border border-blue-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                                        2
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold text-gray-800">สังกัดองค์กร</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="form-label">บริษัท</label>
                                        <select
                                            value={form.companyId}
                                            onChange={(e) => setForm({ ...form, companyId: e.target.value, branchId: "", departmentId: "" })}
                                            className="form-select"
                                        >
                                            <option value="">-- เลือกบริษัท --</option>
                                            {companies.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">สาขา</label>
                                        <select
                                            value={form.branchId}
                                            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                                            className="form-select"
                                            disabled={!form.companyId}
                                        >
                                            <option value="">-- เลือกสาขา --</option>
                                            {filteredBranches.map((b) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">แผนก</label>
                                        <select
                                            value={form.departmentId}
                                            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                            className="form-select"
                                            disabled={!form.companyId}
                                        >
                                            <option value="">-- เลือกแผนก --</option>
                                            {filteredDepartments.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Role & Manager */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl p-5 border border-amber-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-amber-500/30">
                                        3
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-amber-600" />
                                        <h3 className="font-semibold text-gray-800">บทบาทและสายบังคับบัญชา</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="form-label">บทบาท</label>
                                        <select
                                            value={form.role}
                                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                                            className="form-select"
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">หัวหน้า</label>
                                        <select
                                            value={form.managerId}
                                            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                                            className="form-select"
                                        >
                                            <option value="">-- ไม่มี --</option>
                                            {users.filter(u => u.id !== editingUser?.id && u.role !== "employee").map((u) => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                                            ))}
                                        </select>
                                    </div>
                                    {editingUser && (
                                        <div>
                                            <label className="form-label">สถานะ</label>
                                            <select
                                                value={form.status}
                                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                                className="form-select"
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 4: Password */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl p-5 border border-emerald-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/30">
                                        4
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Key className="w-4 h-4 text-emerald-600" />
                                        <h3 className="font-semibold text-gray-800">รหัสผ่าน</h3>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">
                                        {editingUser ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"}
                                    </label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="form-input max-w-md"
                                        placeholder={editingUser ? "เว้นว่างถ้าไม่ต้องการเปลี่ยน" : "กรอกรหัสผ่าน"}
                                    />
                                    {!editingUser && (
                                        <p className="text-xs text-gray-400 mt-1">รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร</p>
                                    )}
                                </div>
                            </div>

                            {/* Section 5: Digital Signature */}
                            <div className="bg-gradient-to-br from-pink-50 to-rose-50/50 rounded-xl p-5 border border-pink-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-pink-500/30">
                                        5
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <PenLine className="w-4 h-4 text-pink-600" />
                                        <h3 className="font-semibold text-gray-800">ลายเซ็นดิจิทัล</h3>
                                        <span className="text-xs text-gray-400">(ไม่บังคับ)</span>
                                    </div>
                                </div>
                                {/* Drag & Drop Zone */}
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging
                                        ? "border-violet-500 bg-violet-50"
                                        : form.signatureImage
                                            ? "border-emerald-300 bg-emerald-50/50"
                                            : "border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-50/50"
                                        }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) {
                                            const input = document.createElement("input");
                                            input.type = "file";
                                            const dt = new DataTransfer();
                                            dt.items.add(file);
                                            input.files = dt.files;
                                            handleSignatureUpload({ target: input } as any);
                                        }
                                    }}
                                >
                                    {form.signatureImage ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <img
                                                src={form.signatureImage}
                                                alt="ลายเซ็น"
                                                className="max-h-20 object-contain"
                                            />
                                            <div className="flex items-center gap-2">
                                                <label className="cursor-pointer text-sm text-violet-600 hover:underline font-medium">
                                                    เปลี่ยนรูป
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg"
                                                        onChange={handleSignatureUpload}
                                                        className="hidden"
                                                        disabled={isUploading}
                                                    />
                                                </label>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, signatureImage: "" })}
                                                    className="text-sm text-red-500 hover:underline"
                                                >
                                                    ลบลายเซ็น
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="flex flex-col items-center gap-2">
                                                {isUploading ? (
                                                    <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                                                        <Upload className="w-6 h-6 text-violet-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-violet-600 font-medium">คลิกเพื่อเลือกไฟล์</span>
                                                    <span className="text-gray-500"> หรือ ลากไฟล์มาวางที่นี่</span>
                                                </div>
                                                <p className="text-xs text-gray-400">รองรับ PNG, JPG ขนาดไม่เกิน 2MB</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg"
                                                onChange={handleSignatureUpload}
                                                className="hidden"
                                                disabled={isUploading}
                                            />
                                        </label>
                                    )}
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-violet-500/10 rounded-xl flex items-center justify-center">
                                            <span className="text-violet-600 font-semibold">ปล่อยเพื่ออัปโหลด</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {editingUser ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
