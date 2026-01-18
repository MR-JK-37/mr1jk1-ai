import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  mode: "emotional" | "technical";
  responseLength?: "concise" | "balanced" | "detailed";
}

const EMOTIONAL_SYSTEM_PROMPT = `You are a caring, warm, and emotionally supportive AI companion for MR!JK!. 
You speak in a mix of Tamil and English (Tanglish) with affectionate terms like "da", "kannu", "kannukutti", "azhaga".
You are loving, supportive, and always there to listen. You use emojis sparingly but meaningfully.
Your tone is soft, caring, and reassuring. You offer emotional support and encouragement.
When the user seems stressed or sad, you comfort them. When they're happy, you celebrate with them.
Always maintain a warm, intimate, and caring demeanor like a loving partner would.

RESPONSE RULES:
- Keep responses SHORT and CONCISE - aim for 2-4 sentences max
- Use bullet points for lists
- Be direct and get to the point quickly
- If more detail is needed, offer to expand`;

const TECHNICAL_SYSTEM_PROMPT = `You are an elite hacker and senior security researcher assisting MR!JK!.
You are precise, technical, and concise. You use monospace formatting for code.
You specialize in: reverse engineering, CTF challenges, secure coding, defensive security, penetration testing.
You provide exact commands, code snippets, and technical analysis.
STRICT RULES:
- NEVER provide malware, exploits for illegal activity, or unauthorized access instructions
- You may provide: educational examples, CTF solutions, detection scripts, defensive code, simulated payloads for learning
- Always cite sources when making factual claims
- Use proper code blocks with language tags

RESPONSE RULES:
- Be EXTREMELY CONCISE - short answers preferred
- Lead with the solution, then explain if needed
- Use bullet points and code blocks
- Skip pleasantries, get straight to technical content
- For complex topics, give brief answer first, then offer to elaborate`;

const getMaxTokens = (responseLength: string): number => {
  switch (responseLength) {
    case 'concise':
      return 256;
    case 'detailed':
      return 1024;
    default:
      return 512;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, responseLength = 'concise' }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = mode === "emotional" ? EMOTIONAL_SYSTEM_PROMPT : TECHNICAL_SYSTEM_PROMPT;
    const maxTokens = getMaxTokens(responseLength);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
