document.addEventListener("DOMContentLoaded", async () => {
    const cartContainer = document.getElementById("cartItems"); 
    const totalAmount = document.getElementById("totalPrice"); 

    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
        alert("⚠ Please log in to access your cart.");
        window.location.href = "/login.html"; // Redirect to login if not logged in
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
                        <p>Quantity: <span class="item-quantity">${item.quantity}</span></p>
                        <div class="quantity-controls">
                            <button data-id="${item.sno}" class="decrease-btn">➖</button>
                            <button data-id="${item.sno}" class="remove-btn">Remove</button>
                        </div>
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

    async function handleDecreaseQuantity(sno) {
        try {
            const response = await fetch(`${BASE_URL}/cart/decrease/${sno}`, { method: "PUT" });
            if (!response.ok) throw new Error("Failed to decrease quantity");

            fetchCartItems(); // Refresh cart after quantity decrease
        } catch (error) {
            console.error("❌ Error decreasing quantity:", error);
            alert("Failed to decrease quantity. Please try again.");
        }
    }

    cartContainer.addEventListener("click", async (event) => {
        const sno = event.target.dataset.id;
        if (!sno) return;

        if (event.target.classList.contains("remove-btn")) {
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
        } else if (event.target.classList.contains("decrease-btn")) {
            handleDecreaseQuantity(sno);
        }
    });

    document.getElementById("checkoutButton").addEventListener("click", async () => {
        const phoneInput = document.getElementById("phone");
        const addressInput = document.getElementById("address");
    
        const phone = phoneInput.value.trim();
        const address = addressInput.value.trim();
    
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
    
            // **Clear the phone and address fields after successful order**
            phoneInput.value = "";
            addressInput.value = "";
    
            fetchCartItems(); // Refresh cart after successful checkout
        } catch (error) {
            console.error("❌ Error during checkout:", error);
            alert("Failed to place order. Please try again.");
        }
    });

    fetchCartItems();
});
