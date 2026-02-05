"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, User, Lock, ShoppingCart } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                employeeId,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 relative">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div
                    className="rounded-2xl p-8 shadow-2xl"
                    style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                            }}
                        >
                            <ShoppingCart className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Procurement System</h1>
                        <p className="text-indigo-200/80 text-sm">ระบบจัดซื้อจัดจ้าง</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg text-red-300 text-sm text-center"
                            style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Employee ID */}
                        <div>
                            <label className="block text-indigo-200 text-sm mb-2">
                                รหัสพนักงาน
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <User className="w-5 h-5 text-indigo-300/60" />
                                </div>
                                <input
                                    type="text"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    placeholder="กรอกรหัสพนักงาน"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-lg text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    style={{
                                        background: 'rgba(99, 102, 241, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-indigo-200 text-sm mb-2">
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Lock className="w-5 h-5 text-indigo-300/60" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="กรอกรหัสผ่าน"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-lg text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    style={{
                                        background: 'rgba(99, 102, 241, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-lg font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                            }}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    เข้าสู่ระบบ
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-indigo-300/50 text-xs mt-6">
                    © 2026 Sonic Interfreight / Grandlink Logistics
                </p>
            </div>
        </div>
    );
}
