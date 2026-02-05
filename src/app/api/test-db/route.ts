import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        // Test database connection
        const users = await query<any>(
            `SELECT id, employeeId, name, role, status, passwordHash FROM Users WHERE employeeId = 'ADMIN001'`
        );

        if (users.length === 0) {
            return NextResponse.json({
                success: false,
                message: "User ADMIN001 not found in database",
                users: []
            });
        }

        const user = users[0];

        // Test password verification
        const testPassword = "123456";
        const isValid = await bcrypt.compare(testPassword, user.passwordHash || "");

        return NextResponse.json({
            success: true,
            message: "Database connection OK",
            user: {
                id: user.id,
                employeeId: user.employeeId,
                name: user.name,
                role: user.role,
                status: user.status,
                hasPasswordHash: !!user.passwordHash,
                passwordHashLength: user.passwordHash?.length || 0,
            },
            passwordTest: {
                testPassword: testPassword,
                isValid: isValid
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Database error",
            error: error.message
        }, { status: 500 });
    }
}
