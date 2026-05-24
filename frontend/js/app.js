/**
 * GameVault — SPA frontend.
 * Arquitetura simples: estado global + funções render por view.
 */

// ── Estado ──────────────────────────────────────────────────────────────
const state = {
  user: null,
  token: localStorage.getItem('gv_token'),
  view: 'catalog',           // catalog | favorites | recommendations | game | admin
  games: [],
  categories: [],
  selectedCategory: null,
  search: '',
  selectedGameId: null,
  selectedGame: null,
  reviews: [],
  myFavorites: new Set(),
  recommendations: [],
  adminTab: 'dashboard',     // dashboard | users | games | categories
  adminData: null,
  adminUsers: [],
  errorMsg: null,
};

// hidrata user do localStorage
try {
  const u = localStorage.getItem('gv_user');
  if (u) state.user = JSON.parse(u);
} catch {}

// ── API helpers ────────────────────────────────────────────────────────
const API = '/api';

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Erro'), { status: res.status, data });
  return data;
}

function toast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

// ── Render principal ───────────────────────────────────────────────────
async function render() {
  const root = document.getElementById('app');
  if (!state.token || !state.user) return renderLogin(root);

  root.innerHTML = `
    ${renderHeader()}
    <main class="container">
      <div id="view-content">${renderSpinner()}</div>
    </main>
  `;
  attachHeaderEvents();

  const content = document.getElementById('view-content');
  switch (state.view) {
    case 'catalog':         await loadCatalog();         content.innerHTML = viewCatalog(); attachCatalogEvents(); break;
    case 'favorites':       await loadFavorites();       content.innerHTML = viewFavorites(); attachCatalogEvents(); break;
    case 'recommendations': await loadRecommendations(); content.innerHTML = viewRecommendations(); attachCatalogEvents(); break;
    case 'game':            await loadGame();            content.innerHTML = viewGameDetail(); attachGameDetailEvents(); break;
    case 'admin':           await loadAdmin();           content.innerHTML = viewAdmin(); attachAdminEvents(); break;
  }
}

function renderSpinner() { return '<div class="spinner"></div>'; }

