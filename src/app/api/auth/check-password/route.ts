import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Check if a user has already set a password
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email } = data;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true },
    });

    return NextResponse.json({
      success: true,
      hasPassword: user ? !!user.password : false,
    });
  } catch (error) {
    console.error("Check password error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
