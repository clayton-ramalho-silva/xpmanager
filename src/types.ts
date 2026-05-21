export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Iteration {
  id: number;
  project_id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'future';
}

export interface UserStory {
  id: number;
  project_id: number;
  iteration_id: number | null;
  title: string;
  description: string;
  points: number;
  priority: number;
  status: 'backlog' | 'todo' | 'doing' | 'testing' | 'done';
  due_date?: string;
  tasks?: Task[];
}

export interface Task {
  id: number;
  story_id: number;
  title: string;
  status: 'todo' | 'done';
  due_date?: string;
  observation?: string;
  actions?: TaskAction[];
}

export interface TaskAction {
  id: number;
  task_id: number;
  description: string;
  completed: boolean;
  created_at?: string;
  task_title?: string;
  story_title?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at?: string;
}
