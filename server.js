const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve Static Files Properly
app.use(express.static(path.join(__dirname, "code"))); 
app.use('/images', express.static(path.join(__dirname, 'images')));

// ✅ Serve Static Files for Each Page (CSS, JS, etc.)
app.use('/user', express.static(path.join(__dirname, "code", "user")));
app.use('/cart', express.static(path.join(__dirname, "code", "cart")));
app.use('/orders', express.static(path.join(__dirname, "code", "orders")));
app.use('/admin', express.static(path.join(__dirname, "code", "admin")));
app.use('/login', express.static(path.join(__dirname, "code", "login")));
app.use('/signup', express.static(path.join(__dirname, "code", "signup")));

// ✅ Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "Abhiraj",
    password: "Qwerty@bh1",
    database: "north_face_users",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL Database");
});

app.get("/user", (req, res) => {
    res.sendFile(path.join(__dirname, "code", "user", "user.html"));
});

app.get("/cart", (req, res) => {
    res.sendFile(path.join(__dirname, "code", "cart", "cart.html"));
});

app.get("/orders", (req, res) => {
    res.sendFile(path.join(__dirname, "code", "orders", "orders.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "code", "admin", "admin.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "code", "login", "login.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "code", "signup", "signup.html"));
});

// **User Authentication**
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
        db.query(sql, [username, email, hashedPassword], (err) => {
            if (err) return res.status(400).json({ message: "User already exists or invalid data" });
            res.status(201).json({ message: "User registered successfully" });
        });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // 🔍 Fetch user details where email matches
    db.query("SELECT id, password FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) {
            console.error("❌ Database query error:", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        // 🔥 Check if user exists
        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const user = results[0];

        // 🔥 Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("✅ Login successful. User ID:", user.id);

        // 🛠 Send the user_id in response
        res.json({ message: "Login successful", user_id: user.id, redirect: `/user?user_id=${user.id}` });
    });
});


