/**
 * Ponto de entrada do servidor GameVault.
 * - Sincroniza models com o banco
 * - Sobe a aplicação Express na porta configurada
 */
import createApp from './app.js';
import { sequelize } from './models/index.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco conectado.');
    await sequelize.sync();
    console.log('✅ Models sincronizados.');

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`\n🎮 GameVault rodando em http://localhost:${PORT}`);
      console.log(`   API:      http://localhost:${PORT}/api`);
      console.log(`   Frontend: http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar:', err.message);
    process.exit(1);
  }
}

start();
