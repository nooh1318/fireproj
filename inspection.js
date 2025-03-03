document.addEventListener("DOMContentLoaded", () => {
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    if (userData?.role !== "manager") {
        alert("Only managers can access this page");
        window.location.href = "dashboard.html";
        return;
    }

    const extData = JSON.parse(localStorage.getItem("currentExtinguisher")) || {};
    let savedInspections = JSON.parse(localStorage.getItem("inspectionRecords")) || {};
    
    // Auto-fill inspection data
    const elements = {
        "ext-id": extData.id,
        "ext-location": extData.location,
        "ext-type": extData.type,
        "ext-weight": extData.weight,
        "ext-serviceDate": extData.serviceDate,
        "ext-hptDate": extData.hptDate
    };

    Object.entries(elements).forEach(([id, value]) => {
        document.getElementById(id).textContent = value;
    });

    document.getElementById("inspection-time").textContent = new Date().toLocaleTimeString();

    // Function to download inspection as Excel
    function downloadInspectionAsExcel(inspection) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "S.No,Location,Type,Weight,Manufacturing Date,HPT Date,Inspected By,Inspection Date,Inspection Due Date\n";
        csvContent += `${inspection.id},${inspection.location},${inspection.type},${inspection.weight},${inspection.serviceDate},${inspection.hptDate},${inspection.inspectedBy},${inspection.inspectionDate},${inspection.inspectionDueDate}\n`;
        
        csvContent += "\nChecklist:\n";
        csvContent += "Check No,Status,Remarks\n";
        inspection.checklist.forEach((item, index) => {
            csvContent += `${index + 1},${item.status},${item.remarks}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Inspection_${inspection.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Save handler
    document.getElementById("save-inspection-btn").addEventListener("click", () => {
        const newInspection = {
            id: extData.id,
            location: extData.location,
            type: extData.type,
            weight: extData.weight,
            serviceDate: extData.serviceDate,
            hptDate: extData.hptDate,
            inspectedBy: document.getElementById("inspected-by").value,
            inspectionDate: document.getElementById("inspection-date").value,
            inspectionDueDate: document.getElementById("inspection-due-date").value,
            checklist: Array.from({ length: 7 }, (_, i) => ({
                status: document.querySelector(`input[name="check${i + 1}"]:checked`)?.value || "",
                remarks: document.getElementById(`remarks${i + 1}`).value
            }))
        };

        if (!savedInspections[extData.id]) {
            savedInspections[extData.id] = [];
        }
        savedInspections[extData.id].push(newInspection);
        localStorage.setItem("inspectionRecords", JSON.stringify(savedInspections));
        localStorage.setItem("selectedReportId", extData.id); // Ensure the correct report ID is stored
        alert("Inspection saved successfully!");

        // Download the inspection as an Excel file
        downloadInspectionAsExcel(newInspection);
        
        // Redirect back to dashboard where Inspection & Report buttons are available
        window.location.href = "dashboard.html";
    });

    // Navigation buttons functionality
    document.getElementById("home-btn").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    document.getElementById("prev-btn").addEventListener("click", () => {
        window.history.back();
    });

    document.getElementById("next-btn").addEventListener("click", () => {
        window.history.forward();
    });

    // Report button functionality
    document.getElementById("report-btn").addEventListener("click", () => {
        localStorage.setItem("selectedReportId", extData.id);
        window.location.href = "report.html";
    });
});
