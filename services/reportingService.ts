// Comprehensive Reporting & Analytics Service
// Generates PDF reports, custom dashboards, and analytics

import { Vehicle, Trip, Incident, UserProfile, WorkOrder } from "../types";

export interface ReportConfig {
  type:
    | "MISSION_SUMMARY"
    | "MAINTENANCE"
    | "INCIDENT"
    | "PERFORMANCE"
    | "CUSTOM";
  dateRange: { start: Date; end: Date };
  filters?: Record<string, any>;
  format: "PDF" | "CSV" | "JSON";
  includeCharts?: boolean;
}

export interface AnalyticsData {
  summary: SummaryMetrics;
  trends: TrendData[];
  comparisons: ComparisonData;
  topPerformers: TopPerformer[];
  alerts: AlertData[];
}

export interface SummaryMetrics {
  totalTrips: number;
  totalDistance: number; // miles
  totalFuelUsed: number; // gallons
  avgTripDuration: number; // minutes
  completionRate: number; // percentage
  incidentRate: number; // per 1000 miles
  fleetUtilization: number; // percentage
  onTimePerformance: number; // percentage
}

export interface TrendData {
  date: string;
  trips: number;
  distance: number;
  fuelUsed: number;
  incidents: number;
}

export interface ComparisonData {
  currentPeriod: SummaryMetrics;
  previousPeriod: SummaryMetrics;
  change: Record<string, number>;
}

export interface TopPerformer {
  type: "DRIVER" | "VEHICLE";
  id: string;
  name: string;
  metric: string;
  value: number;
  score: number;
}

export interface AlertData {
  type: "WARNING" | "INFO" | "CRITICAL";
  category: string;
  message: string;
  recommendation?: string;
}

// Calculate comprehensive analytics
export const calculateAnalytics = (
  trips: Trip[],
  vehicles: Vehicle[],
  incidents: Incident[],
  users: UserProfile[],
  dateRange: { start: Date; end: Date },
): AnalyticsData => {
  const filteredTrips = filterByDate(trips, dateRange);
  const filteredIncidents = filterByDate(incidents, dateRange);

  const summary = calculateSummary(filteredTrips, vehicles, filteredIncidents);
  const trends = calculateTrends(filteredTrips, filteredIncidents, dateRange);
  const comparisons = calculateComparison(
    summary,
    dateRange,
    trips,
    vehicles,
    incidents,
  );
  const topPerformers = calculateTopPerformers(filteredTrips, users, vehicles);
  const alerts = generateAlerts(summary, vehicles, incidents);

  return { summary, trends, comparisons, topPerformers, alerts };
};

// Filter data by date range
const filterByDate = <T extends { pickupTime?: string; timestamp?: string }>(
  items: T[],
  dateRange: { start: Date; end: Date },
): T[] => {
  return items.filter((item) => {
    const dateStr = item.pickupTime || item.timestamp;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date >= dateRange.start && date <= dateRange.end;
  });
};

// Calculate summary metrics
const calculateSummary = (
  trips: Trip[],
  vehicles: Vehicle[],
  incidents: Incident[],
): SummaryMetrics => {
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");
  const totalDistance = completedTrips.reduce(
    (acc, t) => acc + t.estimatedDurationMin * 0.6,
    0,
  ); // Mock calculation
  const totalFuelUsed = totalDistance / 25; // Mock: 25 mpg average
  const avgTripDuration =
    completedTrips.length > 0
      ? completedTrips.reduce((acc, t) => acc + t.estimatedDurationMin, 0) /
        completedTrips.length
      : 0;

  const activeVehicles = vehicles.filter(
    (v) => v.status !== "OUT_OF_SERVICE",
  ).length;
  const fleetUtilization = (activeVehicles / vehicles.length) * 100;

  return {
    totalTrips: trips.length,
    totalDistance: Math.round(totalDistance),
    totalFuelUsed: Math.round(totalFuelUsed),
    avgTripDuration: Math.round(avgTripDuration),
    completionRate:
      trips.length > 0 ? (completedTrips.length / trips.length) * 100 : 0,
    incidentRate:
      totalDistance > 0 ? (incidents.length / totalDistance) * 1000 : 0,
    fleetUtilization,
    onTimePerformance: calculateOnTimePerformance(trips),
  };
};

