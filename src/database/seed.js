/**
 * Seed: popula o banco com categorias, jogos e usuários de exemplo.
 * Uso: `npm run seed`
 *
 * ⚠️ Faz `sync({ force: true })` — recria as tabelas e apaga dados existentes.
 */
import bcrypt from 'bcryptjs';
import { sequelize, User, Category, Game, Review, Favorite } from '../models/index.js';

async function seed() {
  console.log('🌱 Iniciando seed...');
  await sequelize.sync({ force: true });

  // ── Usuários ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('senha123', 10);
  const [admin, alice, bob] = await User.bulkCreate([
    { username: 'admin', email: 'admin@gamevault.com', passwordHash, role: 'admin' },
    { username: 'alice', email: 'alice@example.com',   passwordHash },
    { username: 'bob',   email: 'bob@example.com',     passwordHash },
  ]);

  // ── Categorias ──────────────────────────────────────────────────────────
  const cats = await Category.bulkCreate([
    { name: 'RPG',       slug: 'rpg',       icon: '⚔️' },
    { name: 'FPS',       slug: 'fps',       icon: '🎯' },
    { name: 'Indie',     slug: 'indie',     icon: '🎨' },
    { name: 'Estratégia',slug: 'estrategia',icon: '♟️' },
    { name: 'Aventura',  slug: 'aventura',  icon: '🗺️' },
    { name: 'Simulação', slug: 'simulacao', icon: '🧪' },
    { name: 'Esporte',   slug: 'esporte',   icon: '⚽' },
    { name: 'Puzzle',    slug: 'puzzle',    icon: '🧩' },
  ]);
  const C = Object.fromEntries(cats.map(c => [c.slug, c.id]));

  // ── Jogos ───────────────────────────────────────────────────────────────
  const games = await Game.bulkCreate([
    { title: 'Elden Ring',                     developer: 'FromSoftware',  publisher: 'Bandai Namco', releaseYear: 2022, price: 249.90, categoryId: C.rpg,
      description: 'RPG de mundo aberto em Lands Between. Sucessor espiritual da série Dark Souls com exploração massiva.',
      coverUrl: 'https://placehold.co/600x800/2d1b4e/ffd700?text=Elden+Ring' },
    { title: 'Hades',                          developer: 'Supergiant',     publisher: 'Supergiant',   releaseYear: 2020, price: 49.99,  categoryId: C.indie,
      description: 'Roguelike isométrico com narrativa profunda sobre Zagreus tentando fugir do submundo.',
      coverUrl: 'https://placehold.co/600x800/4e0707/ffaa00?text=Hades' },
    { title: 'Counter-Strike 2',               developer: 'Valve',           publisher: 'Valve',         releaseYear: 2023, price: 0,      categoryId: C.fps,
      description: 'FPS tático competitivo. Atualização gratuita do CS:GO com gráficos remasterizados.',
      coverUrl: 'https://placehold.co/600x800/1a3a5c/ffffff?text=CS2' },
    { title: 'Civilization VI',                developer: 'Firaxis',         publisher: '2K Games',      releaseYear: 2016, price: 89.90,  categoryId: C.estrategia,
      description: 'Estratégia por turnos: construa um império desde a Idade Antiga até a Era da Informação.',
      coverUrl: 'https://placehold.co/600x800/0a3b6e/f8c537?text=Civ+VI' },
    { title: 'The Witcher 3',                  developer: 'CD Projekt Red',  publisher: 'CD Projekt',    releaseYear: 2015, price: 79.90,  categoryId: C.rpg,
      description: 'Geralt de Rívia em uma jornada para encontrar Ciri em um mundo aberto épico.',
      coverUrl: 'https://placehold.co/600x800/3a1d2e/c1a062?text=Witcher+3' },
    { title: 'Hollow Knight',                  developer: 'Team Cherry',     publisher: 'Team Cherry',   releaseYear: 2017, price: 36.99,  categoryId: C.indie,
      description: 'Metroidvania desenhado à mão em Hallownest, um reino subterrâneo em decadência.',
      coverUrl: 'https://placehold.co/600x800/0a1f2e/7fc7ff?text=Hollow+Knight' },
    { title: 'Stardew Valley',                 developer: 'ConcernedApe',    publisher: 'ConcernedApe',  releaseYear: 2016, price: 28.99,  categoryId: C.simulacao,
      description: 'Simulador de fazenda relaxante: cultive, pesque, faça amigos e construa uma vida no campo.',
      coverUrl: 'https://placehold.co/600x800/4d6b2e/f4e3a3?text=Stardew' },
    { title: 'Portal 2',                       developer: 'Valve',           publisher: 'Valve',         releaseYear: 2011, price: 19.99,  categoryId: C.puzzle,
      description: 'Puzzle em primeira pessoa com a icônica Portal Gun e uma história deliciosamente absurda.',
      coverUrl: 'https://placehold.co/600x800/1a1a1a/ff8800?text=Portal+2' },
    { title: 'Red Dead Redemption 2',          developer: 'Rockstar',        publisher: 'Rockstar',      releaseYear: 2018, price: 199.90, categoryId: C.aventura,
      description: 'Faroeste épico: Arthur Morgan e a gangue de Van der Linde nos últimos dias do Velho Oeste.',
      coverUrl: 'https://placehold.co/600x800/2e1a0a/e8b07f?text=RDR2' },
    { title: 'FIFA 24',                        developer: 'EA Sports',       publisher: 'EA',            releaseYear: 2023, price: 249.90, categoryId: C.esporte,
      description: 'Simulador de futebol com licenças oficiais e modos online competitivos.',
      coverUrl: 'https://placehold.co/600x800/0a4d3a/ffffff?text=FIFA+24' },
    { title: 'Baldur\'s Gate 3',                developer: 'Larian',          publisher: 'Larian',         releaseYear: 2023, price: 199.99, categoryId: C.rpg,
      description: 'CRPG baseado em D&D 5ª edição. Liberdade total de escolha em uma história rica.',
      coverUrl: 'https://placehold.co/600x800/2e1a3a/d4a373?text=BG3' },
    { title: 'Celeste',                        developer: 'Maddy Makes',     publisher: 'Maddy Makes',    releaseYear: 2018, price: 39.99,  categoryId: C.indie,
      description: 'Plataforma 2D sobre escalar uma montanha — e enfrentar seus próprios demônios.',
      coverUrl: 'https://placehold.co/600x800/cc4488/ffeebb?text=Celeste' },
  ]);

  // ── Reviews ─────────────────────────────────────────────────────────────
  await Review.bulkCreate([
    { userId: alice.id, gameId: games[0].id, rating: 5, comment: 'Obra-prima absoluta.' },
    { userId: bob.id,   gameId: games[0].id, rating: 4, comment: 'Difícil, mas vale cada hora.' },
    { userId: alice.id, gameId: games[1].id, rating: 5, comment: 'Trilha sonora incrível.' },
    { userId: alice.id, gameId: games[4].id, rating: 5, comment: 'Geralt > qualquer outro RPG.' },
    { userId: bob.id,   gameId: games[7].id, rating: 5, comment: 'Puzzles geniais e roteiro ímpar.' },
    { userId: alice.id, gameId: games[10].id, rating: 5, comment: 'Liberdade absurda. Já passei 200h.' },
  ]);

  // ── Favoritos ───────────────────────────────────────────────────────────
  await Favorite.bulkCreate([
    { userId: alice.id, gameId: games[0].id },
    { userId: alice.id, gameId: games[4].id },
    { userId: alice.id, gameId: games[10].id },
    { userId: bob.id,   gameId: games[0].id },
    { userId: bob.id,   gameId: games[7].id },
  ]);

  console.log('✅ Seed concluído!');
  console.log('   👤 Admin: admin@gamevault.com / senha123');
  console.log('   👤 User:  alice@example.com  / senha123');
  console.log('   👤 User:  bob@example.com    / senha123');
  await sequelize.close();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
