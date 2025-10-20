const { DataSource } = require('typeorm');
require('reflect-metadata');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: ['dist/src/infrastructure/persistence/typeorm/*.js'],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false,
  logging: true,
});

module.exports = AppDataSource;