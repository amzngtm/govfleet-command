import React, { useState } from 'react';
import { Trip, TripStatus, UserProfile, Vehicle } from '../types';
import { Navigation, X, Save, MapPin, Calendar, User, Truck, AlertCircle } from 'lucide-react';

interface EditTripModalProps {
  trip: Trip;
  drivers: UserProfile[];
  vehicles: Vehicle[];
  onSave: (tripId: string, updates: Partial<Trip>) => void;
  onCancel: () => void;
}

const EditTripModal: React.FC<EditTripModalProps> = ({ trip, drivers, vehicles, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    pickupLocation: trip.pickupLocation,
    dropoffLocation: trip.dropoffLocation,
    pickupTime: trip.pickupTime,
    status: trip.status,
    driverId: trip.driverId || '',
    vehicleId: trip.vehicleId || '',
    priority: trip.priority,
    notes: trip.notes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(trip.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gov-800 w-full max-w-2xl rounded-xl border border-gov-600 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="p-5 border-b border-gov-700 bg-gov-900 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Navigation className="text-gov-accent" size={20} /> Edit Mission {trip.id}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><MapPin size={12}/> Pickup</label>
                 <input name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><MapPin size={12}/> Dropoff</label>
                 <input name="dropoffLocation" value={formData.dropoffLocation} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><Calendar size={12}/> Schedule</label>
                 <input type="datetime-local" name="pickupTime" value={formData.pickupTime.slice(0, 16)} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none text-xs" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><AlertCircle size={12}/> Priority</label>
                 <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none text-xs">
                    <option value="STANDARD">Standard</option>
                    <option value="URGENT">Urgent</option>
                    <option value="VIP">VIP</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs text-gray-400 font-bold uppercase">Status</label>
                 <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none text-xs">
                    {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gov-700 pt-4">
              <div className="space-y-1">
                 <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><User size={12}/> Assigned Driver</label>
                 <select name="driverId" value={formData.driverId} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none text-xs">
                    <option value="">-- Unassigned --</option>
                    {drivers.map(d => (
                       <option key={d.id} value={d.id}>{d.name} {d.codename ? `(${d.codename})` : ''}</option>
                    ))}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><Truck size={12}/> Assigned Vehicle</label>
                 <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none text-xs">
                    <option value="">-- Unassigned --</option>
                    {vehicles.map(v => (
                       <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                 </select>
              </div>
           </div>
           
           <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold uppercase">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full bg-gov-900 border border-gov-600 rounded p-2 text-white focus:border-gov-accent outline-none text-xs h-20" placeholder="Operational notes..." />
           </div>

           <div className="pt-4 flex gap-3">
              <button type="button" onClick={onCancel} className="flex-1 py-2 bg-gov-800 hover:bg-gov-700 border border-gov-600 text-gray-300 rounded font-bold transition-colors">
                 Cancel
              </button>
              <button type="submit" className="flex-1 py-2 bg-gov-accent hover:bg-sky-500 text-white rounded font-bold shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                 <Save size={16} /> Save Changes
              </button>
           </div>
        </form>

      </div>
    </div>
  );
};

export default EditTripModal;