// ── Login / Register ───────────────────────────────────────────────────
function renderLogin(root) {
  root.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">GAMEVAULT</div>
        <div class="login-tag">// catálogo de jogos digitais //</div>
        <div class="login-tabs">
          <button data-tab="login" class="${state.loginTab !== 'register' ? 'active' : ''}">Entrar</button>
          <button data-tab="register" class="${state.loginTab === 'register' ? 'active' : ''}">Cadastrar</button>
        </div>
        ${state.errorMsg ? `<div class="error-msg">${escapeHtml(state.errorMsg)}</div>` : ''}
        <form id="auth-form">
          ${state.loginTab === 'register' ? `
            <div class="field">
              <label class="label">Username</label>
              <input class="input" name="username" required minlength="3" />
            </div>
          ` : ''}
          <div class="field">
            <label class="label">Email</label>
            <input class="input" type="email" name="email" required />
          </div>
          <div class="field">
            <label class="label">Senha</label>
            <input class="input" type="password" name="password" required minlength="6" />
          </div>
          <button type="submit" class="btn primary" style="width:100%; justify-content:center;">
            ${state.loginTab === 'register' ? '▶ Criar conta' : '▶ Entrar'}
          </button>
        </form>
      </div>
    </div>
  `;
  root.querySelectorAll('.login-tabs button').forEach(b =>
    b.onclick = () => { state.loginTab = b.dataset.tab; state.errorMsg = null; render(); }
  );
  document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = Object.fromEntries(f.entries());
    const endpoint = state.loginTab === 'register' ? '/auth/register' : '/auth/login';
    try {
      const r = await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      state.token = r.token;
      state.user = r.user;
      localStorage.setItem('gv_token', r.token);
      localStorage.setItem('gv_user', JSON.stringify(r.user));
      state.errorMsg = null;
      state.view = 'catalog';
      toast(`Bem-vindo, ${r.user.username}!`);
      render();
    } catch (err) {
      state.errorMsg = err.message;
      render();
    }
  };
}

// ── Header ─────────────────────────────────────────────────────────────
function renderHeader() {
  const isAdmin = state.user.role === 'admin';
  return `
    <header class="header">
      <div class="container header-inner">
        <div class="logo">GAMEVAULT</div>
        <nav class="nav">
          <button data-view="catalog"         class="${state.view === 'catalog' ? 'active' : ''}">Catálogo</button>
          <button data-view="favorites"       class="${state.view === 'favorites' ? 'active' : ''}">Favoritos</button>
          <button data-view="recommendations" class="${state.view === 'recommendations' ? 'active' : ''}">Pra você</button>
          ${isAdmin ? `<button data-view="admin" class="${state.view === 'admin' ? 'active' : ''}">▣ Admin</button>` : ''}
        </nav>
        <div class="header-user">
          <span>player: <strong>${escapeHtml(state.user.username)}</strong></span>
          <button class="btn ghost" id="logout-btn">Sair</button>
        </div>
      </div>
    </header>
  `;
}
function attachHeaderEvents() {
  document.querySelectorAll('.nav button').forEach(b =>
    b.onclick = () => { state.view = b.dataset.view; state.selectedGameId = null; render(); }
  );
  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('gv_token');
    localStorage.removeItem('gv_user');
    state.token = null; state.user = null;
    render();
  };
}

// ── Catálogo ───────────────────────────────────────────────────────────
async function loadCatalog() {
  if (state.categories.length === 0) {
    state.categories = await api('/categories');
  }
  const qs = new URLSearchParams();
  if (state.selectedCategory) qs.set('categoryId', state.selectedCategory);
  if (state.search) qs.set('search', state.search);
  state.games = await api('/games' + (qs.toString() ? '?' + qs : ''));
  await loadMyFavorites();
}

async function loadMyFavorites() {
  try {
    const favs = await api('/favorites');
    state.myFavorites = new Set(favs.map(f => f.id));
  } catch { state.myFavorites = new Set(); }
}

async function loadFavorites() {
  state.games = await api('/favorites');
  await loadMyFavorites();
}

async function loadRecommendations() {
  state.recommendations = await api('/games/recommendations');
  await loadMyFavorites();
}

function viewCatalog() {
  return `
    <section class="hero">
      <h1>Explore o <span>vault</span></h1>
      <p>${state.games.length} jogos no catálogo. Filtre por gênero, descubra novos títulos e favorite os seus prediletos.</p>
    </section>

    <div class="filters">
      <input class="input" id="search-input" placeholder="Buscar por título..." value="${escapeHtml(state.search)}" />
      <div class="chips">
        <button class="chip ${!state.selectedCategory ? 'active' : ''}" data-cat="">Todos</button>
        ${state.categories.map(c => `
          <button class="chip ${state.selectedCategory == c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon || ''} ${escapeHtml(c.name)}</button>
        `).join('')}
      </div>
    </div>

    ${renderGameGrid(state.games)}
  `;
}

function viewFavorites() {
  return `
    <section class="hero">
      <h1>Seus <span>favoritos</span></h1>
      <p>Jogos que você guardou no seu vault pessoal.</p>
    </section>
    ${renderGameGrid(state.games)}
  `;
}

function viewRecommendations() {
  return `
    <section class="hero">
      <h1>Recomendações <span>pra você</span></h1>
      <p>Baseado nos seus favoritos e no que a comunidade está jogando.</p>
    </section>
    ${renderGameGrid(state.recommendations)}
  `;
}

function renderGameGrid(games) {
  if (!games || games.length === 0) {
    return `<div class="empty">// nenhum jogo encontrado //</div>`;
  }
  return `
    <div class="games-grid">
      ${games.map(g => renderGameCard(g)).join('')}
    </div>
  `;
}

function renderGameCard(g) {
  const fav = state.myFavorites.has(g.id);
  const stars = renderStars(g.avgRating || 0);
  const priceLabel = +g.price === 0 ? '<span class="price free">FREE</span>' : `<span class="price">R$${(+g.price).toFixed(2)}</span>`;
  return `
    <article class="game-card" data-id="${g.id}">
      <div class="cover" style="background-image: url('${escapeHtml(g.coverUrl || '')}')">
        <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${g.id}" title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${fav ? '♥' : '♡'}</button>
      </div>
      <div class="info">
        <h3>${escapeHtml(g.title)}</h3>
        <div class="meta">
          <span class="cat">${escapeHtml(g.category?.name || '')}</span>
          ${g.releaseYear ? `<span>•</span><span>${g.releaseYear}</span>` : ''}
        </div>
        <div class="rating-row">
          ${stars}
          ${priceLabel}
        </div>
      </div>
    </article>
  `;
}

function renderStars(n) {
  const full = Math.round(n);
  let s = '<div class="stars">';
  for (let i = 1; i <= 5; i++) s += i <= full ? '★' : '☆';
  s += `<span class="count">${n ? n.toFixed(1) : '—'}</span></div>`;
  return s;
}

