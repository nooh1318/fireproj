document.addEventListener("DOMContentLoaded", function () {
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    if (userData && userData.email) {
        const firstName = userData.email.split("@")[0];
        document.getElementById("user-name").textContent = `${firstName}`;
    } else {
        alert("No user logged in. Redirecting to login page.");
        window.location.href = "index.html";
        return;
    }

    // Navigation buttons
    const homeBtn = document.getElementById("home-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (homeBtn) {
        homeBtn.addEventListener("click", function() {
            window.location.href = "dashboard.html";
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", function() {
            window.history.back();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", function() {
            window.history.forward();
        });
    }

    // QR scanning functionality
    const scanBtn = document.getElementById("scan-qr");
    const uploadBtn = document.getElementById("upload-qr");
    const scanOptions = document.getElementById("scan-options");
    const inspectionBtn = document.getElementById("inspection-btn");
    const reportBtn = document.getElementById("report-btn");
    let qrScanner = null;

    scanBtn.addEventListener("click", async function () {
        try {
            document.getElementById("qr-reader").style.display = "block";
            
            // Initialize scanner only once
            if (!qrScanner) {
                qrScanner = new Html5Qrcode("qr-reader");
            }

            // Start scanning directly with Html5Qrcode's built-in camera handling
            await qrScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    handleScanSuccess(decodedText, qrScanner);
                },
                (errorMessage) => {
                    console.log("Scanning error:", errorMessage);
                }
            );
        } catch (err) {
            document.getElementById("qr-reader").style.display = "none";
            if (qrScanner && qrScanner.isScanning) {
                qrScanner.stop();
            }
            alert(`Camera error: ${err.message}`);
            console.log("Camera access error:", err);
        }
    });

    uploadBtn.addEventListener("click", function () {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = function () {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            handleScanSuccess(code.data);
                        } else {
                            alert("No QR code found in the image.");
                        }
                    };
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    });

    function handleScanSuccess(decodedText, scanner) {
        alert("QR Code Scanned: " + decodedText);
        if (scanner) scanner.stop();
        document.getElementById("qr-reader").style.display = "none";
        
        // Store scanned extinguisher data
        const mockData = {
            id: decodedText,
            type: "ABC",
            location: "Reception",
            weight: "6",
            serviceDate: "2024-06-06",
            expiryDate: "2027-06-05",
            hptDate: "2027-06-05"
        };

        // Store in localStorage for access across views
        localStorage.setItem("currentExtinguisher", JSON.stringify(mockData));
        
        // Show options instead of details directly
        scanOptions.style.display = "block";
    }

    // Inspection Button Click
    inspectionBtn.addEventListener("click", function() {
        const extData = JSON.parse(localStorage.getItem("currentExtinguisher"));
        scanOptions.style.display = "none";
        
        // Only managers can view and edit inspection sheet
        if (userData.role === "manager") {
            window.location.href = "inspection.html";
        } else {
            alert("Only managers can access inspection checksheets.");
        }
    });

    // Report Button Click
    reportBtn.addEventListener("click", function() {
        scanOptions.style.display = "none";
        window.location.href = "report.html";
    });
});