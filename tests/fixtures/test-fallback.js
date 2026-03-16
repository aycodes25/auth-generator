
// Empty JS file
console.log("Loaded");

// Auto-generated fallback for login
(function() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const data = {
            userEmail: formData.get('userEmail'),
            userPassword: formData.get('userPassword')
            };

            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Login successful!');
                    if (result.token) localStorage.setItem('token', result.token);
                } else {
                    alert(result.error || 'Something went wrong');
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Could not connect to server');
            }
        });
    }
})();
