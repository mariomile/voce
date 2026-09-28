import type { MetadataRoute } from "next"

// The landing page is the only page worth indexing. The app is behind a login, and a public form
// belongs to one workspace's customers: it is shared by link and QR code, not found by search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/research", "/billing", "/auth/", "/f/", "/api/"],
    },
  }
}
