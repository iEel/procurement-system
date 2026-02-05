import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { clearSettingsCache } from "@/lib/settings";

// GET - List all system settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await query<any>(`
            SELECT id, settingKey as [key], settingValue as value, description, category
            FROM SystemSettings
            ORDER BY category, settingKey
        `);

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error("Error fetching system settings:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Save all settings (upsert)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { settings } = body;

        if (!settings || typeof settings !== "object") {
            return NextResponse.json(
                { success: false, error: "Invalid settings data" },
                { status: 400 }
            );
        }

        // Upsert each setting
        for (const [key, value] of Object.entries(settings)) {
            const existing = await query<any>(`
                SELECT id FROM SystemSettings WHERE settingKey = @key
            `, { key });

            if (existing.length > 0) {
                await execute(`
                    UPDATE SystemSettings SET
                        settingValue = @value,
                        updatedAt = GETDATE()
                    WHERE settingKey = @key
                `, { key, value });
            } else {
                await execute(`
                    INSERT INTO SystemSettings (settingKey, settingValue, createdAt, updatedAt)
                    VALUES (@key, @value, GETDATE(), GETDATE())
                `, { key, value });
            }
        }

        // Clear cache so new values take effect immediately
        clearSettingsCache();

        return NextResponse.json({
            success: true,
            message: "บันทึกการตั้งค่าสำเร็จ",
        });
    } catch (error: any) {
        console.error("Error saving system settings:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