// Calculate on-time performance
const calculateOnTimePerformance = (trips: Trip[]): number => {
  const completed = trips.filter((t) => t.status === "COMPLETED");
  if (completed.length === 0) return 100;

  let onTime = 0;
  completed.forEach((trip) => {
    // Mock: 90% are on time
    if (Math.random() > 0.1) onTime++;
  });

  return (onTime / completed.length) * 100;
};

// Calculate trends over time
const calculateTrends = (
  trips: Trip[],
  incidents: Incident[],
  dateRange: { start: Date; end: Date },
): TrendData[] => {
  const trends: TrendData[] = [];
  const days = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  for (let i = 0; i < Math.min(days, 30); i++) {
    const dayStart = new Date(dateRange.start);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayTrips = trips.filter((t) => {
      const d = new Date(t.pickupTime);
      return d >= dayStart && d < dayEnd;
    });

    const dayIncidents = incidents.filter((t) => {
      const d = new Date(t.timestamp || "");
      return d >= dayStart && d < dayEnd;
    });

    trends.push({
      date: dayStart.toISOString().split("T")[0],
      trips: dayTrips.length,
      distance: dayTrips.reduce(
        (acc, t) => acc + t.estimatedDurationMin * 0.6,
        0,
      ),
      fuelUsed: dayTrips.reduce(
        (acc, t) => acc + t.estimatedDurationMin * 0.02,
        0,
      ),
      incidents: dayIncidents.length,
    });
  }

  return trends;
};

// Calculate comparison with previous period
const calculateComparison = (
  current: SummaryMetrics,
  dateRange: { start: Date; end: Date },
  allTrips: Trip[],
  allVehicles: Vehicle[],
  allIncidents: Incident[],
): ComparisonData => {
  const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
  const prevStart = new Date(dateRange.start.getTime() - periodLength);
  const prevEnd = new Date(dateRange.start.getTime());

  const prevTrips = filterByDate(allTrips, { start: prevStart, end: prevEnd });
  const prevIncidents = filterByDate(allIncidents, {
    start: prevStart,
    end: prevEnd,
  });

  const previous = calculateSummary(prevTrips, allVehicles, prevIncidents);

  const change: Record<string, number> = {};
  Object.keys(current).forEach((key) => {
    const currentValue = current[key as keyof SummaryMetrics] as number;
    const previousValue = previous[key as keyof SummaryMetrics] as number;
    if (previousValue > 0) {
      change[key] = ((currentValue - previousValue) / previousValue) * 100;
    } else {
      change[key] = currentValue > 0 ? 100 : 0;
    }
  });

  return { currentPeriod: current, previousPeriod: previous, change };
};

// Calculate top performers
const calculateTopPerformers = (
  trips: Trip[],
  users: UserProfile[],
  vehicles: Vehicle[],
): TopPerformer[] => {
  const performers: TopPerformer[] = [];

  // Top drivers by trip completion
  const driverStats = new Map<string, { trips: number; rating: number }>();
  trips.forEach((trip) => {
    if (trip.driverId) {
      const current = driverStats.get(trip.driverId) || { trips: 0, rating: 0 };
      driverStats.set(trip.driverId, {
        trips: current.trips + 1,
        rating: current.rating + (trip.feedback?.rating || 4),
      });
    }
  });

  driverStats.forEach((stats, driverId) => {
    const user = users.find((u) => u.id === driverId);
    if (user) {
      performers.push({
        type: "DRIVER",
        id: driverId,
        name: user.name,
        metric: "Trips Completed",
        value: stats.trips,
        score: stats.trips * stats.rating,
      });
    }
  });

  // Top vehicles by utilization
  const vehicleStats = new Map<string, number>();
  trips.forEach((trip) => {
    if (trip.vehicleId) {
      const current = vehicleStats.get(trip.vehicleId) || 0;
      vehicleStats.set(trip.vehicleId, current + 1);
    }
  });

  vehicleStats.forEach((trips, vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      performers.push({
        type: "VEHICLE",
        id: vehicleId,
        name: vehicle.plate,
        metric: "Trips Assigned",
        value: trips,
        score: trips,
      });
    }
  });

  return performers.sort((a, b) => b.score - a.score).slice(0, 10);
};

