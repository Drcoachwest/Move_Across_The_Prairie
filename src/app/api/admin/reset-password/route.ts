import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    if (!adminSession) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: "Missing email" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher) {
      return NextResponse.json({ success: false, message: "Teacher not found" }, { status: 404 });
    }

    // In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Save it to the database with an expiration time
    // 3. Send an email with a link containing the token
    // For now, we just return success

    // Example: Generate a reset code (6 digits)
    // const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    // const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    // Save to database (requires passwordResetCode and passwordResetExpiresAt fields in schema)
    // await prisma.teacher.update({
    //   where: { email },
    //   data: {
    //     passwordResetCode: resetCode,
    //     passwordResetExpiresAt: expiresAt,
    //   },
    // });

    // Send email (would use nodemailer or similar service)
    // const emailContent = `Your password reset code is: ${resetCode}`;
    // await sendEmail(email, "Password Reset", emailContent);

    return NextResponse.json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    console.error("Error sending reset link:", error);
    return NextResponse.json({ success: false, message: "Failed to send reset link" }, { status: 500 });
  }
}
