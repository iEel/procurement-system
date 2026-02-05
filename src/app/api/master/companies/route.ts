import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const companies = await query<any>(`
            SELECT id, code, name, isActive 
            FROM Companies 
            WHERE isActive = 1 
            ORDER BY name
        `);

        return NextResponse.json({
            success: true,
            data: companies,
        });
    } catch (error: any) {
        console.error("Error fetching companies:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
