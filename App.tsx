import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Car, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  FileText,
  Users,
  Wrench,
  Navigation as NavIcon, 
  Smartphone,
  Fuel,
  Gauge,
  MoreVertical,
  LocateFixed,
  Filter,
  FileClock,
  CheckCircle,
  UserPlus,
  Clock,
  Timer,
  Activity,
  ShieldCheck,
  Save,
  Sparkles,
  BarChart2,
  PieChart as PieChartIcon,
  ClipboardList,
  Edit2,
  Trash2,
  TrendingUp,
  MapPin,
  XCircle,
  CheckSquare,
  Shield,
  User,
  HelpCircle,
  Route as RouteIcon
} from 'lucide-react';
import TacticalMap from './components/TacticalMap';
import VehicleDetailDrawer from './components/VehicleDetailDrawer';
import DriverApp from './components/DriverApp';
import RiderApp from './components/RiderApp';
import PersonnelManager from './components/PersonnelManager';
import TripDispatchWizard from './components/TripDispatchWizard';
import AddVehicleModal from './components/AddVehicleModal';
import EditTripModal from './components/EditTripModal';
import AssignAgentModal from './components/AssignAgentModal';
import RouteManager from './components/RouteManager';
import LiveSupportModal from './components/LiveSupportModal';
import { 
  MOCK_VEHICLES, 
  MOCK_INCIDENTS, 
  MOCK_TRIPS, 
  MOCK_WORK_ORDERS, 
  MOCK_USERS, 
  MOCK_REQUESTS,
  MOCK_ROUTES
} from './constants';
import { Vehicle, Incident, Trip, VehicleStatus, IncidentSeverity, UserProfile, UserRole, TripStatus, AuditLogEntry, SystemSettings, WorkOrder, TripFeedback, IncomingRequest, FixedRoute } from './types';
import { analyzeIncident } from './services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid } from 'recharts';

// -- Sub-Components --

const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
  <div className="bg-gov-800 p-4 rounded-lg border border-gov-700 shadow-lg flex items-start justify-between hover:border-gov-600 transition-colors group">
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wider font-bold group-hover:text-gray-300 transition-colors">{title}</p>
      <h3 className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</h3>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-md ${colorClass} bg-opacity-10 border border-opacity-20 border-current`}>
      <Icon className={colorClass} size={24} />
    </div>
  </div>
);

const PersonnelStatCard = ({ users }: { users: UserProfile[] }) => {
  const online = users.filter(u => u.status === 'ONLINE').length;
  const busy = users.filter(u => u.status === 'BUSY').length;
  const offline = users.filter(u => u.status === 'OFFLINE').length;
  const total = users.length;

  return (
    <div className="bg-gov-800 p-4 rounded-lg border border-gov-700 shadow-lg hover:border-gov-600 transition-colors group flex flex-col justify-between">
       <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold group-hover:text-gray-300 transition-colors">Personnel Status</p>
            <h3 className="text-3xl font-bold text-white mt-1 tracking-tight">{online + busy} <span className="text-sm text-gray-500 font-normal">/ {total} Active</span></h3>
          </div>
          <div className="p-3 rounded-md text-indigo-500 bg-indigo-500/10 border border-indigo-500/20">
             <Users size={24} />
          </div>
       </div>
       <div className="grid grid-cols-3 gap-2 text-center mt-2">
          <div className="bg-gov-900 rounded p-1 border border-gov-700">
             <span className="block text-emerald-400 font-bold text-lg leading-none">{online}</span>
             <span className="text-[10px] text-gray-500 uppercase">Ready</span>
          </div>
          <div className="bg-gov-900 rounded p-1 border border-gov-700">
             <span className="block text-amber-500 font-bold text-lg leading-none">{busy}</span>
             <span className="text-[10px] text-gray-500 uppercase">Busy</span>
          </div>
          <div className="bg-gov-900 rounded p-1 border border-gov-700">
             <span className="block text-gray-500 font-bold text-lg leading-none">{offline}</span>
             <span className="text-[10px] text-gray-500 uppercase">Off</span>
          </div>
       </div>
    </div>
  );
}

const AuditLogFeed = ({ logs, users }: { logs: AuditLogEntry[], users: UserProfile[] }) => (
  <div className="bg-gov-800 rounded-lg border border-gov-700 flex flex-col h-full shadow-lg overflow-hidden min-h-[200px]">
    <div className="p-3 border-b border-gov-700 flex justify-between items-center bg-gov-900/50 backdrop-blur shrink-0">
      <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
         <ShieldCheck size={14} className="text-emerald-500"/> Security Audit Log
      </h3>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gov-700 scrollbar-track-gov-900">
      {logs.map((log, idx) => {
        const actor = users.find(u => u.id === log.actorId);
        return (
          <div key={log.id} className={`text-xs p-3 border-b border-gov-700/50 hover:bg-gov-700/30 transition-colors flex gap-3 ${idx === 0 ? 'bg-emerald-500/5' : ''}`}>
             <div className="font-mono text-gray-500 text-[10px] w-14 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                   <span className="font-bold text-gov-accent">{log.action}</span>
                   <span className="text-gray-500 text-[10px]">by</span>
                   <span className="text-gray-300 font-medium">{actor?.name || log.actorId}</span>
                </div>
                <div className="text-gray-400 truncate" title={log.details}>{log.details}</div>
             </div>
          </div>
        );
      })}
    </div>
  </div>
);

const ScheduledMissionsFeed = ({ trips, vehicles }: { trips: Trip[], vehicles: Vehicle[] }) => {
   const upcoming = trips
      .filter(t => t.status === TripStatus.SCHEDULED || t.status === TripStatus.DISPATCHED)
      .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime())
      .slice(0, 5);

   return (
      <div className="bg-gov-800 rounded-lg border border-gov-700 flex flex-col h-full shadow-lg overflow-hidden min-h-[200px]">
         <div className="p-3 border-b border-gov-700 flex justify-between items-center bg-gov-900/50 backdrop-blur shrink-0">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
               <CalendarIcon size={14} className="text-sky-500"/> Scheduled Ops
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">{upcoming.length} Pending</span>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {upcoming.length === 0 ? (
               <div className="text-center text-gray-500 text-xs py-8 italic">No upcoming missions scheduled.</div>
            ) : (
               upcoming.map(trip => (
                  <div key={trip.id} className="bg-gov-900/50 p-3 rounded border border-gov-700/50 hover:border-gov-500 transition-colors group">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-gov-accent font-bold text-xs">{new Date(trip.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${trip.priority === 'VIP' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>{trip.priority}</span>
                     </div>
                     <p className="text-sm font-bold text-white mb-0.5">{trip.pickupLocation}</p>
                     <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Car size={10}/> {trip.vehicleId ? vehicles.find(v => v.id === trip.vehicleId)?.model : 'Unassigned'}
                     </p>
                  </div>
               ))
            )}
         </div>
      </div>
   )
}

const IncomingRequestsFeed = ({ requests, onAction }: { requests: IncomingRequest[], onAction: (id: string, action: 'APPROVE' | 'REJECT') => void }) => {
  return (
      <div className="bg-gov-800 rounded-lg border border-gov-700 flex flex-col h-full shadow-lg overflow-hidden min-h-[200px] relative">
           {/* Header */}
           <div className="p-3 border-b border-gov-700 flex justify-between items-center bg-gov-900/50 backdrop-blur shrink-0">
              <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                 <Bell size={14} className="text-gov-warning animate-pulse"/> Incoming Requests
              </h3>
              <span className="bg-gov-warning/20 text-gov-warning text-[10px] font-bold px-1.5 rounded">{requests.length}</span>
           </div>
           {/* List */}
           <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gov-700">
              {requests.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-xs italic flex flex-col items-center justify-center h-full">
                     <CheckCircle size={24} className="mb-2 opacity-20"/>
                     No pending requests.
                  </div>
              ) : (
                  requests.map(req => (
                      <div key={req.id} className="p-3 border-b border-gov-700 hover:bg-gov-700/20 transition-colors group relative">
                         <div className="flex justify-between items-start mb-1">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-gov-warning mt-1"></div>
                               <span className="text-xs font-bold text-white">{req.requestorName}</span>
                             </div>
                             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${req.priority === 'VIP' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>{req.priority}</span>
                         </div>
                         <div className="text-[10px] text-gray-400 space-y-1 pl-3.5">
                             <div className="flex items-center gap-1"><MapPin size={10}/> {req.pickupLocation}</div>
                             <div className="flex items-center gap-1 ml-3.5 border-l border-gov-600 pl-2">to {req.dropoffLocation}</div>
                             <div className="flex items-center gap-1"><Clock size={10}/> {new Date(req.requestedTime).toLocaleString()}</div>
                         </div>
                         <div className="mt-3 pl-3.5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                             <button onClick={() => onAction(req.id, 'APPROVE')} className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm">
                                <CheckSquare size={10}/> Approve
                             </button>
                             <button onClick={() => onAction(req.id, 'REJECT')} className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm">
                                <XCircle size={10}/> Reject
                             </button>
                         </div>
                      </div>
                  ))
              )}
           </div>
      </div>
  )
}

const CalendarView = ({ trips, vehicles }: any) => {
  const sortedTrips = [...trips].sort((a: any, b: any) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());
  
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CalendarIcon /> Operational Schedule</h2>
          <div className="flex gap-2">
             <button className="bg-gov-700 px-3 py-1 rounded text-xs text-white">Day</button>
             <button className="bg-gov-accent px-3 py-1 rounded text-xs text-white">Week</button>
             <button className="bg-gov-700 px-3 py-1 rounded text-xs text-white">Month</button>
          </div>
       </div>
       
       <div className="bg-gov-800 border border-gov-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gov-700 bg-gov-900 text-center py-2">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs font-bold text-gray-500 uppercase">{d}</div>
             ))}
          </div>
          <div className="p-4 min-h-[400px]">
             <div className="space-y-2">
                {sortedTrips.map((trip: any) => (
                   <div key={trip.id} className="flex gap-4 p-3 bg-gov-900/50 rounded border border-gov-700 hover:border-gov-500 transition-colors">
                      <div className="text-center min-w-[60px] border-r border-gov-700 pr-4">
                         <div className="text-xs text-gov-accent font-bold uppercase">{new Date(trip.pickupTime).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                         <div className="text-2xl font-bold text-white">{new Date(trip.pickupTime).getDate()}</div>
                         <div className="text-[10px] text-gray-500">{new Date(trip.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</div>
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between">
                            <h4 className="font-bold text-white text-sm">{trip.pickupLocation} <span className="text-gray-500 font-normal">to</span> {trip.dropoffLocation}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trip.priority === 'VIP' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>{trip.priority}</span>
                         </div>
                         <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><User size={12}/> {trip.passengerName}</span>
                            <span className="flex items-center gap-1"><Car size={12}/> {trip.vehicleId ? vehicles.find((v:any) => v.id === trip.vehicleId)?.plate : 'Unassigned'}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

const WorkOrderBoard = ({ orders }: any) => {
   const columns = ['BACKLOG', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED'];
   
   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-x-auto pb-4">
         {columns.map(status => (
            <div key={status} className="bg-gov-800 rounded-lg border border-gov-700 flex flex-col min-h-[400px]">
               <div className="p-3 border-b border-gov-700 bg-gov-900/50 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{status.replace('_', ' ')}</h3>
                  <span className="bg-gov-700 text-gray-300 text-[10px] px-1.5 rounded-full">{orders.filter((o:any) => o.status === status).length}</span>
               </div>
               <div className="p-2 space-y-2 flex-1 bg-gov-900/20">
                  {orders.filter((o:any) => o.status === status).map((order: any) => (
                     <div key={order.id} className="bg-gov-800 p-3 rounded border border-gov-600 shadow-sm hover:border-gov-accent cursor-pointer group relative">
                        <div className="flex justify-between items-start mb-1">
                           <span className="text-[10px] text-gray-500 font-mono">{order.id}</span>
                           <span className={`w-2 h-2 rounded-full ${order.priority === 'CRITICAL' ? 'bg-red-500' : order.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1 leading-tight">{order.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                           <Wrench size={10} />
                           <span>{order.vehicleId ? `Vehicle ${order.vehicleId}` : 'General'}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gov-700/50 flex justify-between items-center">
                           <span className="text-[10px] text-gray-500">Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                           {order.assignedMechanicId && (
                              <div className="w-5 h-5 rounded-full bg-gov-700 flex items-center justify-center text-[9px] text-white font-bold" title={order.assignedMechanicId}>
                                 {order.assignedMechanicId.charAt(0).toUpperCase()}
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         ))}
      </div>
   )
};

