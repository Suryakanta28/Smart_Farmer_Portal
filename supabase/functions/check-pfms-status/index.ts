// Supabase Edge Function: check-pfms-status
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
    const { gate_pass_id, payment_id } = await req.json();

    const statuses = ["initiated", "processing", "credited"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const mockAmount = 117612.50;
    const txnId = `PFMS-OD-${Date.now()}`;
    const bankRef = `SBIN00${Math.floor(100000 + Math.random() * 900000)}`;

    return new Response(
      JSON.stringify({
        status: randomStatus,
        amount: mockAmount,
        transaction_id: txnId,
        bank_ref_number: bankRef,
        gate_pass_id: gate_pass_id || "GP-2026-9041",
        credited_date: randomStatus === "credited" ? new Date().toLocaleDateString("en-IN") : null,
        message: randomStatus === "credited" ? "Direct Benefit Transfer credited successfully to farmer bank account" : "PFMS clearing in progress"
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
