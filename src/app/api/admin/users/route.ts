import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - List all users
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await query<any>(`
            SELECT 
                u.id, u.employeeId, u.name, u.email, 
                u.companyId, u.branchId, u.departmentId,
                u.role, u.managerId, u.isADUser, u.status,
                u.signatureImage,
                u.createdAt, u.updatedAt,
                c.name as companyName,
                b.name as branchName,
                d.name as departmentName,
                m.name as managerName
            FROM Users u
            LEFT JOIN Companies c ON u.companyId = c.id
            LEFT JOIN Branches b ON u.branchId = b.id
            LEFT JOIN Departments d ON u.departmentId = d.id
            LEFT JOIN Users m ON u.managerId = m.id
            ORDER BY u.employeeId
        `);

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            employeeId, name, email,
            companyId, branchId, departmentId,
            role, managerId, password, signatureImage
        } = body;

        if (!employeeId || !name) {
            return NextResponse.json(
                { success: false, error: "รหัสพนักงานและชื่อจำเป็นต้องกรอก" },
                { status: 400 }
            );
        }

        // Check duplicate employeeId
        const existing = await query<any>(`
            SELECT id FROM Users WHERE employeeId = @employeeId
        `, { employeeId });

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: "รหัสพนักงานนี้มีอยู่แล้ว" },
                { status: 400 }
            );
        }

        // Hash password if provided
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        await execute(`
            INSERT INTO Users (
                employeeId, name, email, 
                companyId, branchId, departmentId,
                role, managerId, passwordHash, signatureImage, status,
                createdAt, updatedAt
            )
            VALUES (
                @employeeId, @name, @email,
                @companyId, @branchId, @departmentId,
                @role, @managerId, @passwordHash, @signatureImage, 'Active',
                GETDATE(), GETDATE()
            )
        `, {
            employeeId,
            name,
            email: email || null,
            companyId: companyId || null,
            branchId: branchId || null,
            departmentId: departmentId || null,
            role: role || 'employee',
            managerId: managerId || null,
            passwordHash,
            signatureImage: signatureImage || null,
        });

        return NextResponse.json({
            success: true,
            message: "เพิ่มผู้ใช้สำเร็จ",
        });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
