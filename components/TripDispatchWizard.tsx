import React, { useState } from 'react';
import { Trip, UserProfile, Vehicle } from '../types';
import { recommendDispatch } from '../services/geminiService';
import { MapPin, User, Navigation, Sparkles, AlertCircle, Search, Circle } from 'lucide-react';

interface TripDispatchWizardProps {
  drivers: UserProfile[];
  vehicles: Vehicle[];
  onDispatch: (trip: any) => void;
  onCancel: () => void;
}

const TripDispatchWizard: React.FC<TripDispatchWizardProps> = ({ drivers, vehicles, onDispatch, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [formData, setFormData] = useState({
    passengerName: '',
    pickupLocation: '',
    dropoffLocation: '',
    priority: 'STANDARD',
    pickupTime: '',
    driverId: '',
    vehicleId: '',
    notes: ''
  });
  const [recommendation, setRecommendation] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSmartMatch = async () => {
    setLoadingAI(true);
    try {
      const resultJson = await recommendDispatch(formData as any, drivers, vehicles);
      const result = JSON.parse(resultJson);
      setRecommendation(result);
      if (result.recommendedDriverId) setFormData(prev => ({ ...prev, driverId: result.recommendedDriverId }));
      if (result.recommendedVehicleId) setFormData(prev => ({ ...prev, vehicleId: result.recommendedVehicleId }));
      setStep(2);
    } catch (e) {
      alert("AI Failed to generate recommendation. Please select manually.");
      setStep(2);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = () => {
     onDispatch({
        ...formData,
        id: `t-${Date.now()}`,
        status: 'DISPATCHED',
        unitId: 'Ops Alpha', // Default
        estimatedDurationMin: 30
     });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ONLINE': return 'bg-emerald-500';
      case 'BUSY': return 'bg-amber-500';
      case 'OFFLINE': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Sort drivers: ONLINE first, then BUSY, then OFFLINE
  const sortedDrivers = [...drivers].sort((a, b) => {
      const score = (status: string) => status === 'ONLINE' ? 3 : status === 'BUSY' ? 2 : 1;
      return score(b.status) - score(a.status);
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gov-800 w-full max-w-2xl rounded-xl border border-gov-600 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gov-700 bg-gov-900 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Navigation className="text-gov-accent" /> New Mission Dispatch
          </h2>
          <div className="flex gap-2">
             <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-gov-accent' : 'bg-gray-700'}`}></div>
             <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-gov-accent' : 'bg-gray-700'}`}></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Mission Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs text-gray-400">Passenger Name</label>
                    <input name="passengerName" value={formData.passengerName} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none" placeholder="e.g. Senator Doe" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs text-gray-400">Priority Level</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none">
                       <option value="STANDARD">Standard</option>
                       <option value="URGENT">Urgent</option>
                       <option value="VIP">VIP</option>
                    </select>
                 </div>
              </div>
              
              <div className="space-y-1">
                 <label className="text-xs text-gray-400">Pickup Location</label>
                 <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded pl-10 pr-2 py-2 text-white focus:border-gov-accent outline-none" placeholder="Enter address..." />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs text-gray-400">Dropoff Location</label>
                 <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input name="dropoffLocation" value={formData.dropoffLocation} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded pl-10 pr-2 py-2 text-white focus:border-gov-accent outline-none" placeholder="Enter address..." />
                 </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSmartMatch}
                  disabled={loadingAI || !formData.pickupLocation}
                  className="bg-gradient-to-r from-gov-accent to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-6 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition-all disabled:opacity-50">
                  {loadingAI ? <Search className="animate-spin" /> : <Search />}
                  {loadingAI ? 'Scanning...' : 'Find Best Driver'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Assignment */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* AI Recommendation Box (Table Format) */}
              {recommendation && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg overflow-hidden">
                   <div className="bg-indigo-900/50 p-2 px-4 border-b border-indigo-500/30 flex items-center gap-2">
                       <Sparkles size={14} className="text-indigo-400" />
                       <span className="text-xs font-bold text-indigo-300">AI STRATEGIC ANALYSIS</span>
                   </div>
                   <table className="w-full text-sm text-left">
                      <tbody>
                         <tr className="border-b border-indigo-500/10">
                            <td className="p-3 text-gray-400 w-1/3">Recommended Driver</td>
                            <td className="p-3 text-white font-bold">{drivers.find(d => d.id === recommendation.recommendedDriverId)?.name || recommendation.recommendedDriverId}</td>
                         </tr>
                         <tr className="border-b border-indigo-500/10">
                            <td className="p-3 text-gray-400">Recommended Vehicle</td>
                            <td className="p-3 text-white font-bold">{vehicles.find(v => v.id === recommendation.recommendedVehicleId)?.model || recommendation.recommendedVehicleId}</td>
                         </tr>
                         <tr>
                            <td className="p-3 text-gray-400 align-top">Strategy</td>
                            <td className="p-3 text-indigo-200 italic">"{recommendation.reasoning}"</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold uppercase">Assigned Driver</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                       {sortedDrivers.map(driver => (
                          <div 
                            key={driver.id} 
                            onClick={() => setFormData({...formData, driverId: driver.id})}
                            className={`p-3 rounded border cursor-pointer flex items-center gap-3 transition-colors
                            ${formData.driverId === driver.id ? 'bg-gov-accent/20 border-gov-accent' : 'bg-gov-900 border-gov-700 hover:border-gray-500'}
                            ${driver.status === 'OFFLINE' ? 'opacity-60' : ''}`}>
                             <div className="relative">
                                <img src={driver.avatar} className="w-8 h-8 rounded-full" />
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gov-900 ${getStatusColor(driver.status)}`}></div>
                             </div>
                             <div className="flex-1">
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                  {driver.name}
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 border ${
                                    driver.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    driver.status === 'BUSY' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'
                                  }`}>
                                    <Circle size={4} fill="currentColor" />
                                    {driver.status}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                   {driver.codename ? `"${driver.codename}"` : 'No Codename'} • {driver.readinessScore}%
                                </p>
                             </div>
                             {formData.driverId === driver.id && <div className="w-2 h-2 rounded-full bg-gov-accent"></div>}
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold uppercase">Assigned Vehicle</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                       {vehicles.filter(v => v.status === 'ACTIVE').map(vehicle => (
                          <div 
                            key={vehicle.id} 
                            onClick={() => setFormData({...formData, vehicleId: vehicle.id})}
                            className={`p-3 rounded border cursor-pointer flex items-center gap-3 transition-colors
                            ${formData.vehicleId === vehicle.id ? 'bg-gov-accent/20 border-gov-accent' : 'bg-gov-900 border-gov-700 hover:border-gray-500'}`}>
                             <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                {vehicle.type[0]}
                             </div>
                             <div className="flex-1">
                                <p className="text-sm font-bold text-white">{vehicle.model}</p>
                                <p className="text-xs text-gray-500">{vehicle.plate}</p>
                             </div>
                             {formData.vehicleId === vehicle.id && <div className="w-2 h-2 rounded-full bg-gov-accent"></div>}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {!formData.driverId && <div className="flex items-center gap-2 text-amber-500 text-sm bg-amber-500/10 p-2 rounded"><AlertCircle size={16}/> Please select a driver.</div>}

            </div>
          )}

        </div>

        <div className="p-4 bg-gov-900 border-t border-gov-700 flex justify-between">
          <button onClick={onCancel} className="text-gray-400 hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>
          
          {step === 2 && (
             <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded bg-gov-700 hover:bg-gov-600 text-white text-sm font-bold">Back</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!formData.driverId || !formData.vehicleId}
                  className="px-6 py-2 rounded bg-gov-success hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  Confirm Dispatch
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDispatchWizard;