document.addEventListener("DOMContentLoaded", function () {
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    if (userData && userData.email) {
        const firstName = userData.email.split("@")[0]; // Extract first name from email
        document.getElementById("user-name").textContent = ` ${firstName}`;
    } else {
        alert("No user logged in. Redirecting to login page.");
        window.location.href = "index.html";
        return;
    }

    const scanBtn = document.getElementById("scan-qr");
    scanBtn.addEventListener("click", async function () {
        document.getElementById("qr-reader").style.display = "block";

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            document.getElementById("qr-reader").style.display = "block";
            const qrScanner = new Html5Qrcode("qr-reader");

            qrScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    alert("QR Code Scanned: " + decodedText);
                    document.getElementById("qr-reader").style.display = "none";
                    qrScanner.stop();

                    const mockData = {
                        id: decodedText,
                        type: "CO2",
                        serviceDate: "2025-01-10",
                        expiryDate: "2026-01-10"
                    };

                    document.getElementById("fire-extinguisher-details").style.display = "block";
                    document.getElementById("ext-id").value = mockData.id;
                    document.getElementById("ext-type").value = mockData.type;
                    document.getElementById("ext-service").value = mockData.serviceDate;
                    document.getElementById("ext-expiry").value = mockData.expiryDate;

                    if (userData.role === "manager") {
                        document.getElementById("edit-btn").style.display = "inline";
                        document.getElementById("submit-btn").style.display = "inline";
                    }

                    loadHistory(mockData.id);
                },
                (errorMessage) => {
                    console.log("Scanning error:", errorMessage);
                }
            ).catch(err => {
                alert("Camera error. Please ensure no other apps are using the camera.");
                console.log("Camera error:", err);
            });
        } catch (err) {
            alert("Camera access is blocked. Please check browser settings and ensure no other apps are using the camera.");
            console.log("Camera access error:", err);
        }
    });

    document.getElementById("submit-btn").addEventListener("click", function () {
        const history = JSON.parse(localStorage.getItem("history")) || [];
        history.push({
            id: document.getElementById("ext-id").value,
            type: document.getElementById("ext-type").value,
            serviceDate: document.getElementById("ext-service").value,
            expiryDate: document.getElementById("ext-expiry").value,
            timestamp: new Date().toLocaleString()
        });

        localStorage.setItem("history", JSON.stringify(history));
        alert("Changes saved.");
        loadHistory(document.getElementById("ext-id").value);
    });

    function loadHistory(extinguisherId) {
        const historyDiv = document.getElementById("history");
        historyDiv.innerHTML = "";
        const history = JSON.parse(localStorage.getItem("history")) || [];

        history.forEach(entry => {
            if (entry.id === extinguisherId) {
                const p = document.createElement("p");
                p.textContent = `ID: ${entry.id}, Type: ${entry.type}, Service: ${entry.serviceDate}, Expiry: ${entry.expiryDate}, Time: ${entry.timestamp}`;
                historyDiv.appendChild(p);
            }
        });
    }
});



