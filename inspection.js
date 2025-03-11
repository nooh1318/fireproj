document.addEventListener("DOMContentLoaded", function () {
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    if (userData?.role !== "manager") {
        alert("Only managers can access this page");
        window.location.href = "dashboard.html";
        return;
    }

    let extData = {};
    const currentExtData = JSON.parse(localStorage.getItem("currentExtinguisher"));
    if (currentExtData) {
        extData = currentExtData;
    } else {
        const qrData = localStorage.getItem("qr_scan_data");
        if (qrData) {
            const parsedData = JSON.parse(qrData);
            extData = {
                id: parsedData.extinguisher_id,
                location: parsedData.location,
                type: parsedData.extinguisher_type,
                weight: parsedData.weight,
                serviceDate: parsedData.service_date,
                hptDate: parsedData.hpt_date
            };
            localStorage.removeItem("qr_scan_data");
        }
    }

    if (Object.keys(extData).length > 0) {
        document.getElementById("ext-id").textContent = extData.id || "N/A";
        document.getElementById("ext-location").textContent = extData.location || "N/A";
        document.getElementById("ext-type").textContent = extData.type || "N/A";
        document.getElementById("ext-weight").textContent = extData.weight || "N/A";
        document.getElementById("ext-serviceDate").textContent = extData.serviceDate || "N/A";
        document.getElementById("ext-hptDate").textContent = extData.hptDate || "N/A";
    }

    document.getElementById("inspection-time").textContent = new Date().toLocaleTimeString();

    // Function to check daily inspection limit
    function checkInspectionLimit() {
        const today = new Date().toISOString().split("T")[0]; // Get current date (YYYY-MM-DD)
        const userInspections = JSON.parse(localStorage.getItem("userInspections")) || {};

        if (!userInspections[userData.email]) {
            userInspections[userData.email] = {};
        }

        if (!userInspections[userData.email][today]) {
            userInspections[userData.email][today] = 0;
        }

        if (userInspections[userData.email][today] >= 3) {
            alert("You have reached the maximum of 3 inspections for today.");
            return false;
        }

        return true;
    }

    // Save Inspection and Download CSV
    document.getElementById("save-inspection-btn").addEventListener("click", function () {
        if (!checkInspectionLimit()) return;

        let checklistValues = [];
        let allChecked = true;
        let missedFields = [];

        const inspectedBy = document.getElementById("inspected-by").value.trim();
        const inspectionDate = document.getElementById("inspection-date").value.trim();
        const inspectionDueDate = document.getElementById("inspection-due-date").value.trim();

        if (!inspectedBy) missedFields.push("Inspected By");
        if (!inspectionDate) missedFields.push("Inspection Date");
        if (!inspectionDueDate) missedFields.push("Inspection Due Date");

        for (let i = 1; i <= 7; i++) {
            let yes = document.querySelector(`input[name="check${i}"][value="Yes"]:checked`);
            let no = document.querySelector(`input[name="check${i}"][value="No"]:checked`);
            let remarks = document.getElementById(`remarks${i}`).value || "N/A";

            if (!yes && !no) {
                allChecked = false;
                missedFields.push(`Checklist item #${i}`);
            } else {
                let checklistText = document.querySelector(`#checklist-table tr:nth-child(${i}) td:first-child`).textContent;
                let cleanedText = checklistText.replace(/^\s*\d+[\s\.\)-]*\s*/, '').trim();

                checklistValues.push({
                    checklist: cleanedText,
                    response: yes ? "Yes" : "No",
                    remarks: remarks
                });
            }
        }

        if (!allChecked || missedFields.length > 0) {
            alert(`Please fill all the required fields: ${missedFields.join(", ")}`);
            return;
        }

        const newInspection = {
            id: extData.id || "N/A",
            location: extData.location || "N/A",
            type: extData.type || "N/A",
            weight: extData.weight || "N/A",
            serviceDate: extData.serviceDate || "N/A",
            hptDate: extData.hptDate || "N/A",
            inspectedBy: inspectedBy,
            inspectionDate: inspectionDate,
            inspectionDueDate: inspectionDueDate,
            inspectionTime: document.getElementById("inspection-time").textContent || new Date().toLocaleTimeString(),
            checklist: checklistValues
        };

        let savedInspections = JSON.parse(localStorage.getItem("inspectionRecords")) || {};
        const extId = newInspection.id;

        if (!savedInspections[extId]) {
            savedInspections[extId] = [];
        }
        savedInspections[extId].push(newInspection);
        localStorage.setItem("inspectionRecords", JSON.stringify(savedInspections));
        localStorage.setItem("selectedReportId", extId);

        // Update inspection count for the user
        const today = new Date().toISOString().split("T")[0];
        let userInspections = JSON.parse(localStorage.getItem("userInspections")) || {};
        if (!userInspections[userData.email]) {
            userInspections[userData.email] = {};
        }
        if (!userInspections[userData.email][today]) {
            userInspections[userData.email][today] = 0;
        }
        userInspections[userData.email][today]++;
        localStorage.setItem("userInspections", JSON.stringify(userInspections));

        // Format Data for CSV Download
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fire Extinguisher S.No,Location,Type,Weight,Manufacturing Date,HPT Date,Inspected By,Inspection Date,Inspection Time\n";
        csvContent += `${newInspection.id},${newInspection.location},${newInspection.type},${newInspection.weight},${newInspection.serviceDate},${newInspection.hptDate},${newInspection.inspectedBy},${newInspection.inspectionDate},${newInspection.inspectionTime}\n\n`;

        csvContent += "Checklist,Yes/No,Remarks\n";
        newInspection.checklist.forEach(row => {
            csvContent += `"${row.checklist}","${row.response}","${row.remarks}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Fire_Extinguisher_Inspection_${newInspection.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert("Inspection saved successfully!");
        window.location.href = "dashboard.html";
    });

    if (document.getElementById("home-btn")) {
        document.getElementById("home-btn").addEventListener("click", () => {
            window.location.href = "dashboard.html";
        });
    }

    if (document.getElementById("prev-btn")) {
        document.getElementById("prev-btn").addEventListener("click", () => {
            window.history.back();
        });
    }

    if (document.getElementById("next-btn")) {
        document.getElementById("next-btn").addEventListener("click", () => {
            window.history.forward();
        });
    }

    if (document.getElementById("report-btn")) {
        document.getElementById("report-btn").addEventListener("click", () => {
            localStorage.setItem("selectedReportId", extData.id || extData.extinguisher_id);
            window.location.href = "report.html";
        });
    }
});
