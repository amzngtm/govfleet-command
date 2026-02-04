import { GoogleGenAI } from "@google/genai";
import { UserProfile, Vehicle, Trip } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const analyzeIncident = async (incidentDescription: string, vehicleModel: string): Promise<string> => {
  if (!apiKey) return "AI Analysis Unavailable: No API Key configured.";

  try {
    const prompt = `
      Role: Senior Fleet Mechanic.
      Task: Analyze incident.
      Vehicle: ${vehicleModel}
      Issue: "${incidentDescription}"
      Output: JSON-like format with 'cause', 'action', 'severity_score' (1-10).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    return "Failed to generate AI analysis.";
  }
};

export const recommendDispatch = async (trip: Partial<Trip>, drivers: UserProfile[], vehicles: Vehicle[]): Promise<string> => {
  if (!apiKey) return "AI Recommendation Unavailable.";

  try {
    const availableDrivers = drivers.filter(d => d.status === 'ONLINE' && !d.assignedVehicleId);
    // For demo simplicity, we send a subset
    const context = {
      trip_request: {
        from: trip.pickupLocation,
        to: trip.dropoffLocation,
        priority: trip.priority
      },
      available_drivers: availableDrivers.map(d => ({ id: d.id, name: d.name, score: d.readinessScore, certs: d.certifications })),
      available_vehicles: vehicles.filter(v => v.status === 'ACTIVE').map(v => ({ id: v.id, model: v.model, type: v.type, fuel: v.fuelLevel }))
    };

    const prompt = `
      You are a Fleet Dispatch AI. Select the best Driver and Vehicle pair for this mission.
      
      Criteria:
      - VIP trips require >95 readiness score or VIP cert.
      - Ensure vehicle has enough fuel (>30%).
      - Match vehicle type to priority (SUV for VIP).
      
      Data: ${JSON.stringify(context)}
      
      Output ONLY a JSON object: { "recommendedDriverId": "...", "recommendedVehicleId": "...", "reasoning": "..." }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return response.text || "{}";
  } catch (e) {
    console.error(e);
    return JSON.stringify({ error: "AI Dispatch Failed" });
  }
}
