import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. Upload to Supabase Storage (Assumes 'payments' bucket exists)
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `screenshots/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payments")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return NextResponse.json({ error: "Failed to upload screenshot to storage" }, { status: 500 });
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from("payments")
      .getPublicUrl(filePath);

    // 3. Save to local_payments table
    const { error: dbError } = await supabase
      .from("local_payments")
      .insert({
        user_id: user.id,
        screenshot_url: publicUrl,
        status: 'pending'
      });

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "Failed to save payment record" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Payment screenshot submitted for verification" });

  } catch (error) {
    console.error("Local payment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
