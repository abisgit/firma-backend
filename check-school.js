const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const orgName = 'Cruse School';
        const res = await client.query("SELECT id FROM \"Organization\" WHERE name = $1;", [orgName]);
        if (res.rowCount > 0) {
            const orgId = res.rows[0].id;
            console.log('Org ID:', orgId);
            const resSchool = await client.query("SELECT id FROM \"School\" WHERE \"organizationId\" = $1;", [orgId]);
            console.log('School Record Found:', resSchool.rowCount > 0);
        } else {
            console.log('Org not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