const IncidentRow = ({ incident, users, onAnalyze, onAcknowledge, onAssign }: any) => {
  const assignedUser = users.find((u: any) => u.id === incident.assignedToId);
  return (
     <div className="bg-gov-800 border border-gov-700 rounded p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm hover:border-gov-600 transition-all">
        <div className="flex items-start gap-4">
           <div className={`p-3 rounded-full shrink-0 ${incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : incident.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
              <AlertTriangle size={24} />
           </div>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${incident.status === 'OPEN' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{incident.status}</span>
                 <span className="text-gray-500 text-xs font-mono">{incident.id}</span>
                 <span className="text-gray-400 text-xs">• {new Date(incident.timestamp).toLocaleString()}</span>
              </div>
              <h3 className="font-bold text-white text-lg">{incident.category}</h3>
              <p className="text-gray-400 text-sm max-w-2xl">{incident.description}</p>
              
              {incident.assignedToId && (
                 <div className="flex items-center gap-2 mt-2 bg-gov-900/50 w-fit px-2 py-1 rounded border border-gov-700">
                    <img src={assignedUser?.avatar} className="w-4 h-4 rounded-full" />
                    <span className="text-xs text-gray-300">Assigned: <span className="text-white font-bold">{assignedUser?.name}</span></span>
                 </div>
              )}
           </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
           {incident.status === 'OPEN' && (
              <button onClick={() => onAcknowledge(incident.id)} className="flex-1 md:flex-none px-3 py-2 bg-gov-700 hover:bg-gov-600 text-white text-xs font-bold rounded">Ack</button>
           )}
           <button onClick={() => onAssign(incident.id)} className="flex-1 md:flex-none px-3 py-2 bg-gov-700 hover:bg-gov-600 text-white text-xs font-bold rounded">Assign</button>
           <button onClick={() => onAnalyze(incident)} className="flex-1 md:flex-none px-3 py-2 bg-gov-accent hover:bg-sky-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2">
              <Sparkles size={14} /> AI Analysis
           </button>
        </div>
     </div>
  );
};

// -- Main App --

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MAP' | 'FLEET' | 'ROUTES' | 'INCIDENTS' | 'PERSONNEL' | 'MAINTENANCE' | 'HISTORY' | 'CALENDAR' | 'SETTINGS' | 'MISSIONS' | 'STATISTICS'>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [routes, setRoutes] = useState<FixedRoute[]>(MOCK_ROUTES);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [workOrders, setWorkOrders] = useState(MOCK_WORK_ORDERS);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(MOCK_REQUESTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    { id: 'al-1', timestamp: new Date().toISOString(), actorId: 'u1', action: 'SYSTEM_STARTUP', details: 'Operational Command Center initialized.' },
    { id: 'al-2', timestamp: new Date(Date.now() - 3600000).toISOString(), actorId: 'disp1', action: 'SHIFT_START', details: 'Dispatcher Miller logged in.' }
  ]);
  
  // Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    unitName: 'HQ Command',
    refreshRateSeconds: 2,
    speedThreshold: 80,
    fuelAlertThreshold: 20,
    autoDispatchEnabled: true,
    maintenanceIntervalMiles: 5000,
    theme: 'DARK'
  });

  const [fleetSearch, setFleetSearch] = useState('');
  const [mapStatusFilter, setMapStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [missionFilter, setMissionFilter] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'>('ALL');

  // Interaction State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDispatchWizard, setShowDispatchWizard] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // Incident Assignment State
  const [assigningIncidentId, setAssigningIncidentId] = useState<string | null>(null);
  
  // Simulation Mode
  const [viewMode, setViewMode] = useState<'ADMIN' | 'DRIVER' | 'RIDER'>('ADMIN');
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]); 

  // -- Helpers --
  const addAuditLog = (action: string, details: string, actorId: string = currentUser.id) => {
    const newLog: AuditLogEntry = {
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Find active ride for rider view
  const riderActiveTrip = viewMode === 'RIDER' 
    ? trips.find(t => t.passengerName === currentUser.name && t.status !== TripStatus.COMPLETED && t.status !== TripStatus.CANCELLED) || null
    : null;

  // -- Realtime Simulation Effect --
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        let newSpeed = v.speed;
        let newStandby = v.standbyTime || 0;
        let newEta = v.etaMinutes || 0;
        
        if (v.status === VehicleStatus.ACTIVE || v.status === VehicleStatus.ON_MISSION) {
          const moveX = (Math.random() - 0.5) * 1;
          const moveY = (Math.random() - 0.5) * 1;
          const newX = Math.min(100, Math.max(0, v.location.x + moveX));
          const newY = Math.min(100, Math.max(0, v.location.y + moveY));
          
          if (v.status === VehicleStatus.ON_MISSION) {
             newSpeed = 45 + Math.floor(Math.random() * 10);
             newStandby = 0; 
             if (newEta > 0) newEta -= 0.1;
          } else {
             if (Math.random() > 0.6) {
                newSpeed = 0;
                newStandby += 1; 
             } else {
                newSpeed = 20 + Math.floor(Math.random() * 20);
                newStandby = 0;
             }
          }
          
          return {
            ...v,
            location: { x: newX, y: newY },
            speed: newSpeed,
            standbyTime: newStandby,
            etaMinutes: Math.max(0, parseFloat(newEta.toFixed(1)))
          };
        }
        return v;
      }));
    }, settings.refreshRateSeconds * 1000);

    return () => clearInterval(interval);
  }, [settings.refreshRateSeconds]);

  // -- Incoming Request Simulation Effect --
  useEffect(() => {
    // Simulate a new request arriving after 10 seconds
    const timer = setTimeout(() => {
        const newReq: IncomingRequest = {
            id: `req-${Date.now()}`,
            requestorName: 'Secret Service Detail',
            passengerCount: 3,
            pickupLocation: 'White House North Portico',
            dropoffLocation: 'JBA Tarmac',
            requestedTime: new Date(Date.now() + 3600000).toISOString(),
            priority: 'VIP',
            status: 'PENDING',
            notes: 'Urgent transport for VPOTUS staff. Armored SUV required.'
        };
        setIncomingRequests(prev => [newReq, ...prev]);
        addAuditLog('SYSTEM_ALERT', 'New Mission Request received from Secret Service Detail');
        
        // Browser notification simulation (console log)
        console.log("NOTIFICATION: New Incoming Request!");
    }, 10000); // 10s delay

    return () => clearTimeout(timer);
  }, []);

  // -- Handlers --
  const handleVehicleSelect = (v: Vehicle) => setSelectedVehicle(v);

  const handleDispatchStart = (v?: Vehicle) => {
    setShowDispatchWizard(true);
    if (selectedVehicle) setSelectedVehicle(null);
  };

  const handleCreateTrip = (tripData: any) => {
    setTrips(prev => [tripData, ...prev]);
    setShowDispatchWizard(false);
    
    // Wire up Driver Status
    if (tripData.driverId) {
      setUsers(prev => prev.map(u => u.id === tripData.driverId ? { ...u, status: 'BUSY' } : u));
    }
    // Wire up Vehicle Status
    if (tripData.vehicleId) {
      setVehicles(prev => prev.map(v => v.id === tripData.vehicleId ? { ...v, status: VehicleStatus.ON_MISSION, etaMinutes: tripData.estimatedDurationMin } : v));
    }
    
    addAuditLog('DISPATCH_CREATED', `Trip ${tripData.id} created for vehicle ${tripData.vehicleId}`);
    alert(`Mission Dispatched Successfully!\nID: ${tripData.id}`);
  };

  const handleEditTrip = (trip: Trip) => {
     setEditingTrip(trip);
     setShowEditTripModal(true);
  };

  const handleSaveTrip = (tripId: string, updates: Partial<Trip>) => {
     setTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...updates } : t));
     setShowEditTripModal(false);
     setEditingTrip(null);
     addAuditLog('TRIP_EDITED', `Trip ${tripId} updated by admin.`);
  };

  const handleDeleteTrip = (tripId: string) => {
     if (confirm("Are you sure you want to delete this mission? This action cannot be undone.")) {
        setTrips(prev => prev.filter(t => t.id !== tripId));
        addAuditLog('TRIP_DELETED', `Trip ${tripId} deleted from records.`);
     }
  };

  const handleAddVehicle = (vehicleData: Partial<Vehicle>) => {
    const newVehicle: Vehicle = {
      id: `v${Date.now()}`,
      vin: vehicleData.vin || `VIN-${Math.floor(Math.random()*100000)}`,
      plate: vehicleData.plate || 'NEW-REG',
      model: vehicleData.model || 'Unknown Model',
      type: vehicleData.type || 'SUV',
      status: VehicleStatus.ACTIVE,
      location: { x: 50, y: 50 },
      speed: 0,
      fuelLevel: 100,
      lastPing: 'Just now',
      department: vehicleData.department || 'HQ Command',
      mileage: 0,
      nextServiceDate: new Date(Date.now() + 15778463000).toISOString().split('T')[0], // +6 months approx
      standbyTime: 0
    };

    setVehicles(prev => [newVehicle, ...prev]);
    setShowAddVehicleModal(false);
    addAuditLog('VEHICLE_ADDED', `New vehicle registered: ${newVehicle.plate} (${newVehicle.model})`);
  };

  const handleTripUpdate = (tripId: string, newStatus: TripStatus, feedback?: TripFeedback) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: newStatus, feedback } : t));
    
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    // State Synchronization Machine
    if (newStatus === TripStatus.COMPLETED || newStatus === TripStatus.CANCELLED) {
       // Free up Driver
       if (trip.driverId) {
          setUsers(prev => prev.map(u => u.id === trip.driverId ? { ...u, status: 'ONLINE' } : u));
       }
       // Free up Vehicle
       if (trip.vehicleId) {
          setVehicles(prev => prev.map(v => v.id === trip.vehicleId ? { ...v, status: VehicleStatus.ACTIVE, etaMinutes: 0 } : v));
       }
       
       let logMsg = `Trip ${trip.id} completed by driver ${trip.driverId}.`;
       if (feedback) {
          logMsg += ` Rating: ${feedback.rating}/5. Notes: ${feedback.comment}`;
          if (feedback.vehicleIssuesDetected) {
             addAuditLog('TRIP_FEEDBACK', `Driver reported vehicle issues for Trip ${trip.id}. Creating maintenance flag.`);
          }
       }
       addAuditLog('TRIP_COMPLETED', logMsg);

    } else if (newStatus === TripStatus.IN_PROGRESS) {
       addAuditLog('TRIP_STARTED', `Trip ${trip.id} passenger onboard.`);
    }
  };

  const handleReportIncident = (data: { type: string, severity: IncidentSeverity, notes?: string }) => {
    // Driver reporting incident
    const vehicle = vehicles.find(v => v.assignedDriverId === currentUser.id);
    const newIncident: Incident = {
       id: `inc-${Date.now()}`,
       vehicleId: vehicle?.id || 'UNKNOWN',
       driverId: currentUser.id,
       severity: data.severity,
       category: data.type,
       description: data.notes || `Driver reported ${data.type} issue via mobile app.`,
       timestamp: new Date().toISOString(),
       status: 'OPEN'
    };
    
    setIncidents(prev => [newIncident, ...prev]);
    
    // Auto-status update logic
    if (data.severity === IncidentSeverity.CRITICAL && vehicle) {
       setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: VehicleStatus.OUT_OF_SERVICE } : v));
       addAuditLog('CRITICAL_ALERT', `Vehicle ${vehicle.id} marked OUT_OF_SERVICE due to critical incident.`);
    }

    addAuditLog('INCIDENT_REPORTED', `Incident ${newIncident.id} reported by ${currentUser.name}`);
    alert("Incident reported successfully to Command Center.");
  };

  const handleChatRequest = (urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY', topic: string) => {
     addAuditLog('CHAT_REQUEST', `Chat requested by ${currentUser.name} [${urgency}]: ${topic}`);
     alert("Request received. Dispatch will contact you shortly.");
  };

  const handleAnalyzeIncident = async (incident: Incident) => {
    const vehicle = vehicles.find(v => v.id === incident.vehicleId);
    if (!vehicle) return;
    const analysis = await analyzeIncident(incident.description, vehicle.model);
    alert(`AI ASSESSMENT (${incident.id}):\n\n${analysis}`);
    addAuditLog('AI_ANALYSIS', `AI Analysis requested for incident ${incident.id}`);
  };

  const handleAcknowledgeIncident = (id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'ACKNOWLEDGED' } : inc));
    addAuditLog('INCIDENT_ACK', `Incident ${id} acknowledged by ${currentUser.name}.`);
  };

  const handleAssignIncident = (id: string) => {
     setAssigningIncidentId(id);
  };

  const handleAgentAssignment = (agentId: string) => {
     if (!assigningIncidentId) return;
     
     setIncidents(prev => prev.map(inc => {
        if (inc.id === assigningIncidentId) {
           return { 
              ...inc, 
              assignedToId: agentId, 
              status: inc.status === 'OPEN' ? 'INVESTIGATING' : inc.status // Auto-advance status
           };
        }
        return inc;
     }));

     const agent = users.find(u => u.id === agentId);
     addAuditLog('INCIDENT_ASSIGNED', `Incident ${assigningIncidentId} assigned to ${agent?.name || agentId}`);
     setAssigningIncidentId(null);
  };

  const handleUserUpdate = (userId: string, updates: Partial<UserProfile>) => {
    const user = users.find(u => u.id === userId);
    if (updates.role && user && updates.role !== user.role) {
       addAuditLog('ROLE_CHANGE', `User ${user.name} role changed from ${user.role} to ${updates.role} by ${currentUser.name}`);
    } else if (updates.codename) {
       addAuditLog('PROFILE_UPDATE', `User ${user?.name} codename updated to "${updates.codename}"`);
    } else {
       addAuditLog('USER_UPDATED', `User ${userId} profile updated.`);
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const handleRequestAction = (id: string, action: 'APPROVE' | 'REJECT') => {
     const request = incomingRequests.find(r => r.id === id);
     if (!request) return;

     if (action === 'REJECT') {
        if (!window.confirm(`Are you sure you want to reject the request from ${request.requestorName}?`)) return;
        
        addAuditLog('REQUEST_REJECTED', `Incoming request from ${request.requestorName} was rejected by ${currentUser.name}.`);
        setIncomingRequests(prev => prev.filter(r => r.id !== id));
        return;
     }

     if (action === 'APPROVE') {
        const newTrip: Trip = {
           id: `t-${Date.now()}`,
           unitId: settings.unitName,
           passengerName: request.requestorName,
           pickupLocation: request.pickupLocation,
           dropoffLocation: request.dropoffLocation,
           pickupTime: request.requestedTime,
           status: TripStatus.SCHEDULED,
           priority: request.priority,
           estimatedDurationMin: 45, // Default estimation for scheduled trips
           notes: request.notes ? `Request Note: ${request.notes}` : 'Generated from Incoming Request.',
           vehicleId: undefined, // Requires dispatch
           driverId: undefined   // Requires dispatch
        };
        
        setTrips(prev => [newTrip, ...prev]);
        setIncomingRequests(prev => prev.filter(r => r.id !== id));
        
        addAuditLog('REQUEST_APPROVED', `Incoming request from ${request.requestorName} approved. Mission ${newTrip.id} scheduled.`);
     }
  };

  const handleRiderRequest = (req: Partial<IncomingRequest>) => {
     const newReq: IncomingRequest = {
        id: `req-${Date.now()}`,
        requestorName: req.requestorName || 'Unknown Rider',
        passengerCount: req.passengerCount || 1,
        pickupLocation: req.pickupLocation || 'Unknown',
        dropoffLocation: req.dropoffLocation || 'Unknown',
        requestedTime: new Date().toISOString(),
        priority: req.priority || 'STANDARD',
        status: 'PENDING',
        notes: req.notes
     };
     setIncomingRequests(prev => [newReq, ...prev]);
     addAuditLog('RIDER_REQUEST', `Mobile Rider ${newReq.requestorName} requested a shuttle to ${newReq.dropoffLocation}`);
  };

  // Route Handlers
  const handleAddRoute = (route: FixedRoute) => {
     setRoutes(prev => [...prev, route]);
     addAuditLog('ROUTE_CREATED', `New route created: ${route.name}`);
  };

  const handleUpdateRoute = (id: string, updates: Partial<FixedRoute>) => {
     setRoutes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
     addAuditLog('ROUTE_UPDATED', `Route ${id} updated.`);
  };

  const handleDeleteRoute = (id: string) => {
     if (confirm("Delete this route? This will unassign all vehicles.")) {
        setRoutes(prev => prev.filter(r => r.id !== id));
        // Reset vehicles assigned to this route
        setVehicles(prev => prev.map(v => v.assignedRouteId === id ? { ...v, assignedRouteId: undefined } : v));
        addAuditLog('ROUTE_DELETED', `Route ${id} deleted.`);
     }
  };

  const toggleViewMode = () => {
    if (viewMode === 'ADMIN') {
      setViewMode('DRIVER');
      setCurrentUser(MOCK_USERS[1]); // Agent Smith
    } else if (viewMode === 'DRIVER') {
      setViewMode('RIDER');
      // Mock Rider User
      setCurrentUser({
         id: 'r1',
         name: 'Staff Sgt. Adams',
         email: 'adams@base.mil',
         role: UserRole.RIDER,
         avatar: 'https://i.pravatar.cc/150?u=adams',
         department: 'Logistics',
         status: 'ONLINE'
      });
    } else {
      setViewMode('ADMIN');
      setCurrentUser(MOCK_USERS[0]); // Admin
    }
  };

  // -- Derived Data for UI --
  const filteredVehicles = vehicles.filter(v => {
      const term = fleetSearch.toLowerCase();
      return v.plate.toLowerCase().includes(term) || 
             v.model.toLowerCase().includes(term) || 
             v.vin.toLowerCase().includes(term);
  });

  const filteredMissions = trips.filter(t => {
     if (missionFilter === 'ALL') return true;
     return t.status === missionFilter;
  });

  const vehicleStatusData = [
     { name: 'Active', value: vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length, color: '#10b981' },
     { name: 'On Mission', value: vehicles.filter(v => v.status === VehicleStatus.ON_MISSION).length, color: '#0ea5e9' },
     { name: 'Maintenance', value: vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length, color: '#f59e0b' },
     { name: 'Out of Service', value: vehicles.filter(v => v.status === VehicleStatus.OUT_OF_SERVICE).length, color: '#ef4444' }
  ];

  const incidentsData = [
     { name: 'Crit', value: incidents.filter(i => i.severity === IncidentSeverity.CRITICAL).length },
     { name: 'High', value: incidents.filter(i => i.severity === IncidentSeverity.HIGH).length },
     { name: 'Med', value: incidents.filter(i => i.severity === IncidentSeverity.MEDIUM).length },
     { name: 'Low', value: incidents.filter(i => i.severity === IncidentSeverity.LOW).length },
  ];

  const missionPriorityData = [
     { name: 'VIP', value: trips.filter(t => t.priority === 'VIP').length, color: '#f59e0b' },
     { name: 'Urgent', value: trips.filter(t => t.priority === 'URGENT').length, color: '#ef4444' },
     { name: 'Standard', value: trips.filter(t => t.priority === 'STANDARD').length, color: '#3b82f6' },
  ];

  const activityData = [
    { time: '06:00', load: 15 }, { time: '08:00', load: 35 },
    { time: '10:00', load: 58 }, { time: '12:00', load: 45 },
    { time: '14:00', load: 62 }, { time: '16:00', load: 40 },
    { time: '18:00', load: 25 }, { time: '20:00', load: 15 },
  ];

  const fuelConsumptionData = vehicles.slice(0, 5).map(v => ({
     name: v.plate,
     fuel: Math.floor((100 - v.fuelLevel) * 0.8) // Mock calculation
  }));

  // RENDER RIDER APP
  if (viewMode === 'RIDER') {
     return (
      <div className="h-screen w-full bg-slate-200 flex items-center justify-center">
         <div className="w-full h-full md:h-[800px] md:w-[400px] md:rounded-3xl overflow-hidden border-8 border-slate-300 bg-white relative shadow-2xl">
             <RiderApp 
                user={currentUser} 
                vehicles={vehicles}
                users={users}
                activeRide={riderActiveTrip}
                onRequestRide={handleRiderRequest}
                onLogout={toggleViewMode}
             />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-300 rounded-b-xl z-50"></div>
         </div>
      </div>
     );
  }

  // RENDER DRIVER APP
  if (viewMode === 'DRIVER') {
    const activeTrip = trips.find(t => t.driverId === currentUser.id && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') || null;
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
         <div className="w-full h-full md:h-[800px] md:w-[400px] md:rounded-3xl overflow-hidden border-8 border-gray-800 bg-gray-900 relative">
             <DriverApp 
                user={currentUser} 
                activeTrip={activeTrip}
                allTrips={trips}
                onStatusChange={(status) => setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, status } : u))}
                onTripUpdate={handleTripUpdate}
                onReportIncident={handleReportIncident}
                onRequestChat={handleChatRequest}
                onLogout={toggleViewMode}
             />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-50"></div>
         </div>
      </div>
    );
  }

  // RENDER ADMIN APP
  return (
    <div className="flex h-screen bg-gov-900 text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gov-800 border-r border-gov-700 flex flex-col transition-all duration-300 z-40`}>
        <div className="h-16 flex items-center justify-center border-b border-gov-700 bg-gov-900">
           {sidebarOpen ? (
             <div className="flex items-center gap-2 font-bold text-lg tracking-wider">
               <div className="w-8 h-8 bg-gradient-to-br from-gov-accent to-blue-700 rounded flex items-center justify-center shadow-lg shadow-blue-900/50">
                 <Settings className="text-white" size={18} />
               </div>
               <span>GOVFLEET</span>
             </div>
           ) : (
             <div className="w-8 h-8 bg-gradient-to-br from-gov-accent to-blue-700 rounded flex items-center justify-center shadow-lg shadow-blue-900/50">
                 <Settings className="text-white" size={18} />
             </div>
           )}
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3">
          {[
            { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Command' },
            { id: 'MAP', icon: Map, label: 'Live Map' },
            { id: 'ROUTES', icon: RouteIcon, label: 'Routes' },
            { id: 'MISSIONS', icon: ClipboardList, label: 'Missions' },
            { id: 'STATISTICS', icon: TrendingUp, label: 'Statistics' },
            { id: 'FLEET', icon: Car, label: 'Vehicles' },
            { id: 'INCIDENTS', icon: AlertTriangle, label: 'Incidents' },
            { id: 'CALENDAR', icon: CalendarIcon, label: 'Schedule' },
            { id: 'PERSONNEL', icon: Users, label: 'Personnel' },
            { id: 'MAINTENANCE', icon: Wrench, label: 'Maintenance' },
            { id: 'HISTORY', icon: FileClock, label: 'History' },
            { id: 'SETTINGS', icon: Settings, label: 'Settings' },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all mb-1 relative
                ${activeTab === item.id 
                  ? 'bg-gov-700/50 text-gov-accent border border-gov-600 shadow-lg' 
                  : 'text-gray-400 hover:bg-gov-700 hover:text-white'}`}
            >
              <div className="relative">
                 <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : ''} />
                 {item.id === 'MISSIONS' && incomingRequests.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border border-gov-800 animate-bounce"></span>
                 )}
              </div>
              {sidebarOpen && (
                 <div className="flex-1 flex justify-between items-center">
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.id === 'MISSIONS' && incomingRequests.length > 0 && (
                       <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full">{incomingRequests.length}</span>
                    )}
                 </div>
              )}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gov-700 space-y-1">
             <button onClick={toggleViewMode} className="w-full flex items-center gap-3 px-3 py-3 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                <Smartphone size={20} />
                {sidebarOpen && <span className="font-medium text-sm">Switch App Mode</span>}
             </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gov-700 bg-gov-900/50">
          <button className="w-full flex items-center gap-3 px-2 py-2 rounded text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-gov-800/80 backdrop-blur border-b border-gov-700 flex items-center justify-between px-6 z-30 shadow-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition-transform hover:scale-110"><Menu size={24} /></button>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-gov-accent">/</span> {activeTab.replace('_', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowSupportModal(true)} className="hidden md:flex bg-gov-800 hover:bg-gov-700 border border-gov-600 text-white px-3 py-2 rounded font-bold text-xs items-center gap-2 transition-all">
                <HelpCircle size={14} /> Support
             </button>
             <button onClick={() => handleDispatchStart()} className="hidden md:flex bg-gov-accent hover:bg-sky-500 text-white px-4 py-2 rounded font-bold text-sm items-center gap-2 shadow-lg shadow-sky-900/20 transition-all hover:-translate-y-0.5">
               <NavIcon size={16} /> New Dispatch
             </button>
             <div className="h-8 w-[1px] bg-gov-700 mx-2"></div>
             <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-xs font-bold text-white leading-none">Admin User</p>
                 <p className="text-xs text-gray-400">HQ Command</p>
               </div>
               <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gov-700 to-gov-600 border border-gov-500 flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer hover:border-gov-accent transition-colors">
                 AD
               </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-gov-900">
          
          {/* VIEW: DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <div className="flex flex-col h-[calc(100vh-140px)] gap-6 overflow-y-auto pr-2 pb-20">
              {/* Stats */}
              <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Fleet Readiness" value={`${vehicles.filter(v => v.status === 'ACTIVE' || v.status === 'ON_MISSION').length}/${vehicles.length}`} subtext="Vehicles Available" icon={Car} colorClass="text-emerald-500" />
                <StatCard title="Active Missions" value={trips.filter(t => t.status === 'IN_PROGRESS' || t.status === 'EN_ROUTE_PICKUP').length} subtext="Real-time Ops" icon={Map} colorClass="text-sky-500" />
                <PersonnelStatCard users={users} />
                <StatCard title="Crit Incidents" value={incidents.filter(i => i.severity === 'CRITICAL').length} subtext="Require Action" icon={AlertTriangle} colorClass="text-red-500" />
              </div>

              {/* 1. Requests + Scheduled Ops (Top Split) */}
              <div className="shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[250px]">
                  <IncomingRequestsFeed requests={incomingRequests} onAction={handleRequestAction} />
                  <ScheduledMissionsFeed trips={trips} vehicles={vehicles} />
              </div>

              {/* 2. Map (Middle) - Expanded Vertical Height */}
              <div className="shrink-0 h-[600px] flex flex-col bg-gov-800 rounded-lg border border-gov-700 shadow-xl overflow-hidden relative group">
                  <div className="p-3 border-b border-gov-700 flex justify-between items-center bg-gov-900/50 backdrop-blur z-10 shrink-0">
                      <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                        <Map size={16} className="text-gov-accent"/> Live Tactical Feed
                      </h3>
                      <div className="flex items-center gap-3">
                         <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <Activity size={10} className="animate-pulse"/> REALTIME
                         </span>
                         <button onClick={() => setActiveTab('MAP')} className="text-[10px] bg-gov-700 hover:bg-gov-600 px-2 py-0.5 rounded text-white transition-colors">Expand</button>
                      </div>
                   </div>
                   <div className="flex-1 relative bg-gov-900 w-full min-h-0">
                      <TacticalMap vehicles={vehicles} onVehicleSelect={handleVehicleSelect} selectedVehicleId={selectedVehicle?.id} />
                   </div>
              </div>

              {/* 3. Audit Logs (Bottom - Full Width) */}
              <div className="shrink-0 min-h-[200px]">
                  <AuditLogFeed logs={auditLogs} users={users} />
              </div>

            </div>
          )}

          {activeTab === 'ROUTES' && (
             <RouteManager 
               routes={routes} 
               vehicles={vehicles} 
               onAddRoute={handleAddRoute} 
               onUpdateRoute={handleUpdateRoute} 
               onDeleteRoute={handleDeleteRoute} 
             />
          )}

          {/* VIEW: STATISTICS */}
          {activeTab === 'STATISTICS' && (
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp /> Operational Analytics</h2>
                    <div className="flex gap-2">
                       <select className="bg-gov-800 border border-gov-600 text-xs rounded px-2 py-1 text-white"><option>Last 7 Days</option><option>Last 30 Days</option></select>
                       <button className="bg-gov-accent px-3 py-1 rounded text-xs font-bold text-white hover:bg-sky-600">Export Report</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Fleet Composition */}
                    <div className="bg-gov-800 rounded-lg border border-gov-700 p-4 flex flex-col shadow-lg min-h-[300px]">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><PieChartIcon size={14}/> Fleet Composition</h3>
                      <div className="flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                                  {vehicleStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                               </Pie>
                               <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
                               <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }} />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Incident Severity */}
                   <div className="bg-gov-800 rounded-lg border border-gov-700 p-4 flex flex-col shadow-lg min-h-[300px]">
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><BarChart2 size={14}/> Incident Severity</h3>
                       <div className="flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={incidentsData} layout="vertical" margin={{top: 5, right: 30, left: 0, bottom: 5}}>
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={40} tickLine={false} axisLine={false} />
                               <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px'}} />
                               <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                                  {incidentsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'Crit' ? '#ef4444' : entry.name === 'High' ? '#f97316' : entry.name === 'Med' ? '#eab308' : '#3b82f6'} />
                                  ))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Mission Priority */}
                   <div className="bg-gov-800 rounded-lg border border-gov-700 p-4 flex flex-col shadow-lg min-h-[300px]">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><ClipboardList size={14}/> Mission Priorities</h3>
                      <div className="flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={missionPriorityData} cx="50%" cy="50%" outerRadius="80%" paddingAngle={2} dataKey="value" stroke="none">
                                  {missionPriorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                               </Pie>
                               <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
                               <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }} />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Operational Volume */}
                   <div className="lg:col-span-2 bg-gov-800 rounded-lg border border-gov-700 p-5 shadow-lg flex flex-col min-h-[300px]">
                       <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Activity size={16} className="text-gov-accent"/> Operational Volume (Requests)</h3>
                       <div className="flex-1 w-full min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={activityData}>
                                <defs>
                                   <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px'}} itemStyle={{color: '#0ea5e9'}} />
                                <Area type="monotone" dataKey="load" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Fuel Analysis */}
                    <div className="bg-gov-800 rounded-lg border border-gov-700 p-4 flex flex-col shadow-lg min-h-[300px]">
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Fuel size={14}/> Fuel Consumption (Gal)</h3>
                       <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={fuelConsumptionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px'}} />
                                <Bar dataKey="fuel" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                 </div>
             </div>
          )}

          {activeTab === 'MAP' && (
             <div className="h-full flex flex-col relative">
                <div className="absolute top-4 right-4 z-10 bg-gov-900/90 backdrop-blur border border-gov-700 p-2 rounded-lg shadow-xl flex flex-col gap-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Tactical Filter</h3>
                    <div className="flex flex-col gap-1">
                        <button onClick={() => setMapStatusFilter('ALL')} className={`text-xs px-3 py-1.5 rounded text-left font-bold transition-colors ${mapStatusFilter === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>ALL UNITS</button>
                        {Object.values(VehicleStatus).map(status => (
                            <button key={status} onClick={() => setMapStatusFilter(status)} className={`text-xs px-3 py-1.5 rounded text-left font-bold transition-colors flex items-center gap-2 ${mapStatusFilter === status ? 'bg-gov-800 border border-gov-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                                <div className={`w-2 h-2 rounded-full ${status === VehicleStatus.ON_MISSION ? 'bg-sky-400' : status === VehicleStatus.ACTIVE ? 'bg-emerald-400' : status === VehicleStatus.MAINTENANCE ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
                <TacticalMap vehicles={vehicles.filter(v => mapStatusFilter === 'ALL' || v.status === mapStatusFilter)} onVehicleSelect={handleVehicleSelect} selectedVehicleId={selectedVehicle?.id} />
             </div>
          )}

          {/* VIEW: MISSIONS */}
          {activeTab === 'MISSIONS' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <ClipboardList /> Mission Control
                  </h2>
                  <div className="bg-gov-800 p-1 rounded-lg border border-gov-700 flex gap-1">
                     {['ALL', 'ACTIVE', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map(status => (
                        <button
                           key={status}
                           onClick={() => setMissionFilter(status as any)}
                           className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${missionFilter === status ? 'bg-gov-accent text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                           {status}
                        </button>
                     ))}
                  </div>
               </div>

               {/* New Incoming Requests Section */}
               {incomingRequests.length > 0 && (
                   <div className="bg-gov-800 rounded-lg border border-gov-700 p-4 shadow-lg border-l-4 border-l-gov-warning animate-in slide-in-from-top-4">
                       <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider mb-4">
                           <Bell size={16} className="text-gov-warning animate-pulse"/> Pending Requests ({incomingRequests.length})
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                           {incomingRequests.map(req => (
                               <div key={req.id} className="bg-gov-900 p-4 rounded border border-gov-700 flex flex-col justify-between hover:border-gov-600 transition-colors">
                                   <div>
                                       <div className="flex justify-between items-start mb-2">
                                           <span className="font-bold text-white text-sm">{req.requestorName}</span>
                                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.priority === 'VIP' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>{req.priority}</span>
                                       </div>
                                       <div className="space-y-1 text-xs text-gray-400 mb-4">
                                           <p className="flex items-center gap-2"><MapPin size={12}/> From: <span className="text-gray-300">{req.pickupLocation}</span></p>
                                           <p className="flex items-center gap-2"><NavIcon size={12}/> To: <span className="text-gray-300">{req.dropoffLocation}</span></p>
                                           <p className="flex items-center gap-2"><Clock size={12}/> Time: <span className="text-gray-300">{new Date(req.requestedTime).toLocaleString()}</span></p>
                                       </div>
                                   </div>
                                   <div className="flex gap-2 mt-2">
                                       <button onClick={() => handleRequestAction(req.id, 'APPROVE')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-1.5 rounded text-xs font-bold transition-colors">Approve</button>
                                       <button onClick={() => handleRequestAction(req.id, 'REJECT')} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-1.5 rounded text-xs font-bold transition-colors">Reject</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               <div className="bg-gov-800 border border-gov-700 rounded-lg overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gov-900 text-gray-400 uppercase text-xs tracking-wider font-bold">
                           <tr>
                              <th className="p-4 border-b border-gov-700">Mission ID</th>
                              <th className="p-4 border-b border-gov-700">Passenger</th>
                              <th className="p-4 border-b border-gov-700">Priority</th>
                              <th className="p-4 border-b border-gov-700">Driver (Codename)</th>
                              <th className="p-4 border-b border-gov-700">Vehicle</th>
                              <th className="p-4 border-b border-gov-700">Route</th>
                              <th className="p-4 border-b border-gov-700">Status</th>
                              <th className="p-4 border-b border-gov-700 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gov-700">
                           {filteredMissions.map(trip => {
                              const driver = users.find(u => u.id === trip.driverId);
                              const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                              return (
                                 <tr key={trip.id} className="hover:bg-gov-700/50 transition-colors">
                                    <td className="p-4 font-mono text-gov-accent font-bold">{trip.id}</td>
                                    <td className="p-4 font-bold text-white">{trip.passengerName}</td>
                                    <td className="p-4">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trip.priority === 'VIP' ? 'bg-amber-500/20 text-amber-500' : trip.priority === 'URGENT' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                          {trip.priority}
                                       </span>
                                    </td>
                                    <td className="p-4">
                                       <div className="flex flex-col">
                                          <span className="text-white text-sm">{driver?.name || 'Unassigned'}</span>
                                          {driver?.codename && <span className="text-[10px] text-gray-500 font-mono">"{driver.codename}"</span>}
                                       </div>
                                    </td>
                                    <td className="p-4 text-gray-300 text-xs font-mono">{vehicle?.plate || '---'}</td>
                                    <td className="p-4">
                                       <div className="flex flex-col gap-1 text-[10px]">
                                          <span className="text-gray-400">P: <span className="text-gray-200">{trip.pickupLocation}</span></span>
                                          <span className="text-gray-400">D: <span className="text-gray-200">{trip.dropoffLocation}</span></span>
                                       </div>
                                    </td>
                                    <td className="p-4">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold border 
                                          ${trip.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 
                                            trip.status === 'CANCELLED' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                                            trip.status === 'SCHEDULED' ? 'bg-gray-700 border-gray-600 text-gray-300' :
                                            'bg-sky-500/10 border-sky-500/30 text-sky-500'}`}>
                                          {trip.status.replace('_', ' ')}
                                       </span>
                                    </td>
                                    <td className="p-4 text-right">
                                       <div className="flex justify-end gap-2">
                                          <button onClick={() => handleEditTrip(trip)} className="p-1.5 text-gray-400 hover:text-white bg-gov-700 hover:bg-gov-600 rounded transition-colors" title="Edit Mission"><Edit2 size={14} /></button>
                                          {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                                             <button onClick={() => handleDeleteTrip(trip.id)} className="p-1.5 text-red-400 hover:text-red-300 bg-gov-700 hover:bg-red-900/50 rounded transition-colors" title="Cancel Mission"><Trash2 size={14} /></button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                           {filteredMissions.length === 0 && (
                              <tr>
                                 <td colSpan={8} className="p-8 text-center text-gray-500 italic">No missions found for this filter.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'FLEET' && (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <h2 className="text-2xl font-bold text-white">Fleet Registry</h2>
                   <div className="flex gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input type="text" value={fleetSearch} onChange={(e) => setFleetSearch(e.target.value)} placeholder="Search Plate, VIN, Model..." className="w-full bg-gov-800 border border-gov-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-gov-accent outline-none" />
                      </div>
                      <button className="bg-gov-800 hover:bg-gov-700 px-3 py-2 rounded border border-gov-600 text-gray-400"><Filter size={18} /></button>
                      <button onClick={() => setShowAddVehicleModal(true)} className="bg-gov-accent hover:bg-sky-600 px-4 py-2 rounded text-sm text-white font-bold whitespace-nowrap">Add Vehicle</button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filteredVehicles.map(vehicle => (
                      <div key={vehicle.id} className="bg-gov-800 rounded-lg border border-gov-700 overflow-hidden hover:border-gov-accent/50 transition-colors group">
                         <div className="p-4 border-b border-gov-700 flex justify-between items-start bg-gov-900/50">
                            <div><h3 className="text-lg font-bold text-white font-mono">{vehicle.plate}</h3><p className="text-xs text-gray-400">{vehicle.model}</p></div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${vehicle.status === VehicleStatus.ACTIVE ? 'bg-emerald-500/20 text-emerald-500' : vehicle.status === VehicleStatus.ON_MISSION ? 'bg-sky-500/20 text-sky-500' : vehicle.status === VehicleStatus.MAINTENANCE ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>{vehicle.status.replace('_', ' ')}</span>
                         </div>
                         <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-gov-700/50 pb-2"><div className="flex items-center gap-2 text-gray-400"><Car size={14}/> Type</div><span className="text-white text-xs bg-gov-700 px-1.5 py-0.5 rounded">{vehicle.type}</span></div>
                            <div className="flex justify-between items-center text-sm border-b border-gov-700/50 pb-2"><div className="flex items-center gap-2 text-gray-400"><FileText size={14}/> VIN</div><span className="text-gray-300 font-mono text-xs">{vehicle.vin || 'N/A'}</span></div>
                            <div className="flex justify-between items-center text-sm border-b border-gov-700/50 pb-2"><div className="flex items-center gap-2 text-gray-400"><Timer size={14}/> Mission Status</div>{vehicle.status === VehicleStatus.ON_MISSION ? <span className="text-sky-400 font-mono text-xs">ETA: {vehicle.etaMinutes?.toFixed(0)}m</span> : vehicle.standbyTime && vehicle.standbyTime > 0 ? <span className="text-amber-500 font-mono text-xs">Idle: {vehicle.standbyTime}m</span> : <span className="text-gray-500 text-xs">-</span>}</div>
                            <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2 text-gray-400"><Gauge size={14}/> Speed</div><span className="text-white font-mono">{vehicle.speed} MPH</span></div>
                            <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2 text-gray-400"><Fuel size={14}/> Fuel</div><span className="text-white font-mono">{vehicle.fuelLevel}%</span></div>
                            <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2 text-gray-400"><Users size={14}/> Driver</div><span className="text-white text-xs">{vehicle.assignedDriverId ? users.find(u => u.id === vehicle.assignedDriverId)?.name || vehicle.assignedDriverId : 'Unassigned'}</span></div>
                         </div>
                         <div className="p-3 bg-gov-900 border-t border-gov-700 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedVehicle(vehicle); setActiveTab('MAP'); }} className="text-xs flex items-center gap-1 text-gov-accent hover:text-white"><LocateFixed size={12}/> Track</button>
                            <button onClick={() => setSelectedVehicle(vehicle)} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white">Details</button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'CALENDAR' && <CalendarView trips={trips} vehicles={vehicles} />}

          {activeTab === 'PERSONNEL' && <PersonnelManager users={users} onUpdateUser={handleUserUpdate} />}

          {activeTab === 'MAINTENANCE' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold text-white">Maintenance & Work Orders</h2>
                   <button className="bg-gov-700 hover:bg-gov-600 px-4 py-2 rounded text-sm text-white font-bold shadow-lg">New Work Order</button>
                </div>
                <WorkOrderBoard orders={workOrders} />
             </div>
          )}

          {activeTab === 'HISTORY' && (
             <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FileClock /> Trip History</h2>
                <div className="bg-gov-800 border border-gov-700 rounded-lg overflow-hidden shadow-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gov-900 text-gray-400 uppercase text-xs tracking-wider font-bold">
                        <tr>
                          <th className="p-4 border-b border-gov-700">Trip ID</th>
                          <th className="p-4 border-b border-gov-700">Date</th>
                          <th className="p-4 border-b border-gov-700">Driver</th>
                          <th className="p-4 border-b border-gov-700">Route Details</th>
                          <th className="p-4 border-b border-gov-700">Status</th>
                          <th className="p-4 border-b border-gov-700">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gov-700">
                        {trips.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED').map((trip, idx) => (
                            <tr key={trip.id} className={`hover:bg-gov-700/50 transition-colors ${idx % 2 === 0 ? 'bg-gov-800' : 'bg-gov-800/50'}`}>
                              <td className="p-4 font-mono text-gov-accent font-bold">{trip.id}</td>
                              <td className="p-4 text-gray-300">{new Date(trip.pickupTime).toLocaleDateString()} <span className="text-gray-500 text-xs">{new Date(trip.pickupTime).toLocaleTimeString()}</span></td>
                              <td className="p-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gov-700 flex items-center justify-center text-xs text-white">
                                       {users.find(u => u.id === trip.driverId)?.name.charAt(0) || '?'}
                                    </div>
                                    <span className="text-white text-sm">{users.find(u => u.id === trip.driverId)?.name || 'Unknown'}</span>
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="flex flex-col gap-1 text-xs">
                                    <span className="text-gray-400">From: <span className="text-white">{trip.pickupLocation}</span></span>
                                    <span className="text-gray-400">To: <span className="text-white">{trip.dropoffLocation}</span></span>
                                 </div>
                              </td>
                              <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold border ${trip.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>{trip.status}</span></td>
                              <td className="p-4 text-gray-400 font-mono">{trip.estimatedDurationMin} min</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
             </div>
           )}

           {activeTab === 'INCIDENTS' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Incident Management & Triage</h2>
              <div className="space-y-3">
                 {incidents.map(inc => (
                    <IncidentRow key={inc.id} incident={inc} users={users} onAnalyze={handleAnalyzeIncident} onAcknowledge={handleAcknowledgeIncident} onAssign={handleAssignIncident} />
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
             <div className="max-w-3xl space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Settings /> System Configuration</h2>
                <div className="bg-gov-800 border border-gov-700 rounded-lg p-6 space-y-6 shadow-lg">
                   <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 border-b border-gov-700 pb-2 uppercase tracking-wider">Unit Identity</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs text-gray-500">Unit Name</label>
                            <input type="text" value={settings.unitName} onChange={e => setSettings({...settings, unitName: e.target.value})} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs text-gray-500">Theme Preference</label>
                            <select value={settings.theme} onChange={e => setSettings({...settings, theme: e.target.value as any})} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none">
                               <option value="DARK">Dark Operations (Default)</option>
                               <option value="LIGHT">Light Admin (Experimental)</option>
                            </select>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 border-b border-gov-700 pb-2 uppercase tracking-wider">Safety Thresholds</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs text-gray-500">Speed Alert Threshold (MPH)</label>
                            <div className="relative">
                                <input type="number" value={settings.speedThreshold} onChange={e => setSettings({...settings, speedThreshold: parseInt(e.target.value)})} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none" />
                                <span className="absolute right-3 top-2 text-xs text-gray-500">MPH</span>
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs text-gray-500">Low Fuel Alert (%)</label>
                            <div className="relative">
                                <input type="number" value={settings.fuelAlertThreshold} onChange={e => setSettings({...settings, fuelAlertThreshold: parseInt(e.target.value)})} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none" />
                                <span className="absolute right-3 top-2 text-xs text-gray-500">%</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 border-b border-gov-700 pb-2 uppercase tracking-wider">Simulation Parameters</h3>
                      <div className="space-y-2 bg-gov-900 p-4 rounded border border-gov-700">
                         <label className="text-xs text-gray-400 font-bold">Telemetry Refresh Rate</label>
                         <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">Fast (1s)</span>
                            <input type="range" min="1" max="10" step="1" value={settings.refreshRateSeconds} onChange={e => setSettings({...settings, refreshRateSeconds: parseInt(e.target.value)})} className="flex-1 accent-gov-accent cursor-pointer" />
                            <span className="text-white font-mono w-10 text-right">{settings.refreshRateSeconds}s</span>
                         </div>
                      </div>
                   </div>

                   <div className="pt-4 flex justify-end">
                      <button onClick={() => alert("Configuration Saved")} className="bg-gov-success hover:bg-emerald-600 text-white px-6 py-2 rounded font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-transform active:scale-95">
                         <Save size={16} /> Save Changes
                      </button>
                   </div>
                </div>
             </div>
          )}

        </div>

        <VehicleDetailDrawer vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onDispatch={handleDispatchStart} />
        {showDispatchWizard && <TripDispatchWizard drivers={users} vehicles={vehicles} onDispatch={handleCreateTrip} onCancel={() => setShowDispatchWizard(false)} />}
        {showAddVehicleModal && <AddVehicleModal onSave={handleAddVehicle} onCancel={() => setShowAddVehicleModal(false)} />}
        {showEditTripModal && editingTrip && (
           <EditTripModal 
              trip={editingTrip} 
              drivers={users} 
              vehicles={vehicles} 
              onSave={handleSaveTrip} 
              onCancel={() => { setShowEditTripModal(false); setEditingTrip(null); }} 
           />
        )}
        {showSupportModal && (
           <LiveSupportModal 
              onClose={() => setShowSupportModal(false)}
              userRole={viewMode}
           />
        )}
        {assigningIncidentId && (
           <AssignAgentModal 
              users={users} 
              incidentId={assigningIncidentId} 
              onAssign={handleAgentAssignment} 
              onCancel={() => setAssigningIncidentId(null)} 
           />
        )}
      </main>
    </div>
  );
};

export default App;