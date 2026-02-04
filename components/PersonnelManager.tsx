import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Shield, Mail, Phone, Car, Award, ChevronDown, CheckCircle, XCircle, Clock, Edit2, Users, Lock, Circle } from 'lucide-react';

interface PersonnelManagerProps {
  users: UserProfile[];
  onUpdateUser: (id: string, data: Partial<UserProfile>) => void;
}

const PersonnelManager: React.FC<PersonnelManagerProps> = ({ users, onUpdateUser }) => {
  const [view, setView] = useState<'DIRECTORY' | 'ROLES'>('DIRECTORY');
  const [filterRole, setFilterRole] = useState<UserRole | 'ALL'>('ALL');
  const [editingCodenameId, setEditingCodenameId] = useState<string | null>(null);
  const [tempCodename, setTempCodename] = useState('');

  const filteredUsers = filterRole === 'ALL' ? users : users.filter(u => u.role === filterRole);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ONLINE': return 'bg-emerald-500';
      case 'BUSY': return 'bg-amber-500';
      case 'OFFLINE': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const style = status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  status === 'BUSY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-gray-700/50 text-gray-400 border-gray-600';
    
    const dotColor = status === 'ONLINE' ? 'fill-emerald-400 text-emerald-400' :
                     status === 'BUSY' ? 'fill-amber-400 text-amber-400' :
                     'fill-gray-400 text-gray-400';

    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ml-2 flex items-center gap-1.5 w-fit ${style}`}>
            <Circle size={6} className={dotColor} />
            {status}
        </span>
    );
  };

  const startEditing = (user: UserProfile) => {
    setEditingCodenameId(user.id);
    setTempCodename(user.codename || '');
  };

  const saveCodename = (userId: string) => {
    onUpdateUser(userId, { codename: tempCodename });
    setEditingCodenameId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Personnel Management</h2>
        
        {/* View Switcher */}
        <div className="flex bg-gov-800 p-1 rounded-lg border border-gov-700 shadow-sm">
            <button 
              onClick={() => setView('DIRECTORY')} 
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all ${view === 'DIRECTORY' ? 'bg-gov-accent text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gov-700'}`}>
              <Users size={14} /> Directory
            </button>
            <button 
              onClick={() => setView('ROLES')} 
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all ${view === 'ROLES' ? 'bg-gov-accent text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gov-700'}`}>
              <Shield size={14} /> Role Management
            </button>
        </div>
      </div>

      {view === 'DIRECTORY' && (
        <>
          <div className="flex flex-wrap gap-2 bg-gov-800 p-1 rounded-lg border border-gov-700 w-fit">
             {['ALL', UserRole.SUPER_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.MECHANIC, UserRole.AUDITOR].map((role) => (
               <button
                 key={role}
                 onClick={() => setFilterRole(role as any)}
                 className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterRole === role ? 'bg-gov-accent text-white shadow' : 'text-gray-400 hover:text-white'}`}
               >
                 {role.replace('_', ' ')}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-gov-800 rounded-lg border border-gov-700 overflow-visible group hover:border-gov-accent/50 transition-all shadow-lg relative">
                <div className="p-6 flex items-start gap-4">
                   <div className="relative shrink-0">
                     <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-gov-700 group-hover:border-gov-accent transition-colors object-cover" />
                     <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gov-800 ${getStatusColor(user.status)}`} title={user.status}></div>
                   </div>
                   
                   <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                         <div className="min-w-0">
                           <div className="flex items-center flex-wrap gap-y-1">
                             <h3 className="text-lg font-bold text-white truncate">
                               {user.name}
                             </h3>
                             {getStatusBadge(user.status)}
                           </div>
                           
                           {/* Codename Edit/Display */}
                           {editingCodenameId === user.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                 <input 
                                   autoFocus
                                   type="text" 
                                   value={tempCodename} 
                                   onChange={(e) => setTempCodename(e.target.value)}
                                   className="bg-gov-900 border border-gov-600 rounded text-xs px-2 py-1 text-white w-24 focus:border-gov-accent outline-none"
                                   onKeyDown={(e) => e.key === 'Enter' && saveCodename(user.id)}
                                 />
                                 <button onClick={() => saveCodename(user.id)} className="text-emerald-500 hover:text-emerald-400"><CheckCircle size={14} /></button>
                                 <button onClick={() => setEditingCodenameId(null)} className="text-red-500 hover:text-red-400"><XCircle size={14} /></button>
                              </div>
                           ) : (
                              <p className="text-xs text-gov-accent font-mono mt-0.5 flex items-center gap-2 group-hover:text-sky-400 cursor-pointer" onClick={() => startEditing(user)} title="Click to edit codename">
                                 {user.codename ? `"${user.codename}"` : '+ Set Codename'} 
                                 <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                           )}
                         </div>
                         <div className="relative group/role shrink-0">
                            <button className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-gov-900 rounded text-gray-400 border border-gov-700 hover:text-white whitespace-nowrap">
                              {user.role} <ChevronDown size={10} />
                            </button>
                            {/* Role Dropdown */}
                            <div className="absolute right-0 top-full mt-1 w-32 bg-gov-900 border border-gov-700 rounded shadow-xl hidden group-hover/role:block z-20">
                               {Object.values(UserRole).map(r => (
                                  <button 
                                    key={r} 
                                    onClick={() => onUpdateUser(user.id, { role: r })}
                                    className="w-full text-left px-2 py-1 text-[10px] hover:bg-gov-800 text-gray-300 cursor-pointer block z-30 relative">
                                    {r}
                                  </button>
                               ))}
                            </div>
                         </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 truncate">{user.department}</p>
                      
                      <div className="space-y-1">
                         <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                            <Mail size={12} /> {user.email}
                         </div>
                         <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                            <Phone size={12} /> {user.phone || 'N/A'}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Expanded Stats for Drivers */}
                {user.role === UserRole.DRIVER && (
                   <div className="bg-gov-900/50 p-4 border-t border-gov-700 grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Award size={10} /> Readiness</p>
                         <div className="w-full bg-gov-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full" style={{ width: `${user.readinessScore || 0}%` }}></div>
                         </div>
                         <p className="text-right text-[10px] text-emerald-400 mt-0.5">{user.readinessScore}%</p>
                      </div>
                      <div>
                         <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Car size={10} /> Vehicle</p>
                         <p className="text-sm font-mono text-white truncate">{user.assignedVehicleId ? user.assignedVehicleId.toUpperCase() : 'UNASSIGNED'}</p>
                      </div>
                      
                      {user.certifications && (
                        <div className="col-span-2 flex flex-wrap gap-1">
                            {user.certifications.map(cert => (
                                <span key={cert} className="text-[10px] bg-gov-700 text-gray-300 px-1.5 py-0.5 rounded border border-gov-600">{cert}</span>
                            ))}
                        </div>
                      )}
                   </div>
                )}
                
                <div className="bg-gov-900 p-2 flex justify-end gap-2 border-t border-gov-700 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 right-0 left-0">
                    <button onClick={() => startEditing(user)} className="text-xs px-3 py-1 bg-gov-800 hover:bg-gov-700 text-white rounded border border-gov-600">Edit Profile</button>
                    <button className="text-xs px-3 py-1 bg-gov-accent hover:bg-sky-600 text-white rounded">Message</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'ROLES' && (
         <div className="bg-gov-800 border border-gov-700 rounded-lg overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 bg-gov-900 border-b border-gov-700">
                <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2"><Lock size={16} className="text-gov-accent"/> Access Control & Role Assignment</h3>
                <p className="text-xs text-gray-500 mt-1">Audit logs are automatically generated for all role and privilege changes.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gov-900/50 text-gray-400 uppercase text-xs font-bold">
                      <tr>
                          <th className="p-4 border-b border-gov-700">User Identity</th>
                          <th className="p-4 border-b border-gov-700">Department</th>
                          <th className="p-4 border-b border-gov-700">Current Role</th>
                          <th className="p-4 border-b border-gov-700 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gov-700">
                      {users.map(user => (
                          <tr key={user.id} className="hover:bg-gov-700/50 transition-colors">
                              <td className="p-4">
                                  <div className="flex items-center gap-3">
                                      <img src={user.avatar} className="w-9 h-9 rounded-full border border-gov-600"/>
                                      <div>
                                          <div className="font-bold text-white flex items-center gap-2">
                                            {user.name}
                                            {getStatusBadge(user.status)}
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                             <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                                             {user.codename && <span className="text-xs text-gov-accent font-mono bg-gov-900 px-1.5 rounded">"{user.codename}"</span>}
                                          </div>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4 text-gray-300 text-sm">{user.department}</td>
                              <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded text-xs font-bold bg-gov-900 border border-gov-700 text-gov-accent inline-flex items-center gap-1`}>
                                    <Shield size={10} /> {user.role}
                                  </span>
                              </td>
                              <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2 items-center">
                                      <span className="text-xs text-gray-600 mr-2">Assign to:</span>
                                      <select 
                                          value={user.role}
                                          onChange={(e) => onUpdateUser(user.id, { role: e.target.value as UserRole })}
                                          className="bg-gov-900 border border-gov-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-gov-accent hover:border-gray-500 cursor-pointer"
                                      >
                                          {Object.values(UserRole).map(role => (
                                              <option key={role} value={role}>{role}</option>
                                          ))}
                                      </select>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
         </div>
      )}
    </div>
  );
};

export default PersonnelManager;