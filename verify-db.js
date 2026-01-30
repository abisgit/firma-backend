const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query("SELECT enum_range(NULL::\"Role\");");
        console.log('Role enum values:', res.rows[0].enum_range);

        const res2 = await client.query("SELECT id, \"orgName\", \"industryType\" FROM \"RegistrationRequest\" WHERE id = 'ae0efebc-6c96-466f-9c9f-161dc5b7a3c0';");
        console.log('Request Record:', res2.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
