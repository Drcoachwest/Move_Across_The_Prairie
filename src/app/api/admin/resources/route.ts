import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const subject = searchParams.get("subject");
    const unit = searchParams.get("unit");
    const search = searchParams.get("search");

    // TODO: Query database with filters
    const filters = { grade, subject, unit, search };
    // console.log("Fetching resources with filters:", filters);

    return NextResponse.json({
      success: true,
      resources: [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const grade = formData.get("grade") as string;
    const unit = formData.get("unit") as string;
    const subject = formData.get("subject") as string;
    const type = formData.get("type") as string;
    const tags = (formData.get("tags") as string)?.split(",") || [];
    const externalUrl = formData.get("externalUrl") as string;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { success: false, message: "Title and type are required" },
        { status: 400 }
      );
    }

    // TODO: Save file if uploaded
    // TODO: Save resource to database
    // NOTE: Resource creation is stubbed - implement database storage before using in production

    const newResource = {
      id: crypto.randomUUID(),
      title,
      description,
      grade,
      unit,
      subject,
      type,
      tags,
      fileUrl: null,
      externalUrl,
      uploadedAt: new Date(),
      createdBy: "admin",
    };

    return NextResponse.json({
      success: true,
      message: "Resource created successfully",
      resource: newResource,
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
