document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    // 🔹 Only accept @nokia.com emails
    function isValidNokiaEmail(email) {
        return email.endsWith("@nokia.com");
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            if (!isValidNokiaEmail(email)) {
                alert("Only @nokia.com emails are allowed!");
                return;
            }

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
            const secretKeyInput = document.getElementById("manager-secret-key");

            if (!isValidNokiaEmail(email)) {
                alert("Only @nokia.com emails are allowed!");
                return;
            }

            // 🔹 Manager Verification with Secret Key
            const MANAGER_SECRET_KEY = "Nokia123"; // 🔒 Change this key for security
            if (role === "Manager") {
                if (!secretKeyInput) {
                    alert("Secret key input not found.");
                    return;
                }
                const enteredSecretKey = secretKeyInput.value;
                if (enteredSecretKey !== MANAGER_SECRET_KEY) {
                    alert("Incorrect secret key for manager registration!");
                    return;
                }
            }

            // Save user details
            localStorage.setItem(email, JSON.stringify({ email, password, role }));
            alert("Account created! Please log in.");
            window.location.href = "index.html";
        });

        // 🔹 Show/Hide Secret Key Field for Manager Role
        document.getElementById("signup-role").addEventListener("change", function () {
            const secretKeyField = document.getElementById("manager-secret-field");
            if (this.value === "Manager") {
                secretKeyField.style.display = "block";
            } else {
                secretKeyField.style.display = "none";
            }
        });
    }
});



