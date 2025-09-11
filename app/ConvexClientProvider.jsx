"use client";

import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// ✅ Use Convex URL from .env.local
// NEXT_PUBLIC_CONVEX_URL must be set in environment variables
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ children }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error("❌ Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
