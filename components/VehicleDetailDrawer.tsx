import React from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { X, Battery, Gauge, MapPin, Wrench, ShieldAlert, Radio, Navigation, Clock, Timer, AlertCircle } from 'lucide-react';

interface Props {
  vehicle: Vehicle | null;
  onClose: () => void;
  onDispatch: (v: Vehicle) => void;
}

const VehicleDetailDrawer: React.FC<Props> = ({ vehicle, onClose, onDispatch }) => {
  if (!vehicle) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 md:w-96 bg-gov-800 border-l border-gov-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gov-700 flex justify-between items-center bg-gov-900/50 backdrop-blur">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{vehicle.plate}</h2>
          <p className="text-sm text-gov-accent font-mono mt-0.5">{vehicle.model}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gov-700 rounded-full text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Status Card */}
        <div className="bg-gov-900/80 rounded-xl p-5 border border-gov-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5">
             <Radio size={64} />
          </div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">System Status</span>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider
              ${vehicle.status === VehicleStatus.ON_MISSION ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 
                vehicle.status === VehicleStatus.ACTIVE ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                vehicle.status === VehicleStatus.MAINTENANCE ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {vehicle.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 relative z-10">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-gov-800 rounded-lg text-gray-400"><Gauge size={18} /></div>
                <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold">Speed</p>
                   <p className="font-mono text-white text-lg font-medium">{vehicle.speed} <span className="text-xs text-gray-500">MPH</span></p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-gov-800 rounded-lg text-gray-400"><Battery size={18} /></div>
                <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold">Fuel</p>
                   <p className="font-mono text-white text-lg font-medium">{vehicle.fuelLevel}%</p>
                </div>
             </div>
          </div>
        </div>

        {/* Operational Status (Enhanced) */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Mission Data</h3>
           
           {/* ON MISSION: Display ETA Prominently */}
           {vehicle.status === VehicleStatus.ON_MISSION ? (
               <div className="bg-sky-500/5 border border-sky-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-sky-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="flex items-center gap-4 text-sky-400 relative z-10">
                     <div className="p-2.5 bg-sky-500/10 rounded-full ring-1 ring-sky-500/30">
                        <Navigation size={20} />
                     </div>
                     <div>
                        <span className="text-sm font-bold block text-white">En Route</span>
                        <span className="text-[10px] text-sky-400/70 uppercase font-bold tracking-wider">Mission Active</span>
                     </div>
                  </div>
                  <div className="text-right relative z-10">
                     <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Dest. ETA</p>
                     <p className="font-mono text-white text-2xl font-bold leading-none tracking-tight">
                        {(vehicle.etaMinutes || 0).toFixed(0)}<span className="text-xs font-normal text-gray-500 ml-1">min</span>
                     </p>
                  </div>
               </div>
           ) : vehicle.status === VehicleStatus.ACTIVE && (vehicle.standbyTime || 0) > 0 ? (
               /* ACTIVE + STANDBY: Display Idle Time Prominently */
               <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4 text-amber-500">
                     <div className="p-2.5 bg-amber-500/10 rounded-full ring-1 ring-amber-500/30">
                        <Timer size={20} />
                     </div>
                     <div>
                        <span className="text-sm font-bold block text-white">Stationary</span>
                        <span className="text-[10px] text-amber-400/70 uppercase font-bold tracking-wider">Idle Status</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Duration</p>
                     <p className="font-mono text-white text-2xl font-bold leading-none tracking-tight">
                        {vehicle.standbyTime}<span className="text-xs font-normal text-gray-500 ml-1">min</span>
                     </p>
                  </div>
               </div>
           ) : (
               <div className="p-4 border border-dashed border-gov-600 rounded-xl text-xs text-gray-500 italic flex items-center justify-center gap-2 bg-gov-900/30">
                  <Clock size={14} /> Vehicle is currently inactive/parked.
               </div>
           )}
        </div>

        {/* Location Info */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Telemetry</h3>
           <div className="bg-gov-900/50 rounded-lg p-3 border border-gov-700 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                  <MapPin size={16} className="text-gov-accent" />
                  <span className="font-mono text-xs">Grid Sector {vehicle.location.x.toFixed(0)}-{vehicle.location.y.toFixed(0)}</span>
              </div>
              <div className="h-px bg-gov-700 w-full"></div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Radio size={16} className={`${vehicle.status !== VehicleStatus.OUT_OF_SERVICE ? 'text-emerald-400 animate-pulse' : 'text-red-500'}`} />
                  <span className="text-xs">Last Signal: <span className="text-white font-bold">{vehicle.lastPing}</span></span>
              </div>
           </div>
        </div>

         {/* Assigned Driver */}
         <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Personnel</h3>
           {vehicle.assignedDriverId ? (
             <div className="flex items-center gap-4 bg-gov-700/20 p-3 rounded-xl border border-gov-700">
                <div className="w-10 h-10 rounded-full bg-gov-600 flex items-center justify-center text-xs font-bold text-white shadow-lg border border-gov-500">AS</div>
                <div>
                    <p className="text-sm font-bold text-white">Agent Smith</p>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded w-fit mt-0.5 border border-emerald-500/20">Active Duty</p>
                </div>
             </div>
           ) : (
             <div className="p-3 bg-gov-900/30 rounded-xl border border-gov-700 text-center">
                <p className="text-xs text-gray-500 italic">No driver assigned</p>
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button 
            onClick={() => onDispatch(vehicle)}
            disabled={vehicle.status !== VehicleStatus.ACTIVE}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95
            ${vehicle.status === VehicleStatus.ACTIVE 
              ? 'bg-gov-accent hover:bg-sky-500 text-white shadow-sky-900/20' 
              : 'bg-gov-700 text-gray-500 cursor-not-allowed'}`}>
            <Navigation size={18} />
            Dispatch Mission
          </button>
          
          <button className="w-full py-3 bg-gov-800 border border-gov-600 hover:bg-gov-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95">
            <Wrench size={18} />
            Create Work Order
          </button>

          <button className="w-full py-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95">
            <ShieldAlert size={18} />
            Report Critical Incident
          </button>
        </div>

      </div>
    </div>
  );
};

export default VehicleDetailDrawer;