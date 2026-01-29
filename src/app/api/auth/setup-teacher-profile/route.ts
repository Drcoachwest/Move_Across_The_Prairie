import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/setup-teacher-profile
 * Complete teacher profile setup after activation code verification
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tempEmail = cookieStore.get("temp_teacher_email")?.value;
    const tempCode = cookieStore.get("temp_activation_code")?.value;

    if (!tempEmail || !tempCode) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, school, password } = body;

    if (!name || !school || !password) {
      return NextResponse.json(
        { error: "Name, school, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Verify activation code is still valid
    const code = await prisma.activationCode.findUnique({
      where: { code: tempCode },
    });

    if (!code || !code.active) {
      return NextResponse.json(
        { error: "Activation code is no longer valid" },
        { status: 401 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update teacher
    const teacher = await prisma.teacher.upsert({
      where: { email: tempEmail },
      update: {
        name,
        school,
        password: hashedPassword,
        activated: true,
        activatedAt: new Date(),
        activationCodeUsed: tempCode,
      },
      create: {
        email: tempEmail,
        name,
        school,
        password: hashedPassword,
        activated: true,
        activatedAt: new Date(),
        activationCodeUsed: tempCode,
      },
    });

    // Update activation code usage count
    await prisma.activationCode.update({
      where: { code: tempCode },
      data: {
        usesCount: { increment: 1 },
      },
    });

    // Clear temp cookies
    cookieStore.delete("temp_teacher_email");
    cookieStore.delete("temp_activation_code");

    // Create teacher session
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
      message: "Profile created successfully",
      teacher: {
        email: teacher.email,
        name: teacher.name,
        school: teacher.school,
      },
    });
  } catch (error: any) {
    console.error("Profile setup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set up profile" },
      { status: 500 }
    );
  }
}
