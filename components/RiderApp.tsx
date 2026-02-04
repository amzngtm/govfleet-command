import React, { useState, useEffect } from 'react';
import { UserProfile, Vehicle, VehicleStatus, IncomingRequest, Trip, TripStatus } from '../types';
import TacticalMap, { MapMarker } from './TacticalMap';
import { Clock, MapPin, Bus, User, Bell, ChevronRight, LogOut, Navigation, Star, ShieldCheck, Lock, AlertCircle, X, CheckCircle, Car, Share2, Phone, Briefcase, HelpCircle } from 'lucide-react';
import LiveSupportModal from './LiveSupportModal';

interface RiderAppProps {
  user: UserProfile;
  vehicles: Vehicle[];
  users: UserProfile[]; // To look up driver details
  activeRide: Trip | null; 
  onRequestRide: (req: Partial<IncomingRequest>) => void;
  onLogout: () => void;
}

const RiderApp: React.FC<RiderAppProps> = ({ user, vehicles, users, activeRide, onRequestRide, onLogout }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'MAP' | 'BOOK' | 'ACTIVITY'>('MAP');
  const [pickup, setPickup] = useState('Building 4 (HQ)');
  const [dropoff, setDropoff] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [vehicleType, setVehicleType] = useState('STANDARD');
  const [notes, setNotes] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSupport, setShowSupport] = useState(false);

  // Mock user location for the map
  const userLocation = { x: 50, y: 50 };

  // Filter for active shuttles
  const activeShuttles = vehicles.filter(v => v.status === VehicleStatus.ACTIVE || v.status === VehicleStatus.ON_MISSION);

  // Determine Driver Info
  const assignedDriver = activeRide?.driverId ? users.find(u => u.id === activeRide.driverId) : null;
  const assignedVehicle = activeRide?.vehicleId ? vehicles.find(v => v.id === activeRide.vehicleId) : null;

  // Derive markers & route
  const markers: MapMarker[] = activeRide ? [
     { id: 'mk-pick', location: { x: 45, y: 45 }, type: 'PICKUP', label: 'Pickup' },
     { id: 'mk-drop', location: { x: 60, y: 30 }, type: 'DROPOFF', label: 'Dest' },
  ] : [];

  const routePoints = activeRide ? [
     { x: 45, y: 45 }, // Start
     { x: 50, y: 40 }, // Midpoint
     { x: 55, y: 35 }, // Midpoint
     { x: 60, y: 30 }  // End
  ] : undefined;

  useEffect(() => {
     if (activeRide) {
        if (activeRide.status === TripStatus.DISPATCHED) {
           setNotification("Driver Dispatched! ETA 5 mins.");
        } else if (activeRide.status === TripStatus.ARRIVED_PICKUP) {
           setNotification("Your ride has arrived!");
        }
     }
  }, [activeRide?.status]);

  const handleLogin = () => {
     setIsLoggedIn(true);
  };

  const handleRequest = () => {
    if (!dropoff) return;
    
    onRequestRide({
        requestorName: user.name,
        passengerCount: passengers,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        priority: 'STANDARD',
        notes: `Type: ${vehicleType}. ${notes}`
    });
    
    setRequestSent(true);
    setTimeout(() => {
        setRequestSent(false);
        setActiveTab('ACTIVITY');
        setDropoff('');
        setNotes('');
        setNotification("Request received. Finding a driver...");
    }, 2000);
  };

  const handleSOS = () => {
     alert("EMERGENCY SIGNAL SENT TO COMMAND.\nDispatch is tracking your location.");
  };

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) {
     return (
        <div className="h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-white font-sans relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="z-10 w-full max-w-sm space-y-8">
              <div className="text-center">
                 <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl mb-6 transform rotate-3">
                    <Bus size={40} className="text-white" />
                 </div>
                 <h1 className="text-3xl font-bold tracking-tight">GovFleet<br/><span className="text-indigo-400">Rider</span></h1>
                 <p className="text-slate-400 mt-2 text-sm">Secure Personnel Transport</p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-6 rounded-xl space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-slate-500">Gov ID / Email</label>
                    <div className="flex items-center bg-slate-900 border border-slate-600 rounded-lg p-3">
                       <User size={18} className="text-slate-400 mr-3" />
                       <span className="text-white text-sm">{user.email}</span>
                    </div>
                 </div>
                 <button 
                    onClick={handleLogin}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                    <Lock size={16} /> Authenticate
                 </button>
                 <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                    <ShieldCheck size={10} /> DoD CAC / PIV Compatible
                 </p>
              </div>
           </div>
        </div>
     );
  }

  // --- MAIN APP ---
  return (
    <div className="h-full bg-gray-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden text-slate-800">
      
      {/* Notifications Toast */}
      {notification && (
         <div className="absolute top-20 left-4 right-4 bg-slate-900/90 backdrop-blur text-white p-3 rounded-lg shadow-xl z-50 flex items-center justify-between animate-in slide-in-from-top-2 border-l-4 border-indigo-500">
            <div className="flex items-center gap-3">
               <Bell size={18} className="text-indigo-400" />
               <span className="text-sm font-medium">{notification}</span>
            </div>
            <button onClick={() => setNotification(null)}><X size={16} className="text-slate-400" /></button>
         </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 shadow-sm z-20 flex justify-between items-center safe-area-top border-b border-slate-100">
         <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-indigo-100">
               {user.name.charAt(0)}
            </div>
            <div>
               <h3 className="font-bold text-slate-900 leading-tight text-sm">{user.name.split(' ')[0]}</h3>
               <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full w-fit">AUTHORIZED</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button
               onClick={() => setShowSupport(true)}
               className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
               aria-label="Support">
               <HelpCircle size={20} />
            </button>
            <button 
               onClick={onLogout} 
               className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" 
               aria-label="Logout">
               <LogOut size={20} />
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-slate-100 overflow-hidden">
         
         {activeTab === 'MAP' && (
            <>
               <div className="flex-1 relative">
                  <TacticalMap 
                     vehicles={activeShuttles} 
                     onVehicleSelect={() => {}} 
                     userLocation={userLocation}
                     markers={markers} 
                     routePoints={routePoints}
                  />
                  
                  {/* Active Ride Card (Overlay) */}
                  {activeRide ? (
                     <div className="absolute bottom-4 left-4 right-4 bg-white p-5 rounded-2xl shadow-2xl z-30 animate-in slide-in-from-bottom-10 border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                 {activeRide.status === TripStatus.ARRIVED_PICKUP ? 'Shuttle Arrived!' : 
                                  activeRide.status === TripStatus.IN_PROGRESS ? 'En Route to Dest' : 
                                  'Driver Assigned'}
                              </h4>
                              <p className="text-xs text-slate-500">Trip ID: #{activeRide.id.slice(-4)}</p>
                           </div>
                           <div className="bg-indigo-50 text-indigo-700 font-bold text-xs px-2 py-1 rounded">
                              {activeRide.estimatedDurationMin} min
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                           {assignedDriver ? (
                              <img src={assignedDriver.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                           ) : (
                              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-400"><User size={24}/></div>
                           )}
                           <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{assignedDriver?.name || 'Searching...'}</p>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                 <Star size={10} className="text-yellow-400 fill-yellow-400" /> 
                                 <span>4.9</span> • 
                                 <span className="font-mono">{assignedVehicle?.plate || '---'}</span>
                              </div>
                           </div>
                           <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                              <Phone size={20} />
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                              <Share2 size={16} /> Share ETA
                           </button>
                           <button 
                              onClick={handleSOS}
                              className="p-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl transition-colors">
                              <ShieldCheck size={20} />
                           </button>
                        </div>
                     </div>
                  ) : (
                     /* Standard Booking Prompt */
                     <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-xl z-30 animate-in slide-in-from-bottom-4">
                        <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                           <Bus size={16} className="text-indigo-600"/> Nearby Shuttles
                        </h4>
                        <div className="space-y-3">
                           {activeShuttles.slice(0, 2).map(v => (
                              <div key={v.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                                       {v.type[0]}
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-slate-700">{v.plate}</p>
                                       <p className="text-[10px] text-slate-500">{v.model}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-bold text-emerald-600">~{Math.floor(Math.random() * 5 + 2)} min</p>
                                    <p className="text-[10px] text-slate-400">ETA</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <button 
                           onClick={() => setActiveTab('BOOK')} 
                           className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
                           aria-label="Book a shuttle">
                           Book a Shuttle
                        </button>
                     </div>
                  )}
               </div>
            </>
         )}

         {activeTab === 'BOOK' && (
            <div className="flex-1 p-6 space-y-6 bg-white overflow-y-auto animate-in slide-in-from-right-10">
               <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Where to?</h2>
                  <p className="text-slate-500 text-sm">Official transport for authorized personnel.</p>
               </div>

               <div className="space-y-4">
                  <div className="relative">
                     <div className="absolute top-3 left-3 flex flex-col items-center gap-1 h-full">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                        <div className="w-0.5 flex-1 bg-slate-200"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                     </div>
                     
                     <div className="space-y-4 pl-8">
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-400 uppercase">Pickup</label>
                           <input value={pickup} onChange={e => setPickup(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" aria-label="Pickup Location" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-400 uppercase">Dropoff</label>
                           <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Enter destination..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" aria-label="Dropoff Location" />
                        </div>
                     </div>
                  </div>

                  {/* Vehicle Selection */}
                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Vehicle Type</label>
                     <div className="grid grid-cols-3 gap-2">
                        {[
                           { id: 'STANDARD', label: 'Std', icon: Car },
                           { id: 'SUV', label: 'SUV', icon: ShieldCheck },
                           { id: 'VAN', label: 'Van', icon: Bus }
                        ].map(type => (
                           <button 
                              key={type.id}
                              onClick={() => setVehicleType(type.id)}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${vehicleType === type.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                           >
                              <type.icon size={20} className="mb-1" />
                              <span className="text-[10px] font-bold uppercase">{type.label}</span>
                           </button>
                        ))}
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Passengers</label>
                     <div className="flex gap-2">
                        {[1, 2, 3, 4].map(n => (
                           <button 
                              key={n} 
                              onClick={() => setPassengers(n)}
                              className={`w-12 h-12 rounded-xl font-bold border transition-all ${passengers === n ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              aria-label={`${n} passenger`}>
                              {n}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Notes for Driver</label>
                     <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Gate code, luggage, etc."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 outline-none focus:border-indigo-500 min-h-[60px]"
                     />
                  </div>
               </div>

               <div className="mt-auto pt-4 pb-2">
                  <button 
                     onClick={handleRequest}
                     disabled={!dropoff || requestSent}
                     className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                     {requestSent ? 'Requesting...' : 'Confirm Request'}
                     {!requestSent && <ChevronRight size={20} />}
                  </button>
                  {requestSent && (
                     <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center text-sm font-bold animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Request Sent to Dispatch!
                     </div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'ACTIVITY' && (
            <div className="flex-1 p-4 bg-slate-50 overflow-y-auto animate-in slide-in-from-right-10">
               <h2 className="text-lg font-bold text-slate-900 mb-4 px-2">Your Activity</h2>
               
               <div className="space-y-3">
                  {/* Current Active Request */}
                  {(requestSent || activeRide) && (
                     <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="flex justify-between items-start mb-2">
                           <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded">
                              {activeRide ? activeRide.status.replace('_', ' ') : 'PENDING'}
                           </span>
                           <span className="text-xs text-slate-400">Today</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                              <Bus size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">{activeRide ? 'Active Mission' : 'Shuttle Request'}</p>
                              <p className="text-xs text-slate-500">To: {dropoff || activeRide?.dropoffLocation || 'Pending...'}</p>
                           </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded text-xs text-slate-500 flex items-center gap-2">
                           <Clock size={14} /> 
                           {activeRide ? 'Vehicle en route.' : 'Waiting for dispatch assignment...'}
                        </div>
                     </div>
                  )}

                  {/* History */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 opacity-60">
                     <div className="flex justify-between items-start mb-2">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">COMPLETED</span>
                        <span className="text-xs text-slate-400">Yesterday</span>
                     </div>
                     <div className="mb-1">
                        <p className="text-sm font-bold text-slate-800">Trip #T-8821</p>
                        <p className="text-xs text-slate-500">To: Main Gate</p>
                     </div>
                     <div className="flex gap-1 mt-2">
                        {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
                     </div>
                  </div>
               </div>
            </div>
         )}

      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-slate-200 p-2 flex justify-around safe-area-bottom">
         <button onClick={() => setActiveTab('MAP')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-20 transition-all ${activeTab === 'MAP' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`} aria-label="Map View">
            <MapPin size={22} />
            <span className="text-[10px] font-medium">Map</span>
         </button>
         <button onClick={() => setActiveTab('BOOK')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-20 transition-all ${activeTab === 'BOOK' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`} aria-label="Book Ride">
            <Navigation size={22} />
            <span className="text-[10px] font-medium">Ride</span>
         </button>
         <button onClick={() => setActiveTab('ACTIVITY')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-20 transition-all ${activeTab === 'ACTIVITY' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`} aria-label="Activity">
            <div className="relative">
               <Bell size={22} />
               {(requestSent || activeRide) && <div className="absolute top-0 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>}
            </div>
            <span className="text-[10px] font-medium">Alerts</span>
         </button>
      </div>

      {/* Live Support Modal */}
      {showSupport && (
         <LiveSupportModal 
            onClose={() => setShowSupport(false)}
            userRole="RIDER"
         />
      )}

    </div>
  );
};

export default RiderApp;