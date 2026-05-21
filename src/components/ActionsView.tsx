import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  ClipboardList,
  Check,
  Plus,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, TaskAction, UserStory, Task } from '../types';
import { formatDate } from '../utils/dateUtils';

interface ActionsViewProps {
  project: Project;
}

export default function ActionsView({ project }: ActionsViewProps) {
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [isNewActionModalOpen, setIsNewActionModalOpen] = useState(false);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [newActionDescription, setNewActionDescription] = useState('');
  const [editingAction, setEditingAction] = useState<TaskAction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchActions();
  }, [project.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchActions = async () => {
    const res = await fetch(`/api/projects/${project.id}/actions`);
    if (res.ok) {
      const data = await res.json();
      setActions(data);
    }
  };

  const fetchStories = async () => {
    const res = await fetch(`/api/projects/${project.id}/stories`);
    if (res.ok) {
      const data = await res.json();
      setStories(data);
    }
  };

  const handleToggleAction = async (action: TaskAction) => {
    const res = await fetch(`/api/task-actions/${action.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !action.completed }),
    });

    if (res.ok) {
      fetchActions();
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !newActionDescription.trim()) return;

    const res = await fetch(`/api/tasks/${selectedTaskId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newActionDescription }),
    });

    if (res.ok) {
      setIsNewActionModalOpen(false);
      setNewActionDescription('');
      setSelectedTaskId('');
      fetchActions();
    }
  };

  const handleUpdateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction || !editDescription.trim()) return;

    const res = await fetch(`/api/task-actions/${editingAction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDescription }),
    });

    if (res.ok) {
      setIsEditModalOpen(false);
      setEditingAction(null);
      setEditDescription('');
      fetchActions();
    }
  };

  const handleDeleteAction = async () => {
    if (!actionToDelete) return;

    const res = await fetch(`/api/task-actions/${actionToDelete}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setIsDeleteModalOpen(false);
      setActionToDelete(null);
      fetchActions();
    }
  };

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.task_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.story_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'completed') return matchesSearch && action.completed;
    if (filter === 'pending') return matchesSearch && !action.completed;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Ações</h2>
          <p className="text-slate-500 text-sm">Visualize e gerencie todos os itens de checklist do projeto.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-mono uppercase">Progresso Geral</div>
            <div className="text-xl font-bold text-emerald-400">
              {actions.filter(a => a.completed).length} / {actions.length} concluídas
            </div>
          </div>
          <button 
            onClick={() => {
              fetchStories();
              setIsNewActionModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} />
            Nova Ação
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ação, tarefa ou história..." 
            className="w-full bg-[#13161e] border border-[#252a38] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-[#13161e] border border-[#252a38] p-1 rounded-xl">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'pending' ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'completed' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Concluídas
          </button>
        </div>
      </div>

      <div className="bg-[#13161e] border border-[#252a38] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1e28] text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold border-b border-[#252a38]">
                <th className="px-6 py-4 w-12">Status</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Tarefa / História</th>
                <th className="px-6 py-4 w-40">Criada em</th>
                <th className="px-6 py-4 w-20 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252a38]">
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma ação encontrada para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredActions.map(action => (
                  <motion.tr 
                    layout
                    key={action.id}
                    className="hover:bg-[#1a1e28] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleAction(action)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          action.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-[#252a38] hover:border-slate-500 text-transparent'
                        }`}
                      >
                        <Check size={12} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-base font-medium block ${action.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {action.description}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 flex items-center gap-1.5">
                          <ClipboardList size={12} className="text-slate-600" />
                          {action.task_title}
                        </span>
                        <span className="text-xs text-slate-600 font-mono uppercase mt-0.5">
                          {action.story_title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <Calendar size={12} />
                        {action.created_at ? formatDate(action.created_at) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === action.id ? null : action.id)}
                        className={`p-1.5 rounded transition-colors ${activeMenuId === action.id ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-[#252a38] text-slate-500 hover:text-white'}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      <AnimatePresence>
                        {activeMenuId === action.id && (
                          <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-6 top-12 z-10 w-36 bg-[#1a1e28] border border-[#252a38] rounded-xl shadow-2xl py-1 overflow-hidden"
                          >
                            <button
                              onClick={() => {
                                setEditingAction(action);
                                setEditDescription(action.description);
                                setIsEditModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                            >
                              <Edit2 size={14} />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setActionToDelete(action.id);
                                setIsDeleteModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                              Excluir
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isNewActionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Nova Ação</h2>
                <button onClick={() => setIsNewActionModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Descrição da Ação</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={newActionDescription}
                    onChange={(e) => setNewActionDescription(e.target.value)}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ex: Revisar documentação técnica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Associar à Tarefa</label>
                  <select
                    required
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  >
                    <option value="">Selecione uma tarefa...</option>
                    {stories.map(story => (
                      <optgroup key={story.id} label={story.title}>
                        {story.tasks?.map(task => (
                          <option key={task.id} value={task.id}>
                            {task.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsNewActionModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedTaskId || !newActionDescription.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Criar Ação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Editar Ação</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Descrição da Ação</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!editDescription.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Excluir Ação?</h2>
              <p className="text-slate-400 text-sm mb-8">
                Esta ação não poderá ser desfeita. Deseja realmente remover este item do checklist?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setActionToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1e28] hover:bg-[#252a38] text-slate-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAction}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
