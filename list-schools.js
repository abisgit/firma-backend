const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query('SELECT id, name, type, "industryType" FROM "Organization"');
        for (let org of res.rows) {
            if (org.type === 'EDUCATION' || org.industryType === 'EDUCATION' || org.name.toLowerCase().includes('school')) {
                const resSchool = await client.query('SELECT id FROM "School" WHERE "organizationId" = $1', [org.id]);
                console.log(`Org: ${org.name} | Type: ${org.type} | Industry: ${org.industryType} | School Profile: ${resSchool.rowCount > 0 ? "OK" : "MISSING"}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
