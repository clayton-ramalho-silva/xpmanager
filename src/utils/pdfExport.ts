import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, UserStory, Task } from '../types';
import { formatDate } from './dateUtils';

export const exportProjectToPDF = async (
  project: Project, 
  stories: UserStory[], 
  taskFilter: 'all' | 'pending' | 'done' = 'all'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 44, 52);
  doc.text('Relatório de Andamento do Projeto', 14, 22);
  
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text(project.name, 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const filterLabel = taskFilter === 'done' ? 'Concluídas' : taskFilter === 'pending' ? 'Pendentes' : 'Todas';
  doc.text(`Gerado em: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Filtro de Tarefas: ${filterLabel}`, 14, 40);

  if (project.description) {
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(project.description, pageWidth - 28);
    doc.text(splitDesc, 14, 50);
  }

  let currentY = project.description ? 65 : 50;

  // Summary Stats
  const totalStories = stories.length;
  const totalTasks = stories.reduce((acc, s) => acc + (s.tasks?.length || 0), 0);
  const completedTasks = stories.reduce((acc, s) => acc + (s.tasks?.filter(t => t.status === 'done').length || 0), 0);
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  doc.setFontSize(12);
  doc.setTextColor(40, 44, 52);
  doc.text('Resumo Executivo:', 14, currentY);
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Histórias', totalStories.toString()],
      ['Total de Tarefas', totalTasks.toString()],
      ['Tarefas Concluídas', completedTasks.toString()],
      ['Progresso Geral', `${progress}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14 },
    tableWidth: 80,
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Stories and Tasks
  stories.forEach((story, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 44, 52);
    doc.text(`${index + 1}. ${story.title}`, 14, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Status: ${story.status.toUpperCase()} | Pontos: ${story.points}`, 14, currentY + 6);

    const filteredTasks = (story.tasks || []).filter(task => {
      if (taskFilter === 'done') return task.status === 'done';
      if (taskFilter === 'pending') return task.status !== 'done';
      return true;
    });

    const taskData = filteredTasks.length > 0 
      ? filteredTasks.map(task => [
          task.title,
          task.status === 'done' ? 'Concluída' : 'Pendente',
          task.due_date ? formatDate(task.due_date) : '-',
          task.observation || '-'
        ])
      : [['Nenhuma tarefa encontrada com o filtro selecionado.', '-', '-', '-']];

    autoTable(doc, {
      startY: currentY + 10,
      head: [['Tarefa', 'Status', 'Data Prevista/Conclusão', 'Observações']],
      body: taskData,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.text[0] === 'Concluída') {
            data.cell.styles.textColor = [22, 163, 74]; // Green-600
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  // Footer on each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${totalPages} - XP Manager Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filterSuffix = taskFilter === 'pending' ? '_pendentes' : taskFilter === 'done' ? '_concluidas' : '';
  doc.save(`Relatorio_${project.name.replace(/\s+/g, '_')}${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`);
};
