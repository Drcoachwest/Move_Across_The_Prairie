import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const grade = formData.get("grade") as string;
    const unit = formData.get("unit") as string;
    const subject = formData.get("subject") as string;
    const tags = formData.get("tags") as string;
    const type = formData.get("type") as string;
    const externalUrl = formData.get("externalUrl") as string;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    let fileUrl: string | null = null;

    // Handle file upload if type is pdf or doc
    if (type !== "link" && file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = path.join(
        process.cwd(),
        "public",
        "curriculum-documents",
        fileName
      );

      // Save the file
      await writeFile(filePath, buffer);
      fileUrl = `/curriculum-documents/${fileName}`;
    }

    // Create database record
    const resource = await prisma.curriculumResource.create({
      data: {
        title,
        description: description || null,
        grade: grade || null,
        unit: unit || null,
        subject: subject || null,
        tags: tags || null,
        type,
        fileUrl: fileUrl || null,
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

// PUT - Update an existing curriculum resource
export async function PUT(request: NextRequest) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const grade = formData.get("grade") as string;
    const unit = formData.get("unit") as string;
    const subject = formData.get("subject") as string;
    const tags = formData.get("tags") as string;
    const type = formData.get("type") as string;
    const externalUrl = formData.get("externalUrl") as string;

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

    let fileUrl = existingResource.fileUrl;

    // Handle file upload if a new file is provided
    if (type !== "link" && file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = path.join(
        process.cwd(),
        "public",
        "curriculum-documents",
        fileName
      );

      // Save the new file
      await writeFile(filePath, buffer);
      fileUrl = `/curriculum-documents/${fileName}`;
    }

    // Update database record
    const resource = await prisma.curriculumResource.update({
      where: { id },
      data: {
        title,
        description: description || null,
        grade: grade || null,
        unit: unit || null,
        subject: subject || null,
        tags: tags || null,
        type,
        fileUrl: type === "link" ? null : fileUrl,
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
export async function DELETE(request: NextRequest) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

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
