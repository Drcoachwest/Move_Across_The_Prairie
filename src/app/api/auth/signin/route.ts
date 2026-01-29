// DEPRECATED: This API endpoint is no longer used. Teachers now sign in via /api/auth/teacher-signin
// This can be deleted once confirmed it's not referenced anywhere

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/password";

// Sign in endpoint for teachers
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email, password, activationCode } = data;

    // Validate email format (must be @gpisd.org)
    if (!email.endsWith("@gpisd.org")) {
      return NextResponse.json(
        { success: false, message: "Must use @gpisd.org email address" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // User doesn't exist - check if they're trying to use activation code
      if (!activationCode) {
        return NextResponse.json(
          { success: false, message: "User not found. Please use activation code for first login." },
          { status: 400 }
        );
      }

      // Verify activation code
      const code = await prisma.activationCode.findUnique({
        where: { code: activationCode.toUpperCase() },
      });

      if (!code || !code.active) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired activation code" },
          { status: 400 }
        );
      }

      // Check if code has uses available
      if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
        return NextResponse.json(
          { success: false, message: "Activation code has expired" },
          { status: 400 }
        );
      }

      if (code.usesCount >= code.maxUses) {
        return NextResponse.json(
          { success: false, message: "Activation code has been used" },
          { status: 400 }
        );
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          activated: true,
          activatedAt: new Date(),
          activationCodeUsed: activationCode.toUpperCase(),
        },
      });

      // Increment activation code usage
      await prisma.activationCode.update({
        where: { id: code.id },
        data: { usesCount: code.usesCount + 1 },
      });

      // Set session cookie
      const response = NextResponse.json({
        success: true,
        message: "Sign in successful",
        needsPasswordSetup: true,
        user: {
          id: user.id,
          email: user.email,
        },
      });

      response.cookies.set("teacher_session", user.id, {
        httpOnly: true,
        maxAge: 8 * 60 * 60, // 8 hours
        sameSite: "lax",
      });

      return response;
    }

    // User exists
    if (password) {
      // Sign in with password
      if (!user.password) {
        return NextResponse.json(
          {
            success: false,
            message: "Password not set. Please use activation code.",
          },
          { status: 400 }
        );
      }

      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, message: "Invalid email or password" },
          { status: 400 }
        );
      }
    } else if (activationCode) {
      // Sign in with activation code (shouldn't happen for existing users)
      return NextResponse.json(
        {
          success: false,
          message:
            "This account already has a password. Please sign in with your password.",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Password or activation code required" },
        { status: 400 }
      );
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: "Sign in successful",
      user: {
        id: user.id,
        email: user.email,
      },
    });

    response.cookies.set("teacher_session", user.id, {
      httpOnly: true,
      maxAge: 8 * 60 * 60, // 8 hours
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
