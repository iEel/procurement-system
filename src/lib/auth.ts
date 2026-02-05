import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./db";
import type { User } from "@/types";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                employeeId: { label: "Employee ID", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.employeeId || !credentials?.password) {
                    throw new Error("กรุณากรอกรหัสพนักงานและรหัสผ่าน");
                }

                try {
                    // Find user by employeeId
                    const users = await query<User>(
                        `SELECT * FROM Users WHERE employeeId = @employeeId AND status = 'Active'`,
                        { employeeId: credentials.employeeId }
                    );

                    if (users.length === 0) {
                        throw new Error("ไม่พบผู้ใช้งานในระบบ");
                    }

                    const user = users[0];

                    // Check if user has password (local auth)
                    if (!user.passwordHash) {
                        throw new Error("ผู้ใช้นี้ไม่ได้ตั้งค่ารหัสผ่าน กรุณาติดต่อ Admin");
                    }

                    // Verify password
                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.passwordHash
                    );

                    if (!isValid) {
                        throw new Error("รหัสผ่านไม่ถูกต้อง");
                    }

                    return {
                        id: String(user.id),
                        employeeId: user.employeeId,
                        name: user.name,
                        email: user.email || "",
                        role: user.role,
                        companyId: user.companyId,
                        branchId: user.branchId,
                        departmentId: user.departmentId,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    throw error;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.employeeId = (user as any).employeeId;
                token.role = (user as any).role;
                token.companyId = (user as any).companyId;
                token.branchId = (user as any).branchId;
                token.departmentId = (user as any).departmentId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).employeeId = token.employeeId;
                (session.user as any).role = token.role;
                (session.user as any).companyId = token.companyId;
                (session.user as any).branchId = token.branchId;
                (session.user as any).departmentId = token.departmentId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
