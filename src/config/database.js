/**
 * Configuração do Sequelize com MySQL.
 *
 * Nota: nos testes automatizados (Vitest), os models são mockados com
 * vi.mock(), de modo que esta conexão real não é estabelecida durante
 * a suíte. Em desenvolvimento e produção, requer MySQL rodando.
 */
import 'dotenv/config';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'gamevault',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    +(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  }
);

export default sequelize;
