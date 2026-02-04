import React, { useState, useEffect } from 'react';
import { UserProfile, Trip, TripStatus, IncidentSeverity, TripFeedback } from '../types';
import { Navigation, MapPin, ShieldAlert, CheckCircle, Phone, MessageSquare, LogOut, Power, Calendar, Home, Mail, Clock, ChevronRight, Star, ThumbsUp, ThumbsDown, AlertTriangle, Send, Radio } from 'lucide-react';
import LiveSupportModal from './LiveSupportModal';

interface DriverAppProps {
  user: UserProfile;
  activeTrip: Trip | null;
  allTrips?: Trip[];
  onStatusChange: (status: 'ONLINE' | 'OFFLINE') => void;
  onTripUpdate: (tripId: string, status: TripStatus, feedback?: TripFeedback) => void;
  onReportIncident: (data: any) => void;
  onLogout: () => void;
  onRequestChat: (urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY', topic: string) => void;
}

const DriverApp: React.FC<DriverAppProps> = ({ user, activeTrip, allTrips = [], onStatusChange, onTripUpdate, onReportIncident, onLogout, onRequestChat }) => {
  const [isShiftActive, setIsShiftActive] = useState(user.status === 'ONLINE');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showChatRequestModal, setShowChatRequestModal] = useState(false);
  const [showLiveSupportModal, setShowLiveSupportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'HOME' | 'SCHEDULE' | 'INBOX'>('HOME');
  
  // Debrief / Feedback State
  const [debriefTrip, setDebriefTrip] = useState<Trip | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [vehicleIssues, setVehicleIssues] = useState(false);

  // Chat Request State
  const [chatUrgency, setChatUrgency] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [chatTopic, setChatTopic] = useState('');

  const upcomingTrips = allTrips.filter(t => t.driverId === user.id && t.status === TripStatus.SCHEDULED);

  const toggleShift = () => {
    const newStatus = !isShiftActive;
    setIsShiftActive(newStatus);
    onStatusChange(newStatus ? 'ONLINE' : 'OFFLINE');
  };

  const handleTripAction = () => {
    if (!activeTrip) return;
    
    // State machine
    if (activeTrip.status === TripStatus.DISPATCHED) {
       onTripUpdate(activeTrip.id, TripStatus.EN_ROUTE_PICKUP);
    } else if (activeTrip.status === TripStatus.EN_ROUTE_PICKUP) {
       onTripUpdate(activeTrip.id, TripStatus.ARRIVED_PICKUP);
    } else if (activeTrip.status === TripStatus.ARRIVED_PICKUP) {
       onTripUpdate(activeTrip.id, TripStatus.IN_PROGRESS);
    } else if (activeTrip.status === TripStatus.IN_PROGRESS) {
       // Instead of completing immediately, enter Debrief Mode
       setDebriefTrip(activeTrip);
    }
  };

  const submitDebrief = () => {
    if (!debriefTrip) return;
    
    const feedback: TripFeedback = {
      rating: feedbackRating,
      comment: feedbackNotes,
      vehicleIssuesDetected: vehicleIssues
    };

    onTripUpdate(debriefTrip.id, TripStatus.COMPLETED, feedback);
    setDebriefTrip(null);
    setFeedbackRating(5);
    setFeedbackNotes('');
    setVehicleIssues(false);
  };

  const handleChatSubmit = () => {
    onRequestChat(chatUrgency, chatTopic || 'General Inquiry');
    setShowChatRequestModal(false);
    setChatTopic('');
    setChatUrgency('NORMAL');
  };

  const getButtonText = () => {
    switch (activeTrip?.status) {
      case TripStatus.DISPATCHED: return "Accept & Start Navigation";
      case TripStatus.EN_ROUTE_PICKUP: return "Arrived at Pickup";
      case TripStatus.ARRIVED_PICKUP: return "Passenger Onboard - Start Trip";
      case TripStatus.IN_PROGRESS: return "Arrived at Destination (End Trip)";
      default: return "Trip Completed";
    }
  };

  // Mock Messages
  const messages = [
    { id: 1, sender: 'Dispatch', text: 'Traffic reported on I-95 South. Recommend alternate route via Rt 1.', time: '10:05 AM', read: false },
    { id: 2, sender: 'System', text: 'Vehicle #GOV-9912 maintenance due in 500 miles.', time: '08:30 AM', read: true },
    { id: 3, sender: 'Cmdr. Connor', text: 'Good work on the Senator extraction yesterday.', time: 'Yesterday', read: true },
  ];

  // RENDER: DEBRIEF MODE
  if (debriefTrip) {
    return (
       <div className="h-full bg-gray-950 flex flex-col font-sans max-w-md mx-auto border-x border-gray-800 shadow-2xl relative p-6">
          <div className="flex-1 flex flex-col items-center">
             <div className="w-16 h-16 bg-gov-success/20 text-gov-success rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Mission Complete</h2>
             <p className="text-gray-400 text-sm mb-8">Please submit your post-mission debrief.</p>

             <div className="w-full bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
                <div className="space-y-2">
                   <label className="text-xs text-gray-400 font-bold uppercase block text-center">Mission Rating</label>
                   <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                         <button 
                           key={star} 
                           onClick={() => setFeedbackRating(star)}
                           className={`p-2 transition-transform hover:scale-110 ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-700'}`}>
                           <Star size={24} fill={star <= feedbackRating ? "currentColor" : "none"} />
                         </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs text-gray-400 font-bold uppercase">Field Notes (Optional)</label>
                   <textarea 
                     value={feedbackNotes}
                     onChange={(e) => setFeedbackNotes(e.target.value)}
                     className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-gov-accent outline-none min-h-[80px]"
                     placeholder="Route issues, passenger notes, etc."
                   />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer" onClick={() => setVehicleIssues(!vehicleIssues)}>
                   <div className={`w-5 h-5 rounded border flex items-center justify-center ${vehicleIssues ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                      {vehicleIssues && <CheckCircle size={14} className="text-white" />}
                   </div>
                   <span className="text-sm text-gray-300">Report vehicle performance issues?</span>
                </div>
             </div>
          </div>

          <button 
            onClick={submitDebrief}
            className="w-full py-4 bg-gov-accent hover:bg-sky-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 mt-4">
            <Send size={18} /> Submit Debrief
          </button>
       </div>
    )
  }

  // RENDER: NORMAL DRIVER APP
  return (
    <div className="h-full bg-gray-950 flex flex-col font-sans max-w-md mx-auto border-x border-gray-800 shadow-2xl relative">
      
      {/* Mobile Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
             <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-gov-accent" />
             <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${isShiftActive ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{user.name}</h3>
            <p className="text-[10px] text-gray-400 font-mono tracking-wide">{user.assignedVehicleId ? `UNIT: ${user.assignedVehicleId}` : 'NO UNIT ASSIGNED'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowLiveSupportModal(true)} className="p-2 text-gov-accent bg-gov-accent/10 rounded-full hover:bg-gov-accent/20 animate-pulse">
              <Radio size={18} />
           </button>
           <button onClick={onLogout} className="p-2 text-gray-500 hover:text-white"><LogOut size={18} /></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        
        {/* VIEW: HOME (Active Mission) */}
        {activeTab === 'HOME' && (
          <>
            {/* Offline State */}
            {!isShiftActive && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border-4 border-gray-700">
                  <Power size={40} className="text-gray-500" />
                </div>
                <div>
                  <h2 className="text-xl text-white font-bold">You are Off Duty</h2>
                  <p className="text-gray-400 text-sm max-w-xs mt-2">Go online to sync with Dispatch and receive mission assignments.</p>
                </div>
                <button 
                  onClick={toggleShift}
                  className="w-full py-4 bg-gov-success hover:bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all">
                  <Power size={20} /> Start Shift
                </button>
              </div>
            )}

            {/* Online - Idle State */}
            {isShiftActive && !activeTrip && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gov-accent/20 rounded-full animate-ping duration-1000"></div>
                    <div className="w-32 h-32 bg-gray-900 border-4 border-gov-accent rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                      <div className="text-center">
                         <Radio size={24} className="mx-auto text-gov-accent mb-2 animate-pulse" />
                         <span className="text-gov-accent font-bold text-xs tracking-wider">AWAITING<br/>DISPATCH</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg text-white font-bold">Standby Mode</h2>
                    <p className="text-gray-400 text-sm mt-1">Zone: Sector 7-Alpha</p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                       <div className="text-center px-4 py-2 bg-gray-800 rounded border border-gray-700">
                          <p className="text-xs text-gray-500">Readiness</p>
                          <p className="text-emerald-400 font-bold">{user.readinessScore}%</p>
                       </div>
                       <div className="text-center px-4 py-2 bg-gray-800 rounded border border-gray-700">
                          <p className="text-xs text-gray-500">Vehicle</p>
                          <p className="text-white font-bold">{user.assignedVehicleId || '---'}</p>
                       </div>
                    </div>
                  </div>
                  <button 
                    onClick={toggleShift}
                    className="mt-8 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-bold text-sm">
                    End Shift
                  </button>
              </div>
            )}

            {/* Active Trip State */}
            {isShiftActive && activeTrip && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Trip Card */}
                <div className="bg-gray-900 rounded-xl p-5 border border-gov-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                       <Navigation size={100} />
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${activeTrip.priority === 'VIP' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-500'}`}>
                        {activeTrip.priority} MISSION
                      </span>
                      <span className="text-gray-400 text-xs font-mono">#{activeTrip.id}</span>
                    </div>
                    
                    <div className="space-y-6 relative z-10 pl-2">
                      {/* Timeline Line */}
                      <div className="absolute left-3 top-3 bottom-10 w-0.5 bg-gray-700"></div>

                      <div className="flex gap-4 relative">
                          <div className="w-6 h-6 rounded-full bg-gov-accent border-4 border-gray-900 shrink-0 flex items-center justify-center shadow-lg shadow-sky-900/50">
                             <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Pickup Location</p>
                            <p className="text-white font-semibold text-lg leading-tight">{activeTrip.pickupLocation}</p>
                            {activeTrip.status === TripStatus.EN_ROUTE_PICKUP && <p className="text-gov-accent text-xs font-mono mt-1 animate-pulse">ETA: 5 min</p>}
                          </div>
                      </div>

                      <div className="flex gap-4 relative">
                          <div className="w-6 h-6 rounded-full bg-gray-700 border-4 border-gray-900 shrink-0 flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Dropoff Location</p>
                            <p className="text-gray-300 font-medium leading-tight">{activeTrip.dropoffLocation}</p>
                          </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-sm font-bold text-white border border-gray-700 shadow-sm">
                            {activeTrip.passengerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-white font-bold">{activeTrip.passengerName}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Principal</p>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button className="p-2.5 bg-gov-800 rounded-full text-gov-accent hover:bg-gov-700 border border-gov-700"><Phone size={18} /></button>
                          <button className="p-2.5 bg-gov-800 rounded-full text-gov-accent hover:bg-gov-700 border border-gov-700"><MessageSquare size={18} /></button>
                      </div>
                    </div>
                </div>

                {/* Navigation Placeholder */}
                <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden relative border border-gray-700 min-h-[180px] shadow-inner group">
                    <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-77.0369,38.9072,12,0/400x300@2x?access_token=pk.123')] bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    <div className="absolute top-4 left-4 right-4 bg-gray-900/95 border border-gov-700 p-3 rounded-lg flex items-center justify-between backdrop-blur shadow-lg">
                       <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Next Maneuver</p>
                          <p className="text-white font-bold text-sm">Right on Constitution Ave</p>
                       </div>
                       <div className="text-xl font-mono text-gov-accent">0.4 <span className="text-xs">mi</span></div>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-gov-accent text-white p-3 rounded-full shadow-lg animate-pulse">
                      <Navigation size={24} />
                    </div>
                </div>

                {/* Primary Action Button */}
                <button 
                  onClick={handleTripAction}
                  className={`w-full py-4 font-bold rounded-lg shadow-lg transform active:scale-95 transition-all text-lg flex items-center justify-center gap-2
                  ${activeTrip.status === TripStatus.IN_PROGRESS ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gov-success hover:bg-emerald-600 text-white'}`}>
                  {activeTrip.status === TripStatus.IN_PROGRESS ? <CheckCircle /> : <Navigation />}
                  {getButtonText()}
                </button>
              </div>
            )}
          </>
        )}

