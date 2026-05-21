import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, User as UserIcon, Mail, Shield, AlertCircle, X } from 'lucide-react';
import { User } from '../types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        fetchUsers();
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'user' });
      } else {
        setError(data.error || 'Falha ao salvar usuário');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-slate-500 text-sm">Controle quem tem acesso ao XP Manager.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'user' });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-[#13161e] border border-[#252a38] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1e28] text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold border-b border-[#252a38]">
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Criado em</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252a38]">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-[#1a1e28] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <UserIcon size={16} />
                    </div>
                    <span className="font-medium text-sm">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                    user.role === 'admin' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="p-2 hover:bg-[#252a38] rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 hover:bg-[#252a38] rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold mb-6">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <UserIcon size={16} />
                    </div>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-white"
                      placeholder="Nome do usuário"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail size={16} />
                    </div>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-white"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock size={16} />
                    </div>
                    <input
                      required={!editingUser}
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Cargo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Shield size={16} />
                    </div>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-white appearance-none"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Usuário'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Lock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
