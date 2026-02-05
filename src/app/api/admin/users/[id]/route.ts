import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - Get single user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const users = await query<any>(`
            SELECT 
                u.id, u.employeeId, u.name, u.email, 
                u.companyId, u.branchId, u.departmentId,
                u.role, u.managerId, u.isADUser, u.status,
                u.signatureImage,
                u.createdAt, u.updatedAt
            FROM Users u
            WHERE u.id = @id
        `, { id: parseInt(id) });

        if (users.length === 0) {
            return NextResponse.json(
                { success: false, error: "ไม่พบผู้ใช้" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: users[0],
        });
    } catch (error: any) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const {
            employeeId, name, email,
            companyId, branchId, departmentId,
            role, managerId, status, password, signatureImage
        } = body;

        if (!employeeId || !name) {
            return NextResponse.json(
                { success: false, error: "รหัสพนักงานและชื่อจำเป็นต้องกรอก" },
                { status: 400 }
            );
        }

        // Check duplicate employeeId (exclude current user)
        const existing = await query<any>(`
            SELECT id FROM Users WHERE employeeId = @employeeId AND id != @id
        `, { employeeId, id: parseInt(id) });

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: "รหัสพนักงานนี้มีอยู่แล้ว" },
                { status: 400 }
            );
        }

        // Update user
        await execute(`
            UPDATE Users SET
                employeeId = @employeeId,
                name = @name,
                email = @email,
                companyId = @companyId,
                branchId = @branchId,
                departmentId = @departmentId,
                role = @role,
                managerId = @managerId,
                signatureImage = @signatureImage,
                status = @status,
                updatedAt = GETDATE()
            WHERE id = @id
        `, {
            id: parseInt(id),
            employeeId,
            name,
            email: email || null,
            companyId: companyId || null,
            branchId: branchId || null,
            departmentId: departmentId || null,
            role: role || 'employee',
            managerId: managerId || null,
            signatureImage: signatureImage || null,
            status: status || 'Active',
        });

        // Update password if provided
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            await execute(`
                UPDATE Users SET passwordHash = @passwordHash WHERE id = @id
            `, { id: parseInt(id), passwordHash });
        }

        return NextResponse.json({
            success: true,
            message: "อัปเดตผู้ใช้สำเร็จ",
        });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if user exists
        const existing = await query<any>(`
            SELECT id FROM Users WHERE id = @id
        `, { id: parseInt(id) });

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: "ไม่พบผู้ใช้" },
                { status: 404 }
            );
        }

        // Check if user has related records (PRs, POs)
        const hasRecords = await query<any>(`
            SELECT TOP 1 id FROM PurchaseRequests WHERE requesterId = @id
            UNION
            SELECT TOP 1 id FROM PRApprovals WHERE approverId = @id
        `, { id: parseInt(id) });

        if (hasRecords.length > 0) {
            // Soft delete - set status to Inactive
            await execute(`
                UPDATE Users SET status = 'Inactive', updatedAt = GETDATE() WHERE id = @id
            `, { id: parseInt(id) });

            return NextResponse.json({
                success: true,
                message: "ปิดการใช้งานผู้ใช้แล้ว (มีข้อมูลที่เกี่ยวข้อง)",
            });
        }

        // Hard delete if no related records
        await execute(`DELETE FROM Users WHERE id = @id`, { id: parseInt(id) });

        return NextResponse.json({
            success: true,
            message: "ลบผู้ใช้สำเร็จ",
        });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
