import { NextResponse } from "next/server";
import { linkSchema } from "@/lib/validations/link.schema";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { originalUrl, customAlias } = linkSchema.parse(body);

    let shortCode = nanoid(6);

    if (customAlias) {
      const existing = await db.link.findUnique({
        where: { shortCode: customAlias }
      });
      if (existing) {
        return NextResponse.json(
          { error: [{ message: "This alias is already taken" }] },
          { status: 400 }
        );
      }
      shortCode = customAlias;
    } else {
      let isUnique = false;
      
      while (!isUnique) {
        const existing = await db.link.findUnique({
          where: { shortCode }
        });
        if (!existing) {
          isUnique = true;
        } else {
          shortCode = nanoid(6);
        }
      }
    }

    const link = await db.link.create({
      data: {
        originalUrl,
        shortCode,
      },
    });

    if (redis) {
      try {
        await redis.set(`link:${shortCode}`, originalUrl);
      } catch (err) {
        console.error("Failed to set redis cache:", err);
      }
    }

    return NextResponse.json(link, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
