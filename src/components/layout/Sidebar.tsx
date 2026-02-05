"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard,
    FileText,
    ShoppingCart,
    ClipboardCheck,
    Settings,
    Building2,
    GitBranch,
    Hash,
    Sliders,
    Menu,
    X,
    LogOut,
    ChevronDown,
    User,
    Users,
    Sparkles,
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "ใบขอซื้อ (PR)",
        href: "/pr",
        icon: FileText,
        children: [
            { label: "สร้างใบขอซื้อ", href: "/pr/create", icon: FileText },
            { label: "รายการใบขอซื้อ", href: "/pr", icon: FileText },
        ],
    },
    {
        label: "ใบสั่งซื้อ (PO)",
        href: "/po",
        icon: ShoppingCart,
        children: [
            { label: "สร้างใบสั่งซื้อ", href: "/po/create", icon: ShoppingCart },
            { label: "รายการใบสั่งซื้อ", href: "/po", icon: ShoppingCart },
        ],
    },
    {
        label: "รออนุมัติ",
        href: "/approvals",
        icon: ClipboardCheck,
    },
];

const adminItems: NavItem[] = [
    {
        label: "ตั้งค่าระบบ",
        href: "/admin",
        icon: Settings,
        children: [
            { label: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
            { label: "จัดการบริษัท", href: "/admin/companies", icon: Building2 },
            { label: "จัดการสาขา", href: "/admin/branches", icon: GitBranch },
            { label: "ตั้งค่าระบบ", href: "/admin/system-settings", icon: Sliders },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (href: string) => {
        setExpandedItems((prev) =>
            prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
        );
    };

    const isActive = (href: string, hasChildren: boolean = false) => {
        // For exact match (leaf items or items with children that have same href as a child)
        if (pathname === href) return true;
        // For parent items - check if pathname starts with href but only if item has children
        if (hasChildren && pathname.startsWith(href + "/")) return true;
        return false;
    };

    const renderNavItem = (item: NavItem, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.href);
        const active = isActive(item.href, hasChildren);

        if (hasChildren) {
            return (
                <div key={item.href}>
                    <button
                        onClick={() => toggleExpanded(item.href)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-all duration-300 ${active
                            ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600"
                            : "text-gray-600 hover:bg-gray-100/50"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${active
                                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                    : "bg-gray-100 text-gray-500"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                                }`}
                        />
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                            {item.children!.map((child) => renderNavItem(child, depth + 1))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active && depth === 0
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : active && depth > 0
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100/50"
                    } ${depth > 0 ? "pl-4" : ""}`}
                onClick={() => setIsMobileOpen(false)}
            >
                {depth === 0 && (
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${active
                            ? "bg-white/20"
                            : "bg-gray-100 text-gray-500"
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                    </div>
                )}
                {depth > 0 && <item.icon className="w-4 h-4" />}
                <span className="font-medium">{item.label}</span>
            </Link>
        );
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 flex items-center gap-1">
                            Procurement
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                        </h1>
                        <p className="text-xs text-gray-500">ระบบจัดซื้อ</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 min-h-0 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => renderNavItem(item))}

                {/* Admin Section */}
                {(session?.user as any)?.role === "admin" && (
                    <div className="pt-6 mt-6 border-t border-gray-100">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            ผู้ดูแลระบบ
                        </p>
                        {adminItems.map((item) => renderNavItem(item))}
                    </div>
                )}
            </nav>

            {/* User Info - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 m-4 mt-auto rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm">
                            {session?.user?.name || "ผู้ใช้งาน"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {(session?.user as any)?.employeeId || ""}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 glass rounded-xl shadow-lg"
            >
                {isMobileOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen w-72 glass-sidebar flex flex-col z-40 transform transition-transform duration-300 lg:transform-none ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
