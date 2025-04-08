document.addEventListener("DOMContentLoaded", async () => {
    const productGrid = document.getElementById("productGrid");
    const filters = document.querySelectorAll(".filter-category");
    const priceSlider = document.getElementById("priceSlider");
    const priceValue = document.getElementById("priceValue");

    let products = [];

    //  Extract user_id from or localStorage
    function getQueryParam(param) {
        return new URLSearchParams(window.location.search).get(param);
    }

    const user_id = (() => {
        const storedUserId = localStorage.getItem("user_id");
        const urlUserId = getQueryParam("user_id");

        if (urlUserId) {
            localStorage.setItem("user_id", urlUserId);
            return urlUserId;
        }

        return storedUserId;
    })();

    if (!user_id) {
        alert(" Please log in to view products.");
        window.location.href = "/login.html"; // Redirect if not logged in
        return;
    }

    console.log(" User ID:", user_id);

    async function fetchProducts() {
        try {
            const response = await fetch("http://localhost:3000/products");
            if (!response.ok) throw new Error("Failed to fetch products");
            products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error(" Error fetching products:", error);
        }
    }

    function renderProducts(filteredProducts) {
        productGrid.innerHTML = "";

        filteredProducts.forEach(product => {
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");

            productCard.innerHTML = `
                <img src="/images/${getImageName(product.category, product.product_id)}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.mrp} INR</p>
                <div class="quantity-control">
                    <button class="decrease" data-id="${product.product_id}">-</button>
                    <span class="quantity" id="qty-${product.product_id}">1</span>
                    <button class="increase" data-id="${product.product_id}" data-stock="${product.stock_quantity}">+</button>
                </div>
                <button class="add-to-cart" data-id="${product.product_id}">Add to Cart</button>
            `;
            productGrid.appendChild(productCard);
        });

        attachEventListeners();
    }

    function getImageName(category, id) {
        const categoryPrefix = {
            "jackets": "Jacket",
            "fleece": "Fleece",
            "tshirts": "Shirt",
            "backpacks": "Bag"
        };
        return `${categoryPrefix[category] || "Default"}0${id % 4 + 1}.avif`;
    }

    function attachEventListeners() {
        document.querySelectorAll(".increase").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.dataset.id;
                const stock = parseInt(this.dataset.stock);
                const qtyElement = document.getElementById(`qty-${id}`);
                let quantity = parseInt(qtyElement.textContent);
                if (quantity < stock) qtyElement.textContent = quantity + 1;
            });
        });

        document.querySelectorAll(".decrease").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.dataset.id;
                const qtyElement = document.getElementById(`qty-${id}`);
                let quantity = parseInt(qtyElement.textContent);
                if (quantity > 1) qtyElement.textContent = quantity - 1;
            });
        });

        document.querySelectorAll(".add-to-cart").forEach(button => {
            button.addEventListener("click", async function () {
                const product_id = this.dataset.id;
                const qtyElement = document.getElementById(`qty-${product_id}`);
                const quantity = parseInt(qtyElement.textContent);

                try {
                    const response = await fetch("http://localhost:3000/add-to-cart", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id, product_id, quantity })
                    });

                    const result = await response.json();
                    if (response.ok) {
                        alert(" Added to cart!");
                    } else {
                        alert(result.message || " Failed to add to cart.");
                    }
                } catch (error) {
                    console.error(" Error adding to cart:", error);
                    alert(" Failed to add to cart.");
                }
            });
        });
    }

    function filterProducts() {
        const selectedCategories = Array.from(filters)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        const maxPrice = parseInt(priceSlider.value);

        const filteredProducts = products.filter(product =>
            (selectedCategories.length === 0 || selectedCategories.includes(product.category)) &&
            product.mrp <= maxPrice
        );

        renderProducts(filteredProducts);
    }

    filters.forEach(filter => filter.addEventListener("change", filterProducts));
    priceSlider.addEventListener("input", () => {
        priceValue.textContent = priceSlider.value;
        filterProducts();
    });

    fetchProducts();
});
