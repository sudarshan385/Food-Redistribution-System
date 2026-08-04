const pool = require("./config/db");

async function testDatabase() {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("✅ Database Connected");
        console.log(result.rows[0]);
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await pool.end();
    }
}

testDatabase();