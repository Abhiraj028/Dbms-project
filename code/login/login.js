document.addEventListener("DOMContentLoaded", function () {
    console.log(" JavaScript Loaded");

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error(" loginForm NOT FOUND.");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.querySelector("[name=email]").value;
        const password = document.querySelector("[name=password]").value;

        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            console.log(" Login Response:", result);

            if (response.ok && result.user_id) {
                localStorage.setItem("user_id", result.user_id);
                localStorage.setItem("is_admin", result.is_admin); // Store is_admin flag
                console.log(` Redirecting to /user.html`);
                window.location.href = "/user"; // Always go to user page first
            }
             else {
                console.error(" user_id is missing in response");
                alert(result.message);
            }
        } catch (error) {
            console.error(" Login error:", error);
        }
    });
});
