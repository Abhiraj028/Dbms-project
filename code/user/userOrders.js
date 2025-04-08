document.addEventListener("DOMContentLoaded", async () => {
    const ordersContainer = document.getElementById("orders-container");
    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
        alert(" Please log in to view your orders.");
        window.location.href = "/login.html"; // Redirect to login if not logged in
        return;
    }

    const BASE_URL = `${window.location.origin.replace(/:\d+$/, '')}:3000`;

    async function fetchUserOrders() {
        try {
            const response = await fetch(`${BASE_URL}/user/orders/${user_id}`);
            if (!response.ok) throw new Error("Failed to fetch orders");

            const orders = await response.json();
            ordersContainer.innerHTML = "";

            if (orders.length === 0) {
                ordersContainer.innerHTML = "<p>You have no past orders </p>";
                return;
            }

            orders.forEach(order => {
                const orderCard = document.createElement("div");
                orderCard.classList.add("order-card");
                orderCard.innerHTML = `
                    <h3>Order No: ${order.order_no}</h3>
                    <p>Phone: ${order.phone}</p>
                    <p>Address: ${order.address}</p>
                    <p>Total Amount: ₹${order.amount}</p>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <p>${item.name} - Qty: ${item.quantity} - ₹${item.mrp}</p>
                            </div>
                        `).join("")}
                    </div>
                `;
                ordersContainer.appendChild(orderCard);
            });

        } catch (error) {
            console.error(" Error fetching orders:", error);
            ordersContainer.innerHTML = "<p> Failed to load orders. Please try again later.</p>";
        }
    }

    fetchUserOrders();
});
