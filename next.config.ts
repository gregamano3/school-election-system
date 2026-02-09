import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    // CSP configuration
    // Allow: self, Google Fonts, Material Symbols, Next.js assets
    const isDev = process.env.NODE_ENV === "development";
    const csp = [
      "default-src 'self'",
      // Scripts: 
      // - In dev: allow unsafe-inline and unsafe-eval for Next.js Turbopack hot reload
      // - In prod: only self (no inline scripts, external script files only)
      `script-src 'self'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : ""}`,
      // Styles: unsafe-inline needed for Tailwind CSS, Google Fonts for external stylesheets
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: Google Fonts and data URIs
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self, data URIs, and blob (for candidate photos/uploads)
      "img-src 'self' data: blob:",
      // API calls: same origin only
      "connect-src 'self'",
      // Frame ancestors: same origin (prevents clickjacking)
      "frame-ancestors 'self'",
      // Base URI: prevent base tag injection
      "base-uri 'self'",
      // Form actions: same origin only
      "form-action 'self'",
      // No plugins (Flash, etc.)
      "object-src 'none'",
      // Media: same origin
      "media-src 'self'",
      // Workers: self and blob (for Next.js)
      "worker-src 'self' blob:",
      // Manifest: same origin
      "manifest-src 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
