
import { Vehicle, VehicleStatus, Incident, IncidentSeverity, Trip, TripStatus, UserProfile, UserRole, WorkOrder, IncomingRequest, FixedRoute } from './types';

export const MOCK_USERS: UserProfile[] = [
  { 
    id: 'u1', 
    name: 'Cmdr. Sarah Connor', 
    codename: 'Valkyrie',
    email: 'sarah.c@govfleet.mil', 
    role: UserRole.SUPER_ADMIN, 
    avatar: 'https://i.pravatar.cc/150?u=sarah', 
    department: 'HQ Command',
    status: 'ONLINE',
    phone: '555-0101'
  },
  { 
    id: 'disp1', 
    name: 'Ops. Chief Miller', 
    codename: 'Watchtower',
    email: 'miller@ops.gov', 
    role: UserRole.DISPATCHER, 
    avatar: 'https://i.pravatar.cc/150?u=miller', 
    department: 'HQ Command', 
    status: 'ONLINE', 
    phone: '555-0150' 
  },
  { 
    id: 'd1', 
    name: 'Agent Smith', 
    codename: 'Neo',
    email: 'smith@ops.gov', 
    role: UserRole.DRIVER, 
    avatar: 'https://i.pravatar.cc/150?u=smith', 
    department: 'Ops Alpha',
    status: 'ONLINE',
    readinessScore: 98,
    certifications: ['EVOC Level 3', 'VIP Protection'],
    assignedVehicleId: 'v2',
    phone: '555-0102'
  },
  { 
    id: 'd2', 
    name: 'Officer K', 
    codename: 'Blade',
    email: 'k@ops.gov', 
    role: UserRole.DRIVER, 
    avatar: 'https://i.pravatar.cc/150?u=k', 
    department: 'Ops Bravo',
    status: 'BUSY',
    readinessScore: 95,
    certifications: ['Heavy Transport'],
    assignedVehicleId: 'v1',
    phone: '555-0103'
  },
  { 
    id: 'mech1', 
    name: 'Sparky Anderson', 
    codename: 'Wrench',
    email: 'sparky@maint.gov', 
    role: UserRole.MECHANIC, 
    avatar: 'https://i.pravatar.cc/150?u=sparky', 
    department: 'Logistics',
    status: 'ONLINE',
    phone: '555-0199'
  }
];

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    vin: '1FM5K8F81GGA10001',
    plate: 'GOV-8821',
    model: 'Ford Explorer Interceptor',
    type: 'SUV',
    status: VehicleStatus.ON_MISSION,
    location: { x: 45, y: 30 },
    speed: 45,
    fuelLevel: 78,
    lastPing: 'Just now',
    assignedDriverId: 'd2',
    department: 'Ops Alpha',
    mileage: 12500,
    nextServiceDate: '2023-12-01',
    standbyTime: 0,
    etaMinutes: 12
  },
  {
    id: 'v2',
    vin: '1GNSKHE30JR10202',
    plate: 'GOV-9912',
    model: 'Chevy Tahoe',
    type: 'SUV',
    status: VehicleStatus.ACTIVE,
    location: { x: 60, y: 65 },
    speed: 0,
    fuelLevel: 92,
    lastPing: '2m ago',
    assignedDriverId: 'd1',
    department: 'Ops Bravo',
    mileage: 4500,
    nextServiceDate: '2024-01-15',
    standbyTime: 15,
    etaMinutes: 0
  },
  {
    id: 'v3',
    vin: '1FTFW1E55KFB40501',
    plate: 'GOV-1102',
    model: 'Ford F-150',
    type: 'TRUCK',
    status: VehicleStatus.MAINTENANCE,
    location: { x: 15, y: 85 },
    speed: 0,
    fuelLevel: 15,
    lastPing: '1h ago',
    department: 'Logistics',
    mileage: 45000,
    nextServiceDate: '2023-10-25',
    standbyTime: 0
  },
  {
    id: 'v4',
    vin: '2C3CDXKT1HH58291',
    plate: 'GOV-3321',
    model: 'Dodge Charger',
    type: 'SEDAN',
    status: VehicleStatus.OUT_OF_SERVICE,
    location: { x: 80, y: 20 },
    speed: 0,
    fuelLevel: 40,
    lastPing: '1d ago',
    department: 'Ops Alpha',
    mileage: 89000,
    nextServiceDate: 'OVERDUE'
  },
  {
    id: 'v5',
    vin: '1FTYR2XM4MKA66022',
    plate: 'GOV-5511',
    model: 'Ford Transit',
    type: 'SPECIALTY',
    status: VehicleStatus.ACTIVE,
    location: { x: 30, y: 50 },
    speed: 22,
    fuelLevel: 65,
    lastPing: '10s ago',
    assignedDriverId: 'd3',
    department: 'Logistics',
    mileage: 12000,
    nextServiceDate: '2024-02-10',
    standbyTime: 5
  }
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    vehicleId: 'v4',
    driverId: 'd3',
    severity: IncidentSeverity.CRITICAL,
    category: 'Engine Failure',
    description: 'Vehicle stalled on highway. Smoke detected from hood. Driver safe.',
    timestamp: '2023-10-27T10:30:00Z',
    status: 'OPEN',
    photos: ['https://picsum.photos/200/300?random=9']
  },
  {
    id: 'inc-002',
    vehicleId: 'v3',
    driverId: 'd1',
    severity: IncidentSeverity.LOW,
    category: 'Maintenance',
    description: 'Scheduled oil change overdue by 500 miles.',
    timestamp: '2023-10-26T08:00:00Z',
    status: 'OPEN'
  }
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: 't-101',
    unitId: 'Ops Alpha',
    vehicleId: 'v1',
    driverId: 'd2',
    passengerName: 'Senator J. Doe',
    pickupLocation: 'Capitol West Gate',
    dropoffLocation: 'Andrews AFB',
    pickupTime: '2023-10-27T14:00:00Z',
    status: TripStatus.IN_PROGRESS,
    priority: 'VIP',
    estimatedDurationMin: 45
  },
  {
    id: 't-102',
    unitId: 'Ops Bravo',
    passengerName: 'Team Bravo 6',
    pickupLocation: 'HQ Sector 7',
    dropoffLocation: 'Training Facility B',
    pickupTime: '2023-10-27T16:30:00Z',
    status: TripStatus.SCHEDULED,
    priority: 'STANDARD',
    estimatedDurationMin: 30
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-1',
    vehicleId: 'v3',
    title: 'Suspension Replacement',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedMechanicId: 'mech1',
    createdAt: '2023-10-25',
    dueDate: '2023-10-30'
  },
  {
    id: 'wo-2',
    vehicleId: 'v4',
    title: 'Engine Rebuild (Catastrophic Failure)',
    priority: 'CRITICAL',
    status: 'WAITING_PARTS',
    createdAt: '2023-10-27',
    dueDate: '2023-11-15'
  }
];

