/** @type {import('next').NextConfig} */

// Hardening against empty strings in Netlify dashboard
const fallbackUrl = "https://ecommerce-admin.netlify.app";
["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_API_URL"].forEach((key) => {
  if (!process.env[key] || process.env[key].trim() === "") {
    if (key === "NEXT_PUBLIC_API_URL") {
      process.env[key] = "http://localhost:9000/api/v1";
    } else {
      process.env[key] = fallbackUrl;
    }
  }
});

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
}
module.exports = nextConfig
