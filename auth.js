document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const roleSelect = document.getElementById("signup-role");
    const managerSecretField = document.getElementById("manager-secret-field");

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
            const role = roleSelect.value;
            const secretKeyInput = document.getElementById("manager-secret-key");

            if (!isValidNokiaEmail(email)) {
                alert("Only @nokia.com emails are allowed!");
                return;
            }

            // 🔹 Manager Verification with Secret Key
            const MANAGER_SECRET_KEY = "Nokia123"; // Change this to a real secure key
            if (role === "manager") {
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

            // Store user details
            localStorage.setItem(email, JSON.stringify({ email, password, role }));
            alert("Account created! Please log in.");
            window.location.href = "index.html";
        });

        // 🔹 Show/Hide Secret Key Field for Manager Role
        roleSelect.addEventListener("change", function () {
            managerSecretField.style.display = (this.value === "manager") ? "block" : "none";
        });
    }
});



