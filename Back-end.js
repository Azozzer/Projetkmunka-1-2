const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const session = require('express-session');

// Express alkalmazás létrehozása
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Statikus fájlok kiszolgálása
app.use(express.static(path.join(__dirname, 'public')));

// Beállítjuk a session-t
app.use(session({
    secret: 'szetf_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }
}));

// Nodemailer konfiguráció
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'szetf.help@gmail.com',
        pass: 'gykk tapx bxff quhn'
    }
});

// Fájlok tárolása multerrel
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Adatbázis kapcsolat beállítása
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projectnew'
});

db.connect((err) => {
    if (err) console.error('Adatbázis kapcsolat hiba:', err);
    else console.log('Csatlakozás az adatbázishoz sikeres');
});

// Regisztráció végpont
app.post('/api/user/reg', async (req, res) => {
    const { username, email, password, confirm_password } = req.body;

    // Jelszavak ellenőrzése
    if (password !== confirm_password) {
        return res.status(400).json({ message: 'A jelszavak nem egyeznek.' });
    }

    try {
        // Ellenőrizzük, hogy az email cím már regisztrálva van-e
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Ez az e-mail cím már regisztrálva van.' });
        }

        // Új felhasználó hozzáadása az adatbázishoz
        await db.promise().query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, password, 'user']);

        // Email elküldése a felhasználónak
        const mailOptions = {
            from: 'szetf.help@gmail.com',
            to: email,
            subject: 'Sikeres regisztráció',
            html: `
                <h1>Kedves ${username}!</h1>
                <p>Köszönjük, hogy regisztráltál a Széchenyi István Egyetem tanulmányi fórumára!</p>
                <p>Bármilyen probléma esetén írj nekünk a szetf.help@gmail.com címre!</p>
                <p>Üdvözlettel,<br>SZETF Csapata</p>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Hiba az email küldése során:', err);
                return res.status(500).json({ message: 'A regisztráció sikerült, de az email küldése nem.' });
            }
            console.log('Email sikeresen elküldve:', info.response);
            res.status(201).json({ message: 'Sikeres regisztráció! Az email elküldve.' });
        });

    } catch (error) {
        console.error('Hiba a regisztráció során:', error);
        res.status(500).json({ message: 'Hiba történt a regisztráció során.' });
    }
});

// Jelszó emlékeztető küldése
app.post('/api/reminder', async (req, res) => {
    const { email } = req.body;

    try {
        // Ellenőrizzük, hogy létezik-e a felhasználó az adott e-maillel
        const [user] = await db.promise().query('SELECT username, password FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'A megadott e-mail cím nem található.' });
        }

        const { username, password } = user[0];

        // Email küldése a jelszóval
        const mailOptions = {
            from: 'szetf.help@gmail.com',
            to: email,
            subject: 'Jelszó emlékeztető',
            html: `
                <h1>Kedves ${username}!</h1>
                <p>A fiókodhoz tartozó jelszó: <strong>${password}</strong></p>
                <p>Üdvözlettel,<br>SZETF Csapata</p>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Hiba az email küldése során:', err);
                return res.status(500).json({ message: 'Hiba történt az email küldése során.' });
            }
            console.log('Email sikeresen elküldve:', info.response);
            res.status(200).json({ message: 'A jelszó emlékeztető email sikeresen elküldve.' });
        });
    } catch (error) {
        console.error('Hiba a jelszó emlékeztető során:', error);
        res.status(500).json({ message: 'Hiba történt a jelszó emlékeztető során.' });
    }
});


// Bejelentkezés végpont
app.post('/api/user/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.promise().query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó.' });
        }
        res.status(200).json({ message: 'Sikeres bejelentkezés!', user: users[0] });
    } catch (error) {
        console.error('Hiba a bejelentkezés során:', error);
        res.status(500).json({ message: 'Hiba történt a bejelentkezés során.' });
    }
});

// Új téma létrehozása
app.post('/api/targyak', upload.single('file'), async (req, res) => {
    const { temaNev, leiras } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await db.promise().query('INSERT INTO targyak (title, description, file) VALUES (?, ?, ?)', [temaNev, leiras, filePath]);
        res.status(201).json({ message: 'Téma sikeresen létrehozva!' });
    } catch (error) {
        console.error('Hiba a téma létrehozása során:', error);
        res.status(500).json({ message: 'Hiba történt a téma létrehozása során.' });
    }
});

// Keresési végpont témákhoz
app.get('/api/topics/search', async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ message: 'Keresési kifejezés hiányzik.' });
    }

    try {
        // SQL lekérdezés a címek keresésére
        const [results] = await db.promise().query(
            'SELECT id, title FROM targyak WHERE title LIKE ?',
            [`%${query}%`]
        );

        res.status(200).json(results);
    } catch (error) {
        console.error('Hiba a keresési lekérdezés során:', error);
        res.status(500).json({ message: 'Hiba történt a keresés során.' });
    }
});


// Témák listázása
app.get('/api/topics', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT id, title AS tema_name FROM targyak');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Hiba a témák lekérése során:', error);
        res.status(500).json({ message: 'Hiba történt a témák lekérése során.' });
    }
});

// Téma részleteinek lekérése
app.get('/api/topic/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.promise().query('SELECT * FROM targyak WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Téma nem található.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Hiba a téma részleteinek lekérése során:', error);
        res.status(500).json({ message: 'Hiba történt a téma részleteinek lekérése során.' });
    }
});

// Szerver indítása
const PORT = 5001;
app.listen(PORT, () => console.log(`A szerver fut a ${PORT} porton.`));


const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
});
