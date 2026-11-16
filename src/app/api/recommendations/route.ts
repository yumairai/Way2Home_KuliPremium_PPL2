import { NextResponse } from "next/server";
import {
  getAllDesignLocationScores,
  getDesigns,
} from "@/services/design.service";
import {
  recommendDesigns,
  type RecommendationInput,
} from "@/services/recommendation.service";
import { createClient } from "@/utils/supabase/server";

const priorities: RecommendationInput["priority"][] = [
  "biaya",
  "estetik",
  "cepat",
];

function isRecommendationInput(value: unknown): value is RecommendationInput {
  if (!value || typeof value !== "object") return false;

  const input = value as Record<string, unknown>;
  return (
    typeof input.location === "string" &&
    input.location.trim().length > 0 &&
    typeof input.style === "string" &&
    input.style.trim().length > 0 &&
    typeof input.area === "number" &&
    Number.isFinite(input.area) &&
    input.area > 0 &&
    typeof input.bedrooms === "number" &&
    Number.isInteger(input.bedrooms) &&
    input.bedrooms > 0 &&
    typeof input.floors === "number" &&
    Number.isInteger(input.floors) &&
    input.floors > 0 &&
    typeof input.budget === "number" &&
    Number.isFinite(input.budget) &&
    input.budget > 0 &&
    typeof input.flexibility === "number" &&
    Number.isFinite(input.flexibility) &&
    input.flexibility >= 0 &&
    priorities.includes(input.priority as RecommendationInput["priority"])
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "Silakan login untuk mendapatkan rekomendasi." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    if (!isRecommendationInput(body)) {
      return NextResponse.json(
        { message: "Input preferensi tidak lengkap atau tidak valid." },
        { status: 400 },
      );
    }

    const [designs, locationScores] = await Promise.all([
      getDesigns(supabase),
      getAllDesignLocationScores(supabase),
    ]);

    return NextResponse.json(recommendDesigns(designs, locationScores, body));
  } catch (error) {
    console.error("[POST /api/recommendations]", error);
    return NextResponse.json(
      { message: "Gagal membuat rekomendasi desain." },
      { status: 500 },
    );
  }
}
