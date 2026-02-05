import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const departments = await query<any>(`
            SELECT d.id, d.companyId, d.code, d.name, d.isActive,
                   c.name as companyName
            FROM Departments d
            LEFT JOIN Companies c ON d.companyId = c.id
            WHERE d.isActive = 1 
            ORDER BY d.name
        `);

        return NextResponse.json({
            success: true,
            data: departments,
        });
    } catch (error: any) {
        console.error("Error fetching departments:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
