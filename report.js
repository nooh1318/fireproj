document.addEventListener("DOMContentLoaded", () => {
    const selectedReportId = localStorage.getItem("selectedReportId");
    const savedInspections = JSON.parse(localStorage.getItem("inspectionRecords")) || {};
    const reportTable = document.getElementById("report-table");

    if (selectedReportId && savedInspections[selectedReportId]) {
        const inspections = savedInspections[selectedReportId];
        reportTable.innerHTML = "";

        inspections.forEach((inspection, index) => {
            reportTable.innerHTML += `
                <tr>
                    <th>Inspection ${index + 1}</th>
                </tr>
                <tr>
                    <th>S.No</th><td>${inspection.id}</td>
                    <th>Location</th><td>${inspection.location}</td>
                    <th>Type</th><td>${inspection.type}</td>
                </tr>
                <tr>
                    <th>Weight</th><td>${inspection.weight} kg</td>
                    <th>Manufacturing Date</th><td>${inspection.serviceDate}</td>
                    <th>HPT Date</th><td>${inspection.hptDate}</td>
                </tr>
                <tr>
                    <th>Last Inspection</th><td>${inspection.inspectionDate}</td>
                    <th>Next Due</th><td>${inspection.inspectionDueDate}</td>
                    <th>Inspected By</th><td>${inspection.inspectedBy}</td>
                </tr>
                <tr>
                    <th colspan="6">Checklist</th>
                </tr>
            `;
            inspection.checklist.forEach((item, i) => {
                reportTable.innerHTML += `
                    <tr>
                        <td>Check ${i + 1}</td>
                        <td>${item.status}</td>
                        <td colspan="4">${item.remarks}</td>
                    </tr>
                `;
            });
        });
        
    } else {
        reportTable.innerHTML = "<tr><td colspan='6'>No inspections found for this extinguisher.</td></tr>";
    }
    document.getElementById("prev-btn").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
    document.getElementById("home-btn").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

});