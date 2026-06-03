# Relatório de TDD — GameVault

**Disciplina:** Test-Driven Development  
**Projeto:** GameVault — Catálogo de Jogos Digitais  
**Tecnologias:** Node.js · Express · Sequelize · Vitest

---

## 1. Funcionalidade Escolhida: Cadastro e Autenticação de Usuários (`UserService`)

A funcionalidade escolhida para demonstrar a aplicação de TDD foi o módulo de **usuários**, especificamente os métodos `register` e `authenticate` do `UserService`.

### Regras de Negócio

**Cadastro (`register`)**

- Os campos `username`, `email` e `password` são obrigatórios. Se algum estiver ausente, o sistema retorna erro `400`.
- A senha deve ter no mínimo 6 caracteres. Caso contrário, retorna erro `400`.
- Não é permitido cadastrar um `email` ou `username` que já existam no banco. Se já existir, retorna erro `409` (conflito).
- A senha nunca é salva em texto puro — ela é convertida em hash com `bcrypt` (fator 10) antes de ser gravada.
- A resposta nunca inclui o campo `passwordHash`. O método `sanitize()` garante isso.

**Autenticação (`authenticate`)**

- Se o e-mail não for encontrado no banco, retorna erro `401` (credenciais inválidas).
- Se a conta estiver com status `banido` ou `suspenso`, retorna erro `403` (acesso proibido).
- Se a senha informada não bater com o hash salvo, retorna erro `401`.
- Em caso de sucesso, retorna os dados do usuário **sem** o `passwordHash`.

---

## 2. Como o TDD foi Aplicado

O desenvolvimento seguiu o ciclo clássico **Red → Green → Refactor**:

**🔴 Red (Vermelho)**  
Antes de escrever qualquer código de produção, o teste foi criado descrevendo o comportamento esperado. Como o service ainda não existia (ou estava incompleto), o teste falhava — essa é a fase "vermelha", que confirma que o teste realmente detecta a ausência da funcionalidade.

**🟢 Green (Verde)**  
Com o teste falhando, foi implementado o mínimo de código necessário para fazê-lo passar. O objetivo aqui não é escrever código bonito, mas sim código funcional o suficiente para o teste ficar verde.

**🔵 Refactor (Refatoração)**  
Com o teste passando, o código foi limpo: remoção de duplicações, melhora na legibilidade, extração de funções auxiliares (como o `sanitize()`). Os testes continuam rodando durante essa etapa para garantir que nada quebrou.

**Exemplo prático no projeto:**  
O método `register()` foi construído assim: primeiro escreveu-se o teste que verifica a rejeição de senha curta (`status: 400`). O teste falhou. Depois foi adicionada a validação `if (password.length < 6)` no service. O teste passou. Na refatoração, a mensagem de erro foi padronizada junto com as demais validações.

---

## 3. Exemplos de Testes Unitários

Os testes ficam em `src/modules/user/__tests__/user.service.test.js` e usam `vi.mock()` para substituir o banco de dados por funções simuladas (`mocks`). Isso garante que os testes rodam sem precisar de MySQL e terminam em milissegundos.

---

### Teste 1 — Rejeitar senha muito curta

```javascript
it('falha (400) com senha < 6 caracteres', async () => {
  await expect(
    UserService.register({ username: 'x', email: 'x@x.com', password: '123' })
  ).rejects.toMatchObject({ status: 400 });
});
```

**O que verifica:**  
Que o `register()` lança um erro com `status: 400` quando a senha tem menos de 6 caracteres. Não chega nem a consultar o banco — a validação acontece antes. Isso protege contra senhas fracas demais.

---

### Teste 2 — Impedir cadastro duplicado

```javascript
it('falha (409) quando email ou username já existem', async () => {
  User.findOne.mockResolvedValue({ id: 1, email: 'x@x.com' });

  await expect(
    UserService.register({ username: 'x', email: 'x@x.com', password: '123456' })
  ).rejects.toMatchObject({ status: 409 });
});
```

**O que verifica:**  
Que o sistema recusa o cadastro quando já existe um usuário com o mesmo e-mail ou username. O `User.findOne` é simulado para retornar um usuário existente. O erro esperado é `409` (conflito). Sem esse teste, seria fácil criar contas duplicadas acidentalmente.

---

### Teste 3 — Bloquear login de conta banida

```javascript
it('falha (403) com conta banida', async () => {
  User.findOne.mockResolvedValue({ status: 'banido' });

  await expect(
    UserService.authenticate('x@x.com', 'qualquersenha')
  ).rejects.toMatchObject({ status: 403 });
});
```

**O que verifica:**  
Que um usuário com status `banido` não consegue fazer login, mesmo que a senha esteja correta. O mock retorna um usuário cujo `status` é `'banido'`, e o teste confirma que o service lança um erro `403` antes mesmo de verificar a senha. Isso garante que a regra de banimento é aplicada corretamente.

---

## Conclusão

A aplicação de TDD no GameVault tornou as regras de negócio explícitas desde o início do desenvolvimento. Cada validação — senha mínima, email duplicado, conta banida — tem um teste correspondente que documenta e protege esse comportamento. Com 91 testes passando em ~6 segundos, é possível modificar o código com segurança, sabendo que qualquer regressão será detectada imediatamente.
