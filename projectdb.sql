-- 1. Karok táblája - Egyetemi karok adatait tárolja
CREATE TABLE faculties (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY, -- Egyedi azonosító minden karnak
    faculty_name VARCHAR(100) NOT NULL,        -- Kar neve
    description TEXT                           -- Kar leírása (opcionális)
);

-- 2. Szakok táblája - Egyetemi szakok adatait tárolja, karokhoz kapcsolódik
CREATE TABLE majors (
    major_id INT AUTO_INCREMENT PRIMARY KEY,   -- Egyedi azonosító minden szaknak
    faculty_id INT NOT NULL,                   -- Kapcsolat a kar táblához (faculty_id)
    major_name VARCHAR(100) NOT NULL,          -- Szak neve
    description TEXT,                          -- Szak leírása (opcionális)
    FOREIGN KEY (faculty_id) REFERENCES faculties(faculty_id) -- Külső kulcs a kar táblára
);

-- 3. Felhasználók táblája - Felhasználói fiókok adatait tárolja
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,      -- Egyedi azonosító minden felhasználónak
    name VARCHAR(100) NOT NULL,                  -- Felhasználó neve
    email VARCHAR(100) UNIQUE NOT NULL,          -- Felhasználó e-mail címe (egyedi)
    password_hash VARCHAR(255) NOT NULL,         -- Felhasználó jelszavának hash-elt változata
    role ENUM('hallgató', 'oktató', 'tanársegéd') DEFAULT 'hallgató', -- Felhasználó szerepe
    profile_picture VARCHAR(255),                -- Felhasználó profilképe (opcionális)
    bio TEXT,                                    -- Rövid bemutatkozás (opcionális)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fiók létrehozásának dátuma
);

-- 4. Tantárgyak táblája - Szakokhoz kapcsolódó tantárgyak adatait tárolja
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,  -- Egyedi azonosító minden tantárgynak
    major_id INT NOT NULL,                     -- Kapcsolat a szak táblához (major_id)
    course_name VARCHAR(100) NOT NULL,         -- Tantárgy neve
    description TEXT,                          -- Tantárgy leírása (opcionális)
    created_by INT,                            -- Tantárgyat létrehozó felhasználó azonosítója
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Létrehozás dátuma
    FOREIGN KEY (major_id) REFERENCES majors(major_id), -- Külső kulcs a szak táblára
    FOREIGN KEY (created_by) REFERENCES users(user_id)  -- Külső kulcs a felhasználó táblára
);

-- 5. Témák táblája - Tantárgyakhoz tartozó témák, jegyzetek adatait tárolja
CREATE TABLE topics (
    topic_id INT AUTO_INCREMENT PRIMARY KEY,  -- Egyedi azonosító minden témának
    course_id INT NOT NULL,                   -- Kapcsolat a tantárgy táblához (course_id)
    user_id INT NOT NULL,                     -- Téma létrehozó felhasználó azonosítója
    title VARCHAR(255) NOT NULL,              -- Téma címe
    description TEXT,                         -- Téma leírása
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Létrehozás dátuma
    FOREIGN KEY (course_id) REFERENCES courses(course_id), -- Külső kulcs a tantárgy táblára
    FOREIGN KEY (user_id) REFERENCES users(user_id)       -- Külső kulcs a felhasználó táblára
);

-- 6. Kommentek táblája - Témákhoz írt kommenteket tárolja
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY, -- Egyedi azonosító minden kommenthez
    topic_id INT NOT NULL,                     -- Kapcsolat a téma táblához (topic_id)
    user_id INT NOT NULL,                      -- Kommentet író felhasználó azonosítója
    content TEXT NOT NULL,                     -- Komment tartalma
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Létrehozás dátuma
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id), -- Külső kulcs a téma táblára
    FOREIGN KEY (user_id) REFERENCES users(user_id)    -- Külső kulcs a felhasználó táblára
);

-- 7. Értékelések táblája - Témák értékeléseit tárolja
CREATE TABLE ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY, -- Egyedi azonosító minden értékeléshez
    topic_id INT NOT NULL,                    -- Kapcsolat a téma táblához (topic_id)
    user_id INT NOT NULL,                     -- Értékelést adó felhasználó azonosítója
    rating ENUM('pozitív', 'negatív') NOT NULL, -- Értékelés típusa (pozitív vagy negatív)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Értékelés létrehozásának dátuma
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id), -- Külső kulcs a téma táblára
    FOREIGN KEY (user_id) REFERENCES users(user_id)    -- Külső kulcs a felhasználó táblára
);

-- 8. Üzenetek táblája - Felhasználók közötti üzenetek tárolása
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY, -- Egyedi azonosító minden üzenethez
    sender_id INT NOT NULL,                    -- Üzenetet küldő felhasználó azonosítója
    receiver_id INT NOT NULL,                  -- Üzenetet fogadó felhasználó azonosítója
    content TEXT NOT NULL,                     -- Üzenet tartalma
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Küldés időpontja
    is_read BOOLEAN DEFAULT FALSE,             -- Olvasottsági állapot (alapértelmezés szerint olvasatlan)
    FOREIGN KEY (sender_id) REFERENCES users(user_id),   -- Külső kulcs a küldő felhasználóra
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)  -- Külső kulcs a fogadó felhasználóra
);

