import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const branches = await query<any>(`
            SELECT b.id, b.companyId, b.code, b.name, b.isActive,
                   c.name as companyName
            FROM Branches b
            LEFT JOIN Companies c ON b.companyId = c.id
            WHERE b.isActive = 1 
            ORDER BY c.name, b.name
        `);

        return NextResponse.json({
            success: true,
            data: branches,
        });
    } catch (error: any) {
        console.error("Error fetching branches:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