        {/* VIEW: SCHEDULE */}
        {activeTab === 'SCHEDULE' && (
           <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Upcoming Missions</h2>
              {upcomingTrips.length === 0 ? (
                 <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 text-center flex flex-col items-center justify-center h-64">
                    <Calendar size={48} className="text-gray-700 mb-4" />
                    <p className="text-gray-400 font-medium">No scheduled missions.</p>
                    <p className="text-gray-600 text-sm">Check back later for assignments.</p>
                 </div>
              ) : (
                 upcomingTrips.map(trip => (
                    <div key={trip.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex gap-4 items-center">
                       <div className="bg-gray-800 p-3 rounded text-center min-w-[60px]">
                          <p className="text-xs text-gov-accent font-bold uppercase">{new Date(trip.pickupTime).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          <p className="text-lg font-bold text-white">{new Date(trip.pickupTime).getDate()}</p>
                       </div>
                       <div className="flex-1">
                          <p className="text-white font-bold text-sm">{trip.pickupLocation}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <Clock size={12} className="text-gray-500" />
                             <p className="text-xs text-gray-400">{new Date(trip.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                          </div>
                          <span className={`inline-block mt-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${trip.priority === 'VIP' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>{trip.priority}</span>
                       </div>
                       <ChevronRight size={16} className="text-gray-600" />
                    </div>
                 ))
              )}
           </div>
        )}

        {/* VIEW: INBOX */}
        {activeTab === 'INBOX' && (
           <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Secure Inbox</h2>
              <div className="space-y-2">
                 {messages.map(msg => (
                    <div key={msg.id} className={`p-4 rounded-lg border transition-colors ${msg.read ? 'bg-gray-900 border-gray-800 opacity-70' : 'bg-gov-800 border-gov-700 shadow-md'}`}>
                       <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-white text-sm">{msg.sender}</span>
                          <span className="text-[10px] text-gray-500">{msg.time}</span>
                       </div>
                       <p className="text-sm text-gray-300 leading-relaxed">{msg.text}</p>
                    </div>
                 ))}
              </div>
           </div>
        )}

      </div>

      {/* Bottom Nav */}
      <div className="bg-gray-900 border-t border-gray-800 p-2 flex justify-around safe-area-bottom">
         <button 
           onClick={() => setActiveTab('HOME')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-all ${activeTab === 'HOME' ? 'text-gov-accent bg-gov-accent/5' : 'text-gray-500 hover:text-gray-300'}`}>
           <Home size={22} />
           <span className="text-[10px] font-medium">Mission</span>
         </button>
         <button 
           onClick={() => setActiveTab('SCHEDULE')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-all ${activeTab === 'SCHEDULE' ? 'text-gov-accent bg-gov-accent/5' : 'text-gray-500 hover:text-gray-300'}`}>
           <Calendar size={22} />
           <span className="text-[10px] font-medium">Sched</span>
         </button>
         <button 
           onClick={() => setActiveTab('INBOX')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-all ${activeTab === 'INBOX' ? 'text-gov-accent bg-gov-accent/5' : 'text-gray-500 hover:text-gray-300'}`}>
           <div className="relative">
              <Mail size={22} />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900"></div>
           </div>
           <span className="text-[10px] font-medium">Inbox</span>
         </button>
      </div>

      {/* Incident Button (Floating if Shift Active) */}
      {isShiftActive && activeTab === 'HOME' && !debriefTrip && (
           <button 
             onClick={() => setShowIncidentModal(true)}
             className="absolute bottom-24 right-4 w-14 h-14 bg-gray-800 hover:bg-gray-700 text-yellow-500 border-2 border-yellow-500/30 rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-95">
             <ShieldAlert size={28} />
           </button>
      )}

      {/* Chat Request Modal */}
      {showChatRequestModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 w-full rounded-xl border border-gray-700 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-10">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Radio className="text-gov-accent" /> Request Dispatch Comms
             </h3>
             
             <div className="space-y-3">
                <label className="text-xs text-gray-400 font-bold uppercase">Urgency Level</label>
                <div className="grid grid-cols-3 gap-2">
                   {['NORMAL', 'URGENT', 'EMERGENCY'].map((level) => (
                      <button 
                        key={level}
                        onClick={() => setChatUrgency(level as any)}
                        className={`p-2 rounded border text-xs font-bold transition-all ${chatUrgency === level 
                          ? level === 'EMERGENCY' ? 'bg-red-500 border-red-500 text-white' : 'bg-gov-accent border-gov-accent text-white' 
                          : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                        {level}
                      </button>
                   ))}
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">Topic</label>
                <input 
                   type="text" 
                   value={chatTopic}
                   onChange={(e) => setChatTopic(e.target.value)}
                   placeholder="e.g. Route blocked, Passenger delay..."
                   className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white text-sm focus:border-gov-accent outline-none"
                />
             </div>

             <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setShowChatRequestModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-gray-400 font-bold rounded-lg border border-gray-700">
                  Cancel
                </button>
                <button 
                  onClick={handleChatSubmit}
                  disabled={!chatTopic}
                  className="flex-1 py-3 bg-gov-accent hover:bg-sky-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  Request Chat
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Live Support Modal */}
      {showLiveSupportModal && (
         <LiveSupportModal 
            onClose={() => setShowLiveSupportModal(false)}
            userRole="DRIVER"
         />
      )}

      {/* Incident Modal Overlay */}
      {showIncidentModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 w-full rounded-xl border border-gray-700 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-10">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Report Incident
             </h3>
             <div className="grid grid-cols-2 gap-3">
                {['Accident', 'Flat Tire', 'Engine', 'Fuel', 'Medical', 'Other'].map(type => (
                   <button 
                     key={type}
                     onClick={() => {
                        onReportIncident({ type, severity: IncidentSeverity.HIGH });
                        setShowIncidentModal(false);
                     }}
                     className="p-3 bg-gray-800 hover:bg-red-900/30 border border-gray-700 hover:border-red-500 rounded text-gray-300 font-medium text-sm transition-all">
                     {type}
                   </button>
                ))}
             </div>
             <button 
               onClick={() => setShowIncidentModal(false)}
               className="w-full py-3 bg-gray-800 text-gray-400 font-semibold rounded-lg">
               Cancel
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverApp;