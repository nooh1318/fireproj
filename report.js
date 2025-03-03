document.addEventListener("DOMContentLoaded", () => {
    const inspectionData = JSON.parse(localStorage.getItem("inspectionDetails"));
    const reportTable = document.getElementById("report-table");

    if (inspectionData) {
        reportTable.innerHTML = `
            <tr>
                <th>S.No</th><td>${inspectionData.id}</td>
                <th>Location</th><td>${inspectionData.location}</td>
                <th>Type</th><td>${inspectionData.type}</td>
            </tr>
            <tr>
                <th>Weight</th><td>${inspectionData.weight} kg</td>
                <th>Manufacturing Date</th><td>${inspectionData.serviceDate}</td>
                <th>HPT Date</th><td>${inspectionData.hptDate}</td>
            </tr>
            <tr>
                <th>Last Inspection</th><td>${inspectionData.inspectionDate}</td>
                <th>Next Due</th><td>${inspectionData.inspectionDueDate}</td>
                <th>Inspected By</th><td>${inspectionData.inspectedBy}</td>
            </tr>
            <tr>
                <td colspan="6">
                    <button onclick="window.location.href='inspection.html'">View Full Checklist</button>
                </td>
            </tr>
        `;
    }
});