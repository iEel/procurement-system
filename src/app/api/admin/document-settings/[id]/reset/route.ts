import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { execute } from "@/lib/db";

// PUT - Reset document counter
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

        // Get current year-month
        const now = new Date();
        const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;

        await execute(`
            UPDATE DocumentSettings SET 
                lastNumber = 0,
                yearMonth = @yearMonth,
                updatedAt = GETDATE()
            WHERE id = @id
        `, { id: parseInt(id), yearMonth });

        return NextResponse.json({
            success: true,
            message: "รีเซ็ตตัวนับสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error resetting counter:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
