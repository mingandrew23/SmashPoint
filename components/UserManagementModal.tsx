
import React, { useState } from 'react';
import { X, UserPlus, Trash2, Edit2, Check, Shield, User, Key } from 'lucide-react';
import { User as UserType, Permission } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  onAddUser: (user: UserType) => void;
  onUpdateUser: (user: UserType) => void;
  onDeleteUser: (id: string) => void;
  currentUser: UserType | null;
}

const PERMISSIONS_LIST: { key: Permission, label: string }[] = [
  { key: 'manage_bookings', label: 'Manage Bookings (Create/Edit/Cancel)' },
  { key: 'view_reports', label: 'View Financial Reports' },
  { key: 'manage_payments', label: 'Manage Payments (Settle/Collection/Refund)' },
  { key: 'batch_tools', label: 'Access Batch Tools' },
  { key: 'manage_settings', label: 'Manage System Settings' },
  { key: 'system_maintenance', label: 'System Maintenance (Backup/Wipe)' },
];

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<UserType>>({
    username: '',
    password: '',
    name: '',
    role: 'user',
    permissions: []
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'user',
      permissions: []
    });
    setEditingUser(null);
    setView('list');
  };

  const handleEditClick = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
      permissions: user.permissions
    });
    setView('form');
  };

  const handleSave = () => {
    if (!formData.username || !formData.password || !formData.name) {
      alert("Please fill in all required fields.");
      return;
    }

    const newUser: UserType = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      username: formData.username,
      password: formData.password,
      name: formData.name,
      role: formData.role as 'admin' | 'user',
      permissions: formData.role === 'admin' ? [] : (formData.permissions || []),
      isActive: true
    };

    if (editingUser) {
      onUpdateUser(newUser);
    } else {
      // Check username uniqueness
      if (users.some(u => u.username === newUser.username)) {
        alert("Username already exists.");
        return;
      }
      onAddUser(newUser);
    }
    resetForm();
  };

  const togglePermission = (perm: Permission) => {
    const current = formData.permissions || [];
    if (current.includes(perm)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...current, perm] });
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield size={20} className="text-emerald-400" />
            User Management
          </h2>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === 'list' ? (
            <div className="p-6 flex-col flex h-full">
               <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-gray-500">Manage system access and permissions.</p>
                  <button 
                    onClick={() => setView('form')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <UserPlus size={16} /> Add User
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar border rounded-xl">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                        <tr>
                           <th className="px-4 py-3">User</th>
                           <th className="px-4 py-3">Role</th>
                           <th className="px-4 py-3">Permissions</th>
                           <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                           <tr key={user.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                 <div className="font-bold text-slate-800">{user.name}</div>
                                 <div className="text-xs text-gray-400">@{user.username}</div>
                              </td>
                              <td className="px-4 py-3">
                                 <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {user.role}
                                 </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                 {user.role === 'admin' ? (
                                    <span className="text-emerald-600 font-medium">Full Access</span>
                                 ) : (
                                    user.permissions.length > 0 ? `${user.permissions.length} modules` : 'None'
                                 )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                 <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEditClick(user)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded">
                                       <Edit2 size={16} />
                                    </button>
                                    {user.id !== currentUser?.id && user.username !== 'admin' && (
                                       <button onClick={() => { if(window.confirm('Delete user?')) onDeleteUser(user.id); }} className="p-1.5 text-slate-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded">
                                          <Trash2 size={16} />
                                       </button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto custom-scrollbar">
               <h3 className="font-bold text-slate-800 text-lg mb-4">{editingUser ? 'Edit User' : 'Create New User'}</h3>
               
               <div className="space-y-4 max-w-lg">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                     <div className="relative">
                        <User size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input 
                           type="text" 
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full pl-9 border rounded-lg p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                           placeholder="e.g. Front Desk Staff"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                        <input 
                           type="text" 
                           value={formData.username}
                           onChange={(e) => setFormData({...formData, username: e.target.value})}
                           className="w-full border rounded-lg p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                           placeholder="login_id"
                           disabled={!!editingUser && editingUser.username === 'admin'}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                        <div className="relative">
                           <Key size={16} className="absolute left-3 top-2.5 text-gray-400" />
                           <input 
                              type="text" 
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="w-full pl-9 border rounded-lg p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="password"
                           />
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                     <div className="flex gap-2">
                        <button 
                           type="button"
                           onClick={() => setFormData({...formData, role: 'user'})}
                           className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.role === 'user' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                        >
                           Standard User
                        </button>
                        <button 
                           type="button"
                           onClick={() => setFormData({...formData, role: 'admin'})}
                           className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.role === 'admin' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}
                        >
                           Administrator
                        </button>
                     </div>
                  </div>

                  {formData.role === 'user' && (
                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Assigned Permissions</label>
                        <div className="space-y-2">
                           {PERMISSIONS_LIST.map(perm => (
                              <label key={perm.key} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-emerald-300 transition-colors">
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.permissions?.includes(perm.key) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-gray-50'}`}>
                                    {formData.permissions?.includes(perm.key) && <Check size={12} />}
                                 </div>
                                 <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={formData.permissions?.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key)}
                                 />
                                 <span className="text-sm text-slate-700 font-medium">{perm.label}</span>
                              </label>
                           ))}
                        </div>
                     </div>
                  )}

                  <div className="flex gap-3 pt-4">
                     <button onClick={resetForm} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                     <button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md">
                        {editingUser ? 'Save Changes' : 'Create User'}
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
