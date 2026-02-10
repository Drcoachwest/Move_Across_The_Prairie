import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-logs";
import crypto from "crypto";

export async function GET() {
  try {
    const codes = await prisma.activationCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      codes: codes.map((code) => ({
        ...code,
        expiresAt: code.expiresAt?.toISOString(),
        createdAt: code.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching codes:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { maxUses, expiresAt } = await request.json();

    // Generate random code (8-12 chars, uppercase + numbers)
    const code = crypto
      .randomBytes(6)
      .toString("hex")
      .toUpperCase()
      .slice(0, 8);

    // Save code to database
    const newCode = await prisma.activationCode.create({
      data: {
        code,
        active: true,
        maxUses: maxUses || 1,
        usesCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: "admin", // In real app, this would be the logged-in admin's username
      },
    });

    await logAdminAction("activation_code_create", {
      code,
      maxUses: maxUses || 1,
      expiresAt: expiresAt || null,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent") || null,
      activationCodeId: newCode.id,
    });

    return NextResponse.json({
      success: true,
      message: "Code generated successfully",
      code: {
        ...newCode,
        expiresAt: newCode.expiresAt?.toISOString(),
        createdAt: newCode.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating code:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
