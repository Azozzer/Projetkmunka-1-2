const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

// Express app létrehozása
const app = express();
app.use(bodyParser.json());

// Adatbázis kapcsolat beállítása
const db = mysql.createConnection(
{
    host: 'localhost',
    user: 'root',
    password: '...', // Add meg az adatbázis jelszavát
    database: 'Database_1' // Add meg az adatbázis nevét
});

// Csatlakozás az adatbázishoz
db.connect((err) => 
{
    if (err) {
        console.error('Adatbázis kapcsolat hiba:', err);
    } else {
        console.log('Csatlakozás az adatbázishoz sikeres');
    }
});

// Regisztráció végpont
app.post('/api/user/register', async (req, res) => 
{
    const { username, email, password } = req.body;

    try {
        // Ellenőrizzük, hogy van-e már ilyen e-mail
        const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length > 0) {
            return res.status(400).json({ message: 'Ez az e-mail cím már regisztrálva van.' });
        }

        // Jelszó hash-elése
        const hashedPassword = await bcrypt.hash(password, 10);

        // Új felhasználó mentése az adatbázisba
        await db.promise().query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        res.status(201).json({ message: 'Sikeres regisztráció!' });
    } catch (error) {
        console.error('Hiba a regisztráció során:', error);
        res.status(500).json({ message: 'Hiba történt a regisztráció során' });
    }
});

// Szerver indítása
const PORT = 5001;
app.listen(PORT, () => 
{
    console.log(`Szerver fut: http://localhost:${PORT}`);
});

