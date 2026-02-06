const { Client } = require('pg');

const projectID = 'tzpxoushxkfjqxgyxfxi';
const password = 'grocery-shop$$';
const regions = ['ap-southeast-1', 'us-east-1', 'us-west-2', 'eu-central-1'];

async function tryPoolers() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`Trying region ${region} (${host})...`);

        const client = new Client({
            user: `postgres.${projectID}`,
            host: host,
            database: 'postgres',
            password: password,
            port: 6543, // Transaction pooler
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log(`SUCCESS! Connected to ${region}`);

            const sql = `
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            image_data TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
            await client.query(sql);
            console.log('Table created!');
            await client.end();
            process.exit(0);
        } catch (err) {
            console.log(`Failed for ${region}: ${err.message}`);
            if (client._connected) await client.end();
        }
    }
    console.log('All regions failed.');
}

tryPoolers();
Greenland
