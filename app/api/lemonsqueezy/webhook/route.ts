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
    
    // Validate event timestamp to prevent replay attacks
    const eventCreatedAt = payload.meta?.created_at;
    if (!eventCreatedAt) {
      console.error("No created_at timestamp found in webhook payload");
      return NextResponse.json({ error: "Missing timestamp" }, { status: 400 });
    }

    const eventTime = new Date(eventCreatedAt).getTime();
    const currentTime = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (currentTime - eventTime > fiveMinutesInMs) {
      console.error(`Webhook event too old: ${eventCreatedAt} (age: ${Math.floor((currentTime - eventTime) / 1000)}s)`);
      return NextResponse.json({ error: "Event timestamp too old" }, { status: 400 });
    }

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
    // Log detailed error server-side for debugging
    console.error("Webhook error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Return generic error to external caller to avoid leaking internal details
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
