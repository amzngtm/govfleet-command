import React, { useState } from 'react';
import { Vehicle, VehicleStatus, Coordinates } from '../types';
import { Navigation, AlertTriangle, Radio, Clock, Timer, Shield, MapPin, User, Flag, Layers, Globe, Grid, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export interface MapMarker {
  id: string;
  location: Coordinates;
  type: 'PICKUP' | 'DROPOFF' | 'USER';
  label?: string;
  color?: string;
}

interface TacticalMapProps {
  vehicles: Vehicle[];
  onVehicleSelect: (v: Vehicle) => void;
  selectedVehicleId?: string;
  userLocation?: Coordinates; // For Rider App
  markers?: MapMarker[]; // For Route Visualization
  routePoints?: Coordinates[]; // Path to draw
}

const TacticalMap: React.FC<TacticalMapProps> = ({ vehicles, onVehicleSelect, selectedVehicleId, userLocation, markers = [], routePoints }) => {
  const [viewMode, setViewMode] = useState<'DARK' | 'SATELLITE' | 'GRID'>('DARK');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Strictly matched colors to VehicleDetailDrawer
  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ON_MISSION: return 'text-sky-400';      // Sky Blue 400
      case VehicleStatus.ACTIVE: return 'text-emerald-400';      // Emerald 400
      case VehicleStatus.MAINTENANCE: return 'text-amber-400';   // Amber 400
      case VehicleStatus.OUT_OF_SERVICE: return 'text-red-500';  // Red 500
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ON_MISSION: return 'bg-sky-400';
      case VehicleStatus.ACTIVE: return 'bg-emerald-400';
      case VehicleStatus.MAINTENANCE: return 'bg-amber-400';
      case VehicleStatus.OUT_OF_SERVICE: return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Simulated Map Backgrounds
  // Using tiling patterns for a continuous look
  const getBackgroundStyle = () => {
    switch (viewMode) {
      case 'SATELLITE':
        return {
          backgroundColor: '#0f172a',
          backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/1566/1171')`, // Sample tile
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(30%) contrast(1.2) brightness(0.6)'
        };
      case 'GRID':
        return {
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        };
      case 'DARK':
      default:
        return {
          backgroundColor: '#111',
          // Dark Matter style simulation using a filtered tile or pattern
          backgroundImage: `url('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/12/1171/1566.png')`, // Sample DC tile
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'contrast(1.1) brightness(0.9)'
        };
    }
  };

  return (
    <div className="relative w-full h-full bg-gov-900 overflow-hidden border-0 rounded-none shadow-none group select-none">
      
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 transition-all duration-500 ease-in-out" 
           style={{
             ...getBackgroundStyle(),
             transform: `scale(${zoomLevel})`
           }}>
      </div>

      {/* Grid Overlay (Always visible in Grid mode, faint in others) */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${viewMode === 'GRID' ? 'opacity-20' : 'opacity-5'}`} 
           style={{ 
             backgroundImage: 'linear-gradient(#475569 0.5px, transparent 0.5px), linear-gradient(90deg, #475569 0.5px, transparent 0.5px)', 
             backgroundSize: '10px 10px' 
           }}>
      </div>

      {/* Controls Layer (Top Right) */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
         {/* View Switcher */}
         <div className="bg-gov-900/90 backdrop-blur border border-gov-700 rounded-lg p-1 shadow-2xl flex flex-col gap-1">
            <button 
              onClick={() => setViewMode('DARK')}
              className={`p-2 rounded flex items-center justify-center transition-colors ${viewMode === 'DARK' ? 'bg-gov-accent text-white' : 'text-gray-400 hover:text-white hover:bg-gov-800'}`}
              title="Dark Map">
              <Layers size={18} />
            </button>
            <button 
              onClick={() => setViewMode('SATELLITE')}
              className={`p-2 rounded flex items-center justify-center transition-colors ${viewMode === 'SATELLITE' ? 'bg-gov-accent text-white' : 'text-gray-400 hover:text-white hover:bg-gov-800'}`}
              title="Satellite">
              <Globe size={18} />
            </button>
            <button 
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded flex items-center justify-center transition-colors ${viewMode === 'GRID' ? 'bg-gov-accent text-white' : 'text-gray-400 hover:text-white hover:bg-gov-800'}`}
              title="Tactical Grid">
              <Grid size={18} />
            </button>
         </div>

         {/* Zoom Controls */}
         <div className="bg-gov-900/90 backdrop-blur border border-gov-700 rounded-lg p-1 shadow-2xl flex flex-col gap-1 mt-2">
            <button onClick={() => setZoomLevel(z => Math.min(z + 0.2, 2))} className="p-2 text-gray-400 hover:text-white hover:bg-gov-800 rounded"><ZoomIn size={18} /></button>
            <button onClick={() => setZoomLevel(z => Math.max(z - 0.2, 1))} className="p-2 text-gray-400 hover:text-white hover:bg-gov-800 rounded"><ZoomOut size={18} /></button>
         </div>
      </div>

      {/* Route Polyline Layer */}
      {routePoints && routePoints.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
           <polyline 
             points={routePoints.map(p => `${p.x},${p.y}`).join(' ')}
             fill="none"
             stroke={viewMode === 'SATELLITE' ? '#38bdf8' : '#6366f1'} 
             strokeWidth="0.6"
             strokeDasharray="2 1"
             className="opacity-80 animate-pulse"
             filter="drop-shadow(0 0 2px rgba(0,0,0,0.5))"
           />
           {/* Start Dot */}
           <circle cx={routePoints[0].x} cy={routePoints[0].y} r="1" fill={viewMode === 'SATELLITE' ? '#38bdf8' : '#6366f1'} />
           {/* End Dot */}
           <circle cx={routePoints[routePoints.length-1].x} cy={routePoints[routePoints.length-1].y} r="1" fill={viewMode === 'SATELLITE' ? '#38bdf8' : '#6366f1'} />
        </svg>
      )}
      
      {/* Map Overlay Text (Top Left) */}
      <div className="absolute top-4 left-4 z-10 bg-gov-900/80 backdrop-blur border border-gov-700/50 px-3 py-1.5 rounded-md text-[10px] font-mono text-gov-accent shadow-lg flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-bold tracking-widest text-white/80">LIVE FEED // SECTOR 7 // {viewMode}</span>
        </div>
      </div>

      {/* Custom Markers (Pickup/Dropoff) */}
      {markers.map(marker => (
         <div 
            key={marker.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group/marker transition-all duration-300"
            style={{ 
               left: `${marker.location.x}%`, 
               top: `${marker.location.y}%`,
               // Simple parallax effect on zoom
               transform: `translate(-50%, -50%) scale(${1 + (1 - zoomLevel) * 0.5})` 
            }}
         >
            <div className={`p-1.5 rounded-full shadow-lg border-2 border-white ${marker.type === 'PICKUP' ? 'bg-emerald-500' : 'bg-red-500'} group-hover/marker:scale-125 transition-transform`}>
               {marker.type === 'PICKUP' ? <User size={12} className="text-white" /> : <Flag size={12} className="text-white" />}
            </div>
            {marker.label && (
               <div className="mt-1.5 px-2 py-1 bg-black/80 backdrop-blur rounded text-[9px] text-white font-bold whitespace-nowrap border border-white/20 shadow-lg">
                  {marker.label}
               </div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/50"></div>
            <div className="absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 w-8 h-2 bg-black/30 rounded-full blur-[2px]"></div>
         </div>
      ))}

      {/* User Location (Rider) */}
      {userLocation && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-1000 ease-linear"
          style={{ left: `${userLocation.x}%`, top: `${userLocation.y}%` }}
        >
           <div className="relative flex flex-col items-center">
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-50"></div>
              <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-xl relative z-10 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className="absolute top-6 bg-white text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-indigo-100 whitespace-nowrap">YOU</div>
           </div>
        </div>
      )}

      {/* Vehicles Layer */}
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          onClick={() => onVehicleSelect(vehicle)}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-[2000ms] ease-linear hover:scale-110 group z-30`}
          style={{ left: `${vehicle.location.x}%`, top: `${vehicle.location.y}%` }}
        >
          <div className="relative">
            {/* Ping Animation for Active/Mission Vehicles */}
            {(vehicle.status === VehicleStatus.ACTIVE || vehicle.status === VehicleStatus.ON_MISSION) && (
              <div 
                 className={`absolute -inset-8 rounded-full opacity-20 animate-ping ${getStatusBg(vehicle.status)}`}
                 style={{ animationDuration: vehicle.status === VehicleStatus.ON_MISSION ? '1.5s' : '3s' }}
              ></div>
            )}
            
            {/* Vehicle Icon Container */}
            <div className={`
                p-2 rounded-full bg-gov-900 shadow-2xl transition-all
                border-2 ${selectedVehicleId === vehicle.id ? 'border-white scale-110 ring-4 ring-gov-accent/50' : `border-gray-600 group-hover:border-gray-400 group-hover:bg-gov-800`}
            `}>
               {vehicle.status === VehicleStatus.OUT_OF_SERVICE ? (
                 <AlertTriangle size={16} className={getStatusColor(vehicle.status)} />
               ) : vehicle.status === VehicleStatus.MAINTENANCE ? (
                 <Shield size={16} className={getStatusColor(vehicle.status)} />
               ) : (
                 <Navigation size={16} className={`transform rotate-45 ${getStatusColor(vehicle.status)}`} />
               )}
            </div>

            {/* Label (Visible on hover or selected) */}
            <div className={`absolute left-8 top-[-10px] bg-gov-900/95 backdrop-blur border border-gov-600 p-2.5 rounded-lg text-xs whitespace-nowrap z-40 min-w-[140px] shadow-2xl
                ${selectedVehicleId === vehicle.id ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 -translate-x-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0'} 
                origin-left transition-all duration-200 pointer-events-none`}>
              
              <div className="flex justify-between items-center mb-1.5 border-b border-gov-700/50 pb-1.5">
                 <span className="font-bold text-white font-mono text-sm">{vehicle.plate}</span>
                 <span className={`text-[9px] font-black uppercase tracking-wider px-1 rounded ${getStatusBg(vehicle.status)} bg-opacity-20 ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status === VehicleStatus.ON_MISSION ? 'ON MISSION' : vehicle.status.replace('_', ' ')}
                 </span>
              </div>
              
              <div className="space-y-1">
                 <div className="flex items-center justify-between text-[10px] text-gray-400">
                     <span>{vehicle.model}</span>
                     <span className="font-mono text-white">{vehicle.speed} MPH</span>
                 </div>
                 {vehicle.status === VehicleStatus.ON_MISSION && (
                     <div className="flex items-center gap-1.5 text-sky-400 text-[10px] pt-1">
                        <Clock size={10} />
                        <span className="font-mono font-bold">ETA: {(vehicle.etaMinutes || 0).toFixed(0)}m</span>
                     </div>
                 )}
              </div>
              
              {/* Connector Triangle */}
              <div className="absolute top-3 -left-1.5 w-3 h-3 bg-gov-900 border-l border-b border-gov-600 transform rotate-45"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TacticalMap;