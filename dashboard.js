document.addEventListener("DOMContentLoaded", function () {
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!userData) {
        alert("No user logged in. Redirecting to login page.");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("user-name").textContent = userData.email.split("@")[0];

    // QR Scanner Setup
    let qrScanner = null;
    const scanOptions = document.getElementById("scan-options");

    document.getElementById("scan-qr").addEventListener("click", async () => {
        try {
            qrScanner = new Html5Qrcode("qr-reader");
            await qrScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    handleScanSuccess(decodedText);
                    qrScanner.stop();
                },
                (error) => console.error("QR Scan Error:", error)
            );
            document.getElementById("qr-reader").style.display = "block";
        } catch (err) {
            alert(`Camera Error: ${err.message}`);
        }
    });

    document.getElementById("upload-qr").addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/png, image/jpeg";
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) handleScanSuccess(code.data);
                    else alert("No QR code found");
                };
            };
            reader.readAsDataURL(file);
        };
        fileInput.click();
    });

    function handleScanSuccess(decodedText) {
        const qrData = {};
        decodedText.split("\n").forEach(line => {
            const [key, value] = line.split(": ");
            if(key && value) qrData[key.trim()] = value.trim();
        });

        const extinguisherData = {
            id: qrData["S.No"] || "N/A",
            type: qrData["Type of Fire Extinguisher"] || "ABC",
            location: qrData.Location || "Reception",
            weight: qrData["Weight in Kg"] || "6",
            serviceDate: qrData["Manufacturing / Refilling Date"] || "2024-06-06",
            hptDate: qrData["HPT Date"] || "2027-06-05"
        };

        localStorage.setItem("currentExtinguisher", JSON.stringify(extinguisherData));
        scanOptions.style.display = "flex";
    }

    document.getElementById("inspection-btn").addEventListener("click", () => {
        if (userData.role === "manager") window.location.href = "inspection.html";
        else alert("Only managers can perform inspections");
    });

    document.getElementById("report-btn").addEventListener("click", () => {
        window.location.href = "report.html";
    });
    
    document.getElementById("prev-btn").addEventListener("click", () => {
        window.location.href = "index.html";
    });
    
    document.getElementById("next-btn").addEventListener("click", () => {
        window.location.href = "report.html";
    });


});