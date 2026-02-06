// Predictive Maintenance AI Service
// ML-based预测 vehicle maintenance needs

import { Vehicle, Incident, WorkOrder } from "../types";

export interface MaintenancePrediction {
  vehicleId: string;
  riskScore: number; // 0-100
  predictedIssues: PredictedIssue[];
  recommendedActions: string[];
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedDaysUntilFailure: number;
  confidence: number; // 0-1
}

export interface PredictedIssue {
  component: string;
  probability: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  estimatedRepairCost?: number;
}

// Maintenance thresholds based on vehicle type
const MAINTENANCE_THRESHOLDS = {
  SEDAN: {
    oilChangeMiles: 5000,
    tireRotationMiles: 7500,
    brakeServiceMiles: 25000,
    transmissionServiceMiles: 60000,
    majorServiceMiles: 100000,
  },
  SUV: {
    oilChangeMiles: 5000,
    tireRotationMiles: 6000,
    brakeServiceMiles: 30000,
    transmissionServiceMiles: 60000,
    majorServiceMiles: 120000,
  },
  TRUCK: {
    oilChangeMiles: 7500,
    tireRotationMiles: 5000,
    brakeServiceMiles: 35000,
    transmissionServiceMiles: 50000,
    majorServiceMiles: 150000,
  },
  SPECIALTY: {
    oilChangeMiles: 5000,
    tireRotationMiles: 5000,
    brakeServiceMiles: 20000,
    transmissionServiceMiles: 40000,
    majorServiceMiles: 80000,
  },
};

// Simulated ML model weights (in production, this would be a trained model)
const RISK_WEIGHTS = {
  mileageAge: 0.25,
  incidentHistory: 0.3,
  fuelEfficiency: 0.15,
  idleTime: 0.1,
  age: 0.2,
};

// Calculate risk score for a vehicle
export const calculateRiskScore = (vehicle: Vehicle): number => {
  let riskScore = 0;

  // Mileage-based risk
  const mileageThreshold =
    MAINTENANCE_THRESHOLDS[vehicle.type]?.majorServiceMiles || 100000;
  const mileageRisk = Math.min(vehicle.mileage / mileageThreshold, 1) * 100;
  riskScore += mileageRisk * RISK_WEIGHTS.mileageAge;

  // Age-based risk (assuming vehicle age in years)
  const vehicleAge = calculateVehicleAge(vehicle);
  const ageRisk = Math.min(vehicleAge / 10, 1) * 100; // Max risk at 10 years
  riskScore += ageRisk * RISK_WEIGHTS.age;

  // Fuel efficiency risk (low fuel level + high mileage = wear)
  if (vehicle.fuelLevel < 20) {
    riskScore += 15 * RISK_WEIGHTS.fuelEfficiency;
  }

  // Idle time risk (high standby = engine wear)
  if (vehicle.standbyTime && vehicle.standbyTime > 60) {
    riskScore +=
      Math.min(vehicle.standbyTime / 120, 1) * 20 * RISK_WEIGHTS.idleTime;
  }

  return Math.round(Math.min(riskScore, 100));
};

// Predict specific issues
export const predictIssues = (vehicle: Vehicle): PredictedIssue[] => {
  const issues: PredictedIssue[] = [];
  const thresholds =
    MAINTENANCE_THRESHOLDS[vehicle.type] || MAINTENANCE_THRESHOLDS.SEDAN;

  // Oil condition
  const oilPercentage =
    (vehicle.mileage % thresholds.oilChangeMiles) / thresholds.oilChangeMiles;
  if (oilPercentage > 0.8) {
    issues.push({
      component: "Engine Oil",
      probability: 0.9,
      severity: "HIGH",
      description: "Oil change recommended within current operating range",
      estimatedRepairCost: 150,
    });
  } else if (oilPercentage > 0.6) {
    issues.push({
      component: "Engine Oil",
      probability: 0.5,
      severity: "MEDIUM",
      description: "Oil change approaching recommended interval",
      estimatedRepairCost: 150,
    });
  }

  // Brake wear
  const brakePercentage =
    (vehicle.mileage % thresholds.brakeServiceMiles) /
    thresholds.brakeServiceMiles;
  if (brakePercentage > 0.85) {
    issues.push({
      component: "Brakes",
      probability: 0.95,
      severity: "CRITICAL",
      description: "Brake service overdue - safety critical",
      estimatedRepairCost: 800,
    });
  } else if (brakePercentage > 0.7) {
    issues.push({
      component: "Brakes",
      probability: 0.6,
      severity: "MEDIUM",
      description: "Brake inspection recommended",
      estimatedRepairCost: 800,
    });
  }

  // Tire wear
  const tirePercentage =
    (vehicle.mileage % thresholds.tireRotationMiles) /
    thresholds.tireRotationMiles;
  if (tirePercentage > 0.9) {
    issues.push({
      component: "Tires",
      probability: 0.8,
      severity: "HIGH",
      description: "Tire rotation/replacement needed",
      estimatedRepairCost: 1200,
    });
  }

  // Transmission
  const transPercentage =
    (vehicle.mileage % thresholds.transmissionServiceMiles) /
    thresholds.transmissionServiceMiles;
  if (transPercentage > 0.9) {
    issues.push({
      component: "Transmission",
      probability: 0.7,
      severity: "HIGH",
      description: "Transmission fluid service recommended",
      estimatedRepairCost: 400,
    });
  }

  return issues;
};

