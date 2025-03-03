document.addEventListener("DOMContentLoaded", function () {
    const extData = JSON.parse(localStorage.getItem("currentExtinguisher"));
    const reportTable = document.getElementById("report-table");

    if (extData) {
        const tableContent = `
            <tr>
                <th>Fire Extinguisher S.No</th>
                <td>${extData.id}</td>
            </tr>
            <tr>
                <th>Location</th>
                <td>${extData.location}</td>
            </tr>
            <tr>
                <th>Type of Fire Extinguisher</th>
                <td>${extData.type}</td>
            </tr>
            <tr>
                <th>Weight in Kg</th>
                <td>${extData.weight}</td>
            </tr>
            <tr>
                <th>Manufacturing / Refilling Date</th>
                <td>${extData.serviceDate}</td>
            </tr>
            <tr>
                <th>HPT Date</th>
                <td>${extData.hptDate}</td>
            </tr>
        `;
        reportTable.innerHTML = tableContent;
    }
});