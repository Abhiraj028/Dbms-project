-- Get all products with basic filtering
SELECT * FROM products 
WHERE 1=1
    AND category IN ('Jackets', 'Fleece', 'T-Shirts', 'Backpacks')
    AND selling_price >= 0
    AND selling_price <= 100000
ORDER BY id;

-- Filter by category
SELECT * FROM products 
WHERE category = 'Jackets';

-- Filter by price range
SELECT * FROM products 
WHERE selling_price BETWEEN 1000 AND 5000;

-- Filter by multiple categories
SELECT * FROM products 
WHERE category IN ('Jackets', 'Fleece');

-- Filter by category and price range
SELECT * FROM products 
WHERE category = 'Jackets' 
AND selling_price BETWEEN 1000 AND 5000;

-- Sort by price (low to high)
SELECT * FROM products 
ORDER BY selling_price ASC;

-- Sort by price (high to low)
SELECT * FROM products 
ORDER BY selling_price DESC;

-- Filter by stock status
SELECT * FROM products 
WHERE stock_status = 'In Stock';

-- Filter by brand
SELECT * FROM products 
WHERE brand = 'The North Face';

-- Combined filters example
SELECT * FROM products 
WHERE category = 'Jackets'
    AND selling_price BETWEEN 1000 AND 5000
    AND stock_status = 'In Stock'
    AND brand = 'The North Face'
ORDER BY selling_price ASC;

-- Common filter combinations:

-- 1. Get all Jackets under 5000
SELECT * FROM products 
WHERE category = 'Jackets' 
AND selling_price <= 5000
ORDER BY selling_price ASC;

-- 2. Get all in-stock T-Shirts
SELECT * FROM products 
WHERE category = 'T-Shirts'
AND stock_status = 'In Stock'
ORDER BY id;

-- 3. Get all Backpacks and Fleece items over 3000
SELECT * FROM products 
WHERE category IN ('Backpacks', 'Fleece')
AND selling_price >= 3000
ORDER BY category, selling_price ASC;

-- 4. Get all products with discount (where selling price is less than MRP)
SELECT * FROM products 
WHERE selling_price < mrp
ORDER BY (mrp - selling_price) DESC;

-- 5. Get all products in a specific price range with multiple categories
SELECT * FROM products 
WHERE category IN ('Jackets', 'Fleece')
AND selling_price BETWEEN 2000 AND 8000
AND stock_status = 'In Stock'
ORDER BY selling_price ASC;

-- 6. Get all products sorted by discount percentage
SELECT *, 
    ROUND(((mrp - selling_price) / mrp) * 100) as discount_percentage
FROM products 
WHERE selling_price < mrp
ORDER BY discount_percentage DESC;

-- 7. Get all products with stock status and price range
SELECT * FROM products 
WHERE stock_status = 'In Stock'
AND selling_price BETWEEN 1000 AND 10000
ORDER BY category, selling_price ASC;

-- Product Filtering Queries
-- Get products by category
SELECT * FROM products WHERE category IN ('Jackets', 'Fleece');

-- Get products by price range
SELECT * FROM products WHERE selling_price BETWEEN 1000 AND 5000;

-- Get products sorted by price (low to high)
SELECT * FROM products ORDER BY selling_price ASC;

-- Get products sorted by price (high to low)
SELECT * FROM products ORDER BY selling_price DESC;

-- Stock Management Queries
-- Get stock info for a product (including in-cart and sold quantities)
SELECT 
    p.id,
    p.name,
    p.stock_quantity as available_stock,
    (SELECT SUM(quantity) FROM cart WHERE product_id = p.id) as in_cart,
    (SELECT SUM(quantity) FROM order_items WHERE product_id = p.id) as sold
FROM products p
WHERE p.id = ?;

-- Update product stock quantity
UPDATE products 
SET 
    stock_quantity = ?,
    in_stock = IF(? > 0, TRUE, FALSE)
WHERE id = ?;

-- Get low stock products (less than 10 items)
SELECT 
    id,
    name,
    stock_quantity,
    category
FROM products
WHERE stock_quantity < 10
ORDER BY stock_quantity ASC;

-- Get out of stock products
SELECT 
    id,
    name,
    category,
    mrp,
    selling_price
FROM products
WHERE stock_quantity = 0 OR in_stock = FALSE;

-- Get products with stock status
SELECT 
    p.id,
    p.name,
    p.category,
    p.stock_quantity as available_stock,
    (SELECT SUM(quantity) FROM cart WHERE product_id = p.id) as in_cart,
    (SELECT SUM(quantity) FROM order_items WHERE product_id = p.id) as sold,
    p.in_stock
FROM products p
ORDER BY p.category, p.name;

-- Cart and Order Related Stock Queries
-- Check if product has enough stock for cart addition
SELECT 
    stock_quantity >= ? as has_stock,
    stock_quantity as current_stock
FROM products 
WHERE id = ?;

-- Get cart items with stock status
SELECT 
    c.product_id,
    p.name,
    c.quantity as cart_quantity,
    p.stock_quantity as available_stock,
    p.stock_quantity >= c.quantity as has_sufficient_stock
FROM cart c
JOIN products p ON c.product_id = p.id
WHERE c.user_id = ?;

-- Transaction Management
-- Start transaction
START TRANSACTION;

-- Update stock after order placement
UPDATE products 
SET 
    stock_quantity = stock_quantity - ?,
    in_stock = IF(stock_quantity - ? > 0, TRUE, FALSE)
WHERE id = ?;

-- Add order item
INSERT INTO order_items (order_id, product_id, quantity, mrp_at_time, selling_price_at_time)
VALUES (?, ?, ?, (SELECT mrp FROM products WHERE id = ?), (SELECT selling_price FROM products WHERE id = ?));

-- Remove from cart after order
DELETE FROM cart WHERE user_id = ? AND product_id = ?;

-- Commit transaction
COMMIT;

-- Rollback transaction (in case of error)
ROLLBACK; 