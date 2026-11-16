import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const MAX_CV_SIZE = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readText(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  const text = typeof value === "string" ? value.trim() : "";
  return text.length <= maxLength ? text : "";
}

export async function POST(request: Request) {
  let createdUserId: string | undefined;
  let adminClient: ReturnType<typeof createAdminClient> | null = null;

  try {
    adminClient = createAdminClient();
    const supabase = adminClient;
    const formData = await request.formData();
    const name = readText(formData, "name", 120);
    const email = readText(formData, "email", 254).toLowerCase();
    const phone = readText(formData, "phone", 20);
    const password = formData.get("password");
    const expertise = readText(formData, "expertise", 80);
    const experience = Number(readText(formData, "experience", 2));
    const area = readText(formData, "area", 120);
    const skills = readText(formData, "skills", 300);
    const summary = readText(formData, "experienceSummary", 1000);
    const previousProjects = readText(formData, "previousProjects", 1000);
    const termsAccepted = formData.get("terms") === "true";
    const cv = formData.get("cv");

    if (
      name.length < 2 ||
      !EMAIL_PATTERN.test(email) ||
      !/^[0-9]{10,14}$/.test(phone.replace(/\D/g, "")) ||
      typeof password !== "string" ||
      password.length < 8 ||
      !termsAccepted ||
      !expertise ||
      !Number.isInteger(experience) ||
      experience < 0 ||
      experience > 60 ||
      area.length < 2 ||
      skills.length < 3 ||
      summary.length < 20 ||
      previousProjects.length < 5
    ) {
      return NextResponse.json(
        { message: "Data pendaftaran belum lengkap atau tidak valid." },
        { status: 400 },
      );
    }

    if (
      !(cv instanceof File) ||
      cv.size === 0 ||
      cv.size > MAX_CV_SIZE ||
      cv.type !== "application/pdf" ||
      !cv.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { message: "CV harus berupa PDF dengan ukuran maksimal 5 MB." },
        { status: 400 },
      );
    }
    const signature = new Uint8Array(await cv.slice(0, 5).arrayBuffer());
    if (new TextDecoder().decode(signature) !== "%PDF-") {
      return NextResponse.json(
        { message: "Isi file CV bukan dokumen PDF yang valid." },
        { status: 400 },
      );
    }

    const keahlianList = [
      expertise,
      ...skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    ];

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "mandor" },
        user_metadata: {
          role: "mandor",
          full_name: name,
          phone,
          keahlian: keahlianList,
          pengalaman_tahun: experience,
          area_kerja: area,
          ringkasan_pengalaman: summary,
          proyek_sebelumnya: previousProjects,
        },
      });

    if (createError || !created.user) {
      const emailExists =
        createError?.message.toLowerCase().includes("already") ||
        createError?.message.toLowerCase().includes("registered");
      return NextResponse.json(
        {
          message: emailExists
            ? "Email sudah terdaftar."
            : `Gagal membuat akun: ${createError?.message || "Silakan coba kembali."}`,
        },
        { status: 400 },
      );
    }
    createdUserId = created.user.id;

    // Pastikan profiles memiliki role 'mandor'
    await supabase
      .from("profiles")
      .update({ role: "mandor", full_name: name, phone })
      .eq("id", created.user.id);

    const cvPath = `${created.user.id}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("mandor-cvs")
      .upload(cvPath, await cv.arrayBuffer(), {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Gagal menyimpan CV ke storage: ${uploadError.message}`);
    }

    // Perbarui mandor_profiles jika trigger sudah membuatnya
    const { data: savedProfile, error: profileError } = await supabase
      .from("mandor_profiles")
      .update({
        cv_path: cvPath,
        keahlian: keahlianList,
        pengalaman_tahun: experience,
        area_kerja: area,
        ringkasan_pengalaman: summary,
        proyek_sebelumnya: previousProjects,
      })
      .eq("id", created.user.id)
      .select("id")
      .maybeSingle();

    // Jika trigger belum menyisipkan baris, lakukan upsert langsung
    if (!savedProfile) {
      const { error: upsertError } = await supabase
        .from("mandor_profiles")
        .upsert({
          id: created.user.id,
          keahlian: keahlianList,
          pengalaman_tahun: experience,
          area_kerja: area,
          ringkasan_pengalaman: summary,
          proyek_sebelumnya: previousProjects,
          cv_path: cvPath,
          status: "pending",
        });

      if (upsertError) {
        const { error: removeError } = await supabase.storage
          .from("mandor-cvs")
          .remove([cvPath]);
        if (removeError) {
          console.error("Gagal membersihkan CV pendaftaran mandor:", removeError);
        }
        throw new Error(
          `Gagal menyimpan profil mandor: ${upsertError.message || profileError?.message || "Trigger database tidak membuat baris mandor_profiles"}`,
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    if (createdUserId && adminClient) {
      const { error: cleanupError } =
        await adminClient.auth.admin.deleteUser(createdUserId);
      if (cleanupError) {
        console.error(
          "Gagal membersihkan akun pendaftaran mandor:",
          cleanupError,
        );
      }
    }
    console.error("Error in POST /api/mandor/register:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Pendaftaran gagal diproses. Silakan coba kembali.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Method GET tidak didukung pada endpoint pendaftaran mandor." },
    { status: 405 },
  );
}
