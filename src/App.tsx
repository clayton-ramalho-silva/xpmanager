import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  Kanban as KanbanIcon, 
  Plus, 
  FolderPlus, 
  Settings, 
  ChevronRight,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar as GanttIcon,
  Users,
  LogOut,
  Trash2,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, UserStory, Iteration, User } from './types';
import { exportProjectToPDF } from './utils/pdfExport';
import Backlog from './components/Backlog';
import Kanban from './components/Kanban';
import Calendar from './components/Calendar';
import ActionsView from './components/ActionsView';
import Login from './components/Login';
import UserManagement from './components/UserManagement';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'backlog' | 'kanban' | 'calendar' | 'users' | 'actions'>('backlog');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setSelectedProject(null);
      setView('backlog');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
    });
    if (res.ok) {
      const newProj = await res.json();
      setProjects([newProj, ...projects]);
      setSelectedProject(newProj);
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
    }
  };

  const handleExportPDF = async (filter: 'all' | 'pending' | 'done' = 'all') => {
    if (!selectedProject) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/stories`);
      if (res.ok) {
        const stories = await res.json();
        await exportProjectToPDF(selectedProject, stories, filter);
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Deseja realmente excluir este projeto? Todas as histórias, iterações e tarefas serão removidas permanentemente.')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedProjects = projects.filter(p => p.id !== id);
        setProjects(updatedProjects);
        if (selectedProject?.id === id) {
          setSelectedProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
        }
      }
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen bg-[#0d0f14] text-[#e2e8f0] font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#252a38] bg-[#13161e] flex flex-col">
        <div className="p-6 border-b border-[#252a38]">
          <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold text-lg">
            <Target size={24} />
            <span>XP Manager</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">Projetos</h2>
              <button 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="p-1 hover:bg-[#252a38] rounded text-indigo-400 transition-colors"
              >
                <FolderPlus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProject(p);
                    if (view === 'users') setView('backlog');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedProject?.id === p.id && view !== 'users'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'hover:bg-[#1a1e28] text-slate-400'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedProject?.id === p.id && view !== 'users' ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2 px-2">Navegação</h2>
            <div className="space-y-1">
              <button
                onClick={() => setView('backlog')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  view === 'backlog' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'hover:bg-[#1a1e28] text-slate-400'
                }`}
              >
                <ListTodo size={18} />
                <span>Backlog</span>
              </button>
              <button
                onClick={() => setView('actions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  view === 'actions' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'hover:bg-[#1a1e28] text-slate-400'
                }`}
              >
                <CheckCircle2 size={18} />
                <span>Ações</span>
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  view === 'kanban' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'hover:bg-[#1a1e28] text-slate-400'
                }`}
              >
                <KanbanIcon size={18} />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  view === 'calendar' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'hover:bg-[#1a1e28] text-slate-400'
                }`}
              >
                <GanttIcon size={18} />
                <span>Calendário</span>
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => setView('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    view === 'users' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'hover:bg-[#1a1e28] text-slate-400'
                  }`}
                >
                  <Users size={18} />
                  <span>Usuários</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#252a38] space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-300 text-sm font-medium">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
              {user.name.charAt(0)}
            </div>
            <span className="truncate">{user.name}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'users' ? (
          <div className="flex-1 overflow-auto p-8">
            <UserManagement />
          </div>
        ) : selectedProject ? (
          <>
            <header className="h-16 border-b border-[#252a38] bg-[#13161e] flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{selectedProject.name}</h1>
                <div className="h-4 w-px bg-[#252a38]" />
                <span className="text-sm text-slate-500 font-mono uppercase tracking-widest">
                  {view === 'backlog' ? 'Product Backlog' : view === 'kanban' ? 'Iteration Board' : view === 'actions' ? 'Gestão de Ações' : 'Calendar'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1e28] hover:bg-[#252a38] text-slate-300 hover:text-white rounded-lg transition-all text-sm border border-[#252a38] disabled:opacity-50 cursor-pointer"
                    title="Exportar Relatório PDF"
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileDown size={16} />
                    )}
                    <span>Exportar PDF</span>
                    <span className="text-[10px] text-slate-500">▼</span>
                  </button>

                  {isExportDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsExportDropdownOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-[#13161e] border border-[#252a38] rounded-lg shadow-xl py-1 z-20">
                        <div className="px-3 py-1.5 text-slate-500 font-mono text-[9px] uppercase tracking-wider border-b border-[#252a38]/50 mb-1">
                          Filtro de Tarefas
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleExportPDF('all');
                            setIsExportDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#1a1e28] hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>Todas as Tarefas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleExportPDF('pending');
                            setIsExportDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-amber-400/90 hover:bg-[#1a1e28] hover:text-amber-300 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>Pendentes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleExportPDF('done');
                            setIsExportDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-emerald-400/90 hover:bg-[#1a1e28] hover:text-emerald-300 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>Concluídas</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteProject(selectedProject.id)}
                  className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                  title="Excluir Projeto"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view + selectedProject.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {view === 'backlog' ? (
                    <Backlog project={selectedProject} />
                  ) : view === 'kanban' ? (
                    <Kanban project={selectedProject} />
                  ) : view === 'actions' ? (
                    <ActionsView project={selectedProject} />
                  ) : (
                    <Calendar project={selectedProject} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Target size={64} className="opacity-20" />
            <p className="text-lg">Selecione ou crie um projeto para começar</p>
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Novo Projeto
            </button>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Novo Projeto</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Projeto</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Sistema de Vendas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                  placeholder="Breve descrição do projeto..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
