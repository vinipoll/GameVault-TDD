# 🎮 GameVault

> Catálogo de jogos digitais — explore, favorite, avalie.

Plataforma web full-stack com sistema de recomendação personalizado, gamificação e painel administrativo. Construída em **Node.js + Express + Sequelize + MySQL** seguindo **TDD com Vitest**.

![Status](https://img.shields.io/badge/testes-91%20passing-00ff9d?style=flat-square)
![Stack](https://img.shields.io/badge/stack-node%20%7C%20express%20%7C%20sequelize-blue?style=flat-square)
![Coverage](https://img.shields.io/badge/services-~90%25-success?style=flat-square)

## ✨ Funcionalidades

### Para usuários
- 🔐 Cadastro e login com JWT
- 🎮 Catálogo com filtro por gênero e busca
- ⭐ Avaliações (1 a 5 estrelas + comentário)
- ♥ Sistema de favoritos
- 🎯 **Recomendação personalizada** baseada no perfil

### Para administradores
- 📊 Dashboard com estatísticas agregadas
- 🎮 CRUD completo de jogos e categorias
- 👥 Gerenciamento de usuários (suspender, banir, remover)
- 🏆 Ranking de jogos mais favoritados

## 🏗️ Stack

| Camada       | Tecnologia                                |
|--------------|-------------------------------------------|
| Backend      | Node.js 18+ (ESM), Express 4              |
| ORM          | Sequelize 6 com MySQL 8                   |
| Auth         | JWT (jsonwebtoken) + bcryptjs             |
| Testes       | Vitest 1.6 + Supertest 7                  |
| Frontend     | HTML5 + CSS3 + JavaScript vanilla         |

## 📁 Estrutura

```
gamevault/
├── src/
│   ├── app.js                  # Express app (importável em testes)
│   ├── server.js               # Entry point (sincroniza Sequelize + listen)
│   ├── config/
│   │   └── database.js         # Conexão Sequelize MySQL
│   ├── middleware/
│   │   └── auth.js             # JWT + verificação de role admin
│   ├── models/
│   │   └── index.js            # Associações entre models
│   ├── database/
│   │   └── seed.js             # Popula DB com dados de exemplo
│   └── modules/                # Um por feature
│       ├── auth/
│       │   ├── auth.routes.js
│       │   └── __tests__/
│       ├── user/
│       │   ├── user.model.js
│       │   ├── user.service.js
│       │   └── __tests__/
│       ├── game/      (...)
│       ├── category/  (...)
│       ├── favorite/  (...)
│       ├── review/    (...)
│       └── admin/     (...)
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── docs/
│   ├── Relatorio_GameVault.docx     # Relatório acadêmico completo
│   └── api-examples.md              # Exemplos de uso da API
├── database.sql                     # Schema MySQL de referência
├── vitest.config.js
├── vitest.setup.js
└── package.json
```

## 🚀 Como rodar

### Pré-requisitos
- Node.js **18+**
- MySQL **8+** rodando localmente

### 1. Instalar
```bash
npm install
```

### 2. Configurar .env
```bash
cp .env.example .env
# Edite as credenciais MySQL no .env
```

### 3. Subir o banco
```bash
# Criar o banco (uma vez)
node criar-banco.js

# Popular com dados de exemplo
npm run seed
```

> O `seed` faz `sequelize.sync({ force: true })` — **apaga tudo e recria** com 12 jogos, 8 categorias e 3 usuários.

### 4. Subir o servidor
```bash
npm run dev          # com nodemon (auto-reload)
# ou
npm start
```

🎮 Frontend disponível em `http://localhost:3000`
🔌 API em `http://localhost:3000/api`

### Usuários de seed

| Email                  | Senha     | Role  |
|------------------------|-----------|-------|
| admin@gamevault.com    | senha123  | admin |
| alice@example.com      | senha123  | user  |
| bob@example.com        | senha123  | user  |

## 🧪 Testes

```bash
npm test                    # tudo (91 testes em ~6s)
npm run test:watch          # modo watch
npm run test:coverage       # cobertura
npm run test:ui             # UI do Vitest no browser
```

📄 Detalhes em [`src/modules/README_TESTES.md`](src/modules/README_TESTES.md)

## 📑 Documentação

- 📄 [**Relatório acadêmico** (.docx)](docs/Relatorio_GameVault.docx) — objetivo, escopo, RFs, RNFs, casos de uso, plano de testes
- 🔌 [Exemplos da API](docs/api-examples.md) — todas as rotas com `curl`
- 🧪 [Guia de testes](src/modules/README_TESTES.md) — como rodar e estender

## 🎯 Sistema de recomendação

O método `GameService.recommendFor(userId)` implementa um algoritmo simples baseado em conteúdo:

1. Lista os favoritos do usuário e agrupa por categoria
2. Identifica as categorias mais frequentes (preferência inferida)
3. Busca jogos dessas categorias que o usuário **ainda não favoritou**
4. Ordena por nota média (desc) e retorna o top N

**Cold start** (usuário sem favoritos): devolve os jogos com melhor nota média geral.

## 🔒 Segurança

- Senhas armazenadas como hash bcrypt (cost factor 10)
- JWT no header `Authorization: Bearer <token>`, expira em 7 dias
- Variáveis sensíveis em `.env` — **nunca** commitar (ver `.gitignore`)
- Middleware `adminMiddleware` protege rotas administrativas
- `passwordHash` removido de todas as respostas via `UserService.sanitize()`

## 📜 Licença

Projeto acadêmico — disciplina de Test-Driven Development (TDD).
