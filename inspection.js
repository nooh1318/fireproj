document.addEventListener("DOMContentLoaded", function () {
    const extData = JSON.parse(localStorage.getItem("currentExtinguisher"));
    const inspectionTable = document.getElementById("inspection-table");

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
        inspectionTable.innerHTML = tableContent;
    }

    const saveBtn = document.getElementById("save-inspection-btn");
    saveBtn.addEventListener("click", function() {
        alert("Inspection saved!");
        window.location.href = "dashboard.html";
    });
});