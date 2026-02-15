"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
async function testConnection() {
    try {
        console.log("Testing database connection...");
        const res = await (0, db_1.query)('SELECT NOW() as now');
        console.log("Database Connection Successful!", res.rows[0]);
        process.exit(0);
    }
    catch (error) {
        console.error("Database Connection Failed:", error);
        process.exit(1);
    }
}
testConnection();
