// Two build modes from one codebase:
//
//   standalone (default) — self-contained Node server for the Docker image.
//   export               — fully static site for GitHub Pages (set
//                          NEXT_OUTPUT_MODE=export). Pages serves the repo
//                          under /satisfactory-calculator, so the Pages
//                          workflow also sets NEXT_PUBLIC_BASE_PATH.
const output = process.env.NEXT_OUTPUT_MODE === "export" ? "export" : "standalone";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output,
  basePath,
  // Plain <img> everywhere; disabling the optimizer keeps export mode happy
  // and changes nothing for the server build.
  images: { unoptimized: true },
  // Directory-style URLs (calculator/index.html) so GitHub Pages routes
  // /calculator/ without a server.
  trailingSlash: output === "export",
  eslint: {
    ignoreDuringBuilds: true
  },
  reactStrictMode: true,
  compiler: {
    styledComponents: true
  },
  // headers() needs a server; Next warns if it's present in export mode.
  // GitHub Pages sets its own baseline headers (incl. nosniff).
  ...(output === "export"
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
              ]
            },
            {
              source: "/data/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800"
                }
              ]
            }
          ];
        }
      })
};

export default nextConfig;
