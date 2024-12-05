const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Adatbázis kapcsolat
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '...', // Jelszó
    database: 'Database_1' // Adatbázis név
});

db.connect((err) => {
    if (err) {
        console.error('Adatbázis kapcsolat hiba:', err);
    } else {
        console.log('Csatlakozás az adatbázishoz sikeres');
    }
});

// Regisztráció végpont
app.post('/api/user/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Ellenőrzés, hogy létezik-e már az e-mail
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Ez az e-mail cím már regisztrálva van.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.promise().query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'user'] // Minden új felhasználó "user" szereppel indul
        );

        res.status(201).json({ message: 'Sikeres regisztráció!' });
    } catch (error) {
        console.error('Hiba a regisztráció során:', error);
        res.status(500).json({ message: 'Hiba történt a regisztráció során' });
    }
});

// Bejelentkezési végpont (minden felhasználóhoz kapcsolódó adatot visszaad)
app.post('/api/user/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Ellenőrizzük, hogy létezik-e az e-mail cím
        const [userResult] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (userResult.length === 0) {
            return res.status(401).json({ message: 'Hibás e-mail cím vagy jelszó.' });
        }

        const user = userResult[0];

        // Jelszó érvényesítése
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Hibás e-mail cím vagy jelszó.' });
        }

        // User kapott értékeléseinek a lekérése
        const [ratings] = await db.promise().query(
            'SELECT r.rating_id, r.rating, t.title FROM ratings r ' +
            'JOIN topics t ON r.topic_id = t.topic_id ' +
            'WHERE t.user_id = ?', [user.user_id]
        );

        // User adatok vissza adása
        res.status(200).json({
            message: 'Sikeres bejelentkezés!',
            user: {
                id: user.user_id,
                username: user.name,
                email: user.email,
                role: user.role,
                profile_picture: user.profile_picture,
                bio: user.bio,
                ratings: ratings
            }
        });
    } catch (error) {
        console.error('Hiba a bejelentkezés során:', error);
        res.status(500).json({ message: 'Hiba történt a bejelentkezés során' });
    }
});


// Keresési végpont
app.get('/api/topics', async (req, res) => {
    const searchQuery = req.query.q;

    try {
        const [topics] = await db.promise().query(
            'SELECT * FROM topics WHERE name LIKE ? OR description LIKE ?',
            [`%${searchQuery}%`, `%${searchQuery}%`]
        );
        res.status(200).json(topics);
    } catch (error) {
        console.error('Hiba a keresés során:', error);
        res.status(500).json({ message: 'Hiba történt a keresés során' });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
});
