import { NextResponse } from "next/server";
import { getAllSettings } from "@/lib/settings";

/**
 * GET /api/settings
 * Public endpoint to get system settings for frontend usage
 * Only returns non-sensitive settings
 */
export async function GET() {
    try {
        const allSettings = await getAllSettings();

        // Filter only public settings (exclude sensitive ones)
        const publicKeys = [
            'VAT_RATE',
            'WHT_RATE',
            'CURRENCY',
            'DEFAULT_COMPANY_ID',
            'DEFAULT_BRANCH_ID',
            'PR_NUMBER_FORMAT',
            'PO_NUMBER_FORMAT',
            'APPROVAL_REQUIRED_PR',
            'APPROVAL_REQUIRED_PO',
        ];

        const publicSettings: Record<string, string> = {};
        for (const key of publicKeys) {
            if (allSettings[key]) {
                publicSettings[key] = allSettings[key];
            }
        }

        return NextResponse.json({
            success: true,
            data: publicSettings,
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        );
    }
}
