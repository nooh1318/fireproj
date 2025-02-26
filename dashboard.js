document.addEventListener("DOMContentLoaded", function () {
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    const firstName = userData.email.split("@")[0]; // Extract first name from email
    document.getElementById("user-name").textContent = `Welcome, ${firstName}`;

    const scanBtn = document.getElementById("scan-qr");
    scanBtn.addEventListener("click", function () {
        document.getElementById("qr-reader").style.display = "block";

        function onScanSuccess(decodedText) {
            alert("QR Code Scanned: " + decodedText);
            document.getElementById("qr-reader").style.display = "none";

            // Simulated Data (Replace with actual scanned data)
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

            // Load History
            loadHistory(mockData.id);
        }

        new Html5Qrcode("qr-reader").start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: 250 },
            onScanSuccess
        );
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

