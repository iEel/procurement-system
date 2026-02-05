import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    FileText,
    ShoppingCart,
    ClipboardCheck,
    TrendingUp,
    Clock,
    CheckCircle,
    ArrowUpRight,
    Sparkles,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "ผู้ใช้งาน";

    // TODO: Fetch real data from database
    const stats = {
        pendingPR: 5,
        pendingPO: 3,
        approvedThisMonth: 12,
        totalAmount: 250000,
    };

    const recentItems = [
        { id: "PR-2602-0001", type: "PR", status: "Pending", date: "2026-02-03", amount: 45000 },
        { id: "PR-2602-0002", type: "PR", status: "Approved", date: "2026-02-02", amount: 32000 },
        { id: "PO-2602-0001", type: "PO", status: "Pending", date: "2026-02-03", amount: 78000 },
        { id: "PR-2602-0003", type: "PR", status: "Approved", date: "2026-02-01", amount: 15000 },
    ];

    return (
        <div className="space-y-8 relative">
            {/* Decorative Blobs */}
            <div className="blob blob-1 opacity-20"></div>
            <div className="blob blob-2 opacity-20"></div>

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-gray-600">สวัสดี, <span className="font-semibold text-indigo-600">{userName}</span> 👋</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {/* Pending PR */}
                <div className="stats-card group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">ใบขอซื้อรออนุมัติ</p>
                            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {stats.pendingPR}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+2</span>
                        <span className="ml-1">จากเมื่อวาน</span>
                    </div>
                </div>

                {/* Pending PO */}
                <div className="stats-card group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">ใบสั่งซื้อรออนุมัติ</p>
                            <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                {stats.pendingPO}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+1</span>
                        <span className="ml-1">จากเมื่อวาน</span>
                    </div>
                </div>

                {/* Approved This Month */}
                <div className="stats-card group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">อนุมัติแล้วเดือนนี้</p>
                            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                {stats.approvedThisMonth}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+5</span>
                        <span className="ml-1">จากสัปดาห์ก่อน</span>
                    </div>
                </div>

                {/* Total Amount */}
                <div className="stats-card group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">ยอดจัดซื้อเดือนนี้</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                ฿{stats.totalAmount.toLocaleString()}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+18%</span>
                        <span className="ml-1">จากเดือนก่อน</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <Link
                    href="/pr/create"
                    className="card p-6 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">สร้างใบขอซื้อใหม่</h3>
                        <p className="text-sm text-gray-500">เริ่มสร้าง PR ใหม่</p>
                    </div>
                </Link>
                <Link
                    href="/po/create"
                    className="card p-6 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">สร้างใบสั่งซื้อใหม่</h3>
                        <p className="text-sm text-gray-500">เริ่มสร้าง PO ใหม่</p>
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {/* Pending Approvals */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                            รออนุมัติ
                        </h2>
                        <Link href="/approvals" className="text-sm text-indigo-600 hover:underline font-medium">
                            ดูทั้งหมด →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentItems
                            .filter((item) => item.status === "Pending")
                            .map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === "PR"
                                                    ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                                    : "bg-gradient-to-br from-orange-500 to-red-500"
                                                }`}
                                        >
                                            {item.type === "PR" ? (
                                                <FileText className="w-5 h-5 text-white" />
                                            ) : (
                                                <ShoppingCart className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.id}</p>
                                            <p className="text-xs text-gray-500">{item.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-800">฿{item.amount.toLocaleString()}</p>
                                        <span className="badge badge-pending">รออนุมัติ</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            กิจกรรมล่าสุด
                        </h2>
                        <Link href="/pr/list" className="text-sm text-indigo-600 hover:underline font-medium">
                            ดูทั้งหมด →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === "PR"
                                                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                                : "bg-gradient-to-br from-orange-500 to-red-500"
                                            }`}
                                    >
                                        {item.type === "PR" ? (
                                            <FileText className="w-5 h-5 text-white" />
                                        ) : (
                                            <ShoppingCart className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.id}</p>
                                        <p className="text-xs text-gray-500">{item.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800">฿{item.amount.toLocaleString()}</p>
                                    <span
                                        className={`badge ${item.status === "Approved" ? "badge-approved" : "badge-pending"
                                            }`}
                                    >
                                        {item.status === "Approved" ? "อนุมัติแล้ว" : "รออนุมัติ"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
