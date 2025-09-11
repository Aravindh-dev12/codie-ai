// app/api/ai-chat/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const result = response?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (e) {
    console.error("/api/ai-chat error:", e);
    return NextResponse.json({ error: e?.message ?? String(e) });
  }
}
