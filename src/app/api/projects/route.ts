import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createProjectWithDocuments } from "@/services/project.service";
import { ServiceError } from "@/services/access.service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();

    const result = await createProjectWithDocuments(supabase, formData);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      const errData = error.data as { errors?: Record<string, string>; projectId?: string } | undefined;
      if (error.status === 422) {
        return NextResponse.json(
          { message: error.message, errors: errData?.errors || {} },
          { status: 422 }
        );
      }
      if (error.status === 409) {
        return NextResponse.json(
          { message: error.message, projectId: errData?.projectId },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    console.error("Error in POST /api/projects:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { message: err?.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
