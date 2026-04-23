import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  experimental: {
    // Replace deprecated middlewareClientMaxBodySize with proxyClientMaxBodySize
    proxyClientMaxBodySize: 50 * 1024 * 1024, // 50MB
  },
  /**
   * Makes Next treat normal browsers like "HTML-limited bots" for metadata streaming.
   * That disables the streamed-metadata `<div hidden>` wrapper (see Next MetadataWrapper),
   * which otherwise hydrates with mismatches when security extensions inject attributes
   * like `bis_skin_checked` before React loads.
   */
  htmlLimitedBots: /.*/,
}

export default nextConfig
