import { ValidationError, ExternalServiceError } from "@/lib/errorHandling"

export async function createLemonSqueezyCheckout(params: {
    userId: string
    email?: string
    name?: string
  }) {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
  
    if (!apiKey || !storeId || !variantId || !appUrl) {
      throw new ValidationError(
        "Missing Lemon Squeezy env vars. Check API key, store ID, variant ID, and app URL."
      )
    }
  
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_options: {
              embed: false,
              media: true,
              logo: true,
            },
            checkout_data: {
              email: params.email,
              name: params.name,
              custom: {
                user_id: params.userId,
                source: "document-analyzer",
              },
            },
            product_options: {
              redirect_url: `${appUrl}/dashboard?upgraded=1`,
              receipt_button_text: "Back to Dashboard",
              receipt_link_url: `${appUrl}/dashboard?upgraded=1`,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: String(storeId),
              },
            },
            variant: {
              data: {
                type: "variants",
                id: String(variantId),
              },
            },
          },
        },
      }),
    })
  
    if (!response.ok) {
      const errorText = await response.text()
      throw new ExternalServiceError(
        "Lemon Squeezy",
        `Failed to create checkout (HTTP ${response.status} ${response.statusText}): ${errorText}`
      )
    }
  
    const json = await response.json()
    return json?.data?.attributes?.url as string
  }