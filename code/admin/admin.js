const BASE_URL = "http://localhost:3000";
const productList = document.getElementById("product-list");
const orderList = document.getElementById("order-list"); // Order section still referenced

// ✅ Function to get image name based on category and product ID
function getImageName(category, id) {
    const categoryPrefix = {
        "jackets": "Jacket",
        "fleece": "Fleece",
        "tshirts": "Shirt",
        "backpacks": "Bag"
    };
    return `${categoryPrefix[category] || "Default"}0${id % 4 + 1}.avif`;
}

// ✅ Fetch and display products
async function fetchProducts() {
    try {
        const response = await fetch(`${BASE_URL}/admin/products`);
        if (!response.ok) throw new Error(`Server Error: ${response.status}`);

        const products = await response.json();
        productList.innerHTML = "";

        products.forEach(product => {
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");
            productCard.innerHTML = `
                <img src="../images/${getImageName(product.category, product.product_id)}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Price: ₹${product.mrp}</p>
                <p>Stock Available: ${product.stock_quantity}</p>
                <p>In Carts: ${product.in_cart}</p>
                <p>Stock Sold: ${product.sold_quantity}</p>
                <button class="update-stock" data-id="${product.product_id}">Update Stock</button>
            `;
            productList.appendChild(productCard);
        });
    } catch (error) {
        console.error("❌ Error fetching products:", error.message);
    }
}

// ✅ Fetch and display orders (only if orderList exists)
async function fetchOrders() {
    if (!orderList) return; // No order section in admin.html, so skip this

    try {
        const response = await fetch(`${BASE_URL}/admin/orders`);
        if (!response.ok) throw new Error(`Server Error: ${response.status}`);

        const orders = await response.json();
        orderList.innerHTML = "";

        orders.forEach(order => {
            const orderCard = document.createElement("div");
            orderCard.classList.add("order-card");
            orderCard.innerHTML = `
                <h3>Order No: ${order.order_no}</h3>
                <p>User: ${order.username}</p>
                <p>Phone: ${order.phone}</p>
                <p>Address: ${order.address}</p>
                <p>Total Amount: ₹${order.amount}</p>
            `;
            orderList.appendChild(orderCard);
        });
    } catch (error) {
        console.error("❌ Error fetching orders:", error.message);
    }
}

// ✅ Update stock functionality
productList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("update-stock")) {
        const productId = event.target.dataset.id;
        const newStock = prompt("Enter new stock quantity:");

        if (newStock === null || isNaN(newStock) || newStock < 0) return;

        try {
            const response = await fetch(`${BASE_URL}/admin/update-stock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id: productId, stock_quantity: newStock })
            });

            if (!response.ok) throw new Error("Failed to update stock");

            alert("✅ Stock updated successfully!");
            fetchProducts(); // Refresh the product list
        } catch (error) {
            console.error("❌ Error updating stock:", error.message);
        }
    }
});

// ✅ Initial fetch
fetchProducts();
fetchOrders(); // Only runs if order section exists
