
export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  ON_MISSION = 'ON_MISSION'
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  DISPATCHED = 'DISPATCHED',
  EN_ROUTE_PICKUP = 'EN_ROUTE_PICKUP',
  ARRIVED_PICKUP = 'ARRIVED_PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DISPATCHER = 'DISPATCHER',
  DRIVER = 'DRIVER',
  MECHANIC = 'MECHANIC',
  AUDITOR = 'AUDITOR',
  RIDER = 'RIDER'
}

export interface Coordinates {
  x: number; // Relative 0-100 for tactical map
  y: number; // Relative 0-100 for tactical map
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ON_LEAVE';
  readinessScore?: number; // 0-100
  certifications?: string[];
  assignedVehicleId?: string;
  phone?: string;
  codename?: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  plate: string;
  model: string;
  type: 'SEDAN' | 'SUV' | 'TRUCK' | 'SPECIALTY';
  status: VehicleStatus;
  location: Coordinates;
  speed: number;
  fuelLevel: number;
  lastPing: string;
  assignedDriverId?: string;
  department: string;
  mileage: number;
  nextServiceDate: string;
  standbyTime?: number; // minutes idle
  etaMinutes?: number; // if on mission
  assignedRouteId?: string; // Link to fixed route
}

export interface Incident {
  id: string;
  vehicleId: string;
  driverId: string;
  severity: IncidentSeverity;
  category: string;
  description: string;
  timestamp: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'INVESTIGATING';
  assignedToId?: string;
  aiAnalysis?: string;
  photos?: string[];
}

export interface TripFeedback {
  rating: number; // 1-5
  comment: string;
  vehicleIssuesDetected: boolean;
  passengerRating?: number;
}

export interface Trip {
  id: string;
  unitId: string;
  vehicleId?: string;
  driverId?: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  status: TripStatus;
  priority: 'STANDARD' | 'URGENT' | 'VIP';
  estimatedDurationMin: number;
  notes?: string;
  feedback?: TripFeedback;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'BACKLOG' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED';
  assignedMechanicId?: string;
  createdAt: string;
  dueDate: string;
}

export interface IncomingRequest {
  id: string;
  requestorName: string; // e.g. "Senator Office", "Base Commander"
  passengerCount: number;
  pickupLocation: string;
  dropoffLocation: string;
  requestedTime: string;
  priority: 'STANDARD' | 'URGENT' | 'VIP';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  details: string;
  entityId?: string;
}

export interface SystemSettings {
  unitName: string;
  refreshRateSeconds: number;
  speedThreshold: number;
  fuelAlertThreshold: number;
  autoDispatchEnabled: boolean;
  maintenanceIntervalMiles: number;
  theme: 'DARK' | 'LIGHT';
}

export interface RouteStop {
  id: string;
  name: string;
  location: Coordinates;
  etaOffsetMinutes: number; // Approx time from start
}

export interface FixedRoute {
  id: string;
  name: string;
  color: string;
  status: 'ACTIVE' | 'INACTIVE';
  stops: RouteStop[];
  assignedVehicleIds: string[];
}