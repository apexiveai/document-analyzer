import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabaseServer";
import { createLemonSqueezyCheckout } from "@/lib/billing/lemonsqueezy";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkoutUrl = await createLemonSqueezyCheckout({
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email || "",
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout creation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create checkout",
      },
      { status: 500 },
    );
  }
}
