import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Edit2, X, Check } from 'lucide-react';
import { TaskAction } from '../types';

interface TaskActionsProps {
  taskId: number;
}

export default function TaskActions({ taskId }: TaskActionsProps) {
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [newActionDescription, setNewActionDescription] = useState('');
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  useEffect(() => {
    fetchActions();
  }, [taskId]);

  const fetchActions = async () => {
    const res = await fetch(`/api/tasks/${taskId}/actions`);
    if (res.ok) {
      const data = await res.json();
      setActions(data);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionDescription.trim()) return;

    const res = await fetch(`/api/tasks/${taskId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newActionDescription }),
    });

    if (res.ok) {
      setNewActionDescription('');
      fetchActions();
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

  const handleUpdateAction = async (id: number) => {
    if (!editingDescription.trim()) return;

    const res = await fetch(`/api/task-actions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editingDescription }),
    });

    if (res.ok) {
      setEditingActionId(null);
      setEditingDescription('');
      fetchActions();
    }
  };

  const handleDeleteAction = async (id: number) => {
    const res = await fetch(`/api/task-actions/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchActions();
    }
  };

  return (
    <div className="mt-3 pl-7 space-y-2 border-l border-[#252a38] ml-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Checklist de Ações</span>
        {actions.length > 0 && (
          <span className="text-[11px] font-mono text-slate-600">
            {actions.filter(a => a.completed).length}/{actions.length}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {actions.map(action => (
          <div key={action.id} className="flex items-center justify-between group/action">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button 
                onClick={() => handleToggleAction(action)}
                className={`shrink-0 transition-colors ${action.completed ? 'text-emerald-500' : 'text-slate-700 hover:text-slate-500'}`}
              >
                {action.completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              </button>
              
              {editingActionId === action.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <input 
                    autoFocus
                    type="text"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="flex-1 bg-[#0d0f14] border border-indigo-500/50 rounded px-2 py-0.5 text-[13px] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateAction(action.id);
                      if (e.key === 'Escape') setEditingActionId(null);
                    }}
                  />
                  <button onClick={() => handleUpdateAction(action.id)} className="text-emerald-500 hover:text-emerald-400">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingActionId(null)} className="text-slate-500 hover:text-slate-400">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <span className={`text-[13px] truncate ${action.completed ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                  {action.description}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover/action:opacity-100 transition-opacity shrink-0 ml-2">
              <button 
                onClick={() => {
                  setEditingActionId(action.id);
                  setEditingDescription(action.description);
                }}
                className="p-0.5 text-slate-600 hover:text-slate-400"
              >
                <Edit2 size={10} />
              </button>
              <button 
                onClick={() => handleDeleteAction(action.id)}
                className="p-0.5 text-slate-600 hover:text-red-400"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddAction} className="flex items-center gap-2 pt-1">
        <input 
          type="text"
          placeholder="Nova ação..."
          value={newActionDescription}
          onChange={(e) => setNewActionDescription(e.target.value)}
          className="flex-1 bg-transparent border-b border-transparent hover:border-[#252a38] focus:border-indigo-500/50 py-0.5 text-[12px] text-slate-500 focus:text-slate-300 focus:outline-none transition-colors"
        />
        <button 
          type="submit"
          disabled={!newActionDescription.trim()}
          className="text-slate-600 hover:text-indigo-400 disabled:opacity-0 transition-all"
        >
          <Plus size={12} />
        </button>
      </form>
    </div>
  );
}
