import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/teacher-signin
 * Teacher login with email + activation code (first time) or password (returning)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, activationCode, password } = body;

    if (!email || !email.endsWith("@gpisd.org")) {
      return NextResponse.json(
        { error: "Valid @gpisd.org email required" },
        { status: 400 }
      );
    }

    // Check if teacher exists in database
    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    // RETURNING TEACHER - Sign in with password
    if (teacher && teacher.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 400 }
        );
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, teacher.password);
      if (!passwordValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }

      // Create teacher session cookie
      const cookieStore = await cookies();
      cookieStore.set("teacher_session", teacher.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      // Store teacher info for easy access
      cookieStore.set("teacher_info", JSON.stringify({
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        school: teacher.school,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({
        success: true,
        message: "Teacher signed in successfully",
        needsProfile: false,
        teacher: {
          email: teacher.email,
          name: teacher.name,
          school: teacher.school,
        },
      });
    }

    // NEW TEACHER - Sign in with activation code
    if (!activationCode) {
      return NextResponse.json(
        { error: "Activation code required for first-time sign in" },
        { status: 400 }
      );
    }

    // Verify activation code
    const code = await prisma.activationCode.findUnique({
      where: { code: activationCode },
    });

    if (!code || !code.active) {
      return NextResponse.json(
        { error: "Invalid or inactive activation code" },
        { status: 401 }
      );
    }

    // Check if code has expired
    if (code.expiresAt && new Date() > code.expiresAt) {
      return NextResponse.json(
        { error: "Activation code has expired" },
        { status: 401 }
      );
    }

    // Check if code has reached max uses
    if (code.usesCount >= code.maxUses) {
      return NextResponse.json(
        { error: "Activation code has reached maximum uses" },
        { status: 401 }
      );
    }

    // Create temp session for profile setup
    const cookieStore = await cookies();
    cookieStore.set("temp_teacher_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes to complete profile
    });

    cookieStore.set("temp_activation_code", activationCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
    });

    return NextResponse.json({
      success: true,
      message: "Activation code verified",
      needsProfile: true,
    });
  } catch (error: any) {
    console.error("Teacher signin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign in" },
      { status: 500 }
    );
  }
}
