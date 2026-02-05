import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        // Generate new password hash
        const password = "123456";
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Update all test users with new hash
        await execute(
            `UPDATE Users SET passwordHash = @hash WHERE employeeId IN ('ADMIN001', 'MGR001', 'EMP001')`,
            { hash: hash }
        );

        // Verify the update
        const isValid = await bcrypt.compare(password, hash);

        return NextResponse.json({
            success: true,
            message: "Password updated successfully!",
            newHash: hash,
            testPassword: password,
            verified: isValid,
            instruction: "Now try to login with ADMIN001 / 123456"
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Error updating password",
            error: error.message
        }, { status: 500 });
    }
}
