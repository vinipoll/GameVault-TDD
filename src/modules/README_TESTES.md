# Testes — GameVault

Suíte automatizada com **Vitest** + **Supertest** seguindo TDD. Os testes ficam ao lado do código que testam, em pastas `__tests__/` dentro de cada módulo (como pedido pela disciplina).

> **TL;DR:** `npm install && npm test` → 91 testes em ~6 segundos.

---

## 1. Estrutura

```
src/modules/
├── auth/__tests__/
│   ├── auth.middleware.test.js   ← Middleware JWT (vi.fn para req/res/next)
│   └── auth.routes.test.js       ← Rotas com Supertest + models mockados
├── user/__tests__/
│   └── user.service.test.js      ← vi.mock + vi.spyOn(bcrypt)
├── game/__tests__/
│   ├── game.service.test.js      ← Cálculo de média e recomendação
│   └── game.routes.test.js       ← Rotas + autorização admin
├── category/__tests__/
│   └── category.service.test.js  ← Slugify e CRUD
├── favorite/__tests__/
│   └── favorite.service.test.js  ← Toggle idempotente
├── review/__tests__/
│   └── review.service.test.js    ← Upsert + autorização
└── admin/__tests__/
    └── admin.routes.test.js      ← Dashboard agregado
```

**9 suítes, 91 testes.** Sem dependência de banco real.

---

## 2. Como rodar

```bash
# Instalar (uma vez)
npm install

# Rodar tudo
npm test

# Modo watch (re-roda ao salvar)
npm run test:watch

# Cobertura
npm run test:coverage

# UI interativa do Vitest (abre no browser)
npm run test:ui
```

### Saída esperada

```
 ✓ src/modules/game/__tests__/game.routes.test.js  (17 tests)
 ✓ src/modules/user/__tests__/user.service.test.js  (14 tests)
 ✓ src/modules/auth/__tests__/auth.routes.test.js  (12 tests)
 ✓ src/modules/review/__tests__/review.service.test.js  (13 tests)
 ✓ src/modules/admin/__tests__/admin.routes.test.js  (8 tests)
 ✓ src/modules/game/__tests__/game.service.test.js  (8 tests)
 ✓ src/modules/category/__tests__/category.service.test.js  (8 tests)
 ✓ src/modules/auth/__tests__/auth.middleware.test.js  (6 tests)
 ✓ src/modules/favorite/__tests__/favorite.service.test.js  (5 tests)

 Test Files  9 passed (9)
      Tests  91 passed (91)
```

---

## 3. Ferramentas e configuração

Como solicitado pela disciplina:

- **Vitest** com `globals: true`, `environment: 'node'` (em `vitest.config.js`)
- **`setupFiles`** com mocks globais (em `vitest.setup.js`) — força `NODE_ENV=test` e silencia logs
- **Mocks**: `vi.fn()`, `vi.mock()`, `vi.spyOn()`
- **Supertest** para testes de integração HTTP
- **Sequelize** + **bcryptjs** no código de produção (testes mockam)

### Por que ESM?

`vi.mock()` não funciona corretamente com CommonJS no Vitest 1.6 — o hoisting do mock acontece em tempo de transformação, mas o `require()` ignora a substituição. **Por isso o projeto inteiro usa `"type": "module"`** no `package.json`. Toda importação usa `import ... from '...js'` com extensão explícita (requisito do Node.js ESM).

---

## 4. Como o mock dos models funciona

Os services dependem dos models Sequelize. Nos testes, substituímos o módulo inteiro:

```javascript
// No início do arquivo de teste
vi.mock('../../../models/index.js', () => ({
  User: {
    findOne:  vi.fn(),
    findByPk: vi.fn(),
    create:   vi.fn(),
  },
}));

import { User } from '../../../models/index.js';   // recebe o mock
import UserService from '../user.service.js';

it('retorna 404 quando usuário não existe', async () => {
  User.findByPk.mockResolvedValue(null);
  await expect(UserService.updateStatus(1, 'banido'))
    .rejects.toMatchObject({ status: 404 });
});
```

`vi.mock()` é **hoisted** — o Vitest move a chamada para o topo do arquivo automaticamente, antes dos `import`s. Por isso funciona mesmo escrito depois dos imports.

---

## 5. Os 3 tipos de teste presentes

### 5.1. Unidade pura (services)
Mockam todos os models. Verificam regras de negócio isoladas.
**Exemplo**: `tests/unit/user.service.test.js` valida que `register()` rejeita senhas curtas, hashea com bcrypt etc.

### 5.2. Unidade com `vi.spyOn`
Espionam funções de bibliotecas (bcrypt) para verificar chamadas sem trocar a implementação.
**Exemplo**: `expect(vi.spyOn(bcrypt, 'hash')).toHaveBeenCalledWith('senha123', 10)`.

### 5.3. Integração HTTP (Supertest)
Sobem a Express app inteira em memória, mockam só os models, fazem requisições reais e validam status + body.
**Exemplo**: `await request(app).post('/api/games').set('Authorization', ...).expect(403)`.

---

## 6. TDD aplicado

Cada regra de negócio do GameVault foi escrita seguindo o ciclo **Red → Green → Refactor**:

1. **Red**: escrever o teste que descreve o comportamento desejado e ver falhar.
2. **Green**: implementar o mínimo de código no service/rota para passar.
3. **Refactor**: limpar duplicação mantendo todos os testes verdes.

Exemplo concreto: o método `Tip.toggle()` foi expresso primeiro como dois testes ("favorita quando ainda não estava" e "desfavorita quando já estava") em `favorite.service.test.js`, depois implementado no `favorite.service.js`. O teste serve como **especificação executável**.

---

## 7. Cobertura atual

Após `npm run test:coverage`:

| Camada      | Linhas | Branches |
|-------------|-------:|---------:|
| Middleware  | 100 %  | 93 %     |
| Services    | ~90 %  | ~93 %    |
| Routes      | ~89 %  | ~78 %    |

Os models mostram 0% porque o `vi.mock` substitui o módulo inteiro — esperado. Para cobertura dos models reais, são necessários testes E2E com banco MySQL real (fora do escopo desta disciplina).

---

## 8. Adicionando um teste novo

Crie um arquivo `.test.js` em `src/modules/<feature>/__tests__/` e o Vitest pega automaticamente:

```javascript
vi.mock('../../../models/index.js', () => ({
  MyModel: { findAll: vi.fn() },
}));

import { MyModel } from '../../../models/index.js';
import MyService from '../my.service.js';

describe('MyService.list', () => {
  it('retorna lista vazia', async () => {
    MyModel.findAll.mockResolvedValue([]);
    expect(await MyService.list()).toEqual([]);
  });
});
```
