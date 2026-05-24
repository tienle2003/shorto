import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    let originalUrl: string | null = null;
    let linkId: string | null = null;

    if (redis) {
      try {
        originalUrl = await redis.get(`link:${code}`) as string | null;
      } catch (err) {
        console.error("Redis get error:", err);
      }
    }

    if (!originalUrl) {
      const link = await db.link.findUnique({
        where: { shortCode: code },
      });

      if (!link) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      originalUrl = link.originalUrl;
      linkId = link.id;

      if (redis) {
        try {
          await redis.set(`link:${code}`, originalUrl);
        } catch (err) {
          console.error("Redis set error:", err);
        }
      }
    }

    // Increment clicks in background
    after(async () => {
      try {
        if (linkId) {
          await db.link.update({
            where: { id: linkId },
            data: { clicks: { increment: 1 } },
          });
        } else {
          await db.link.update({
            where: { shortCode: code },
            data: { clicks: { increment: 1 } },
          });
        }
      } catch (error) {
        console.error("Error incrementing clicks:", error);
      }
    });

    return NextResponse.redirect(originalUrl);
  } catch (error) {
    console.error("Error in redirect route:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
