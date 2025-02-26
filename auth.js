document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;
            
            const userData = JSON.parse(localStorage.getItem(email));
            if (userData && userData.password === password) {
                localStorage.setItem("loggedInUser", JSON.stringify(userData));
                window.location.href = "dashboard.html";
            } else {
                alert("Invalid credentials");
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const email = document.getElementById("signup-email").value;
            const password = document.getElementById("signup-password").value;
            const role = document.getElementById("signup-role").value;

            localStorage.setItem(email, JSON.stringify({ email, password, role }));
            alert("Account created! Please log in.");
            window.location.href = "index.html";
        });
    }
});


