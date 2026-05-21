import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  ArrowRight,
  Calendar,
  Eye,
  Circle,
  X,
  Check,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../utils/dateUtils';
import { Project, UserStory, Iteration, Task } from '../types';
import TaskActions from './TaskActions';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  defaultDropAnimationSideEffects,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanProps {
  project: Project;
}

interface SortableKanbanStoryProps {
  story: UserStory;
  onView: (story: UserStory) => void;
  onToggleTask: (taskId: number, currentStatus: string) => void;
  onMoveStory: (storyId: number, newStatus: string) => void;
  nextColumnId?: string;
}

const SortableKanbanStory: React.FC<SortableKanbanStoryProps> = ({ 
  story, 
  onView, 
  onToggleTask, 
  onMoveStory,
  nextColumnId 
}) => {
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="bg-[#1a1e28] border border-[#252a38] p-4 rounded-xl shadow-sm group relative"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div 
            {...attributes}
            {...listeners}
            className="p-1 text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </div>
          <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-400/10 px-1.5 py-0.5 rounded">
            {story.points} PTS
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onView(story)}
            className="p-1 hover:bg-indigo-500/10 rounded text-indigo-400 transition-colors"
            title="Ver detalhes"
          >
            <Eye size={14} />
          </button>
          <button className="text-slate-600 hover:text-white transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      <h4 className="text-sm font-medium mb-1">{story.title}</h4>
      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{story.description}</p>
      
      {story.due_date && (
        <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono mb-4">
          <Calendar size={10} />
          <span>{formatDate(story.due_date)}</span>
        </div>
      )}
      
      {story.tasks && story.tasks.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-600 uppercase">Tarefas</span>
            <span className="text-[10px] font-mono text-slate-600">
              {story.tasks.filter(t => t.status === 'done').length}/{story.tasks.length}
            </span>
          </div>
          {story.tasks.map(task => (
            <div key={task.id} className="flex flex-col gap-1">
              <button
                onClick={() => onToggleTask(task.id, task.status)}
                className="w-full flex items-center gap-2 text-left group/task"
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  task.status === 'done' 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                    : 'border-[#252a38] group-hover/task:border-slate-500'
                }`}>
                  {task.status === 'done' && <CheckCircle2 size={10} />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-[13px] block truncate ${
                    task.status === 'done' ? 'text-slate-600 line-through' : 'text-slate-400'
                  }`}>
                    {task.title}
                  </span>
                  {task.observation && (
                    <p className="text-[11px] text-slate-600 italic mt-0.5 truncate">{task.observation}</p>
                  )}
                </div>
              </button>
              <TaskActions taskId={task.id} />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-1">
        {nextColumnId && (
          <button 
            onClick={() => onMoveStory(story.id, nextColumnId)}
            className="p-1.5 hover:bg-indigo-500/10 rounded text-indigo-400 transition-colors"
            title="Mover para próxima etapa"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface KanbanProps {
  project: Project;
}

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'bg-slate-500' },
  { id: 'doing', title: 'Em Andamento', color: 'bg-amber-500' },
  { id: 'testing', title: 'Em Teste', color: 'bg-indigo-500' },
  { id: 'done', title: 'Concluído', color: 'bg-emerald-500' }
];

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, color, count, children }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-[#1a1e28] px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 bg-[#13161e]/50 border border-[#252a38] rounded-2xl p-4 overflow-y-auto space-y-4">
        {children}
      </div>
    </div>
  );
};

