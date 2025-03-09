document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful!');
            window.location.href = '/login';
        } else {
            alert(data.message || 'Error during registration');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error during registration');
    }
});
