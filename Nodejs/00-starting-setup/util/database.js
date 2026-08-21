const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: process.env.DATABASE_PORT,
    user: 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

module.exports = pool