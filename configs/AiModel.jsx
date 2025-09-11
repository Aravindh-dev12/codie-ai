import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const codeGenerationConfig = {
  model: "gpt-4o-mini",
  temperature: 1,
  top_p: 0.95,
  max_tokens: 8192,
};

/**
 * AI Role: Full-Stack Architect & Developer
 * Responsibilities:
 * - Analyze user prompt requirements
 * - Choose the correct frontend, backend, and database stack
 * - Generate full production-ready project structure and code files
 * - Include optional libraries only if requested (Tailwind, lucide-react icons, date-fns, chart libraries, firebase, generative AI)
 */
export async function GenAiCode(userPrompt) {
  try {
    const response = await openai.chat.completions.create({
      ...codeGenerationConfig,
      messages: [
        {
          role: "system",
          content: `
            You are a **full-stack architect and developer AI**. 
            Your role is to:
            1. Analyze the user's requirements.
            2. Decide the correct technology stack (frontend, backend, database).
            3. Generate a full production-ready project with actual code files.
            4. Include multiple components and organize folders logically.
            5. Use Tailwind CSS, React, Node.js/Express, MongoDB where appropriate.
            6. Add icons, charts, or date handling only if needed.
            7. Format output using <<<FILE /path/to/file>>> delimiters for multi-file parsing.
            8. Include emojis or UI improvements for better UX.
            9. ⚠️ Do NOT generate default files like index.html or styles.css automatically. 
               Only create files explicitly required by the user’s prompt.
          `,
        },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response?.choices?.[0]?.message?.content ?? "";
    return raw; // Multi-file code with <<<FILE>>> delimiters
  } catch (err) {
    console.error("GenAiCode error:", err);
    return "Error generating project code.";
  }
}
