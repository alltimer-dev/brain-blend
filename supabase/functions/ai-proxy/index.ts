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
    let responseData: any;

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

      responseData = await res.json();
      if (!res.ok) {
        console.error("xAI error", responseData);
        const errorMessage = `xAI API Error (${res.status}): ${responseData?.error?.message || responseData?.error || "Request failed"}`;
        const detailedError = new Error(errorMessage);
        (detailedError as any).statusCode = res.status;
        (detailedError as any).details = responseData;
        throw detailedError;
      }
      generatedText = responseData?.choices?.[0]?.message?.content ?? "";
    } else {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) throw new Error("Missing OPENAI_API_KEY secret");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          // GPT-5 and newer models use max_completion_tokens instead of max_tokens
          // and don't support temperature parameter
          ...(model.startsWith('gpt-5') || model.startsWith('gpt-4.1') || model.startsWith('o3') || model.startsWith('o4') 
            ? { max_completion_tokens: 4000 }
            : { max_tokens: 4000, temperature: 0.7 }
          )
        }),
      });

      responseData = await res.json();
      if (!res.ok) {
        console.error("OpenAI error", responseData);
        const errorMessage = `OpenAI API Error (${res.status}): ${responseData?.error?.message || responseData?.error || "Request failed"}`;
        const detailedError = new Error(errorMessage);
        (detailedError as any).statusCode = res.status;
        (detailedError as any).details = responseData;
        throw detailedError;
      }
      generatedText = responseData?.choices?.[0]?.message?.content ?? "";
    }

    return new Response(JSON.stringify({ 
      generatedText, 
      model: responseData?.model,
      usage: responseData?.usage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error in ai-proxy:", e);
    
    // Return detailed error information for debugging
    const errorDetails = {
      error: String((e as Error).message || e),
      statusCode: (e as any)?.statusCode || 500,
      details: (e as any)?.details || null,
      timestamp: new Date().toISOString(),
      model: (req.method === 'POST' ? ((await req.clone().json()).model) : "unknown") || "unknown"
    };
    
    return new Response(JSON.stringify(errorDetails), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
