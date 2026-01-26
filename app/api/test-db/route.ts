import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const slipCount = await prisma.slip.count();
    
    return NextResponse.json({
      ok: true,
      slipCount,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
