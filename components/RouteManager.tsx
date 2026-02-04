import React, { useState } from 'react';
import { FixedRoute, Vehicle, VehicleStatus, Coordinates } from '../types';
import { Map, MapPin, Plus, Edit2, Trash2, Bus, Circle } from 'lucide-react';
import TacticalMap from './TacticalMap';

interface RouteManagerProps {
  routes: FixedRoute[];
  vehicles: Vehicle[];
  onAddRoute: (route: FixedRoute) => void;
  onUpdateRoute: (id: string, route: Partial<FixedRoute>) => void;
  onDeleteRoute: (id: string) => void;
}

const RouteManager: React.FC<RouteManagerProps> = ({ routes, vehicles, onAddRoute, onUpdateRoute, onDeleteRoute }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const handleCreateRoute = () => {
    const newRoute: FixedRoute = {
      id: `route-${Date.now()}`,
      name: 'New Route',
      color: '#3b82f6',
      status: 'INACTIVE',
      stops: [],
      assignedVehicleIds: []
    };
    onAddRoute(newRoute);
    setSelectedRouteId(newRoute.id);
    setIsEditing(true);
  };

  // Filter vehicles that are assigned to this route or available
  const relevantVehicles = vehicles.filter(v => 
    v.assignedRouteId === activeRoute?.id || (activeRoute && activeRoute.assignedVehicleIds.includes(v.id))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Route List & Config */}
      <div className="lg:col-span-1 bg-gov-800 rounded-lg border border-gov-700 flex flex-col overflow-hidden shadow-lg">
        <div className="p-4 border-b border-gov-700 flex justify-between items-center bg-gov-900">
           <h3 className="font-bold text-white flex items-center gap-2"><Map size={18} className="text-gov-accent" /> Route Configurations</h3>
           <button onClick={handleCreateRoute} className="p-1.5 bg-gov-700 hover:bg-gov-600 rounded text-white transition-colors"><Plus size={16} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {routes.map(route => (
              <div 
                key={route.id} 
                onClick={() => { setSelectedRouteId(route.id); setIsEditing(false); }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRouteId === route.id ? 'bg-gov-900 border-gov-accent shadow-md' : 'bg-gov-800 border-gov-600 hover:border-gray-500'}`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }}></div>
                       <h4 className="font-bold text-white">{route.name}</h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${route.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>{route.status}</span>
                 </div>
                 
                 <div className="text-xs text-gray-400 space-y-1">
                    <p className="flex items-center gap-2"><MapPin size={12}/> {route.stops.length} Stops defined</p>
                    <p className="flex items-center gap-2"><Bus size={12}/> {route.assignedVehicleIds.length} Vehicles assigned</p>
                 </div>

                 {selectedRouteId === route.id && (
                    <div className="mt-3 pt-3 border-t border-gov-700 flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); onUpdateRoute(route.id, { status: route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }); }} className="flex-1 py-1.5 text-xs font-bold bg-gov-700 hover:bg-gov-600 rounded text-white">
                          {route.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteRoute(route.id); }} className="px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/30">
                          <Trash2 size={14} />
                       </button>
                    </div>
                 )}
              </div>
           ))}
        </div>
      </div>

      {/* Map Editor / Viewer */}
      <div className="lg:col-span-2 bg-gov-800 rounded-lg border border-gov-700 flex flex-col overflow-hidden shadow-lg relative">
         <div className="p-4 border-b border-gov-700 bg-gov-900 flex justify-between items-center z-10 relative">
            <h3 className="font-bold text-white flex items-center gap-2">
               {activeRoute ? (
                  <>Route Visualizer: <span style={{color: activeRoute.color}}>{activeRoute.name}</span></>
               ) : 'Select a Route'}
            </h3>
            {activeRoute && (
               <div className="flex gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Circle size={8} fill={activeRoute.color} className="text-transparent" /> Live Tracking</span>
               </div>
            )}
         </div>

         <div className="flex-1 relative bg-gov-900">
            {activeRoute ? (
               <TacticalMap 
                  vehicles={relevantVehicles} 
                  onVehicleSelect={() => {}} 
                  routePoints={activeRoute.stops.map(s => s.location)}
                  markers={activeRoute.stops.map(s => ({
                     id: s.id,
                     location: s.location,
                     type: 'PICKUP', // Reuse generic marker type
                     label: s.name,
                     color: activeRoute.color
                  }))}
               />
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Select a route to view its path and assigned units.
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default RouteManager;