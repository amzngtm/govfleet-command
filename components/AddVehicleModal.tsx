import React, { useState } from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { Car, X, Save, FileText, Hash, Truck } from 'lucide-react';

interface AddVehicleModalProps {
  onSave: (vehicle: Partial<Vehicle>) => void;
  onCancel: () => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    plate: '',
    vin: '',
    model: '',
    type: 'SUV' as 'SEDAN' | 'SUV' | 'TRUCK' | 'SPECIALTY',
    department: 'HQ Command'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.model) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gov-800 w-full max-w-md rounded-xl border border-gov-600 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="p-5 border-b border-gov-700 bg-gov-900 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="text-gov-accent" size={20} /> Register New Asset
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           
           <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><Hash size={12}/> License Plate</label>
              <input 
                name="plate"
                value={formData.plate} 
                onChange={handleChange} 
                className="w-full bg-gov-900 border border-gov-600 rounded p-2.5 text-white focus:border-gov-accent outline-none font-mono uppercase placeholder-gray-600" 
                placeholder="GOV-XXXX"
                autoFocus
              />
           </div>

           <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><Truck size={12}/> Model / Make</label>
              <input 
                name="model"
                value={formData.model} 
                onChange={handleChange} 
                className="w-full bg-gov-900 border border-gov-600 rounded p-2.5 text-white focus:border-gov-accent outline-none" 
                placeholder="e.g. Ford Explorer Interceptor"
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">Vehicle Type</label>
                  <select 
                    name="type"
                    value={formData.type} 
                    onChange={handleChange} 
                    className="w-full bg-gov-900 border border-gov-600 rounded p-2.5 text-white focus:border-gov-accent outline-none appearance-none"
                  >
                    <option value="SUV">SUV</option>
                    <option value="SEDAN">SEDAN</option>
                    <option value="TRUCK">TRUCK</option>
                    <option value="SPECIALTY">SPECIALTY</option>
                  </select>
              </div>
              <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><FileText size={12}/> VIN (Optional)</label>
                  <input 
                    name="vin"
                    value={formData.vin} 
                    onChange={handleChange} 
                    className="w-full bg-gov-900 border border-gov-600 rounded p-2.5 text-white focus:border-gov-accent outline-none font-mono text-xs uppercase" 
                    placeholder="17 CHAR VIN"
                    maxLength={17}
                  />
              </div>
           </div>

           <div className="pt-4 flex gap-3">
              <button type="button" onClick={onCancel} className="flex-1 py-2 bg-gov-800 hover:bg-gov-700 border border-gov-600 text-gray-300 rounded font-bold transition-colors">
                 Cancel
              </button>
              <button type="submit" className="flex-1 py-2 bg-gov-accent hover:bg-sky-500 text-white rounded font-bold shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                 <Save size={16} /> Register Vehicle
              </button>
           </div>
        </form>

      </div>
    </div>
  );
};

export default AddVehicleModal;