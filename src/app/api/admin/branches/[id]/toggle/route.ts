import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { execute } from "@/lib/db";

// PUT - Toggle branch active status
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

        await execute(`
            UPDATE Branches SET 
                isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END,
                updatedAt = GETDATE()
            WHERE id = @id
        `, { id: parseInt(id) });

        return NextResponse.json({
            success: true,
            message: "เปลี่ยนสถานะสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error toggling branch:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
