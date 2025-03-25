
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL CHECK (mrp >= 0),
    category VARCHAR(50) NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)
);

CREATE TABLE cart (
    sno INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    UNIQUE KEY unique_cart_item (user_id, product_id)
);

CREATE TABLE orders (
    order_no VARCHAR(20) PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    sno INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(20) NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    mrp DECIMAL(10,2) NOT NULL CHECK (mrp >= 0),
    FOREIGN KEY (order_no) REFERENCES orders(order_no),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);