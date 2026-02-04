import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Request password reset by email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    if (!teacher) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token (32 random bytes, hex encoded)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save token to database
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    });

    // In production, send email with reset link
    // For now, return link in response (for testing)
    const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    console.log(`Password reset link for ${email}: ${resetLink}`);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
      // Remove in production - only for testing
      resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