// **Product Routes**
app.get("/products", (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// **Cart Routes**
app.get("/cart/:user_id", (req, res) => {
    const userId = req.params.user_id;
    console.log(`🔍 Fetching cart items for user_id: ${userId}`); // Debug log

    const query = `
        SELECT 
            cart.*, 
            products.name, 
            products.mrp,
            products.category
        FROM 
            cart 
        JOIN 
            products 
        ON 
            cart.product_id = products.product_id 
        WHERE 
            cart.user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        console.log(`🛒 Cart items found for user ${userId}:`, results.length);

        // ✅ Return an empty array instead of a 404 error
        res.json(results.length > 0 ? results : []);
    });
});


app.post("/add-to-cart", (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id || !quantity) {
        console.log("❌ Missing required fields:", req.body);
        return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🔍 Checking stock for product ${product_id}`);

    db.query("SELECT stock_quantity FROM products WHERE product_id = ?", [product_id], (err, results) => {
        if (err) {
            console.error("❌ Database error in stock check:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            console.log("❌ Product not found:", product_id);
            return res.status(404).json({ error: "Product not found" });
        }

        const availableStock = results[0].stock_quantity;
        if (quantity > availableStock) {
            console.log("❌ Not enough stock:", { available: availableStock, requested: quantity });
            return res.status(400).json({ error: "Not enough stock available" });
        }

        console.log(`✅ Stock is available for ${product_id}, checking cart`);

        db.query("SELECT * FROM cart WHERE user_id = ? AND product_id = ?", [user_id, product_id], (err, cartResults) => {
            if (err) {
                console.error("❌ Database error when checking cart:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (cartResults.length > 0) {
                console.log(`🛒 Product already in cart, updating quantity`);

                db.query("UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?", [quantity, user_id, product_id], (err) => {
                    if (err) {
                        console.error("❌ Failed to update cart:", err);
                        return res.status(500).json({ error: "Failed to update cart" });
                    }
                    console.log("✅ Cart updated successfully");
                    res.json({ message: "Cart updated successfully" });
                });

            } else {
                console.log("➕ Adding new item to cart");

                db.query("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)", [user_id, product_id, quantity], (err) => {
                    if (err) {
                        console.error("❌ Failed to add to cart:", err);
                        return res.status(500).json({ error: "Failed to add to cart" });
                    }
                    console.log("✅ Item added to cart");
                    res.json({ message: "Item added to cart" });
                });
            }
        });
    });
});


app.delete("/cart/:id", (req, res) => {
    const cartId = req.params.id;
    console.log(`🗑 Removing item with cart_id: ${cartId}`); // Debug log

    db.query("DELETE FROM cart WHERE sno = ?", [cartId], (err, results) => {
        if (err) {
            console.error("❌ Failed to remove item:", err);
            return res.status(500).json({ error: "Failed to remove item" });
        }
        if (results.affectedRows === 0) {
            console.log(`⚠ No item found with cart_id: ${cartId}`);
            return res.status(404).json({ message: "Item not found" });
        }
        console.log(`✅ Item removed successfully`);
        res.json({ message: "Item removed successfully" });
    });
});


app.post("/checkout", (req, res) => {
    const { user_id, phone, address } = req.body;

    if (!user_id || !phone || !address) {
        console.log("❌ Missing required fields for checkout:", req.body);
        return res.status(400).json({ error: "Missing fields" });
    }

    // Generate order_no
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(2, 12);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const order_no = `ORD${timestamp}-${randomDigits}`;

    // Fetch username, cart items, and total amount
    const getCartQuery = `
        SELECT u.username, c.product_id, c.quantity, p.mrp, SUM(p.mrp * c.quantity) AS total_amount
        FROM users u
        JOIN cart c ON u.id = c.user_id
        JOIN products p ON c.product_id = p.product_id
        WHERE u.id = ?
        GROUP BY u.username, c.product_id, c.quantity, p.mrp`;

    db.query(getCartQuery, [user_id], (err, results) => {
        if (err || results.length === 0) {
            console.error("❌ Failed to fetch user/cart data:", err);
            return res.status(500).json({ error: "Failed to process order" });
        }

        const { username } = results[0];
        const total_amount = results.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
        const cartItems = results.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            mrp: item.mrp
        }));

        // Insert into orders
        db.query(
            `INSERT INTO orders (order_no, user_id, username, phone, address, amount) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [order_no, user_id, username, phone, address, total_amount || 0],
            (orderErr) => {
                if (orderErr) {
                    console.error("❌ Checkout failed:", orderErr);
                    return res.status(500).json({ error: "Checkout failed" });
                }

                // Insert items into order_items
                const insertOrderItemsQuery = `INSERT INTO order_items (order_no, product_id, quantity, mrp) VALUES ?`;
                const orderItemsValues = cartItems.map(item => [order_no, item.product_id, item.quantity, item.mrp]);

                db.query(insertOrderItemsQuery, [orderItemsValues], (orderItemsErr) => {
                    if (orderItemsErr) {
                        console.error("❌ Failed to insert order items:", orderItemsErr);
                        return res.status(500).json({ error: "Failed to save order items" });
                    }

                    // Clear cart after successful order
                    db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (deleteErr) => {
                        if (deleteErr) {
                            console.error("❌ Failed to clear cart after checkout:", deleteErr);
                            return res.status(500).json({ error: "Failed to clear cart" });
                        }

                        console.log(`✅ Order placed: ${order_no} for user ${user_id}`);
                        res.json({ message: "Order placed successfully", order_no });
                    });
                });
            }
        );
    });
});

app.get("/admin/products", (req, res) => {
    const query = `
        SELECT 
            p.product_id, 
            p.name, 
            p.mrp, 
            p.category, 
            p.stock_quantity,
            COALESCE(SUM(c.quantity), 0) AS in_cart, 
            COALESCE(SUM(oi.quantity), 0) AS sold_quantity
        FROM 
            products p
        LEFT JOIN 
            cart c ON p.product_id = c.product_id
        LEFT JOIN 
            order_items oi ON p.product_id = oi.product_id
        GROUP BY 
            p.product_id, p.name, p.mrp, p.category, p.stock_quantity
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error fetching products for admin:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});


app.get("/admin/orders", (req, res) => {
    db.query("SELECT * FROM orders ORDER BY order_no DESC", (err, results) => {
        if (err) {
            console.error("❌ Failed to fetch orders:", err);
            return res.status(500).json({ error: "Failed to fetch orders" });
        }
        res.json(results);
    });
});

app.get("/admin/all-orders", (req, res) => {
    const query = `
        SELECT o.order_no, o.username, o.phone, o.address, o.amount, 
               oi.product_id, oi.quantity, oi.mrp, p.name
        FROM orders o
        JOIN order_items oi ON o.order_no = oi.order_no
        JOIN products p ON oi.product_id = p.product_id
        ORDER BY o.order_no DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Failed to fetch all orders:", err);
            return res.status(500).json({ error: "Failed to fetch all orders" });
        }

        const ordersMap = {};
        results.forEach(row => {
            if (!ordersMap[row.order_no]) {
                ordersMap[row.order_no] = {
                    order_no: row.order_no,
                    username: row.username,
                    phone: row.phone,
                    address: row.address,
                    amount: row.amount,
                    items: []
                };
            }
            ordersMap[row.order_no].items.push({
                product_id: row.product_id,
                name: row.name,
                quantity: row.quantity,
                mrp: row.mrp
            });
        });

        res.json(Object.values(ordersMap));
    });
});

app.post("/admin/update-stock", (req, res) => {
    const { product_id, stock_quantity } = req.body;

    if (!product_id || stock_quantity < 0) {
        return res.status(400).json({ error: "Invalid stock data" });
    }

    db.query(
        "UPDATE products SET stock_quantity = ? WHERE product_id = ?",
        [stock_quantity, product_id],
        (err) => {
            if (err) {
                console.error("❌ Failed to update stock:", err);
                return res.status(500).json({ error: "Failed to update stock" });
            }
            res.json({ message: "Stock updated successfully" });
        }
    );
});

app.get("/user/orders/:user_id", (req, res) => {
    const user_id = req.params.user_id;
    
    const query = `
        SELECT o.order_no, o.username, o.phone, o.address, o.amount, 
               oi.product_id, oi.quantity, oi.mrp, p.name
        FROM orders o
        JOIN order_items oi ON o.order_no = oi.order_no
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.user_id = ?  -- ✅ Only fetch orders for this user
        ORDER BY o.order_no DESC;
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error("❌ Failed to fetch user orders:", err);
            return res.status(500).json({ error: "Failed to fetch orders" });
        }

        const ordersMap = {};
        results.forEach(row => {
            if (!ordersMap[row.order_no]) {
                ordersMap[row.order_no] = {
                    order_no: row.order_no,
                    username: row.username,
                    phone: row.phone,
                    address: row.address,
                    amount: row.amount,
                    items: []
                };
            }
            ordersMap[row.order_no].items.push({
                product_id: row.product_id,
                name: row.name,
                quantity: row.quantity,
                mrp: row.mrp
            });
        });

        res.json(Object.values(ordersMap));
    });
});



// Start Server
app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
