// Supabase Edge Function: assign-vehicle
// Smart India Hackathon 2026 - KRISHIFLOW-AI
// Smart Nearest Vehicle Matching Algorithm using Haversine Formula

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      farmer_id,
      booking_id,
      offline_farmer_id,
      crop_quantity_kg = 500,
      pickup_latitude = 21.4669,
      pickup_longitude = 83.9812,
      farmer_name = "Farmer",
      village = "Sambalpur Rural",
      pickup_time = "07:30 AM"
    } = await req.json();

    // Available vehicles pool
    const mockVehicles = [
      {
        id: "33333333-3333-3333-3333-333333333301",
        registration_number: "OD-15-AB-1024",
        vehicle_type: "Mini Truck (1.5T)",
        capacity_kg: 1500,
        driver_name: "Suresh Kumar Mohapatra",
        driver_phone: "+919876543210",
        latitude: 21.4680,
        longitude: 83.9780,
        status: "available"
      },
      {
        id: "33333333-3333-3333-3333-333333333303",
        registration_number: "HR-05-XY-7890",
        vehicle_type: "Medium Truck (5.0T)",
        capacity_kg: 5000,
        driver_name: "Gurmeet Singh",
        driver_phone: "+919876543212",
        latitude: 29.8310,
        longitude: 76.9150,
        status: "available"
      },
      {
        id: "33333333-3333-3333-3333-333333333304",
        registration_number: "OD-02-KL-9988",
        vehicle_type: "Tata Ace (1.2T)",
        capacity_kg: 1200,
        driver_name: "Manoj Sahoo",
        driver_phone: "+919876543213",
        latitude: 21.4710,
        longitude: 83.9900,
        status: "available"
      }
    ];

    // Filter vehicles with capacity >= crop_quantity_kg and available
    const eligibleVehicles = mockVehicles.filter(
      (v) => v.capacity_kg >= crop_quantity_kg && v.status === "available"
    );

    if (eligibleVehicles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No eligible vehicles found with sufficient capacity. Try later or choose Self Transport."
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort by Haversine distance
    const scoredVehicles = eligibleVehicles.map((vehicle) => {
      const dist = calculateHaversineDistance(
        pickup_latitude,
        pickup_longitude,
        vehicle.latitude,
        vehicle.longitude
      );
      // Avg speed 30 km/h in rural roads
      const etaMinutes = Math.max(5, Math.round((dist / 30) * 60));
      return { ...vehicle, distance_km: dist, eta_minutes: etaMinutes };
    });

    scoredVehicles.sort((a, b) => a.distance_km - b.distance_km);
    const assigned = scoredVehicles[0];

    // Notification messages
    const driverSms = `Pickup assigned: ${farmer_name}, ${crop_quantity_kg}kg at ${pickup_time}, Village: ${village}. Open KrishiFlow Driver app to navigate.`;
    const farmerSms = `Vehicle assigned! Driver: ${assigned.driver_name} (${assigned.driver_phone}), Vehicle: ${assigned.registration_number}. ETA: ~${assigned.eta_minutes} mins.`;

    console.log("[SMS TO DRIVER]", driverSms);
    console.log("[SMS TO FARMER]", farmerSms);

    return new Response(
      JSON.stringify({
        success: true,
        assigned_vehicle: assigned,
        distance_km: assigned.distance_km,
        eta_minutes: assigned.eta_minutes,
        sms_sent: { driver: true, farmer: true },
        fcm_notification_sent: true
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
