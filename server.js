import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE claims (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, name TEXT, phoneNumber TEXT, orderNumber TEXT, returnAddress TEXT, brand TEXT, problem TEXT)");
});

// API routes
app.post('/api/claims', (req, res) => {
  console.log('Received claim submission:', req.body);
  const { email, name, phoneNumber, orderNumber, returnAddress, brand, problem } = req.body;
  const stmt = db.prepare("INSERT INTO claims (email, name, phoneNumber, orderNumber, returnAddress, brand, problem) VALUES (?, ?, ?, ?, ?, ?, ?)");
  stmt.run([email, name, phoneNumber, orderNumber, returnAddress, brand, problem], function(err) {
    if (err) {
      console.error('Error inserting claim:', err);
      return res.status(500).json({ error: 'Failed to submit claim' });
    }
    console.log('Claim submitted successfully, ID:', this.lastID);
    res.json({ claimNumber: this.lastID });
  });
  stmt.finalize();
});

app.get('/api/claims', (req, res) => {
  console.log('Fetching claims');
  db.all("SELECT * FROM claims", (err, rows) => {
    if (err) {
      console.error('Error fetching claims:', err);
      return res.status(500).json({ error: 'Failed to fetch claims' });
    }
    console.log('Claims fetched:', rows);
    res.json(rows);
  });
});

// Serve static files from the React app
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});