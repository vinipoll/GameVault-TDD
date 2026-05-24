import 'dotenv/config';
import mysql from 'mysql2/promise';

async function criarBanco() {
    try {
        // Puxa as configurações direto do seu arquivo .env
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '' 
        });

        // Puxa o nome do banco do .env (caso não ache, usa 'gamevault_db' como padrão)
        const nomeBanco = process.env.DB_NAME || 'gamevault_db'; 

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${nomeBanco};`);
        
        console.log(`Banco '${nomeBanco}' criado com sucesso!`);
        await connection.end();
    } catch (error) {
        console.error('Erro ao criar o banco:', error.message);
    }
}

criarBanco();