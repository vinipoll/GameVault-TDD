# Relatório Técnico de Implementação N3 — GameVault

**Projeto:** GameVault — Catálogo de Jogos Digitais  
**Tecnologias:** Node.js · Express · Sequelize · Vitest · Supertest  
**Funcionalidade Desenvolvida:** Biblioteca de Jogos Pessoais (`Library`) com TDD

**Alunos Envolvidos no projeto:** Vinicius Pollnow Fernandes e Lucas Gabriel Scheibe

---

## 1. Descrição da Funcionalidade e Regras de Negócio

A nova funcionalidade de **Biblioteca de Jogos (Library)** permite que cada usuário gerencie sua coleção pessoal de jogos adquiridos, acompanhando o seu progresso de jogatina, tempo dedicado e valor investido.

### Regras de Negócio

#### 1. Adicionar Jogo à Biblioteca (`POST /api/library`)
- O usuário deve estar autenticado.
- O campo `gameId` é obrigatório. Caso ausente, o sistema retorna erro `400` ("gameId é obrigatório.").
- O jogo especificado deve existir no sistema. Caso contrário, retorna erro `404` ("Jogo não encontrado.").
- Um usuário não pode adicionar o mesmo jogo mais de uma vez em sua biblioteca. Tentativas de duplicidade resultam em erro `409` ("Jogo já está na sua biblioteca.").
- As propriedades `playTime` (tempo jogado) e `purchasePrice` (preço pago) devem ser maiores ou iguais a zero. Caso sejam negativos, o Sequelize impede a validação (erro `400`).
- O status do progresso do jogo deve ser obrigatoriamente um dos seguintes: `['nao_iniciado', 'jogando', 'zerado', 'abandonado']`. Valores fora dessa lista retornam erro `400`.

#### 2. Listar Biblioteca (`GET /api/library`)
- Retorna todos os jogos na biblioteca do usuário logado.
- Suporta filtragem opcional pelo parâmetro de busca `status` na query string (ex: `GET /api/library?status=jogando`).
- Os dados retornados incluem o objeto do jogo associado (`Game`).

#### 3. Atualizar Progresso (`PATCH /api/library/:gameId`)
- Permite alterar o progresso (`status`, `playTime`, `purchasePrice`, `notes`).
- Valida se o jogo de fato pertence à biblioteca do usuário. Caso não seja encontrado, retorna erro `404` ("Jogo não encontrado na sua biblioteca.").

#### 4. Remover Jogo (`DELETE /api/library/:gameId`)
- Remove a entrada de biblioteca do usuário.
- Retorna `404` se o jogo não constar na biblioteca do usuário.

#### 5. Estatísticas Consolidadas (`GET /api/library/stats`)
- Retorna um painel de dados analíticos do usuário logado contendo:
  - `totalGames`: quantidade total de jogos da biblioteca.
  - `totalPlayTime`: soma total das horas jogadas.
  - `totalSpent`: valor financeiro total investido (soma de `purchasePrice`).
  - `byStatus`: contagem de jogos distribuída em cada um dos quatro status disponíveis.

---

## 2. Aplicação do TDD (Ciclo Red-Green-Refactor)

O desenvolvimento desta funcionalidade seguiu estritamente o ciclo clássico do Desenvolvimento Guiado por Testes:

### 1. 🔴 Red (Escrever Testes que Falham)
Antes de criar qualquer arquivo de lógica de produção ou modificar arquivos existentes, foram criados os testes unitários da camada de dados (`library.model.test.js`), do serviço (`library.service.test.js`), do controlador (`library.controller.test.js`) e as rotas de integração (`library.routes.test.js`). 
Ao rodar `npm test`, as importações falharam e os testes quebraram (12 falhas no Supertest, 14 falhas unitárias), sinalizando que o comportamento desejado estava documentado, mas não implementado.

### 2. 🟢 Green (Escrever o Mínimo de Código para Passar)
Com a quebra dos testes documentada, os componentes foram implementados em etapas:
- O model `Library` foi criado com suas devidas restrições e registrado no `index.js` dos models.
- O `LibraryService` foi criado e preenchido com lógica mínima para tratar as consultas e erros `404` e `409`.
- O `LibraryController` foi montado para repassar os dados corretos ao serviço e tratar as respostas.
- O roteador de biblioteca foi criado e acoplado no `app.js`.
Após essas criações, `npm test` foi executado e todos os testes passaram com sucesso.

### 3. 🔵 Refactor (Refatoração de Código)
Com 100% dos testes verdes, melhorou-se a legibilidade de códigos específicos:
- Na agregação de estatísticas no `LibraryService.getStats`, o total financeiro gasto (`totalSpent`) foi convertido estritamente usando `+stats.totalSpent.toFixed(2)` para assegurar precisão de ponto flutuante e consistência no retorno JSON.
- A validação manual do `gameId` foi movida para o topo do fluxo no `LibraryService.add`, evitando consultas redundantes no banco de dados.

