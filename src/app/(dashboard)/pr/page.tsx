"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText,
    Plus,
    Search,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Filter,
    TrendingUp,
    Package,
    Calendar,
} from "lucide-react";
import { formatDateTime, formatDateThai } from "@/lib/timezone";

interface PR {
    id: number;
    prNumber: string;
    requestDate: string;
    requesterName: string;
    companyName: string;
    branchName: string;
    departmentName: string;
    totalAmount: number;
    status: string;
    currentStep: number;
    createdAt: string;
}

const statusConfig: Record<string, { label: string; bgClass: string; textClass: string; icon: any }> = {
    Draft: { label: "ร่าง", bgClass: "bg-gray-100", textClass: "text-gray-600", icon: FileText },
    Pending: { label: "รออนุมัติ", bgClass: "bg-gradient-to-r from-amber-400 to-orange-500", textClass: "text-white", icon: Clock },
    Approved: { label: "อนุมัติแล้ว", bgClass: "bg-gradient-to-r from-emerald-400 to-teal-500", textClass: "text-white", icon: CheckCircle },
    Rejected: { label: "ไม่อนุมัติ", bgClass: "bg-gradient-to-r from-red-400 to-rose-500", textClass: "text-white", icon: XCircle },
    Cancelled: { label: "ยกเลิก", bgClass: "bg-gray-400", textClass: "text-white", icon: AlertCircle },
};

export default function PRListPage() {
    const router = useRouter();
    const [prs, setPrs] = useState<PR[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        fetchPRs();
    }, [statusFilter]);

    const fetchPRs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/pr?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setPrs(data.data);
            }
        } catch (error) {
            console.error("Error fetching PRs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPRs = prs.filter(
        (pr) =>
            pr.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pr.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pr.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const stats = {
        total: prs.length,
        pending: prs.filter(p => p.status === "Pending").length,
        approved: prs.filter(p => p.status === "Approved").length,
        draft: prs.filter(p => p.status === "Draft").length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span>รายการใบขอซื้อ</span>
                    </h1>
                    <p className="text-gray-500 mt-1 ml-16">Purchase Requests</p>
                </div>
                <Link href="/pr/create" className="btn btn-primary text-lg py-3 px-6 shadow-lg shadow-indigo-500/30">
                    <Plus className="w-5 h-5" />
                    สร้างใบขอซื้อใหม่
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                            placeholder="ค้นหาเลขที่ PR, ชื่อผู้ขอ, บริษัท..."
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
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : filteredPRs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">ไม่พบข้อมูลใบขอซื้อ</p>
                        <Link href="/pr/create" className="btn btn-primary mt-4 inline-flex">
                            <Plus className="w-4 h-4" />
                            สร้างใบขอซื้อใหม่
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">เลขที่ PR</th>
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">วันที่</th>
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">ผู้ขอ</th>
                                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-600">บริษัท / สาขา</th>
                                    <th className="px-6 py-5 text-right text-sm font-bold text-gray-600">ยอดรวม</th>
                                    <th className="px-6 py-5 text-center text-sm font-bold text-gray-600">สถานะ</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPRs.map((pr) => {
                                    const status = statusConfig[pr.status] || statusConfig.Draft;
                                    const Icon = status.icon;
                                    return (
                                        <tr
                                            key={pr.id}
                                            className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                            onClick={() => router.push(`/pr/${pr.id}`)}
                                        >
                                            <td className="px-6 py-5">
                                                <span className="font-bold text-indigo-600 group-hover:text-indigo-700">
                                                    {pr.prNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {formatDateThai(pr.requestDate)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-medium text-gray-800">{pr.requesterName}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-medium text-gray-800">{pr.companyName}</p>
                                                    <p className="text-sm text-gray-500">{pr.branchName}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="font-bold text-gray-800">
                                                    ฿{pr.totalAmount?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
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
                                                    className="p-2.5 bg-white hover:bg-indigo-100 rounded-xl transition-all shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/pr/${pr.id}`);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 text-indigo-600" />
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
