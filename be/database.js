const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function openDb() {
  return open({
    filename: './farm.db',
    driver: sqlite3.Database
  });
}

async function initDb() {
  const db = await openDb();
  // Tạo bảng nếu chưa có
  await db.exec(`
    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      start_date TEXT,
      area REAL,
      n_index REAL,
      p_index REAL,
      k_index REAL,
      expected_yield TEXT, 
      ai_prediction TEXT
    )
  `);
  return db;
}

initDb(); // Chạy khởi tạo ngay khi server bật

module.exports = openDb;