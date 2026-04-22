import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabaseadmin";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmac = crypto.createHmac("sha256", process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "");
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(req.headers.get("x-signature") || "", "utf8");

    if (!crypto.timingSafeEqual(digest, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    const userId = customData?.user_id;

    if (!userId) {
      console.error("No user_id found in webhook payload custom_data");
      return NextResponse.json({ error: "No user_id found" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    if (eventName === "order_created" || eventName === "subscription_created") {
      // Upgrade user to PRO plan
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ plan: "PRO", updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      console.log(`User ${userId} upgraded to PRO via ${eventName}`);
    }

    if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      // Downgrade user to FREE plan
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ plan: "FREE", updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      console.log(`User ${userId} downgraded to FREE via ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed" },
      { status: 500 }
    );
  }
}
