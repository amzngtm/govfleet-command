
import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { User, Shield, Search, CheckCircle, X, Wrench, Radio } from 'lucide-react';

interface AssignAgentModalProps {
  users: UserProfile[];
  incidentId: string;
  onAssign: (agentId: string) => void;
  onCancel: () => void;
}

const AssignAgentModal: React.FC<AssignAgentModalProps> = ({ users, incidentId, onAssign, onCancel }) => {
  const [search, setSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Filter users suitable for assignment (Mechanics, Dispatchers, Admins)
  // Generally drivers aren't assigned to investigate incidents unless specific workflows exist.
  const eligibleUsers = users.filter(u => 
    [UserRole.MECHANIC, UserRole.DISPATCHER, UserRole.SUPER_ADMIN].includes(u.role)
  );

  const filteredUsers = eligibleUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.MECHANIC: return <Wrench size={14} className="text-amber-400" />;
      case UserRole.DISPATCHER: return <Radio size={14} className="text-sky-400" />;
      default: return <Shield size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-gov-800 w-full max-w-lg rounded-xl border border-gov-600 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="p-5 border-b border-gov-700 bg-gov-900 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="text-gov-accent" size={20} /> Assign Response Agent
            </h2>
            <p className="text-xs text-gray-400 mt-1">Incident Reference: <span className="font-mono text-gov-accent">{incidentId}</span></p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gov-700 bg-gov-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search personnel by name or role..."
              className="w-full bg-gov-900 border border-gov-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-gov-accent outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredUsers.map(user => (
            <div 
              key={user.id}
              onClick={() => setSelectedAgentId(user.id)}
              className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all border
                ${selectedAgentId === user.id 
                  ? 'bg-gov-accent/20 border-gov-accent' 
                  : 'bg-transparent border-transparent hover:bg-gov-700 hover:border-gov-600'}`}
            >
              <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-gov-900 object-cover" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gov-800 
                  ${user.status === 'ONLINE' ? 'bg-emerald-500' : user.status === 'BUSY' ? 'bg-amber-500' : 'bg-gray-500'}`}>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">{user.name}</h4>
                  <span className="text-[10px] font-mono text-gray-500 bg-gov-900 px-1.5 rounded">{user.id}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-xs text-gray-400 bg-gov-900/50 px-1.5 py-0.5 rounded border border-gov-700">
                    {getRoleIcon(user.role)} {user.role}
                  </div>
                  <span className="text-[10px] text-gray-500">{user.department}</span>
                </div>
              </div>

              {selectedAgentId === user.id && (
                <div className="text-gov-accent">
                  <CheckCircle size={20} />
                </div>
              )}
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No eligible agents found.
            </div>
          )}
        </div>

        <div className="p-4 bg-gov-900 border-t border-gov-700 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => selectedAgentId && onAssign(selectedAgentId)}
            disabled={!selectedAgentId}
            className="px-6 py-2 bg-gov-accent hover:bg-sky-500 text-white text-sm font-bold rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
          >
            <Shield size={16} /> Confirm Assignment
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssignAgentModal;
