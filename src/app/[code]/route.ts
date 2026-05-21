import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const link = await db.link.findUnique({
      where: { shortCode: code },
    });

    if (!link) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Increment clicks
    await db.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.redirect(link.originalUrl);
  } catch (error) {
    console.error("Error in redirect route:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
