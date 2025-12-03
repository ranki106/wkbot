const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');


db.run(`ALTER TABLE apikeys ADD COLUMN ping_enabled INTEGER DEFAULT 1`, (err) => {
    if (err) {
        console.error("Error:", err.message);
    } else {
        console.log("Column added!");
    }
});

db.close();