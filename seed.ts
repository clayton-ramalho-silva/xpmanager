import Database from 'better-sqlite3';

const db = new Database('xp_manager.db');

const data = [
  {
    name: 'Automatização (SAP)',
    description: 'Projeto de integração e automação de dados SAP.',
    stories: [
      {
        title: 'Preparação',
        description: 'Fase inicial de saneamento e organização.',
        points: 3,
        priority: 2,
        status: 'done',
        tasks: ['Preparação dos dados para inserção']
      },
      {
        title: 'Revendas',
        description: 'Módulo de gestão de revendas no SAP.',
        points: 8,
        priority: 3,
        status: 'testing',
        tasks: ['Criação de arquivo específico para inserção no banco', 'Fase de testes']
      },
      {
        title: 'Comissões',
        description: 'Cálculo e processamento de comissionamento.',
        points: 8,
        priority: 3,
        status: 'testing',
        tasks: ['Criação de arquivo específico para inserção no banco', 'Fase de testes']
      },
      {
        title: 'Servidor / Infra',
        description: 'Configurações de ambiente e automação de jobs.',
        points: 5,
        priority: 1,
        status: 'todo',
        tasks: ['Configuração do CRON para automatizar as inserções', 'Criação de tabelas de teste para teste final da automatização']
      }
    ]
  },
  {
    name: 'Portal',
    description: 'Desenvolvimento e manutenção do Portal de Clientes/Adm.',
    stories: [
      {
        title: 'Atualização /sistema → /dev',
        description: 'Migração e ajustes de ambiente.',
        points: 5,
        priority: 2,
        status: 'doing',
        tasks: ['Alterações na área do administrador para não atrapalhar o funcionamento atual']
      },
      {
        title: 'Clientes',
        description: 'Gestão e visualização de base de clientes.',
        points: 13,
        priority: 3,
        status: 'done',
        tasks: ['Paginação da lista para evitar sobrecarga', 'Alterações para impedir novos cadastros ou alterações pelo portal', 'Alteração no campo de pesquisa devido à paginação']
      },
      {
        title: 'Comissões (Portal)',
        description: 'Visualização de comissões no portal.',
        points: 8,
        priority: 2,
        status: 'doing',
        tasks: ['Alterações no funcionamento para otimização / novo funcionamento', 'Buscar lista de comissionamentos por grupos / revendas do usuário']
      },
      {
        title: 'Usuários',
        description: 'Módulo de autenticação e perfis.',
        points: 5,
        priority: 1,
        status: 'todo',
        tasks: ['Separação das informações de revendas e usuários', 'Alteração no cadastro de usuário através do portal']
      },
      {
        title: 'Administração',
        description: 'Painel de controle master.',
        points: 8,
        priority: 1,
        status: 'todo',
        tasks: ['Adicionar nova área com lista de grupos cadastrados', 'Área para administrador master cadastrar sub-administradores']
      }
    ]
  }
];

function seed() {
  console.log('Iniciando população do banco...');
  
  // Limpar dados existentes para evitar duplicatas no seed
  db.prepare('DELETE FROM tasks').run();
  db.prepare('DELETE FROM user_stories').run();
  db.prepare('DELETE FROM iterations').run();
  db.prepare('DELETE FROM projects').run();

  for (const p of data) {
    const projectResult = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)').run(p.name, p.description);
    const projectId = projectResult.lastInsertRowid;

    // Criar uma iteração padrão para cada projeto
    const iterResult = db.prepare('INSERT INTO iterations (project_id, name, status) VALUES (?, ?, ?)').run(projectId, 'Iteração 01', 'active');
    const iterationId = iterResult.lastInsertRowid;

    for (const s of p.stories) {
      const storyResult = db.prepare('INSERT INTO user_stories (project_id, iteration_id, title, description, points, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(projectId, iterationId, s.title, s.description, s.points, s.priority, s.status);
      const storyId = storyResult.lastInsertRowid;

      for (const t of s.tasks) {
        db.prepare('INSERT INTO tasks (story_id, title, status, observation) VALUES (?, ?, ?, ?)').run(storyId, t, 'todo', '');
      }
    }
  }

  console.log('Banco de dados populado com sucesso!');
}

seed();
