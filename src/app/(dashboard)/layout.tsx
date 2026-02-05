import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-pink-200 to-orange-200 rounded-full opacity-30 blur-3xl"></div>
            </div>

            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto relative z-10">
                {children}
            </main>
        </div>
    );
}
