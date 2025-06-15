const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.init();
            }
        });
    }

    init() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                birth_date TEXT NOT NULL,
                month TEXT NOT NULL,
                qr_image_path TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createTableSQL, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Tickets table ready');
            }
        });
    }

    insertTicket(data) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO tickets (id, user_id, first_name, last_name, birth_date, month, qr_image_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                data.id,
                data.userId,
                data.firstName,
                data.lastName,
                data.birthDate,
                data.month,
                data.qrImagePath
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    getTicket(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tickets WHERE id = ?`;
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
    getAllTickets() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tickets ORDER BY created_at DESC`;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error getting all tickets:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }
    deleteTicket(ticketId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM tickets WHERE id = ?`;
            
            this.db.run(sql, [ticketId], function(err) {
                if (err) {
                    console.error('Error deleting ticket:', err);
                    reject(err);
                } else {
                    console.log(`Ticket deleted from database: ${ticketId}`);
                    resolve(this.changes > 0);
                }
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
    
}

module.exports = new Database();