function attachCatalogEvents() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let t;
    searchInput.oninput = (e) => {
      clearTimeout(t);
      t = setTimeout(() => { state.search = e.target.value; render(); }, 300);
    };
  }
  document.querySelectorAll('.chip[data-cat]').forEach(c =>
    c.onclick = () => { state.selectedCategory = c.dataset.cat || null; render(); }
  );
  document.querySelectorAll('.game-card').forEach(card =>
    card.onclick = (e) => {
      if (e.target.dataset.fav) return; // não navega ao clicar no coração
      state.selectedGameId = +card.dataset.id;
      state.view = 'game';
      render();
    }
  );
  document.querySelectorAll('[data-fav]').forEach(b =>
    b.onclick = async (e) => {
      e.stopPropagation();
      const id = +b.dataset.fav;
      try {
        const r = await api(`/favorites/${id}`, { method: 'POST' });
        if (r.favorited) state.myFavorites.add(id); else state.myFavorites.delete(id);
        toast(r.favorited ? '♥ Adicionado aos favoritos' : '♡ Removido dos favoritos');
        b.classList.toggle('active', r.favorited);
        b.textContent = r.favorited ? '♥' : '♡';
      } catch (err) { toast(err.message, true); }
    }
  );
}

// ── Detalhe do jogo ────────────────────────────────────────────────────
async function loadGame() {
  const [game, reviews] = await Promise.all([
    api(`/games/${state.selectedGameId}`),
    api(`/reviews/game/${state.selectedGameId}`),
  ]);
  state.selectedGame = game;
  state.reviews = reviews;
  await loadMyFavorites();
}

