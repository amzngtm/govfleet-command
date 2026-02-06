import { UserProfile, Vehicle, Trip } from "../types";

export const analyzeIncident = async (
  incidentDescription: string,
  vehicleModel: string,
): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/analyze-incident", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incidentDescription,
        vehicleModel,
      }),
    });

    if (!response.ok) {
      return "AI Analysis Unavailable: Service error.";
    }

    const data = await response.json();
    return data.analysis || "No analysis generated.";
  } catch (error) {
    return "Failed to generate AI analysis.";
  }
};

export const recommendDispatch = async (
  trip: Partial<Trip>,
  drivers: UserProfile[],
  vehicles: Vehicle[],
): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/recommend-dispatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trip,
        drivers,
        vehicles,
      }),
    });

    if (!response.ok) {
      return JSON.stringify({ error: "AI Dispatch Unavailable" });
    }

    const data = await response.json();
    return JSON.stringify(data) || "{}";
  } catch (e) {
    console.error(e);
    return JSON.stringify({ error: "AI Dispatch Failed" });
  }
};
