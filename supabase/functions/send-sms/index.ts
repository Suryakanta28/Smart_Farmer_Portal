// Supabase Edge Function: send-sms (MSG91 Integration)
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
    const { phone, message, type = "transactional" } = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "phone and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("MSG91_API_KEY");

    // If real MSG91 API key is present, forward to MSG91 API
    if (apiKey && apiKey !== "demo_msg91_key") {
      const response = await fetch("https://api.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "authkey": apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          mobiles: phone.replace("+91", "").replace(/\s+/g, ""),
          message: message,
          sender: "KRIFLO"
        })
      });

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, provider: "msg91_live", data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // High fidelity hackathon simulation
    console.log(`[KRISHIFLOW-SMS] To: ${phone} | Content: ${message}`);
    return new Response(
      JSON.stringify({
        success: true,
        provider: "msg91_simulated",
        phone,
        message,
        timestamp: new Date().toISOString(),
        message_id: `MSG91-${Date.now()}`
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
