document.addEventListener("DOMContentLoaded", function () {
    const extData = JSON.parse(localStorage.getItem("currentExtinguisher"));
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!userData || userData.role !== "manager") {
        alert("Only managers can view and edit inspection checksheets.");
        window.location.href = "dashboard.html";
        return;
    }

    if (extData) {
        document.getElementById("ext-id").textContent = extData.id;
        document.getElementById("ext-location").textContent = extData.location;
        document.getElementById("ext-type").textContent = extData.type;
        document.getElementById("ext-weight").textContent = extData.weight;
        document.getElementById("ext-serviceDate").textContent = extData.serviceDate;
        document.getElementById("ext-hptDate").textContent = extData.hptDate;
        document.getElementById("inspection-time").textContent = new Date().toLocaleTimeString();
    }

    const saveBtn = document.getElementById("save-inspection-btn");
    saveBtn.addEventListener("click", function () {
        const inspectedBy = document.getElementById("inspected-by").value;
        const inspectionDate = document.getElementById("inspection-date").value;
        const inspectionDueDate = document.getElementById("inspection-due-date").value;

        const checklist = [];
        for (let i = 1; i <= 7; i++) {
            const yes = document.querySelector(`input[name="check${i}"][value="yes"]`).checked;
            const no = document.querySelector(`input[name="check${i}"][value="no"]`).checked;
            const remarks = document.getElementById(`remarks${i}`).value;
            checklist.push({ yes, no, remarks });
        }

        const inspectionDetails = {
            ...extData,
            inspectedBy,
            inspectionDate,
            inspectionDueDate,
            checklist,
            time: new Date().toLocaleTimeString()
        };

        localStorage.setItem("inspectionDetails", JSON.stringify(inspectionDetails));
        alert("Inspection saved!");
        window.location.href = "dashboard.html";
    });
});