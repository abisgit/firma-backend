const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const id = 'ae0efebc-6c96-466f-9c9f-161dc5b7a3c0';
        const res = await client.query("SELECT * FROM \"RegistrationRequest\" WHERE id = $1;", [id]);
        const request = res.rows[0];
        console.log('Request orgCode:', request.orgCode);
        console.log('Request officialEmail:', request.officialEmail);

        const resOrg = await client.query("SELECT id FROM \"Organization\" WHERE code = $1;", [request.orgCode]);
        console.log('Existing Org count:', resOrg.rowCount);

        const resUser = await client.query("SELECT id FROM \"User\" WHERE email = $1;", [request.officialEmail]);
        console.log('Existing User count:', resUser.rowCount);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
