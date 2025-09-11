import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";

/**
 * Parses AI output with <<<FILE /path/to/file>>> delimiters
 * Returns { "/path": { code: "..." }, ... }
 */
function parseDelimitedFiles(text) {
  if (!text || typeof text !== "string") return null;

  const regex = /<<<FILE\s+(.+?)>>>([\s\S]*?)(?=(?:<<<FILE\s)|$)/g;
  const files = {};
  let match;

  while ((match = regex.exec(text)) !== null) {
    let content = match[2].replace(/^[\r\n]+|[\r\n]+$/g, ""); // trim
    // REMOVE triple backticks and optional language tags
    content = content.replace(/^```(?:\w+)?\n?/, "").replace(/```$/, "");
    const path = match[1].trim().startsWith("/") ? match[1].trim() : `/${match[1].trim()}`;
    files[path] = { code: content };
  }

  return Object.keys(files).length ? files : null;
}


export async function POST(req) {
  try {
    const { prompt } = await req.json();

    console.log("[AI Role] Acting as Full-Stack Architect + Developer");

    // Call AI to generate full project code
    const rawCode = await GenAiCode(prompt);

    console.log("[AI Role] Raw code received from AI");

    // Parse multi-file code output
    const files = parseDelimitedFiles(rawCode);

    if (!files) {
      console.warn("[AI Role] No files parsed, returning raw output");
      return NextResponse.json({ files: null, raw: rawCode });
    }

    console.log(`[AI Role] Parsed ${Object.keys(files).length} files successfully`);

    return NextResponse.json({ files, raw: rawCode });
  } catch (err) {
    console.error("[AI Role] /api/gen-ai-code error:", err);
    return NextResponse.json({ error: err?.message || String(err) });
  }
}
