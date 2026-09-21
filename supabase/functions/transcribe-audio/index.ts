// Supabase Edge Function: transcribe-audio (OpenAI Whisper)
// Smart India Hackathon 2026 - KRISHIFLOW-AI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const formData = await req.formData();
    const audioFile = formData.get("file");

    if (apiKey && apiKey !== "demo_openai_key" && audioFile) {
      const openAiFormData = new FormData();
      openAiFormData.append("file", audioFile);
      openAiFormData.append("model", "whisper-1");
      openAiFormData.append("language", "hi");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
        body: openAiFormData
      });

      const data = await response.json();
      return new Response(
        JSON.stringify({ text: data.text, command: { type: "query" } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default realistic audio voice command transcription for SIH demo
    return new Response(
      JSON.stringify({
        text: "मैं धान की खरीद के लिए स्लॉट बुक करना चाहता हूँ",
        translation_en: "I want to book a slot for paddy procurement",
        command: { type: "book_slot", crop: "Paddy" }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
