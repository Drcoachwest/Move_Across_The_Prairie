import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// PUT - Update an existing curriculum resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, band, grade, unit, subject, tags, type, externalUrl } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    // Get existing resource
    const existingResource = await prisma.curriculumResource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Update database record
    const resource = await prisma.curriculumResource.update({
      where: { id },
      data: {
        title,
        description: description || null,
        band: band || "ELEMENTARY",
        grade: grade || null,
        unit: unit || null,
        subject: subject || null,
        tags: tags || null,
        type,
        externalUrl: type === "link" ? externalUrl : null,
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error("Error updating curriculum resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a curriculum resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete the resource
    await prisma.curriculumResource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting curriculum resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