-- 9. Fájlok táblája - Témákhoz kapcsolódó fájlok, anyagok tárolása
CREATE TABLE files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,   -- Egyedi azonosító minden fájlhoz
    topic_id INT NOT NULL,                    -- Kapcsolat a téma táblához (topic_id)
    user_id INT NOT NULL,                     -- Feltöltést végző felhasználó azonosítója
    file_name VARCHAR(255) NOT NULL,          -- Fájl neve
    file_path VARCHAR(255) NOT NULL,          -- Fájl elérési útja a szerveren
    file_type ENUM('anyag', 'segédlet', 'vizsga') NOT NULL, -- Fájl típusa (anyag, segédlet, vizsga)
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Feltöltés dátuma
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id), -- Külső kulcs a téma táblára
    FOREIGN KEY (user_id) REFERENCES users(user_id)    -- Külső kulcs a felhasználóra
);

-- 10. Beiratkozások táblája - Felhasználók tantárgyakra való feliratkozását tárolja
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY, -- Egyedi azonosító minden beiratkozáshoz
    user_id INT NOT NULL,                         -- Feliratkozó felhasználó azonosítója
    course_id INT NOT NULL,                       -- Kapcsolat a tantárgy táblához (course_id)
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Feliratkozás dátuma
    FOREIGN KEY (user_id) REFERENCES users(user_id), -- Külső kulcs a felhasználóra
    FOREIGN KEY (course_id) REFERENCES courses(course_id) -- Külső kulcs a tantárgyra
);

-- Kar és szakok közötti kapcsolat: A 'majors' tábla 'faculty_id' oszlopa kapcsolódik a 'faculties' tábla 'faculty_id' oszlopához.
ALTER TABLE majors
ADD CONSTRAINT fk_major_faculty
FOREIGN KEY (faculty_id) REFERENCES faculties(faculty_id);

-- Szak és tantárgyak közötti kapcsolat: A 'courses' tábla 'major_id' oszlopa kapcsolódik a 'majors' tábla 'major_id' oszlopához.
ALTER TABLE courses
ADD CONSTRAINT fk_course_major
FOREIGN KEY (major_id) REFERENCES majors(major_id);

-- Tantárgyak és felhasználók közötti kapcsolat (tantárgy létrehozója): A 'courses' tábla 'created_by' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE courses
ADD CONSTRAINT fk_course_user
FOREIGN KEY (created_by) REFERENCES users(user_id);

-- Tantárgyak és témák közötti kapcsolat: A 'topics' tábla 'course_id' oszlopa kapcsolódik a 'courses' tábla 'course_id' oszlopához.
ALTER TABLE topics
ADD CONSTRAINT fk_topic_course
FOREIGN KEY (course_id) REFERENCES courses(course_id);

-- Témák és felhasználók közötti kapcsolat (téma létrehozója): A 'topics' tábla 'user_id' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE topics
ADD CONSTRAINT fk_topic_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Témák és kommentek közötti kapcsolat: A 'comments' tábla 'topic_id' oszlopa kapcsolódik a 'topics' tábla 'topic_id' oszlopához.
ALTER TABLE comments
ADD CONSTRAINT fk_comment_topic
FOREIGN KEY (topic_id) REFERENCES topics(topic_id);

-- Kommentek és felhasználók közötti kapcsolat (kommentelő): A 'comments' tábla 'user_id' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE comments
ADD CONSTRAINT fk_comment_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Témák és értékelések közötti kapcsolat: A 'ratings' tábla 'topic_id' oszlopa kapcsolódik a 'topics' tábla 'topic_id' oszlopához.
ALTER TABLE ratings
ADD CONSTRAINT fk_rating_topic
FOREIGN KEY (topic_id) REFERENCES topics(topic_id);

-- Értékelések és felhasználók közötti kapcsolat (értékelést adó): A 'ratings' tábla 'user_id' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE ratings
ADD CONSTRAINT fk_rating_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Üzenetek és felhasználók közötti kapcsolat (küldő): A 'messages' tábla 'sender_id' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE messages
ADD CONSTRAINT fk_message_sender
FOREIGN KEY (sender_id) REFERENCES users(user_id);

-- Üzenetek és felhasználók közötti kapcsolat (címzett): A 'messages' tábla 'receiver_id' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE messages
ADD CONSTRAINT fk_message_receiver
FOREIGN KEY (receiver_id) REFERENCES users(user_id);

-- Témák és fájlok közötti kapcsolat: A 'files' tábla 'topic_id' oszlopa kapcsolódik a 'topics' tábla 'topic_id' oszlopához.
ALTER TABLE files
ADD CONSTRAINT fk_file_topic
FOREIGN KEY (topic_id) REFERENCES topics(topic_id);

-- Fájlok és felhasználók közötti kapcsolat (feltöltő): A 'files' tábla 'user_id' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE files
ADD CONSTRAINT fk_file_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Tantárgyak és beiratkozások közötti kapcsolat: A 'enrollments' tábla 'course_id' oszlopa kapcsolódik a 'courses' tábla 'course_id' oszlopához.
ALTER TABLE enrollments
ADD CONSTRAINT fk_enrollment_course
FOREIGN KEY (course_id) REFERENCES courses(course_id);

-- Beiratkozások és felhasználók közötti kapcsolat (hallgató): A 'enrollments' tábla 'user_id' oszlopa kapcsolódik a 'users' tábla 'user_id' oszlopához.
ALTER TABLE enrollments
ADD CONSTRAINT fk_enrollment_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