function viewGameDetail() {
  const g = state.selectedGame;
  if (!g) return '<div class="empty">// jogo não encontrado //</div>';
  const fav = state.myFavorites.has(g.id);
  return `
    <button class="btn ghost" id="back-btn" style="margin-top:20px;">← Voltar</button>
    <div class="detail">
      <div class="cover" style="background-image: url('${escapeHtml(g.coverUrl || '')}')"></div>
      <div class="detail-info">
        <h1>${escapeHtml(g.title)}</h1>
        <div class="subtitle">
          ${escapeHtml(g.developer || '')}${g.publisher ? ' · ' + escapeHtml(g.publisher) : ''}
          ${g.releaseYear ? ' · ' + g.releaseYear : ''}
          ${g.category ? ' · <span style="color:var(--neon)">' + escapeHtml(g.category.name) + '</span>' : ''}
        </div>
        <div>${renderStars(g.avgRating || 0)} <span style="color:var(--text-faint);font-size:.85rem">(${g.reviewCount} avaliações)</span></div>
        <p class="description">${escapeHtml(g.description)}</p>
        <div class="detail-actions">
          <span class="price ${+g.price === 0 ? 'free' : ''}" style="margin-right:auto;font-size:1.6rem">${+g.price === 0 ? 'FREE' : 'R$' + (+g.price).toFixed(2)}</span>
          <button class="btn ${fav ? 'primary' : ''}" id="fav-toggle">${fav ? '♥ Favoritado' : '♡ Favoritar'}</button>
        </div>

        <div class="review-form">
          <h3 style="margin-bottom:12px;color:var(--neon)">Deixe sua avaliação</h3>
          <div class="star-picker" id="star-picker">
            ${[1,2,3,4,5].map(i => `<span data-r="${i}">☆</span>`).join('')}
          </div>
          <textarea class="textarea" id="review-comment" placeholder="Conte o que você achou..."></textarea>
          <button class="btn primary" id="submit-review" style="margin-top:12px">▶ Publicar avaliação</button>
        </div>

        <div class="section-title"><h2>Comunidade</h2><small>${state.reviews.length} avaliações</small></div>
        ${state.reviews.length === 0
          ? '<div class="empty" style="padding:20px">// ainda sem avaliações //</div>'
          : state.reviews.map(r => `
            <div class="review">
              <div class="review-head">
                <span class="author">${escapeHtml(r.user?.username || '?')}</span>
                <span class="stars" style="font-size:.85rem">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
              </div>
              ${r.comment ? `<div class="comment">${escapeHtml(r.comment)}</div>` : ''}
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

function attachGameDetailEvents() {
  document.getElementById('back-btn').onclick = () => { state.view = 'catalog'; render(); };
  document.getElementById('fav-toggle').onclick = async () => {
    const id = state.selectedGame.id;
    try {
      const r = await api(`/favorites/${id}`, { method: 'POST' });
      if (r.favorited) state.myFavorites.add(id); else state.myFavorites.delete(id);
      toast(r.favorited ? '♥ Favoritado' : '♡ Removido');
      render();
    } catch (err) { toast(err.message, true); }
  };

  let chosenRating = 0;
  const stars = document.querySelectorAll('#star-picker span');
  stars.forEach((s, i) => {
    s.onclick = () => {
      chosenRating = i + 1;
      stars.forEach((sx, j) => {
        sx.classList.toggle('lit', j < chosenRating);
        sx.textContent = j < chosenRating ? '★' : '☆';
      });
    };
  });

  document.getElementById('submit-review').onclick = async () => {
    if (!chosenRating) return toast('Escolha de 1 a 5 estrelas', true);
    const comment = document.getElementById('review-comment').value.trim();
    try {
      await api(`/reviews/game/${state.selectedGame.id}`, {
        method: 'POST',
        body: JSON.stringify({ rating: chosenRating, comment: comment || null }),
      });
      toast('✓ Avaliação publicada');
      render();
    } catch (err) { toast(err.message, true); }
  };
}

// ── Admin ──────────────────────────────────────────────────────────────
async function loadAdmin() {
  if (state.adminTab === 'dashboard') {
    state.adminData = await api('/admin/dashboard');
  } else if (state.adminTab === 'users') {
    state.adminUsers = await api('/admin/users');
  } else if (state.adminTab === 'games' || state.adminTab === 'categories') {
    if (state.categories.length === 0) state.categories = await api('/categories');
    if (state.games.length === 0) state.games = await api('/games');
  }
}

function viewAdmin() {
  const tab = state.adminTab;
  return `
    <section class="hero" style="padding-top:48px">
      <h1>Painel <span>admin</span></h1>
      <p>Gerenciamento do GameVault.</p>
    </section>
    <div class="filters" style="margin-bottom:32px">
      ${['dashboard','users','games','categories'].map(t => `
        <button class="chip ${tab === t ? 'active' : ''}" data-tab="${t}">${t.toUpperCase()}</button>
      `).join('')}
    </div>
    ${tab === 'dashboard'  ? viewAdminDashboard()  : ''}
    ${tab === 'users'      ? viewAdminUsers()      : ''}
    ${tab === 'games'      ? viewAdminGames()      : ''}
    ${tab === 'categories' ? viewAdminCategories() : ''}
  `;
}

function viewAdminDashboard() {
  const d = state.adminData || {};
  return `
    <div class="admin-grid">
      <div class="stat"><div class="label">Usuários</div><div class="value">${d.totalUsers ?? 0}</div></div>
      <div class="stat"><div class="label">Jogos</div><div class="value">${d.totalGames ?? 0}</div></div>
      <div class="stat"><div class="label">Categorias</div><div class="value">${d.totalCategories ?? 0}</div></div>
      <div class="stat"><div class="label">Avaliações</div><div class="value">${d.totalReviews ?? 0}</div></div>
      <div class="stat"><div class="label">Favoritos</div><div class="value">${d.totalFavorites ?? 0}</div></div>
    </div>
    <div class="section-title"><h2>Top 5 mais favoritados</h2></div>
    ${d.topGames?.length ? `
      <table>
        <thead><tr><th>#</th><th>Jogo</th><th>Favoritos</th></tr></thead>
        <tbody>${d.topGames.map((g,i) => `
          <tr><td>${i+1}</td><td>${escapeHtml(g.title)}</td><td>${g.favorites}</td></tr>
        `).join('')}</tbody>
      </table>` : '<div class="empty">// ainda sem favoritos //</div>'
    }
  `;
}

function viewAdminUsers() {
  return `
    <table>
      <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${state.adminUsers.map(u => `
        <tr>
          <td>${u.id}</td>
          <td>${escapeHtml(u.username)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge ${u.role}">${u.role}</span></td>
          <td><span class="badge ${u.status}">${u.status}</span></td>
          <td>
            ${u.role === 'admin' ? '<span style="color:var(--text-faint)">—</span>' : `
              <select class="select" style="display:inline-block;width:auto;" data-id="${u.id}">
                <option value="ativo"    ${u.status === 'ativo' ? 'selected' : ''}>ativo</option>
                <option value="suspenso" ${u.status === 'suspenso' ? 'selected' : ''}>suspenso</option>
                <option value="banido"   ${u.status === 'banido' ? 'selected' : ''}>banido</option>
              </select>
            `}
          </td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

function viewAdminGames() {
  return `
    <div style="margin-bottom:16px"><button class="btn primary" id="new-game-btn">+ Novo jogo</button></div>
    <table>
      <thead><tr><th>Título</th><th>Categoria</th><th>Ano</th><th>Preço</th><th>Ações</th></tr></thead>
      <tbody>${state.games.map(g => `
        <tr>
          <td>${escapeHtml(g.title)}</td>
          <td>${escapeHtml(g.category?.name || '')}</td>
          <td>${g.releaseYear || '—'}</td>
          <td>R$ ${(+g.price).toFixed(2)}</td>
          <td><button class="btn danger" data-del-game="${g.id}" style="padding:4px 10px;font-size:.85rem">Excluir</button></td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

function viewAdminCategories() {
  return `
    <div style="margin-bottom:16px">
      <input class="input" id="new-cat-name" placeholder="Nome da nova categoria" style="max-width:300px;display:inline-block;margin-right:8px">
      <button class="btn primary" id="new-cat-btn">+ Criar</button>
    </div>
    <table>
      <thead><tr><th>ID</th><th>Nome</th><th>Slug</th><th>Ícone</th></tr></thead>
      <tbody>${state.categories.map(c => `
        <tr><td>${c.id}</td><td>${escapeHtml(c.name)}</td><td><code>${c.slug}</code></td><td>${c.icon || '—'}</td></tr>
      `).join('')}</tbody>
    </table>
  `;
}

function attachAdminEvents() {
  document.querySelectorAll('.chip[data-tab]').forEach(c =>
    c.onclick = () => { state.adminTab = c.dataset.tab; state.games = []; state.categories = []; render(); }
  );

  // Mudar status de usuários
  document.querySelectorAll('select[data-id]').forEach(s =>
    s.onchange = async (e) => {
      try {
        await api(`/admin/users/${s.dataset.id}/status`, {
          method: 'PUT', body: JSON.stringify({ status: e.target.value }),
        });
        toast('✓ Status atualizado');
      } catch (err) { toast(err.message, true); render(); }
    }
  );

  // Novo jogo
  const newBtn = document.getElementById('new-game-btn');
  if (newBtn) newBtn.onclick = () => showNewGameModal();

  document.querySelectorAll('[data-del-game]').forEach(b =>
    b.onclick = async () => {
      if (!confirm('Remover este jogo?')) return;
      try {
        await api(`/games/${b.dataset.delGame}`, { method: 'DELETE' });
        toast('✓ Jogo removido');
        state.games = []; render();
      } catch (err) { toast(err.message, true); }
    }
  );

  // Nova categoria
  const newCatBtn = document.getElementById('new-cat-btn');
  if (newCatBtn) newCatBtn.onclick = async () => {
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return toast('Informe o nome', true);
    try {
      await api('/categories', { method: 'POST', body: JSON.stringify({ name }) });
      toast('✓ Categoria criada');
      state.categories = []; render();
    } catch (err) { toast(err.message, true); }
  };
}

function showNewGameModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Novo jogo</h2>
      <form id="new-game-form">
        <div class="field"><label class="label">Título</label><input class="input" name="title" required></div>
        <div class="field"><label class="label">Descrição</label><textarea class="textarea" name="description" required></textarea></div>
        <div class="field"><label class="label">Categoria</label>
          <select class="select" name="categoryId" required>
            <option value="">Selecione...</option>
            ${state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label class="label">Desenvolvedora</label><input class="input" name="developer"></div>
        <div class="field"><label class="label">Ano</label><input class="input" type="number" name="releaseYear" min="1970" max="2100"></div>
        <div class="field"><label class="label">Preço (R$)</label><input class="input" type="number" name="price" step="0.01" min="0" value="0"></div>
        <div class="field"><label class="label">URL da capa</label><input class="input" name="coverUrl" placeholder="https://..."></div>
        <div class="modal-actions">
          <button type="button" class="btn ghost" id="cancel-new">Cancelar</button>
          <button type="submit" class="btn primary">▶ Criar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('cancel-new').onclick = () => overlay.remove();
  document.getElementById('new-game-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.categoryId = +data.categoryId;
    data.releaseYear = data.releaseYear ? +data.releaseYear : null;
    data.price = +(data.price || 0);
    try {
      await api('/games', { method: 'POST', body: JSON.stringify(data) });
      toast('✓ Jogo criado');
      overlay.remove();
      state.games = []; render();
    } catch (err) { toast(err.message, true); }
  };
}

// ── Boot ───────────────────────────────────────────────────────────────
render();
