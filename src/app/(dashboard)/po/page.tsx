"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShoppingCart,
    Plus,
    Search,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Filter,
    Package,
    Calendar,
    FileText,
} from "lucide-react";
import { formatDateThai } from "@/lib/timezone";

interface PO {
    id: number;
    poNumber: string;
    prNumber: string;
    issueDate: string;
    vendorName: string;
    companyName: string;
    branchName: string;
    grandTotal: number;
    status: string;
    currentStep: number;
}

const statusConfig: Record<string, { label: string; bgClass: string; textClass: string; icon: any }> = {
    Draft: { label: "ร่าง", bgClass: "bg-gray-100", textClass: "text-gray-600", icon: FileText },
    Pending: { label: "รออนุมัติ", bgClass: "bg-gradient-to-r from-amber-400 to-orange-500", textClass: "text-white", icon: Clock },
    Approved: { label: "อนุมัติแล้ว", bgClass: "bg-gradient-to-r from-emerald-400 to-teal-500", textClass: "text-white", icon: CheckCircle },
    Rejected: { label: "ไม่อนุมัติ", bgClass: "bg-gradient-to-r from-red-400 to-rose-500", textClass: "text-white", icon: XCircle },
    Cancelled: { label: "ยกเลิก", bgClass: "bg-gray-400", textClass: "text-white", icon: AlertCircle },
};

export default function POListPage() {
    const router = useRouter();
    const [pos, setPos] = useState<PO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        fetchPOs();
    }, [statusFilter]);

    const fetchPOs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/po?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setPos(data.data);
            }
        } catch (error) {
            console.error("Error fetching POs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPOs = pos.filter(
        (po) =>
            po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.prNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const stats = {
        total: pos.length,
        pending: pos.filter(p => p.status === "Pending").length,
        approved: pos.filter(p => p.status === "Approved").length,
        draft: pos.filter(p => p.status === "Draft").length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <span>รายการใบสั่งซื้อ</span>
                    </h1>
                    <p className="text-gray-500 mt-1 ml-16">Purchase Orders</p>
                </div>
                <Link href="/po/create" className="btn btn-primary bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-lg py-3 px-6 shadow-lg shadow-teal-500/30">
                    <Plus className="w-5 h-5" />
                    สร้างใบสั่งซื้อใหม่
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stats-card group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">ทั้งหมด</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="stats-card group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">รออนุมัติ</p>
                            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="stats-card group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
                            <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="stats-card group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">ร่าง</p>
                            <p className="text-3xl font-bold text-gray-600">{stats.draft}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาเลขที่ PO, PR, ชื่อผู้ขาย, บริษัท..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-select w-44"
                        >
                            <option value="">ทุกสถานะ</option>
                            <option value="Draft">ร่าง</option>
                            <option value="Pending">รออนุมัติ</option>
                            <option value="Approved">อนุมัติแล้ว</option>
                            <option value="Rejected">ไม่อนุมัติ</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : filteredPOs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">ไม่พบข้อมูลใบสั่งซื้อ</p>
                        <Link href="/po/create" className="btn btn-primary mt-4 inline-flex bg-gradient-to-r from-teal-500 to-emerald-600">
                            <Plus className="w-4 h-4" />
                            สร้างใบสั่งซื้อใหม่
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">เลขที่ PO</th>
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">อ้างอิง PR</th>
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">วันที่</th>
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">ผู้ขาย</th>
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">บริษัท</th>
                                    <th className="px-6 py-5 text-right text-sm font-bold text-gray-600">ยอดรวม</th>
                                    <th className="px-6 py-5 text-center text-sm font-bold text-gray-600">สถานะ</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPOs.map((po) => {
                                    const status = statusConfig[po.status] || statusConfig.Draft;
                                    const Icon = status.icon;
                                    return (
                                        <tr
                                            key={po.id}
                                            className="hover:bg-teal-50/50 cursor-pointer transition-colors group"
                                            onClick={() => router.push(`/po/${po.id}`)}
                                        >
                                            <td className="px-6 py-5">
                                                <span className="font-bold text-teal-600 group-hover:text-teal-700">
                                                    {po.poNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-indigo-600 font-medium">
                                                    {po.prNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {formatDateThai(po.issueDate)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-medium text-gray-800">{po.vendorName || "-"}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-medium text-gray-800">{po.companyName}</p>
                                                    <p className="text-sm text-gray-500">{po.branchName}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="font-bold text-gray-800">
                                                    ฿{po.grandTotal?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${status.bgClass} ${status.textClass}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button
                                                    className="p-2.5 bg-white hover:bg-teal-100 rounded-xl transition-all shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/po/${po.id}`);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 text-teal-600" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