export default function Kanban({ project }: KanbanProps) {
  const [activeIteration, setActiveIteration] = useState<Iteration | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [backlogStories, setBacklogStories] = useState<UserStory[]>([]);
  const [isNewIterationModalOpen, setIsNewIterationModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState<UserStory | null>(null);
  const [isViewStoryModalOpen, setIsViewStoryModalOpen] = useState(false);
  const [modalTaskFilter, setModalTaskFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [newIteration, setNewIteration] = useState({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchData = async () => {
    // Fetch iterations
    const iterRes = await fetch(`/api/projects/${project.id}/iterations`);
    const iterations: Iteration[] = await iterRes.json();
    const active = iterations.find(i => i.status === 'active');
    setActiveIteration(active || null);

    // Fetch all stories
    const storyRes = await fetch(`/api/projects/${project.id}/stories`);
    const allStories: UserStory[] = await storyRes.json();
    
    if (active) {
      setStories(allStories.filter(s => s.iteration_id === active.id));
    } else {
      setStories([]);
    }
    setBacklogStories(allStories.filter(s => s.iteration_id === null));

    // Update viewingStory if it's open to reflect server-side changes (like story due_date)
    setViewingStory(prev => {
      if (!prev) return null;
      const updated = allStories.find(s => s.id === prev.id);
      return updated || prev;
    });
  };

  const handleCreateIteration = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/iterations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newIteration, project_id: project.id, status: 'active' }),
    });
    if (res.ok) {
      fetchData();
      setIsNewIterationModalOpen(false);
    }
  };

  const handleMoveStory = async (storyId: number, newStatus: string) => {
    await fetch(`/api/stories/${storyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    
    // Refresh data
    await fetchData();
  };

  const handleAddToIteration = async (storyId: number) => {
    if (!activeIteration) return;
    await fetch(`/api/stories/${storyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iteration_id: activeIteration.id, status: 'todo' }),
    });
    fetchData();
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

  const [activeId, setActiveId] = useState<number | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as string | number;

    const activeStory = stories.find(s => s.id === activeId);
    if (!activeStory) return;

    // Find the containers
    const activeContainer = activeStory.status;
    const overContainer = COLUMNS.some(c => c.id === overId) 
      ? overId as string 
      : stories.find(s => s.id === overId)?.status;

    if (!overContainer || activeContainer === overContainer) return;

    setStories(prev => {
      const activeIndex = prev.findIndex(s => s.id === activeId);
      const overIndex = prev.findIndex(s => s.id === overId);

      let newIndex;
      if (COLUMNS.some(c => c.id === overId)) {
        newIndex = prev.length;
      } else {
        newIndex = overIndex >= 0 ? overIndex : prev.length;
      }

      const newItems = [...prev];
      const [movedItem] = newItems.splice(activeIndex, 1);
      newItems.splice(newIndex, 0, { ...movedItem, status: overContainer as any });
      
      return newItems;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as string | number;

    const activeStory = stories.find(s => s.id === activeId);
    if (!activeStory) return;

    const overContainer = COLUMNS.some(c => c.id === overId) 
      ? overId as string 
      : stories.find(s => s.id === overId)?.status;

    if (!overContainer) return;

    if (activeId !== overId || activeStory.status !== overContainer) {
      const oldIndex = stories.findIndex((s) => s.id === activeId);
      const newIndex = stories.findIndex((s) => s.id === overId);

      const newStories = arrayMove(stories, oldIndex, newIndex === -1 ? stories.length : newIndex) as UserStory[];
      
      // Optimistic update
      setStories(newStories);

      // Persist status change if needed
      if (activeStory.status !== overContainer) {
        await fetch(`/api/stories/${activeStory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: overContainer }),
        });
      }

      // Persist reorder
      const reorderPayload = newStories.map((story, index) => ({
        id: story.id,
        priority: newStories.length - index,
      }));

      await fetch('/api/stories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stories: reorderPayload }),
      });

      fetchData();
    }
  };

  if (!activeIteration) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="p-6 bg-[#13161e] border border-[#252a38] rounded-2xl text-center max-w-md">
          <Clock size={48} className="mx-auto mb-4 text-indigo-400 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Nenhuma Iteração Ativa</h2>
          <p className="text-slate-500 mb-6">Inicie uma nova iteração para começar a trabalhar nas histórias do backlog.</p>
          <button 
            onClick={() => setIsNewIterationModalOpen(true)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
          >
            <Play size={18} />
            Iniciar Iteração
          </button>
        </div>

        {isNewIterationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Nova Iteração</h2>
              <form onSubmit={handleCreateIteration} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Iteração</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={newIteration.name}
                    onChange={(e) => setNewIteration({ ...newIteration, name: e.target.value })}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ex: Iteração 01 - MVP"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Início</label>
                    <input
                      type="date"
                      value={newIteration.start_date}
                      onChange={(e) => setNewIteration({ ...newIteration, start_date: e.target.value })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Fim</label>
                    <input
                      type="date"
                      value={newIteration.end_date}
                      onChange={(e) => setNewIteration({ ...newIteration, end_date: e.target.value })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsNewIterationModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Iniciar Agora
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{activeIteration.name}</h2>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Calendar size={14} />
            {formatDate(activeIteration.start_date)} até {formatDate(activeIteration.end_date)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-mono uppercase">Velocidade Atual</div>
            <div className="text-xl font-bold text-indigo-400">
              {stories.filter(s => s.status === 'done').reduce((acc, s) => acc + s.points, 0)} / {stories.reduce((acc, s) => acc + s.points, 0)} pts
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
        <DndContext 
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map(col => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              color={col.color}
              count={stories.filter(s => s.status === col.id).length}
            >
              <SortableContext 
                id={col.id}
                items={stories.filter(s => s.status === col.id).map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {stories.filter(s => s.status === col.id).map(story => (
                  <SortableKanbanStory
                    key={story.id}
                    story={story}
                    onView={(s) => {
                      setViewingStory(s);
                      setIsViewStoryModalOpen(true);
                    }}
                    onToggleTask={handleToggleTask}
                    onMoveStory={handleMoveStory}
                    nextColumnId={COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1]?.id}
                  />
                ))}

                {col.id === 'todo' && backlogStories.length > 0 && (
                  <div className="pt-4 border-t border-[#252a38] mt-4">
                    <h4 className="text-[10px] font-mono text-slate-600 uppercase mb-3 px-1">Disponível no Backlog</h4>
                    <div className="space-y-2">
                      {backlogStories.slice(0, 3).map(story => (
                        <div key={story.id} className="flex items-center justify-between p-2 bg-[#0d0f14] rounded-lg border border-[#252a38] group">
                          <span className="text-xs text-slate-500 truncate pr-2">{story.title}</span>
                          <button 
                            onClick={() => handleAddToIteration(story.id)}
                            className="p-1 hover:bg-indigo-500/10 rounded text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SortableContext>
            </KanbanColumn>
          ))}
          
          <DragOverlay>
            {activeId ? (
              <div className="bg-[#1a1e28] border border-indigo-500/50 p-4 rounded-xl shadow-2xl opacity-90 scale-105 cursor-grabbing">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-400/10 px-1.5 py-0.5 rounded">
                    {stories.find(s => s.id === activeId)?.points} PTS
                  </span>
                </div>
                <h4 className="text-sm font-medium mb-1">{stories.find(s => s.id === activeId)?.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{stories.find(s => s.id === activeId)?.description}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

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
                    viewingStory.status === 'doing' ? 'bg-amber-500/10 text-amber-400 border border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {viewingStory.status}
                  </span>
                  <span className="text-xs font-mono text-indigo-400">{viewingStory.points} pontos</span>
                  {viewingStory.due_date && (
                    <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(viewingStory.due_date)}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold">{viewingStory.title}</h2>
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
                          filteredModalTasks.map((task: Task) => (
                            <div key={task.id} className="flex flex-col bg-[#0d0f14] border border-[#252a38] p-3 rounded-lg gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => handleToggleTask(task.id, task.status)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                      task.status === 'done' 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'border-[#252a38] hover:border-slate-500'
                                    }`}
                                  >
                                    {task.status === 'done' && <CheckCircle2 size={12} />}
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <span className={`text-sm block ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                      {task.title}
                                    </span>
                                    {task.observation && (
                                      <p className="text-[10px] text-slate-500 italic mt-0.5">{task.observation}</p>
                                    )}
                                  </div>
                                </div>
                                {task.due_date && (
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] text-indigo-400 font-mono font-bold">
                                    <Calendar size={12} />
                                    <span>{formatDate(task.due_date)}</span>
                                  </div>
                                )}
                              </div>
                              <TaskActions taskId={task.id} />
                            </div>
                          ))
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
    </div>
  );
}
