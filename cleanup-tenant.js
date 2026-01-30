const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const email = 'aman@cruseschool.com';
        const code = 'SCH-1';
        const requestId = 'ae0efebc-6c96-466f-9c9f-161dc5b7a3c0';

        console.log('Cleaning up conflicting records...');

        // Delete users first (foreign key constraints)
        const delUser = await client.query("DELETE FROM \"User\" WHERE email = $1 RETURNING id;", [email]);
        console.log('Deleted Users:', delUser.rowCount);

        const delOrg = await client.query("DELETE FROM \"Organization\" WHERE code = $1 RETURNING id;", [code]);
        console.log('Deleted Orgs:', delOrg.rowCount);

        const resetReq = await client.query("UPDATE \"RegistrationRequest\" SET status = 'PENDING' WHERE id = $1;", [requestId]);
        console.log('Reset Request Status:', resetReq.rowCount);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
