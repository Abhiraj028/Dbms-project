document.addEventListener("DOMContentLoaded", async () => {
    const cartContainer = document.getElementById("cartItems"); // Fixed ID
    const totalAmount = document.getElementById("totalPrice"); // Fixed ID

    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
        alert("⚠ Please log in to access your cart.");
        return;
    }

    const BASE_URL = `${window.location.origin.replace(/:\d+$/, '')}:3000`;

    async function fetchCartItems() {
        try {
            const response = await fetch(`${BASE_URL}/cart/${user_id}`);
            if (!response.ok) throw new Error("Failed to fetch cart items");

            const cartItems = await response.json();
            cartContainer.innerHTML = "";
            let total = 0;

            if (cartItems.length === 0) {
                cartContainer.innerHTML = "<p>Your cart is empty 🛒</p>";
                totalAmount.textContent = "₹0";
                return;
            }

            cartItems.forEach(item => {
                const cartItem = document.createElement("div");
                cartItem.classList.add("cart-item");
                cartItem.innerHTML = `
                    <img src="../images/${getImageName(item.category, item.product_id)}" alt="${item.name}">
                    <div class="cart-details">
                        <h3>${item.name}</h3>
                        <p>Price: ₹${item.mrp}</p>
                        <p>Quantity: ${item.quantity}</p>
                        <button data-id="${item.sno}" class="remove-btn">Remove</button>
                    </div>
                `;
                cartContainer.appendChild(cartItem);
                total += item.mrp * item.quantity;
            });

            totalAmount.textContent = `₹${total}`;
        } catch (error) {
            console.error("❌ Error fetching cart:", error);
            cartContainer.innerHTML = "<p>⚠ Failed to load cart items. Please try again later.</p>";
        }
    }

    function getImageName(category, id) {
        const categoryPrefix = {
            "jackets": "Jacket",
            "fleece": "Fleece",
            "tshirts": "Shirt",
            "backpacks": "Bag"
        };
        return `${categoryPrefix[category]}0${id % 4 + 1}.avif`;
    }

    cartContainer.addEventListener("click", async (event) => {
        if (event.target.classList.contains("remove-btn")) {
            const sno = event.target.dataset.id;
            if (!confirm("Are you sure you want to remove this item?")) return;

            try {
                console.log("🗑 Removing item with sno:", sno);

                const response = await fetch(`${BASE_URL}/cart/${sno}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Failed to remove item");

                fetchCartItems(); // Refresh cart after removal
            } catch (error) {
                console.error("❌ Error removing item:", error);
                alert("Failed to remove item. Please try again.");
            }
        }
    });

    document.getElementById("checkoutButton").addEventListener("click", async () => {
        const phone = document.getElementById("phone").value.trim();
        const address = document.getElementById("address").value.trim();

        if (!phone || !address) {
            alert("⚠ Please enter both phone number and address.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id, phone, address })
            });

            if (!response.ok) throw new Error("Failed to place order");

            alert("✅ Order placed successfully!");
            fetchCartItems(); // Clear cart after successful checkout
        } catch (error) {
            console.error("❌ Error during checkout:", error);
            alert("Failed to place order. Please try again.");
        }
    });

    fetchCartItems();
});
