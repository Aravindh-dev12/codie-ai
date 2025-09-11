import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    picture: v.optional(v.string()),
    uid: v.optional(v.string()),
    token: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }),
  workspaces: defineTable({
    messages: v.any(), // message can be any JSON object
    fileData: v.optional(v.any()), // fileData can be any JSON object
    user: v.id("users"), // user is id of users table
  }),
});
