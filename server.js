const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/signup', express.static(path.join(__dirname, 'code', 'signup')));
app.use('/user', express.static(path.join(__dirname, 'code', 'user')));
app.use(express.static('code'));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve user page
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'code', 'user', 'user.html'));
});

// Serve signup and login pages
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'code', 'signup', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'code', 'signup', 'login.html'));
});

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'Abhiraj',
    password: 'Qwerty@bh1',
    database: 'north_face_users'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: 'Email or username already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                'INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, FALSE)', 
                [username, email, hashedPassword], 
                (insertErr) => {
                    if (insertErr) {
                        console.error(insertErr);
                        return res.status(500).json({ message: 'Error registering user' });
                    }
                    res.status(200).json({ message: 'User registered successfully' });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT id, username, password, isAdmin FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = results[0];

        try {
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                return res.status(200).json({
                    message: user.isAdmin ? 'Admin login successful' : 'Customer login successful',
                    redirect: user.isAdmin ? '/admin' : '/user'
                });
            } else {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error during login' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at: http://localhost:${port}`);
});
