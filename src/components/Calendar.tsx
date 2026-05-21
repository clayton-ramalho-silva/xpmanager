import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, UserStory, Task } from '../types';
import { parseDate, formatDate } from '../utils/dateUtils';

interface CalendarProps {
  project: Project;
}

interface CalendarEvent {
  id: string | number;
  title: string;
  date: Date;
  type: 'story' | 'task';
  status: string;
  points?: number;
}

export default function Calendar({ project }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchData = async () => {
    const res = await fetch(`/api/projects/${project.id}/stories`);
    const stories: UserStory[] = await res.json();
    
    const calendarEvents: CalendarEvent[] = [];
    
    stories.forEach(story => {
      if (story.due_date) {
        const date = parseDate(story.due_date);
        if (date) {
          calendarEvents.push({
            id: `story-${story.id}`,
            title: story.title,
            date,
            type: 'story',
            status: story.status,
            points: story.points
          });
        }
      }
      
      story.tasks?.forEach(task => {
        if (task.due_date) {
          const date = parseDate(task.due_date);
          if (date) {
            calendarEvents.push({
              id: `task-${task.id}`,
              title: task.title,
              date,
              type: 'task',
              status: task.status
            });
          }
        }
      });
    });
    
    setEvents(calendarEvents);
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const nextMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const prevMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  
  const getDays = () => {
    if (viewMode === 'month') {
      const totalDays = daysInMonth(year, month);
      const firstDay = firstDayOfMonth(year, month);
      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
      return days;
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000));
      }
      return days;
    }
  };

  const days = getDays();

  const getEventsForDate = (date: Date) => {
    return events.filter(e => 
      e.date.getDate() === date.getDate() && 
      e.date.getMonth() === date.getMonth() && 
      e.date.getFullYear() === date.getFullYear()
    );
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'done': return 'bg-emerald-500';
      case 'doing': return 'bg-amber-500';
      case 'testing': return 'bg-indigo-500';
      case 'todo': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {viewMode === 'month' ? `${monthName} ${year}` : `Semana de ${currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
            </h2>
            <p className="text-sm text-slate-500">Cronograma de Entregas</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#13161e] border border-[#252a38] rounded-lg p-1">
            <button 
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mês
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
          </div>
          <div className="flex items-center gap-2 bg-[#13161e] border border-[#252a38] rounded-lg p-1">
          <button 
            onClick={prevMonth}
            className="p-1.5 hover:bg-[#252a38] rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Hoje
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 hover:bg-[#252a38] rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>

    <div className="flex-1 bg-[#13161e] border border-[#252a38] rounded-2xl overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-[#252a38] bg-[#1a1e28]/50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-[#252a38] bg-[#0d0f14]/20" />;
            
            const dayEvents = getEventsForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <div 
                key={date.toISOString()} 
                onClick={() => setSelectedDate(date)}
                className={`min-h-[100px] p-2 border-b border-r border-[#252a38] transition-colors cursor-pointer group hover:bg-[#1a1e28]/30 ${
                  isSelected ? 'bg-indigo-500/5' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-500 group-hover:text-slate-300'
                  }`}>
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-600 font-mono">{dayEvents.length}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id}
                      className={`px-1.5 py-0.5 rounded text-[9px] truncate flex items-center gap-1 border ${
                        event.type === 'story' 
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}
                    >
                      <div className={`w-1 h-1 rounded-full ${getStatusColor(event.status)}`} />
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-slate-600 pl-1">
                      + {dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[#13161e] border border-[#252a38] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarIcon size={16} className="text-indigo-400" />
                Entregas em {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-[#1a1e28] border border-[#252a38] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`} />
                      <div>
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          {event.type === 'story' ? 'História' : 'Tarefa'} • {event.status}
                        </div>
                      </div>
                    </div>
                    {event.points && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                        {event.points} PTS
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-4 text-center text-sm text-slate-500 italic">
                  Nenhuma entrega programada para este dia.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 text-xs text-slate-500 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-500" />
          <span>A Fazer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-indigo-500" />
          <span>Em Teste</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Concluído</span>
        </div>
      </div>
    </div>
  );
}
