import { NextResponse } from "next/server";
import { checkAndSendDeadlineReminders } from "@/services/notification.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Jika CRON_SECRET dikonfigurasi, validasi bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: "Unauthorized cron request" },
        { status: 401 },
      );
    }

    const result = await checkAndSendDeadlineReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cron execution error";
    console.error("[Cron Reminders Error]:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
