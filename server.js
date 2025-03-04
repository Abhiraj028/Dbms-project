const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'Abhiraj', // Or your MySQL username
    password: 'Qwerty@bh1', // Your MySQL password
    database: 'north_face_users',
});


db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to MySQL');
});

// Signup Route (Modified for error popup, account exists check)
app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // --- Server-Side Password Confirmation ---
    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        // Check if the email already exists
        const emailCheckSql = 'SELECT * FROM users WHERE email = ?';
        db.query(emailCheckSql, [email], async (emailCheckErr, emailCheckResults) => {
            if (emailCheckErr) {
                console.error(emailCheckErr);
                return res.status(500).json({ message: 'Database error checking email' }); // Send JSON for AJAX
            }

            if (emailCheckResults.length > 0) {
                return res.status(400).json({ message: 'Email already exists' }); // Send JSON for AJAX
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the user into the database
            const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
            db.query(sql, [username, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error registering user' }); // Send JSON for AJAX
                }
                console.log('User registered successfully');
                res.status(200).json({ message: 'User registered successfully' }); // Send JSON for AJAX
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error hashing password' }); // Send JSON for AJAX
    }
});

// Login Route (Modified for admin/customer redirect)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT id, username, password, isAdmin FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error during login' }); // Send JSON for AJAX
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' }); // Send JSON for AJAX
        }

        const user = results[0];
        try {
            // Compare the password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                console.log('Login successful');
                if (user.isAdmin) {
                    return res.status(200).json({ message: 'Admin login successful', redirect: '/admin' }); // Send JSON for AJAX
                } else {
                    return res.status(200).json({ message: 'Customer login successful', redirect: '/customer' }); // Send JSON for AJAX
                }
            } else {
                res.status(400).json({ message: 'Invalid credentials' }); // Send JSON for AJAX
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error comparing passwords' }); // Send JSON for AJAX
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
