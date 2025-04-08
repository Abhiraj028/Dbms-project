const BASE_URL = "http://localhost:3000";
const ordersContainer = document.getElementById("orders-container");

// Fetch and display all orders
async function fetchOrders() {
    try {
        const response = await fetch(`${BASE_URL}/admin/all-orders`);
        if (!response.ok) throw new Error("Failed to fetch orders");

        const orders = await response.json();
        ordersContainer.innerHTML = "";

        orders.forEach(order => {
            const orderCard = document.createElement("div");
            orderCard.classList.add("order-card");

            let itemsHTML = order.items.map(item => `
                <div class="order-item">
                    ${item.name} (x${item.quantity}) - ₹${item.mrp}
                </div>
            `).join("");

            orderCard.innerHTML = `
                <div class="order-header">
                    <p><strong>Order No:</strong> ${order.order_no}</p>
                    <p><strong>User:</strong> ${order.username}</p>
                    <p><strong>Phone:</strong> ${order.phone}</p>
                    <p><strong>Address:</strong> ${order.address}</p>
                    <p><strong>Total Amount:</strong> ₹${order.amount}</p>
                </div>
                <div class="order-items">${itemsHTML}</div>
            `;

            ordersContainer.appendChild(orderCard);
        });
    } catch (error) {
        console.error(" Error fetching orders:", error);
    }
}

// Initial fetch
fetchOrders();
