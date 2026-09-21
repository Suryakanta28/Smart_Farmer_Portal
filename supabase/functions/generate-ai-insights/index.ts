// Supabase Edge Function: generate-ai-insights (OpenAI GPT-4 for Manager Dashboard)
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
    const { centre_id, stats } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (apiKey && apiKey !== "demo_openai_key") {
      const prompt = `You are the chief procurement analyst for KrishiFlow-AI (Smart India Hackathon 2026).
Analyze this procurement data: ${JSON.stringify(stats || {})}
Generate 5 sharp operational insights in Hindi and English focusing on:
1. Crop procurement surges
2. Mandi congestion & waiting queues
3. Vehicle allocation bottlenecks
4. Direct Benefit Transfer payments pending
5. Offline farmer assistance volume.
Return clean JSON array with fields: { id, icon, category, title_hi, title_en, description_hi, description_en, severity, action_recommendation }`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      return new Response(data.choices[0].message.content, {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // High quality predefined insights for SIH 2026 presentation
    const insights = [
      {
        id: "ins-01",
        icon: "TrendingUp",
        category: "Procurement Growth",
        title_hi: "📈 धान और गेहूं खरीद में 35% की भारी वृद्धि दर्ज",
        title_en: "📈 Grain procurement surged by 35% across Bargarh & Karnal",
        description_hi: "अकेले अट्टाबिरा केंद्र पर 450 मीट्रिक टन की दैनिक आवक दर्ज की गई है।",
        description_en: "Daily intake at Attabira Regulated Market Yard reached 450 MT.",
        severity: "success",
        action: "Deploy 4 additional digital weighing bridges."
      },
      {
        id: "ins-02",
        icon: "AlertTriangle",
        category: "Congestion Alert",
        title_hi: "⚠️ कटक और नीलोखेड़ी केंद्र पर प्रतीक्षा समय 240 मिनट पहुंचा",
        title_en: "⚠️ Cuttack & Nilokheri Mandi experiencing 240 min peak wait",
        description_hi: "दोपहर 12 से 3 बजे के बीच स्लॉट अधिक बुक हैं, किसानों को सुबह 8 बजे का स्लॉट आवंटित करें।",
        description_en: "Queue backlog between 12-3 PM. Auto-diverting upcoming slots to morning shift.",
        severity: "warning",
        action: "Enable dynamic shift extensions and overflow holding yards."
      },
      {
        id: "ins-03",
        icon: "Truck",
        category: "Logistics Optimization",
        title_hi: "🚚 वाहन मांग पूर्वानुमान: 300 आवश्यक, 200 वर्तमान में सक्रिय",
        title_en: "🚚 Vehicle Deficit Alert: 300 required, 200 currently deployed",
        description_hi: "संबलपुर क्षेत्र में 100 अतिरिक्त ट्रॉलियों को तत्काल अनुबंधित करने की सिफारिश।",
        description_en: "High farmer pickup requests detected in Sambalpur; dispatching reserve fleet.",
        severity: "danger",
        action: "Approve 20 auxiliary transport partners from registered societies."
      },
      {
        id: "ins-04",
        icon: "DollarSign",
        category: "DBT Payouts",
        title_hi: "💰 12 किसानों का PFMS भुगतान 72 घंटे से अधिक समय से लंबित",
        title_en: "💰 12 DBT bank settlements pending >72 hours due to IFSC mismatch",
        description_hi: "अधिकारियों को बैंक विवरण पुनः सत्यापित करने हेतु एसएमएस अलर्ट जारी किया गया।",
        description_en: "Automated batch reconciliation triggered with State Bank PFMS gateway.",
        severity: "warning",
        action: "Notify society officers for swift IFSC bank re-verification."
      },
      {
        id: "ins-05",
        icon: "Users",
        category: "Offline Inclusion",
        title_hi: "📵 8 ऑफलाइन किसान सहायता अनुरोध सफलतापूर्वक टोकन में परिवर्तित",
        title_en: "📵 8 Offline farmer registrations verified and tokens dispatched",
        description_hi: "सोसाइटी अधिकारियों द्वारा 8 गैर-स्मार्टफोन धारक किसानों को क्यूआर पर्ची जारी।",
        description_en: "Society PACS officers generated instant token slips with SMS to family contacts.",
        severity: "info",
        action: "Sync paper tokens with central queue scanner."
      }
    ];

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