export const MOCK_REQUESTS: IncomingRequest[] = [
  {
    id: 'req-1',
    requestorName: 'State Dept. Protocol',
    passengerCount: 2,
    pickupLocation: 'Dulles Int. Airport',
    dropoffLocation: 'Blair House',
    requestedTime: '2023-10-27T18:00:00Z',
    priority: 'VIP',
    status: 'PENDING',
    notes: 'Diplomatic delegation arriving. Armored transport required.'
  },
   {
    id: 'req-2',
    requestorName: 'Logistics Alpha',
    passengerCount: 4,
    pickupLocation: 'Warehouse 4',
    dropoffLocation: 'Sector 7 Depot',
    requestedTime: '2023-10-27T15:30:00Z',
    priority: 'STANDARD',
    status: 'PENDING'
  },
  {
    id: 'req-3',
    requestorName: 'Base Commander',
    passengerCount: 1,
    pickupLocation: 'Command HQ',
    dropoffLocation: 'Pentagon Annex',
    requestedTime: '2023-10-28T09:00:00Z',
    priority: 'URGENT',
    status: 'PENDING'
  }
];

export const MOCK_ROUTES: FixedRoute[] = [
  {
    id: 'r-1',
    name: 'Blue Line (HQ Loop)',
    color: '#3b82f6', // Blue 500
    status: 'ACTIVE',
    stops: [
      { id: 's1', name: 'Main Gate', location: { x: 20, y: 80 }, etaOffsetMinutes: 0 },
      { id: 's2', name: 'Building 4', location: { x: 45, y: 50 }, etaOffsetMinutes: 10 },
      { id: 's3', name: 'Logistics Center', location: { x: 70, y: 30 }, etaOffsetMinutes: 20 },
      { id: 's4', name: 'West Parking', location: { x: 30, y: 20 }, etaOffsetMinutes: 30 }
    ],
    assignedVehicleIds: ['v5']
  },
  {
    id: 'r-2',
    name: 'Red Line (Base Perimeter)',
    color: '#ef4444', // Red 500
    status: 'INACTIVE',
    stops: [
      { id: 's5', name: 'North Checkpoint', location: { x: 50, y: 10 }, etaOffsetMinutes: 0 },
      { id: 's6', name: 'East Armory', location: { x: 90, y: 50 }, etaOffsetMinutes: 15 },
      { id: 's7', name: 'South Barracks', location: { x: 50, y: 90 }, etaOffsetMinutes: 30 },
      { id: 's8', name: 'West Airfield', location: { x: 10, y: 50 }, etaOffsetMinutes: 45 }
    ],
    assignedVehicleIds: []
  }
];