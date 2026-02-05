"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ClipboardCheck,
    FileText,
    ShoppingCart,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Building2,
    User,
    Calendar,
    Filter,
    Search,
    AlertCircle,
    RotateCcw,
} from "lucide-react";
import { formatDateThai } from "@/lib/timezone";

interface PendingPR {
    id: number;
    prNumber: string;
    requestDate: string;
    requesterName: string;
    departmentName: string;
    companyName: string;
    totalAmount: number;
    requestType: string;
    status: string;
}

interface PendingPO {
    id: number;
    poNumber: string;
    prNumber: string;
    issueDate: string;
    vendorName: string;
    companyName: string;
    totalAmount: number;
    status: string;
}

const requestTypeLabels: Record<string, string> = {
    newPurchase: "ซื้อใหม่",
    replacement: "ซื้อทดแทน",
    repair: "ซ่อมแซม",
    renewal: "ต่อสัญญา",
};

export default function ApprovalsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"pr" | "po">("pr");
    const [isLoading, setIsLoading] = useState(true);
    const [pendingPRs, setPendingPRs] = useState<PendingPR[]>([]);
    const [pendingPOs, setPendingPOs] = useState<PendingPO[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isApproving, setIsApproving] = useState<number | null>(null);

    useEffect(() => {
        fetchPendingItems();
    }, []);

    const fetchPendingItems = async () => {
        setIsLoading(true);
        try {
            const [prRes, poRes] = await Promise.all([
                fetch("/api/pr?status=Pending"),
                fetch("/api/po?status=Pending"),
            ]);

            const [prData, poData] = await Promise.all([
                prRes.json(),
                poRes.json(),
            ]);

            if (prData.success) {
                setPendingPRs(prData.data);
            }
            if (poData.success) {
                setPendingPOs(poData.data);
            }
        } catch (error) {
            console.error("Error fetching pending items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (type: "pr" | "po", id: number) => {
        if (!confirm("ยืนยันการอนุมัติ?")) return;

        setIsApproving(id);
        try {
            const res = await fetch(`/api/${type}/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "Approved" }),
            });

            const data = await res.json();
            if (data.success) {
                alert("อนุมัติสำเร็จ");
                fetchPendingItems();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error approving:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsApproving(null);
        }
    };

    const handleReject = async (type: "pr" | "po", id: number) => {
        const reason = prompt("กรุณาระบุเหตุผลในการไม่อนุมัติ:");
        if (!reason) return;

        setIsApproving(id);
        try {
            const res = await fetch(`/api/${type}/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "Rejected", comments: reason }),
            });

            const data = await res.json();
            if (data.success) {
                alert("ไม่อนุมัติสำเร็จ");
                fetchPendingItems();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error rejecting:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsApproving(null);
        }
    };

    const handleSendBack = async (type: "pr" | "po", id: number) => {
        const reason = prompt("กรุณาระบุเหตุผลในการส่งกลับไปแก้ไข:");
        if (!reason) return;

        setIsApproving(id);
        try {
            const res = await fetch(`/api/${type}/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "Returned", comments: reason }),
            });

            const data = await res.json();
            if (data.success) {
                alert("ส่งกลับไปแก้ไขสำเร็จ");
                fetchPendingItems();
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error sending back:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsApproving(null);
        }
    };

    // Filter by search term
    const filteredPRs = pendingPRs.filter(
        (pr) =>
            pr.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pr.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pr.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPOs = pendingPOs.filter(
        (po) =>
            po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            รออนุมัติ
                        </h1>
                        <p className="text-gray-500">
                            Pending Approvals
                        </p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-indigo-50 rounded-xl flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span className="font-bold text-indigo-600">{pendingPRs.length}</span>
                        <span className="text-indigo-600/70 text-sm">PR</span>
                    </div>
                    <div className="px-4 py-2 bg-teal-50 rounded-xl flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-teal-600" />
                        <span className="font-bold text-teal-600">{pendingPOs.length}</span>
                        <span className="text-teal-600/70 text-sm">PO</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab("pr")}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${activeTab === "pr"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                >
                    <FileText className="w-5 h-5" />
                    ใบขอซื้อ (PR)
                    {pendingPRs.length > 0 && (
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "pr" ? "bg-white/20" : "bg-indigo-100 text-indigo-600"
                            }`}>
                            {pendingPRs.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("po")}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${activeTab === "po"
                        ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    ใบสั่งซื้อ (PO)
                    {pendingPOs.length > 0 && (
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "po" ? "bg-white/20" : "bg-teal-100 text-teal-600"
                            }`}>
                            {pendingPOs.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Search */}
            <div className="card">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={activeTab === "pr"
                                ? "ค้นหาเลขที่ PR, ผู้ขอ, แผนก..."
                                : "ค้นหาเลขที่ PO, PR, ชื่อผู้ขาย..."
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {activeTab === "pr" ? (
                        filteredPRs.length === 0 ? (
                            <div className="card text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่มีใบขอซื้อรออนุมัติ</h3>
                                <p className="text-gray-400">เอกสารทั้งหมดได้รับการอนุมัติเรียบร้อยแล้ว</p>
                            </div>
                        ) : (
                            filteredPRs.map((pr) => (
                                <div
                                    key={pr.id}
                                    className="card hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <Link href={`/pr/${pr.id}`} className="flex items-start gap-4 flex-1 cursor-pointer group/link">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover/link:scale-105 transition-transform">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-gray-800 group-hover/link:text-indigo-600 transition-colors">{pr.prNumber}</h3>
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        รออนุมัติ
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {pr.requesterName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {pr.departmentName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDateThai(pr.requestDate)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                        {requestTypeLabels[pr.requestType] || pr.requestType}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {pr.companyName}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-800 mb-2">
                                                ฿{pr.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSendBack("pr", pr.id)}
                                                    disabled={isApproving === pr.id}
                                                    className="px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all flex items-center gap-1 font-medium"
                                                >
                                                    <RotateCcw className="w-5 h-5" />
                                                    ส่งกลับแก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleReject("pr", pr.id)}
                                                    disabled={isApproving === pr.id}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1 font-medium"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                    ไม่อนุมัติ
                                                </button>
                                                <button
                                                    onClick={() => handleApprove("pr", pr.id)}
                                                    disabled={isApproving === pr.id}
                                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1 font-medium"
                                                >
                                                    {isApproving === pr.id ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-5 h-5" />
                                                    )}
                                                    อนุมัติ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        filteredPOs.length === 0 ? (
                            <div className="card text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่มีใบสั่งซื้อรออนุมัติ</h3>
                                <p className="text-gray-400">เอกสารทั้งหมดได้รับการอนุมัติเรียบร้อยแล้ว</p>
                            </div>
                        ) : (
                            filteredPOs.map((po) => (
                                <div
                                    key={po.id}
                                    className="card hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <Link href={`/po/${po.id}`} className="flex items-start gap-4 flex-1 cursor-pointer group/link">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover/link:scale-105 transition-transform">
                                                <ShoppingCart className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-gray-800 group-hover/link:text-teal-600 transition-colors">{po.poNumber}</h3>
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        รออนุมัติ
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-4 h-4" />
                                                        อ้างอิง: {po.prNumber}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {po.vendorName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDateThai(po.issueDate)}
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <span className="text-xs text-gray-400">
                                                        {po.companyName}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-800 mb-2">
                                                ฿{po.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSendBack("po", po.id)}
                                                    disabled={isApproving === po.id}
                                                    className="px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all flex items-center gap-1 font-medium"
                                                >
                                                    <RotateCcw className="w-5 h-5" />
                                                    ส่งกลับแก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleReject("po", po.id)}
                                                    disabled={isApproving === po.id}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1 font-medium"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                    ไม่อนุมัติ
                                                </button>
                                                <button
                                                    onClick={() => handleApprove("po", po.id)}
                                                    disabled={isApproving === po.id}
                                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1 font-medium"
                                                >
                                                    {isApproving === po.id ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-5 h-5" />
                                                    )}
                                                    อนุมัติ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            )}
        </div>
    );
}
