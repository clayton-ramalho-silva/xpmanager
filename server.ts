import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('xp_manager.db');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS iterations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'future',
    FOREIGN KEY (project_id) REFERENCES projects (id)
  );

  CREATE TABLE IF NOT EXISTS user_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    iteration_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'backlog',
    due_date TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (iteration_id) REFERENCES iterations (id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    position INTEGER DEFAULT 0,
    due_date TEXT,
    observation TEXT,
    FOREIGN KEY (story_id) REFERENCES user_stories (id)
  );

  CREATE TABLE IF NOT EXISTS task_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    description TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id)
  );
`);

// Migration: Add observation column to tasks if it doesn't exist
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN observation TEXT').run();
} catch (e) {
  // Column already exists or table doesn't exist yet
}

// Migration: Add due_date column to user_stories if it doesn't exist
try {
  db.prepare('ALTER TABLE user_stories ADD COLUMN due_date TEXT').run();
} catch (e) {
  // Column already exists
}

// Seed Admin User
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@example.com');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@example.com', hashedPassword, 'admin');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // Auth Routes
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ success: true });
  });

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // User CRUD (Admin Only)
  app.get('/api/users', authenticate, isAdmin, (req, res) => {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
    res.json(users);
  });

  app.post('/api/users', authenticate, isAdmin, (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role || 'user');
      res.json({ id: result.lastInsertRowid, name, email, role });
    } catch (err) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.put('/api/users/:id', authenticate, isAdmin, (req, res) => {
    const { name, email, role, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    let query = 'UPDATE users SET name = ?, email = ?, role = ?';
    const params = [name || user.name, email || user.email, role || user.role];

    if (password) {
      query += ', password = ?';
      params.push(bcrypt.hashSync(password, 10));
    }

    query += ' WHERE id = ?';
    params.push(req.params.id);

    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.delete('/api/users/:id', authenticate, isAdmin, (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Projects
  app.get('/api/projects', authenticate, (req, res) => {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    res.json(projects);
  });

  app.get('/api/projects/:id', authenticate, (req, res) => {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(project);
  });

  app.post('/api/projects', authenticate, (req, res) => {
    const { name, description } = req.body;
    const result = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)').run(name, description);
    res.json({ id: result.lastInsertRowid, name, description });
  });

  app.delete('/api/projects/:id', authenticate, (req, res) => {
    const projectId = req.params.id;
    
    const deleteProject = db.transaction(() => {
      // 1. Delete tasks belonging to stories of the project
      db.prepare(`
        DELETE FROM tasks 
        WHERE story_id IN (SELECT id FROM user_stories WHERE project_id = ?)
      `).run(projectId);

      // 2. Delete user stories
      db.prepare('DELETE FROM user_stories WHERE project_id = ?').run(projectId);

      // 3. Delete iterations
      db.prepare('DELETE FROM iterations WHERE project_id = ?').run(projectId);

      // 4. Delete the project
      db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
    });

    deleteProject();
    res.json({ success: true });
  });

  // Iterations
  app.get('/api/projects/:projectId/iterations', authenticate, (req, res) => {
    const iterations = db.prepare('SELECT * FROM iterations WHERE project_id = ?').all(req.params.projectId);
    res.json(iterations);
  });

  app.post('/api/iterations', authenticate, (req, res) => {
    const { project_id, name, start_date, end_date, status } = req.body;
    const result = db.prepare('INSERT INTO iterations (project_id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)').run(project_id, name, start_date, end_date, status || 'future');
    res.json({ id: result.lastInsertRowid, ...req.body });
  });

  app.put('/api/iterations/:id', authenticate, (req, res) => {
    const { status, name, start_date, end_date } = req.body;
    const current = db.prepare('SELECT * FROM iterations WHERE id = ?').get(req.params.id) as any;
    if (!current) return res.status(404).json({ error: 'Iteration not found' });

    db.prepare('UPDATE iterations SET status = ?, name = ?, start_date = ?, end_date = ? WHERE id = ?')
      .run(
        status ?? current.status, 
        name ?? current.name, 
        start_date ?? current.start_date, 
        end_date ?? current.end_date, 
        req.params.id
      );
    res.json({ success: true });
  });

  // User Stories
  app.get('/api/projects/:projectId/stories', authenticate, (req, res) => {
    const stories = db.prepare('SELECT * FROM user_stories WHERE project_id = ? ORDER BY priority DESC').all(req.params.projectId) as any[];
    for (const story of stories) {
      story.tasks = db.prepare('SELECT * FROM tasks WHERE story_id = ? ORDER BY (due_date IS NULL OR due_date = \'\') ASC, due_date ASC, position ASC, id DESC').all(story.id);
    }
    res.json(stories);
  });

  app.post('/api/stories', authenticate, (req, res) => {
    const { project_id, iteration_id, title, description, points, priority, status, due_date } = req.body;
    const result = db.prepare('INSERT INTO user_stories (project_id, iteration_id, title, description, points, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(project_id, iteration_id, title, description, points || 0, priority || 0, status || 'backlog', due_date);
    res.json({ id: result.lastInsertRowid, ...req.body });
  });

  app.put('/api/stories/:id', authenticate, (req, res) => {
    const { iteration_id, status, priority, title, description, points, due_date } = req.body;
    const current = db.prepare('SELECT * FROM user_stories WHERE id = ?').get(req.params.id) as any;
    if (!current) return res.status(404).json({ error: 'Story not found' });

    db.prepare('UPDATE user_stories SET iteration_id = ?, status = ?, priority = ?, title = ?, description = ?, points = ?, due_date = ? WHERE id = ?')
      .run(
        iteration_id !== undefined ? iteration_id : current.iteration_id,
        status ?? current.status,
        priority ?? current.priority,
        title ?? current.title,
        description ?? current.description,
        points ?? current.points,
        due_date ?? current.due_date,
        req.params.id
      );
    
    updateStoryDueDate(Number(req.params.id));
    
    res.json({ success: true });
  });

  app.delete('/api/stories/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM tasks WHERE story_id = ?').run(req.params.id);
    db.prepare('DELETE FROM user_stories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.put('/api/stories/reorder', authenticate, (req, res) => {
    const { stories } = req.body; // Array of { id, priority }
    const update = db.prepare('UPDATE user_stories SET priority = ? WHERE id = ?');
    
    const transaction = db.transaction((storyList) => {
      for (const story of storyList) {
        update.run(story.priority, story.id);
      }
    });

    transaction(stories);
    res.json({ success: true });
  });

  // Tasks
  const updateStoryDueDate = (storyId: number | string) => {
    console.log(`[DEBUG] Updating due_date for story ${storyId}...`);
    const result = db.prepare(`
      UPDATE user_stories 
      SET due_date = (
        SELECT MAX(due_date) 
        FROM tasks 
        WHERE story_id = ? AND due_date IS NOT NULL AND due_date != '' AND status != 'done'
      ) 
      WHERE id = ?
    `).run(storyId, storyId);
    console.log(`[DEBUG] Update result:`, result);
    
    const updated = db.prepare('SELECT due_date FROM user_stories WHERE id = ?').get(storyId) as any;
    console.log(`[DEBUG] New due_date for story ${storyId}:`, updated?.due_date);
  };

  // One-time sync for existing stories
  const syncAllStoryDueDates = () => {
    const stories = db.prepare('SELECT id FROM user_stories').all() as any[];
    for (const story of stories) {
      updateStoryDueDate(story.id);
    }
  };

  syncAllStoryDueDates();

  app.get('/api/stories/:storyId/tasks', authenticate, (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE story_id = ? ORDER BY (due_date IS NULL OR due_date = \'\') ASC, due_date ASC, position ASC, id DESC').all(req.params.storyId);
    res.json(tasks);
  });

  app.post('/api/tasks', authenticate, (req, res) => {
    const { story_id, title, status, due_date, observation } = req.body;
    // Get max position for this story
    const maxPos = db.prepare('SELECT MAX(position) as maxPos FROM tasks WHERE story_id = ?').get(story_id) as any;
    const nextPos = (maxPos?.maxPos || 0) + 1;
    
    const result = db.prepare('INSERT INTO tasks (story_id, title, status, position, due_date, observation) VALUES (?, ?, ?, ?, ?, ?)').run(story_id, title, status || 'todo', nextPos, due_date, observation);
    
    updateStoryDueDate(story_id);
    
    res.json({ id: result.lastInsertRowid, ...req.body, position: nextPos });
  });

  app.put('/api/tasks/reorder', authenticate, (req, res) => {
    const { tasks } = req.body; // Array of { id, position }
    const update = db.prepare('UPDATE tasks SET position = ? WHERE id = ?');
    
    const transaction = db.transaction((taskList) => {
      for (const task of taskList) {
        update.run(task.position, task.id);
      }
    });

    transaction(tasks);
    res.json({ success: true });
  });

  app.put('/api/tasks/:id', authenticate, (req, res) => {
    const { status, title, due_date, observation } = req.body;
    const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
    if (!current) return res.status(404).json({ error: 'Task not found' });

    db.prepare('UPDATE tasks SET status = ?, title = ?, due_date = ?, observation = ? WHERE id = ?')
      .run(status ?? current.status, title ?? current.title, due_date ?? current.due_date, observation ?? current.observation, req.params.id);
    
    updateStoryDueDate(current.story_id);
    
    res.json({ success: true });
  });

  app.delete('/api/tasks/:id', authenticate, (req, res) => {
    const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
    db.prepare('DELETE FROM task_actions WHERE task_id = ?').run(req.params.id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    
    if (current) {
      updateStoryDueDate(current.story_id);
    }
    
    res.json({ success: true });
  });

  // Task Actions
  app.get('/api/tasks/:taskId/actions', authenticate, (req, res) => {
    const actions = db.prepare('SELECT * FROM task_actions WHERE task_id = ? ORDER BY created_at ASC').all(req.params.taskId);
    res.json(actions);
  });

  app.post('/api/tasks/:taskId/actions', authenticate, (req, res) => {
    const { description } = req.body;
    const result = db.prepare('INSERT INTO task_actions (task_id, description) VALUES (?, ?)').run(req.params.taskId, description);
    res.json({ id: result.lastInsertRowid, task_id: Number(req.params.taskId), description, completed: 0 });
  });

  app.put('/api/task-actions/:id', authenticate, (req, res) => {
    const { completed, description } = req.body;
    const current = db.prepare('SELECT * FROM task_actions WHERE id = ?').get(req.params.id) as any;
    if (!current) return res.status(404).json({ error: 'Action not found' });

    db.prepare('UPDATE task_actions SET completed = ?, description = ? WHERE id = ?')
      .run(
        completed !== undefined ? (completed ? 1 : 0) : current.completed,
        description ?? current.description,
        req.params.id
      );
    res.json({ success: true });
  });

  app.delete('/api/task-actions/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM task_actions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/projects/:projectId/actions', authenticate, (req, res) => {
    const actions = db.prepare(`
      SELECT 
        ta.*, 
        t.title as task_title, 
        us.title as story_title
      FROM task_actions ta
      JOIN tasks t ON ta.task_id = t.id
      JOIN user_stories us ON t.story_id = us.id
      WHERE us.project_id = ?
      ORDER BY ta.created_at DESC
    `).all(req.params.projectId);
    res.json(actions);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
