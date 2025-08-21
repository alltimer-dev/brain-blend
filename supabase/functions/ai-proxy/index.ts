import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, messages } = await req.json();
    if (!model || !messages) {
      return new Response(JSON.stringify({ error: "Missing model or messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let generatedText = "";

    if (String(model).startsWith("grok")) {
      const xaiKey = Deno.env.get("XAI_API_KEY");
      if (!xaiKey) throw new Error("Missing XAI_API_KEY secret");

      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${xaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("xAI error", data);
        throw new Error(data?.error?.message || "xAI request failed");
      }
      generatedText = data?.choices?.[0]?.message?.content ?? "";
    } else {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) throw new Error("Missing OPENAI_API_KEY secret");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("OpenAI error", data);
        throw new Error(data?.error?.message || "OpenAI request failed");
      }
      generatedText = data?.choices?.[0]?.message?.content ?? "";
    }

    return new Response(JSON.stringify({ 
      generatedText, 
      model: data?.model,
      usage: data?.usage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error in ai-proxy:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