---

## 3. Explicação Detalhada dos Testes Desenvolvidos

### Testes Unitários

#### Teste Unitário 1 — Validação de Enum de Status no Model
- **Arquivo:** [library.model.test.js](file:///c:/Users/vinipoll/Downloads/GameVault%20(1)/GameVault/src/modules/library/__tests__/library.model.test.js)
- **O que verifica:** Garante que o Sequelize rejeite tentativas de instanciar entradas com status inválidos (que não estejam no enum `['nao_iniciado', 'jogando', 'zerado', 'abandonado']`).
- **Mock Utilizado:** Nenhum. A validação é testada usando `Library.build()` diretamente com campos inválidos.
- **Asserção Aplicada:**
  ```javascript
  await expect(entry.validate()).rejects.toThrow();
  ```

#### Teste Unitário 2 — Bloqueio de Jogos Duplicados no Service
- **Arquivo:** [library.service.test.js]
- **O que verifica:** Verifica se o método `LibraryService.add()` rejeita a inserção caso o registro da dupla `userId` e `gameId` já exista na base de dados.
- **Mock Utilizado:** O model `Library.findOne` é mockado via Vitest para retornar um objeto preenchido, simulando o registro existente.
- **Asserção Aplicada:**
  ```javascript
  await expect(
    LibraryService.add(1, { gameId: 5 })
  ).rejects.toMatchObject({ status: 409, message: 'Jogo já está na sua biblioteca.' });
  ```

#### Teste Unitário 3 — Retorno com Status 201 no Controller
- **Arquivo:** [library.controller.test.js]
- **O que verifica:** Assegura que, ao adicionar um jogo com sucesso, o `LibraryController.addToLibrary` execute corretamente a chamada ao serviço e envie a resposta com o código de status HTTP `201 (Created)`.
- **Mock Utilizado:** `LibraryService.add` mockado para retornar o registro criado. Mock dos objetos `req` (com dados do corpo) e `res` (espiando as chamadas de status e json).
- **Asserção Aplicada:**
  ```javascript
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(mockResult);
  ```

---

### Testes de Integração

#### Teste de Integração 1 — Bloqueio por Falta de Token
- **Arquivo:** [library.routes.test.js]
- **O que verifica:** Valida se a rota `POST /api/library` está adequadamente protegida pelo middleware de autenticação (`authMiddleware`), rejeitando requisições sem tokens na cabeçalho.
- **Mock Utilizado:** Mock de `LibraryService` para isolar a camada de serviço durante a chamada HTTP simulada do Supertest.
- **Asserção Aplicada:**
  ```javascript
  const res = await request(app).post('/api/library').send({ gameId: 5 });
  expect(res.status).toBe(401);
  ```

#### Teste de Integração 2 — Atualização de Detalhes da Biblioteca
- **Arquivo:** [library.routes.test.js]
- **O que verifica:** Testa a integração completa da rota `PATCH /api/library/:gameId`. Garante que dados válidos de atualização fornecidos pelo cliente resultem em status `200` e retornem o JSON com o objeto atualizado.
- **Mock Utilizado:** `LibraryService.update` é mockado para resolver a entrada modificada. É gerado e enviado um token JWT real no cabeçalho `Authorization` para passar pelo middleware.
- **Asserção Aplicada:**
  ```javascript
  const res = await request(app)
    .patch('/api/library/5')
    .set('Authorization', validToken)
    .send({ status: 'zerado', playTime: 20 });

  expect(res.status).toBe(200);
  expect(res.body).toEqual(mockUpdated);
  ```

---

## 4. Instruções para Rodar o Projeto e Testes

Para configurar o ambiente de desenvolvimento local e executar a bateria completa de testes, siga os passos abaixo:

### 1. Instalar as dependências
Certifique-se de que possui o [Node.js](https://nodejs.org/) instalado. Execute no terminal a partir da raiz do projeto:
```bash
npm install
```

### 2. Configurar o banco de dados (se executando o servidor de produção)
Copie o arquivo `.env.example` para `.env` e configure suas variáveis de conexão com o banco MySQL.
Em seguida, execute a criação do banco de dados:
```bash
cp .env.example .env
# Edite as credenciais MySQL no .env
node criar-banco.js
```

### 3. Rodar os testes (Unitários e de Integração)
Para rodar a bateria de testes e visualizar os resultados consolidados com o Vitest:
```bash
npm test
```

Para rodar em modo dinâmico (watch mode):
```bash
npm run test:watch
```