// Generate alerts based on analytics
const generateAlerts = (
  summary: SummaryMetrics,
  vehicles: Vehicle[],
  incidents: Incident[],
): AlertData[] => {
  const alerts: AlertData[] = [];

  // Low utilization alert
  if (summary.fleetUtilization < 50) {
    alerts.push({
      type: "WARNING",
      category: "Fleet Management",
      message: `Fleet utilization is at ${summary.fleetUtilization.toFixed(1)}%`,
      recommendation: "Consider consolidating routes or reducing vehicle count",
    });
  }

  // High incident rate alert
  if (summary.incidentRate > 0.5) {
    alerts.push({
      type: "CRITICAL",
      category: "Safety",
      message: `Incident rate increased to ${summary.incidentRate.toFixed(2)} per 1000 miles`,
      recommendation:
        "Review driver training and vehicle maintenance schedules",
    });
  }

  // Low on-time performance
  if (summary.onTimePerformance < 85) {
    alerts.push({
      type: "WARNING",
      category: "Performance",
      message: `On-time performance dropped to ${summary.onTimePerformance.toFixed(1)}%`,
      recommendation: "Review traffic patterns and dispatch routing",
    });
  }

  // Vehicle maintenance due
  const maintenanceDue = vehicles.filter((v) => {
    const dueDate = new Date(v.nextServiceDate);
    return dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  });
  if (maintenanceDue.length > 0) {
    alerts.push({
      type: "INFO",
      category: "Maintenance",
      message: `${maintenanceDue.length} vehicles require maintenance within 7 days`,
      recommendation: "Review and schedule maintenance work orders",
    });
  }

  return alerts;
};

// Export to CSV
export const exportToCSV = (data: any[], filename: string): string => {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
      .join(","),
  );

  return [headers, ...rows].join("\n");
};

// Generate downloadable report
export const generateReport = async (
  config: ReportConfig,
  analytics: AnalyticsData,
): Promise<Blob> => {
  const reportData = {
    generatedAt: new Date().toISOString(),
    dateRange: config.dateRange,
    ...analytics,
  };

  if (config.format === "JSON") {
    return new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
  }

  if (config.format === "CSV") {
    const csvData = exportToCSV(analytics.summary as any, "summary");
    return new Blob([csvData], { type: "text/csv" });
  }

  // PDF generation would require a library like jsPDF
  // For now, return a text representation
  const textReport = generateTextReport(config, analytics);
  return new Blob([textReport], { type: "text/plain" });
};

// Generate text report (placeholder for PDF)
const generateTextReport = (
  config: ReportConfig,
  analytics: AnalyticsData,
): string => {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("GOVFLEET COMMAND - OPERATIONAL REPORT");
  lines.push("=".repeat(60));
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `Period: ${config.dateRange.start.toISOString()} to ${config.dateRange.end.toISOString()}`,
  );
  lines.push("");

  lines.push("EXECUTIVE SUMMARY");
  lines.push("-".repeat(60));
  lines.push(`Total Trips: ${analytics.summary.totalTrips}`);
  lines.push(`Total Distance: ${analytics.summary.totalDistance} miles`);
  lines.push(`Fuel Used: ${analytics.summary.totalFuelUsed} gallons`);
  lines.push(
    `Completion Rate: ${analytics.summary.completionRate.toFixed(1)}%`,
  );
  lines.push(
    `Fleet Utilization: ${analytics.summary.fleetUtilization.toFixed(1)}%`,
  );
  lines.push(
    `On-Time Performance: ${analytics.summary.onTimePerformance.toFixed(1)}%`,
  );
  lines.push("");

  lines.push("ALERTS & RECOMMENDATIONS");
  lines.push("-".repeat(60));
  analytics.alerts.forEach((alert) => {
    lines.push(`[${alert.type}] ${alert.message}`);
    if (alert.recommendation) {
      lines.push(`  → ${alert.recommendation}`);
    }
  });
  lines.push("");

  lines.push("=".repeat(60));
  lines.push("END OF REPORT");
  lines.push("=".repeat(60));

  return lines.join("\n");
};

export default {
  calculateAnalytics,
  generateReport,
  exportToCSV,
};