// Main prediction function
export const predictMaintenance = (
  vehicle: Vehicle,
  incidentHistory?: Incident[],
): MaintenancePrediction => {
  const riskScore = calculateRiskScore(vehicle);
  const predictedIssues = predictIssues(vehicle);

  // Calculate urgency based on risk and issues
  let urgencyLevel: MaintenancePrediction["urgencyLevel"] = "LOW";
  if (
    riskScore >= 80 ||
    predictedIssues.some((i) => i.severity === "CRITICAL")
  ) {
    urgencyLevel = "CRITICAL";
  } else if (
    riskScore >= 60 ||
    predictedIssues.some((i) => i.severity === "HIGH")
  ) {
    urgencyLevel = "HIGH";
  } else if (
    riskScore >= 40 ||
    predictedIssues.some((i) => i.severity === "MEDIUM")
  ) {
    urgencyLevel = "MEDIUM";
  }

  // Estimate days until potential failure
  const estimatedDaysUntilFailure = estimateDaysToFailure(
    riskScore,
    predictedIssues,
  );

  // Generate recommendations
  const recommendedActions = generateRecommendations(vehicle, predictedIssues);

  return {
    vehicleId: vehicle.id,
    riskScore,
    predictedIssues,
    recommendedActions,
    urgencyLevel,
    estimatedDaysUntilFailure,
    confidence: 0.85, // Placeholder for model confidence
  };
};

// Generate maintenance recommendations
const generateRecommendations = (
  vehicle: Vehicle,
  issues: PredictedIssue[],
): string[] => {
  const recommendations: string[] = [];

  if (issues.length === 0) {
    return [
      "Vehicle is in good condition - continue regular maintenance schedule",
    ];
  }

  issues.forEach((issue) => {
    if (issue.component === "Engine Oil") {
      recommendations.push(`Schedule oil change for ${vehicle.plate}`);
    }
    if (issue.component === "Brakes") {
      recommendations.push(
        `URGENT: Schedule brake inspection/service for ${vehicle.plate}`,
      );
    }
    if (issue.component === "Tires") {
      recommendations.push(
        `Schedule tire rotation or replacement for ${vehicle.plate}`,
      );
    }
    if (issue.component === "Transmission") {
      recommendations.push(
        `Schedule transmission fluid service for ${vehicle.plate}`,
      );
    }
  });

  return recommendations;
};

// Estimate failure timeline
const estimateDaysToFailure = (
  riskScore: number,
  issues: PredictedIssue[],
): number => {
  if (riskScore >= 80) return 7;
  if (riskScore >= 60) return 14;
  if (riskScore >= 40) return 30;
  return 90;
};

// Calculate vehicle age from service date
const calculateVehicleAge = (vehicle: Vehicle): number => {
  if (!vehicle.nextServiceDate) return 0;
  const serviceDate = new Date(vehicle.nextServiceDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - serviceDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
};

// Batch predict for all vehicles
export const predictAllVehicles = (
  vehicles: Vehicle[],
): Map<string, MaintenancePrediction> => {
  const predictions = new Map<string, MaintenancePrediction>();

  vehicles.forEach((vehicle) => {
    const prediction = predictMaintenance(vehicle);
    predictions.set(vehicle.id, prediction);
  });

  return predictions;
};

// Priority sorting for maintenance queue
export const getMaintenancePriority = (
  predictions: Map<string, MaintenancePrediction>,
): MaintenancePrediction[] => {
  return Array.from(predictions.values()).sort((a, b) => {
    // Sort by urgency first
    const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
      return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    }
    // Then by risk score
    return b.riskScore - a.riskScore;
  });
};

// Auto-generate work orders from predictions
export const autoGenerateWorkOrders = (
  predictions: Map<string, MaintenancePrediction>,
  vehicleMap: Map<string, Vehicle>,
): Partial<WorkOrder>[] => {
  const workOrders: Partial<WorkOrder>[] = [];

  predictions.forEach((prediction, vehicleId) => {
    if (
      prediction.urgencyLevel === "CRITICAL" ||
      prediction.urgencyLevel === "HIGH"
    ) {
      const vehicle = vehicleMap.get(vehicleId);
      if (vehicle) {
        const criticalIssue = prediction.predictedIssues.find(
          (i) => i.severity === "CRITICAL" || i.severity === "HIGH",
        );

        workOrders.push({
          vehicleId,
          title: criticalIssue
            ? `${criticalIssue.component} Service Required`
            : "Predicted Maintenance Required",
          priority:
            prediction.urgencyLevel === "CRITICAL" ? "CRITICAL" : "HIGH",
          status: "BACKLOG",
          createdAt: new Date().toISOString(),
          dueDate: new Date(
            Date.now() +
              prediction.estimatedDaysUntilFailure * 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
      }
    }
  });

  return workOrders;
};

export default {
  predictMaintenance,
  predictAllVehicles,
  getMaintenancePriority,
  autoGenerateWorkOrders,
  calculateRiskScore,
};
