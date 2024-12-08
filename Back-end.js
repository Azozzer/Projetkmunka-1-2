const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const session = require('express-session'); // express-session importálása

// Express alkalmazás létrehozása
const app = express();
app.use(bodyParser.json());

// Beállítjuk a session-t
app.use(session({
    secret: 'szetf_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true } // HttpOnly és Secure cookie beállítások
}));

// Nodemailer konfiguráció
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'szetf.help@gmail.com', // Gmail címed
        pass: 'gykk tapx bxff quhn' // App-specifikus jelszó (nem az email jelszavad!)
    }
});

// Fájlok tárolása
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Adatbázis kapcsolat beállítása
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Itt add meg a MySQL jelszavad
    database: 'projectnew' // Az adatbázis neve
});

// Csatlakozás az adatbázishoz
db.connect((err) => {
    if (err) {
        console.error('Adatbázis kapcsolat hiba:', err);
    } else {
        console.log('Csatlakozás az adatbázishoz sikeres');
    }
});

// Statikus fájlok kiszolgálása
app.use(express.static(path.join(__dirname, 'public')));

// Regisztráció végpont
app.post('/api/user/reg', async (req, res) => {
    const { username, email, password, confirm_password } = req.body;

    // Jelszavak ellenőrzése
    if (password !== confirm_password) {
        return res.status(400).json({ message: 'A jelszavak nem egyeznek.' });
    }

    try {
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Ez az e-mail cím már regisztrálva van.' });
        }

        // Felhasználó adatainak hozzáadása
        await db.promise().query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
            [username, email, password, 'user']);

        // Email küldése a felhasználónak
        const mailOptions = {
            from: 'szetf.help@gmail.com',
            to: email,
            subject: 'Sikeres regisztráció',
            html: `<h1>Kedves ${username}!</h1>
                   <p>Köszönjük, hogy regisztráltál a Széchenyi István Egyetem - Projektmunka feladatában fejlesztendő tanulmányi fórumra!
                   Kellemes időtöltést és jó tanulást kívánunk!
                   Amennyiben problémád adódna az oldallal bátran keress meg minket az email címünkön.</p>
                   <p>Üdvözlettel,<br>A SZETF Csapata</p>`
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
        res.status(500).json({ message: 'Hiba történt a regisztráció során' });
    }
});

// Bejelentkezés végpont
app.post('/api/user/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [userResult] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if (userResult.length === 0) {
            return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó.' });
        }

        // Jelszó egyszerű összehasonlítása
        if (password !== userResult[0].password) {
            return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó.' });
        }

        // Session tárolás
        req.session.user = {
            id: userResult[0].user_id,
            username: userResult[0].username,
            email: userResult[0].email,
            role: userResult[0].role
        };

        res.status(200).json({
            message: 'Sikeres bejelentkezés!',
            user: req.session.user
        });
    } catch (error) {
        console.error('Hiba a bejelentkezés során:', error);
        res.status(500).json({ message: 'Hiba történt a bejelentkezés során' });
    }
});

// Jelszó emlékeztető küldése
app.post('/api/user/reminder', async (req, res) => {
    const { email } = req.body;

    try {
        // Ellenőrizzük, hogy létezik-e a felhasználó
        const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'A megadott e-mail cím nem található.' });
        }

        // Email küldése a jelszóval
        const mailOptions = {
            from: 'szetf.help@gmail.com',
            to: email,
            subject: 'Jelszó emlékeztető',
            html: `<h1>Kedves ${username}!</h1>
                   <p>A kért jelszó-emlékeztető: <strong>${password}</strong></p>
                   <p>Üdvözlettel,<br>A SZETF Csapata</p>`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Hiba az email küldése során:', err);
                return res.status(500).json({ message: 'Hiba történt az email küldése során.' });
            }
            console.log('Email sikeresen elküldve:', info.response);
            res.status(200).json({ message: 'A jelszó-emlékeztető email sikeresen elküldve.' });
        });
    } catch (error) {
        console.error('Hiba a jelszó emlékeztető során:', error);
        res.status(500).json({ message: 'Hiba történt a jelszó emlékeztető során.' });
    }
});

// Profil lekérése felhasználó ID alapján
app.get('/api/user/profile/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Felhasználói adatok lekérése az adatbázisból
        const [userData] = await db.promise().query('SELECT * FROM users WHERE user_id = ?', [userId]);

        if (userData.length === 0) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }

        // Témák számának lekérése
        const [topicCountData] = await db.promise().query('SELECT COUNT(*) AS topicCount FROM topics WHERE user_id = ?', [userId]);

        // Hozzászólások számának lekérése
        const [commentCountData] = await db.promise().query('SELECT COUNT(*) AS commentCount FROM comments WHERE user_id = ?', [userId]);

        // Reputáció lekérése
        const [reputationData] = await db.promise().query('SELECT SUM(likes) - SUM(dislikes) AS reputation FROM reputation WHERE user_id = ?', [userId]);

        const user = userData[0];
        const topicCount = topicCountData[0].topicCount;
        const commentCount = commentCountData[0].commentCount;
        const reputation = reputationData[0] ? reputationData[0].reputation : 0; // Ha nincs reputáció, akkor 0

        res.status(200).json({
            user: {
                ...user,
                topicCount,
                commentCount,
                reputation
            }
        });
    } catch (error) {
        console.error('Hiba a profil adatainak lekérésekor:', error);
        res.status(500).json({ message: 'Hiba történt a profil adatainak lekérésekor' });
    }
});



// Karok lekérése
app.get('/api/faculties', async (req, res) => {
    try {
        const [faculties] = await db.promise().query('SELECT * FROM faculties');
        res.status(200).json(faculties);
    } catch (error) {
        console.error('Hiba a karok lekérése során:', error);
        res.status(500).json({ message: 'Hiba történt a karok lekérése során' });
    }
});

// Fájlok feltöltése
app.post('/api/files/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Fájl nem található.' });
    }

    const file = req.file;
    res.status(200).json({
        message: 'Fájl sikeresen feltöltve!',
        file: {
            filename: file.filename,
            path: file.path,
            url: `/uploads/${file.filename}`
        }
    });
});

// Kijelentkezés végpont
app.post('/api/user/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Hiba történt a kijelentkezés során' });
        }
        res.status(200).json({ message: 'Sikeres kijelentkezés' });
    });
});

// Szerver indítása
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`A szerver fut a ${PORT} porton`);
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
});
