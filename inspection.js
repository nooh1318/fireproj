document.addEventListener("DOMContentLoaded", () => {
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    if (userData?.role !== "manager") {
        alert("Only managers can access this page");
        window.location.href = "dashboard.html";
        return;
    }

    const extData = JSON.parse(localStorage.getItem("currentExtinguisher")) || {};
    
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

    // Save handler
    document.getElementById("save-inspection-btn").addEventListener("click", () => {
        const inspectionData = {
            ...extData,
            inspectedBy: document.getElementById("inspected-by").value,
            inspectionDate: document.getElementById("inspection-date").value,
            inspectionDueDate: document.getElementById("inspection-due-date").value,
            checklist: Array.from({length: 7}, (_, i) => ({
                status: document.querySelector(`input[name="check${i+1}"]:checked`)?.value || "",
                remarks: document.getElementById(`remarks${i+1}`).value
            }))
        };

        localStorage.setItem("inspectionDetails", JSON.stringify(inspectionData));
        alert("Inspection saved successfully!");
        window.location.href = "dashboard.html";
    });
});