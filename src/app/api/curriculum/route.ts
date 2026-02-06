import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Fetch all curriculum resources
export async function GET(_request: NextRequest) {
  try {
    const resources = await prisma.curriculumResource.findMany({
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching curriculum resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST - Upload a new curriculum resource
export async function POST(request: NextRequest) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, band, grade, unit, subject, tags, type, externalUrl } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    // Create database record
    const resource = await prisma.curriculumResource.create({
      data: {
        title,
        description: description || null,
        band: band || "ELEMENTARY",
        grade: grade || null,
        unit: unit || null,
        subject: subject || null,
        tags: tags || null,
        type,
        fileUrl: null,
        externalUrl: type === "link" ? externalUrl : null,
        createdBy: "admin",
      },
    });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error) {
    console.error("Error uploading curriculum resource:", error);
    return NextResponse.json(
      { error: "Failed to upload resource" },
      { status: 500 }
    );
  }
}
