import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Eye,
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  GripVertical,
  Star,
  Zap,
  Calendar,
  MoreHorizontal,
  Circle,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dropdown } from './Dropdown';
import TaskActions from './TaskActions';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate } from '../utils/dateUtils';
import { Project, UserStory, Iteration, Task } from '../types';

interface BacklogProps {
  project: Project;
}

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

interface SortableTaskItemProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task | null) => void;
  onOpenEditModal: (open: boolean) => void;
  onDelete: (id: number) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ task, onToggleStatus, onEdit, onOpenEditModal, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center justify-between bg-[#0d0f14] border border-[#252a38] p-3 rounded-lg group/task"
    >
      <div className="flex items-center gap-3 flex-1">
        <button 
          {...attributes}
          {...listeners}
          className="p-1 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <button 
          onClick={() => onToggleStatus(task)}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
            task.status === 'done' 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-[#252a38] hover:border-slate-500'
          }`}
        >
          {task.status === 'done' && <CheckCircle2 size={12} />}
        </button>
        <div className="min-w-0 flex-1">
          <span className={`text-base block truncate ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
            {task.title}
          </span>
          {task.observation && (
            <p className="text-xs text-slate-500 italic mt-0.5 truncate">{task.observation}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {task.due_date && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] text-indigo-400 font-mono font-bold">
            <Calendar size={12} />
            <span>{formatDate(task.due_date)}</span>
          </div>
        )}
        <div className="opacity-0 group-hover/task:opacity-100 transition-opacity">
          <Dropdown
            items={[
              {
                label: 'Editar Tarefa',
                icon: <Edit2 size={14} />,
                onClick: () => {
                  onEdit(task);
                  onOpenEditModal(true);
                }
              },
              {
                label: 'Excluir Tarefa',
                icon: <Trash2 size={14} />,
                onClick: () => onDelete(task.id),
                variant: 'danger'
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

interface SortableStoryItemProps {
  story: UserStory;
  expandedStories: Set<number>;
  toggleStoryExpansion: (storyId: number) => void;
  onView: (story: UserStory) => void;
  onAddTask: (storyId: number) => void;
  onEdit: (story: UserStory) => void;
  onDelete: (storyId: number) => void;
  handleToggleTaskStatus: (task: Task) => void;
  setEditingTask: (task: Task) => void;
  setIsEditTaskModalOpen: (open: boolean) => void;
  handleDeleteTask: (taskId: number) => void;
  activeStoryId: number | null;
  newTaskTitle: string;
  newTaskDate: string;
  setActiveStoryId: (id: number | null) => void;
  setNewTaskTitle: (title: string) => void;
  setNewTaskDate: (date: string) => void;
  handleCreateTask: (e: React.FormEvent) => void;
}

const SortableStoryItem: React.FC<SortableStoryItemProps> = ({ 
  story, 
  expandedStories, 
  toggleStoryExpansion,
  onView,
  onAddTask,
  onEdit,
  onDelete,
  handleToggleTaskStatus,
  setEditingTask,
  setIsEditTaskModalOpen,
  handleDeleteTask,
  activeStoryId,
  newTaskTitle,
  newTaskDate,
  setActiveStoryId,
  setNewTaskTitle,
  setNewTaskDate,
  handleCreateTask
}) => {
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done'>('all');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const filteredTasks = (story.tasks || []).filter(task => {
    if (taskFilter === 'done') return task.status === 'done';
    if (taskFilter === 'pending') return task.status !== 'done';
    return true;
  });

  return (
    <motion.div 
      ref={setNodeRef}
      style={style}
      layout
      className="border-b border-[#252a38] last:border-0"
    >
      <div className="grid grid-cols-[1fr_100px_120px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-[#1a1e28] transition-colors group">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <div 
              {...attributes}
              {...listeners}
              className="p-1 text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={16} />
            </div>
            <button 
              onClick={() => toggleStoryExpansion(story.id)}
              className="p-1 hover:bg-[#252a38] rounded text-slate-500 hover:text-white transition-colors"
            >
              {expandedStories.has(story.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate">{story.title}</h3>
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500 truncate">{story.description}</p>
              {story.due_date && (
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                  <Calendar size={10} />
                  <span>{formatDate(story.due_date)}</span>
                </div>
              )}
            </div>
            {story.tasks && story.tasks.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 size={10} className="text-slate-600" />
                <span className="text-[10px] font-mono text-slate-600">
                  {story.tasks.filter(t => t.status === 'done').length}/{story.tasks.length} tarefas
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs font-mono font-bold">
            {story.points} pts
          </span>
        </div>

        <div className="flex justify-center gap-1">
          {[1, 2, 3].map(p => (
            <Star 
              key={p} 
              size={14} 
              className={p <= story.priority ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} 
            />
          ))}
        </div>

        <div className="flex justify-center">
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${
            story.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            story.status === 'doing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          }`}>
            {story.status}
          </span>
        </div>

        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Dropdown
            items={[
              {
                label: 'Visualizar',
                icon: <Eye size={14} />,
                onClick: () => onView(story)
              },
              {
                label: 'Adicionar Tarefa',
                icon: <Plus size={14} />,
                onClick: () => onAddTask(story.id)
              },
              {
                label: 'Editar História',
                icon: <Edit2 size={14} />,
                onClick: () => onEdit(story)
              },
              {
                label: 'Excluir História',
                icon: <Trash2 size={14} />,
                onClick: () => onDelete(story.id),
                variant: 'danger'
              }
            ]}
          />
        </div>
      </div>

      <AnimatePresence>
        {expandedStories.has(story.id) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0d0f14]/30"
          >
            <div className="px-16 pb-6 pt-2 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tarefas Associadas</h4>
                
                <div className="flex gap-1 p-0.5 bg-[#0d0f14] border border-[#252a38] rounded-md shrink-0">
                  <button
                    type="button"
                    onClick={() => setTaskFilter('all')}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                      taskFilter === 'all' 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/10' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('pending')}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                      taskFilter === 'pending' 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('done')}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                      taskFilter === 'done' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Concluídas
                  </button>
                </div>
              </div>
              
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <div key={task.id} className="flex flex-col bg-[#13161e] p-3 rounded-lg border border-[#252a38] group/task">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              task.status === 'done' 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-[#252a38] hover:border-slate-500'
                            }`}
                          >
                            {task.status === 'done' && <CheckCircle2 size={10} />}
                          </button>
                          <div className="min-w-0 font-sans">
                            <span className={`text-xs block ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                              {task.title}
                            </span>
                            {task.observation && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">{task.observation}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {task.due_date && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] text-indigo-400 font-mono font-bold">
                              <Calendar size={12} />
                              <span>{formatDate(task.due_date)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTask(task);
                                setIsEditTaskModalOpen(true);
                              }}
                              className="p-1 hover:text-white text-slate-500"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 hover:text-red-400 text-slate-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <TaskActions taskId={task.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic py-2">
                  {taskFilter === 'done' ? 'Nenhuma tarefa concluída.' :
                   taskFilter === 'pending' ? 'Nenhuma tarefa pendente.' :
                   'Nenhuma tarefa para esta história.'}
                </p>
              )}

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#252a38]/30">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Adicionar nova tarefa..." 
                    className="flex-1 bg-[#13161e] border border-[#252a38] rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    value={activeStoryId === story.id ? newTaskTitle : ''}
                    onChange={(e) => {
                      setActiveStoryId(story.id);
                      setNewTaskTitle(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTask(e);
                    }}
                  />
                  <input 
                    type="date" 
                    className="bg-[#13161e] border border-[#252a38] rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={activeStoryId === story.id ? newTaskDate : ''}
                    onChange={(e) => {
                      setActiveStoryId(story.id);
                      setNewTaskDate(e.target.value);
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      setActiveStoryId(story.id);
                      handleCreateTask(e);
                    }}
                    disabled={!newTaskTitle.trim() || activeStoryId !== story.id}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shrink-0"
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Backlog({ project }: BacklogProps) {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [isNewStoryModalOpen, setIsNewStoryModalOpen] = useState(false);
  const [isEditStoryModalOpen, setIsEditStoryModalOpen] = useState(false);
  const [isViewStoryModalOpen, setIsViewStoryModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<number | null>(null);
  const [viewingStory, setViewingStory] = useState<UserStory | null>(null);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskObservation, setNewTaskObservation] = useState('');
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<number | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<number>>(new Set());
  const [modalTaskFilter, setModalTaskFilter] = useState<'all' | 'pending' | 'done'>('all');

  const toggleStoryExpansion = (storyId: number) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    points: 1,
    priority: 0,
    due_date: ''
  });

  useEffect(() => {
    fetchStories();
    fetchIterations();
  }, [project.id]);

  const fetchStories = async () => {
    const res = await fetch(`/api/projects/${project.id}/stories`);
    const data = await res.json();
    setStories(data);
    
    // Update viewingStory if it's open to reflect server-side changes (like story due_date)
    setViewingStory(prev => {
      if (!prev) return null;
      const updated = data.find((s: UserStory) => s.id === prev.id);
      return updated || prev;
    });
    
    return data;
  };

  const fetchIterations = async () => {
    const res = await fetch(`/api/projects/${project.id}/iterations`);
    const data = await res.json();
    setIterations(data);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newStory, project_id: project.id }),
    });
    if (res.ok) {
      fetchStories();
      setIsNewStoryModalOpen(false);
      setNewStory({ title: '', description: '', points: 1, priority: 0 });
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;

    const res = await fetch(`/api/stories/${editingStory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingStory),
    });
    if (res.ok) {
      fetchStories();
      setIsEditStoryModalOpen(false);
      setEditingStory(null);
    }
  };

  const handleDeleteStory = async (id: number) => {
    if (confirm('Deseja excluir esta história?')) {
      await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      fetchStories();
    }
  };

  const handleUpdateStoryStatus = async (id: number, status: string) => {
    await fetch(`/api/stories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchStories();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStoryId || !newTaskTitle.trim()) return;

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        story_id: activeStoryId, 
        title: newTaskTitle,
        status: 'todo',
        due_date: newTaskDate,
        observation: newTaskObservation
      }),
    });

    if (res.ok) {
      await fetchStories();
      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDate('');
      setNewTaskObservation('');
      setActiveStoryId(null);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setTaskToDeleteId(taskId);
    setIsDeleteTaskModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (taskToDeleteId === null) return;
    
    const res = await fetch(`/api/tasks/${taskToDeleteId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      await fetchStories();
      setIsDeleteTaskModalOpen(false);
      setTaskToDeleteId(null);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: editingTask.title,
        status: editingTask.status,
        due_date: editingTask.due_date,
        observation: editingTask.observation
      }),
    });

    if (res.ok) {
      await fetchStories();
      setIsEditTaskModalOpen(false);
      setEditingTask(null);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      await fetchStories();
    }
  };

  const [activeId, setActiveId] = useState<number | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    // Check if we are reordering tasks (inside viewingStory)
    if (viewingStory?.tasks) {
      const activeTaskId = active.id as number;
      const overTaskId = over.id as number;
      
      const oldIndex = viewingStory.tasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = viewingStory.tasks.findIndex((t) => t.id === overTaskId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(viewingStory.tasks, oldIndex, newIndex) as Task[];
        const updatedStory = { ...viewingStory, tasks: newTasks };
        
        // Optimistic update
        setViewingStory(updatedStory);
        setStories(prev => prev.map(s => s.id === viewingStory.id ? updatedStory : s));

        // Persist to server
        const reorderPayload = newTasks.map((task: Task, index: number) => ({
          id: task.id,
          position: index + 1,
        }));

        try {
          await fetch('/api/tasks/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: reorderPayload }),
          });
        } catch (error) {
          console.error("Failed to reorder tasks:", error);
          fetchStories();
        }
        return;
      }
    }

    // Otherwise, check if we are reordering stories
    const activeStoryId = active.id as number;
    const overStoryId = over.id as number;
    
    const oldIndex = stories.findIndex((s) => s.id === activeStoryId);
    const newIndex = stories.findIndex((s) => s.id === overStoryId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newStories = arrayMove(stories, oldIndex, newIndex) as UserStory[];
      
      // Optimistic update
      setStories(newStories);

      // Persist to server
      const reorderPayload = newStories.map((story: UserStory, index: number) => ({
        id: story.id,
        priority: newStories.length - index,
      }));

      try {
        await fetch('/api/stories/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stories: reorderPayload }),
        });
      } catch (error) {
        console.error("Failed to reorder stories:", error);
        fetchStories();
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Backlog</h2>
          <p className="text-slate-500 text-sm">Gerencie e priorize as histórias de usuário do projeto.</p>
        </div>
        <button 
          onClick={() => setIsNewStoryModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nova História
        </button>
      </div>

      <div className="bg-[#13161e] border border-[#252a38] rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-280px)]">
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-[#252a38] scrollbar-track-transparent">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1fr_100px_120px_100px_80px] gap-4 px-6 py-4 bg-[#1a1e28] text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold border-b border-[#252a38] sticky top-0 z-20">
              <span>História</span>
              <span className="text-center">Pontos</span>
              <span className="text-center">Prioridade</span>
              <span className="text-center">Status</span>
              <span className="text-right">Ações</span>
            </div>

            <div className="divide-y divide-[#252a38]">
          {stories.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Nenhuma história cadastrada ainda.
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={stories.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {stories.map(story => (
                  <SortableStoryItem 
                    key={story.id}
                    story={story}
                    expandedStories={expandedStories}
                    toggleStoryExpansion={toggleStoryExpansion}
                    onView={(s) => {
                      setViewingStory(s);
                      setIsViewStoryModalOpen(true);
                    }}
                    onAddTask={(id) => {
                      setActiveStoryId(id);
                      setIsNewTaskModalOpen(true);
                    }}
                    onEdit={(s) => {
                      setEditingStory(s);
                      setIsEditStoryModalOpen(true);
                    }}
                    onDelete={handleDeleteStory}
                    handleToggleTaskStatus={handleToggleTaskStatus}
                    setEditingTask={setEditingTask}
                    setIsEditTaskModalOpen={setIsEditTaskModalOpen}
                    handleDeleteTask={handleDeleteTask}
                    activeStoryId={activeStoryId}
                    newTaskTitle={newTaskTitle}
                    newTaskDate={newTaskDate}
                    setActiveStoryId={setActiveStoryId}
                    setNewTaskTitle={setNewTaskTitle}
                    setNewTaskDate={setNewTaskDate}
                    handleCreateTask={handleCreateTask}
                  />
                ))}
              </SortableContext>
              
              <DragOverlay>
                {activeId ? (
                  <div className="bg-[#1a1e28] border border-indigo-500/50 p-4 rounded-xl shadow-2xl opacity-90 scale-[1.02] cursor-grabbing">
                    <div className="flex items-center gap-4">
                      <GripVertical size={16} className="text-slate-400" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-white">
                          {stories.find(s => s.id === activeId)?.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {stories.find(s => s.id === activeId)?.description}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs font-mono font-bold">
                        {stories.find(s => s.id === activeId)?.points} pts
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* New Story Modal */}
      {isNewStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-lg shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Nova História de Usuário</h2>
            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Título da História</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newStory.title}
                  onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Como cliente, quero ver meus pedidos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição / Critérios de Aceite</label>
                <textarea
                  value={newStory.description}
                  onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                  placeholder="Detalhes sobre a funcionalidade..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Pontos (Fibonacci)</label>
                  <select
                    value={newStory.points}
                    onChange={(e) => setNewStory({ ...newStory, points: parseInt(e.target.value) })}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {FIBONACCI.map(p => (
                      <option key={p} value={p}>{p} pontos</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Prioridade</label>
                  <select
                    value={newStory.priority}
                    onChange={(e) => setNewStory({ ...newStory, priority: parseInt(e.target.value) })}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value={0}>Baixa</option>
                    <option value={1}>Média</option>
                    <option value={2}>Alta</option>
                    <option value={3}>Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Previsão de Entrega</label>
                <input
                  type="date"
                  value={newStory.due_date}
                  onChange={(e) => setNewStory({ ...newStory, due_date: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-slate-300"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsNewStoryModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Criar História
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Story Modal */}
      {isEditStoryModalOpen && editingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-lg shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Editar História de Usuário</h2>
            <form onSubmit={handleUpdateStory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Título da História</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={editingStory.title}
                  onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição / Critérios de Aceite</label>
                <textarea
                  value={editingStory.description}
                  onChange={(e) => setEditingStory({ ...editingStory, description: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Pontos (Fibonacci)</label>
                  <select
                    value={editingStory.points}
                    onChange={(e) => setEditingStory({ ...editingStory, points: parseInt(e.target.value) })}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {FIBONACCI.map(p => (
                      <option key={p} value={p}>{p} pontos</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Prioridade</label>
                  <select
                    value={editingStory.priority}
                    onChange={(e) => setEditingStory({ ...editingStory, priority: parseInt(e.target.value) })}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value={0}>Baixa</option>
                    <option value={1}>Média</option>
                    <option value={2}>Alta</option>
                    <option value={3}>Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Previsão de Entrega</label>
                <input
                  type="date"
                  value={editingStory.due_date || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, due_date: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-slate-300"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStoryModalOpen(false);
                    setEditingStory(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Story Modal */}
      {isViewStoryModalOpen && viewingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    viewingStory.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    viewingStory.status === 'doing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {viewingStory.status}
                  </span>
                  <span className="text-xs font-mono text-indigo-400">{viewingStory.points} pontos</span>
                </div>
                <h2 className="text-2xl font-bold">{viewingStory.title}</h2>
                {viewingStory.due_date && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-indigo-400 font-mono">
                    <Calendar size={14} />
                    <span>Previsão: {formatDate(viewingStory.due_date)}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsViewStoryModalOpen(false);
                  setViewingStory(null);
                }}
                className="p-2 hover:bg-[#252a38] rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">Descrição</h3>
                <div className="bg-[#0d0f14] border border-[#252a38] p-4 rounded-lg text-slate-300 text-sm whitespace-pre-wrap">
                  {viewingStory.description || 'Sem descrição.'}
                </div>
              </div>

              <div>
                {(() => {
                  const filteredModalTasks = (viewingStory.tasks || []).filter(task => {
                    if (modalTaskFilter === 'done') return task.status === 'done';
                    if (modalTaskFilter === 'pending') return task.status !== 'done';
                    return true;
                  });

                  return (
                    <>
                      <div className="flex items-center justify-between mb-3 border-b border-[#252a38]/30 pb-2">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                          Tarefas
                        </h3>
                        
                        <div className="flex gap-1 p-0.5 bg-[#0d0f14] border border-[#252a38] rounded-md shrink-0">
                          <button
                            type="button"
                            onClick={() => setModalTaskFilter('all')}
                            className={`px-2 py-1 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                              modalTaskFilter === 'all' 
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/10' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Todas ({viewingStory.tasks?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalTaskFilter('pending')}
                            className={`px-2 py-1 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                              modalTaskFilter === 'pending' 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Pendentes ({viewingStory.tasks?.filter(t => t.status !== 'done').length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalTaskFilter('done')}
                            className={`px-2 py-1 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                              modalTaskFilter === 'done' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Concluídas ({viewingStory.tasks?.filter(t => t.status === 'done').length || 0})
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {filteredModalTasks.length > 0 ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={(e) => setActiveId(e.active.id as number)}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={filteredModalTasks.map(t => t.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {filteredModalTasks.map((task: Task) => (
                                <SortableTaskItem 
                                  key={task.id} 
                                  task={task} 
                                  onToggleStatus={(t) => handleToggleTaskStatus(t)}
                                  onEdit={(t) => setEditingTask(t)}
                                  onOpenEditModal={(o) => setIsEditTaskModalOpen(o)}
                                  onDelete={(id) => handleDeleteTask(id)}
                                />
                              ))}
                            </SortableContext>
                            <DragOverlay>
                              {activeId && viewingStory.tasks.find(t => t.id === activeId) ? (
                                <div className="flex items-center gap-3 p-3 bg-[#13161e] border border-indigo-500 rounded-lg shadow-2xl opacity-90">
                                  <div className="w-5 h-5 rounded border-2 border-slate-700 flex-shrink-0" />
                                  <span className="text-sm text-slate-300">{viewingStory.tasks.find(t => t.id === activeId)?.title}</span>
                                </div>
                              ) : null}
                            </DragOverlay>
                          </DndContext>
                        ) : (
                          <p className="text-sm text-slate-500 italic py-4 text-center bg-[#0d0f14]/50 border border-dashed border-[#252a38] rounded-xl">
                            {modalTaskFilter === 'done' ? 'Nenhuma tarefa concluída.' :
                             modalTaskFilter === 'pending' ? 'Nenhuma tarefa pendente.' :
                             'Nenhuma tarefa associada.'}
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => {
                  setIsViewStoryModalOpen(false);
                  setViewingStory(null);
                }}
                className="px-6 py-2 bg-[#252a38] hover:bg-[#2e3445] text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditTaskModalOpen && editingTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-6">Editar Tarefa</h2>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Título da Tarefa</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="todo">A fazer</option>
                  <option value="done">Concluída</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Previsão de Entrega</label>
                <input
                  type="date"
                  value={editingTask.due_date || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Observação</label>
                <textarea
                  value={editingTask.observation || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, observation: e.target.value })}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors h-20 resize-none text-sm"
                  placeholder="Observações sobre a tarefa..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTaskModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-6">Adicionar Nova Tarefa</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Título da Tarefa</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Criar endpoint de login..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Previsão de Entrega</label>
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Observação</label>
                <textarea
                  value={newTaskObservation}
                  onChange={(e) => setNewTaskObservation(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors h-20 resize-none text-sm"
                  placeholder="Observações sobre a tarefa..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewTaskModalOpen(false);
                    setNewTaskTitle('');
                    setActiveStoryId(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {isDeleteTaskModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
            <p className="text-slate-400 mb-8">
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteTaskModalOpen(false);
                  setTaskToDeleteId(null);
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTask}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
