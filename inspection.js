document.addEventListener("DOMContentLoaded", function () {
    // Check user role (from second version)
    const userData = JSON.parse(localStorage.getItem("loggedInUser"));
    if (userData?.role !== "manager") {
        alert("Only managers can access this page");
        window.location.href = "dashboard.html";
        return;
    }

    // Try to load extinguisher data from multiple possible sources
    let extData = {};
    
    // Priority 1: Check for current extinguisher data (from second version)
    const currentExtData = JSON.parse(localStorage.getItem("currentExtinguisher"));
    if (currentExtData) {
        extData = currentExtData;
        console.log("Loaded extinguisher data from currentExtinguisher:", extData);
    } 
    // Priority 2: Check for QR scan data (from first version)
    else {
        const qrData = localStorage.getItem("qr_scan_data");
        if (qrData) {
            const parsedData = JSON.parse(qrData);
            console.log("QR Data Loaded:", parsedData);
            
            // Map QR data to our expected format
            extData = {
                id: parsedData.extinguisher_id,
                location: parsedData.location,
                type: parsedData.extinguisher_type,
                weight: parsedData.weight,
                serviceDate: parsedData.service_date,
                hptDate: parsedData.hpt_date
            };
            
            // Clear QR data after using it
            localStorage.removeItem("qr_scan_data");
        } else {
            console.warn("No extinguisher data found!");
        }
    }

    // Auto-fill the extinguisher information
    if (Object.keys(extData).length > 0) {
        document.getElementById("ext-id").textContent = extData.id || extData.extinguisher_id || "N/A";
        document.getElementById("ext-location").textContent = extData.location || "N/A";
        document.getElementById("ext-type").textContent = extData.type || extData.extinguisher_type || "N/A";
        document.getElementById("ext-weight").textContent = extData.weight || "N/A";
        document.getElementById("ext-serviceDate").textContent = extData.serviceDate || extData.service_date || "N/A";
        document.getElementById("ext-hptDate").textContent = extData.hptDate || extData.hpt_date || "N/A";
    }
    
    // Add current time to inspection details
    document.getElementById("inspection-time").textContent = new Date().toLocaleTimeString();

    // Save Inspection and Download CSV
    document.getElementById("save-inspection-btn").addEventListener("click", function () {
        // Validate all checklist fields are filled
        let checklistValues = [];
        let allChecked = true;
        let missedFields = [];
        
        // Check required form fields (from second version)
        const inspectedBy = document.getElementById("inspected-by").value.trim();
        const inspectionDate = document.getElementById("inspection-date").value.trim();
        const inspectionDueDate = document.getElementById("inspection-due-date").value.trim();
        
        if (!inspectedBy) missedFields.push("Inspected By");
        if (!inspectionDate) missedFields.push("Inspection Date");
        if (!inspectionDueDate) missedFields.push("Inspection Due Date");

        // Validate all checklist items
        for (let i = 1; i <= 7; i++) {
            let yes = document.querySelector(`input[name="check${i}"][value="Yes"]:checked`);
            let no = document.querySelector(`input[name="check${i}"][value="No"]:checked`);
            let remarks = document.getElementById(`remarks${i}`).value || "N/A";
            
            if (!yes && !no) {
                allChecked = false;
                missedFields.push(`Checklist item #${i}`);
            } else {
                // Get the full text from the checklist table row
                let checklistText = document.querySelector(`#checklist-table tr:nth-child(${i}) td:first-child`).textContent;
                
                // Remove the serial number (1-7) from the beginning of the text
                // This regex removes numeric prefixes like "1.", "2)", "3. ", etc.
                let cleanedText = checklistText.replace(/^\s*\d+[\s\.\)-]*\s*/, '').trim();
                
                checklistValues.push({
                    checklist: cleanedText,
                    response: yes ? "Yes" : "No",
                    remarks: remarks
                });
            }
        }

        // Show error if any field is missing
        if (!allChecked || missedFields.length > 0) {
            alert(`Please fill all the required fields: ${missedFields.join(", ")}`);
            return;
        }

        // Prepare data for saving and export
        const newInspection = {
            id: extData.id || extData.extinguisher_id || "N/A",
            location: extData.location || "N/A",
            type: extData.type || extData.extinguisher_type || "N/A",
            weight: extData.weight || "N/A",
            serviceDate: extData.serviceDate || extData.service_date || "N/A",
            hptDate: extData.hptDate || extData.hpt_date || "N/A",
            inspectedBy: inspectedBy,
            inspectionDate: inspectionDate,
            inspectionDueDate: inspectionDueDate,
            inspectionTime: document.getElementById("inspection-time").textContent || new Date().toLocaleTimeString(),
            checklist: checklistValues
        };

        // Save to local storage
        let savedInspections = JSON.parse(localStorage.getItem("inspectionRecords")) || {};
        const extId = newInspection.id;
        
        if (!savedInspections[extId]) {
            savedInspections[extId] = [];
        }
        savedInspections[extId].push(newInspection);
        localStorage.setItem("inspectionRecords", JSON.stringify(savedInspections));
        localStorage.setItem("selectedReportId", extId);

        // Format Data for CSV Download according to the required format
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fire Extinguisher S.No,Location,Type of Fire Extinguisher,Weight in Kg,Manufacturing / Refilling Date,HPT Date,Inspected By,Inspection Done on,Time\n";
        csvContent += `${newInspection.id},${newInspection.location},${newInspection.type},${newInspection.weight},${newInspection.serviceDate},${newInspection.hptDate},${newInspection.inspectedBy},${newInspection.inspectionDate},${newInspection.inspectionTime}\n\n`;
        
        // Add checklist section (with cleaned text without serial numbers)
        csvContent += "Checklist,Yes/No,Remarks\n";
        newInspection.checklist.forEach(row => {
            csvContent += `"${row.checklist}","${row.response}","${row.remarks}"\n`;
        });

        // Download CSV file
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Fire_Extinguisher_Inspection_${newInspection.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("Inspection saved successfully!");
        
        // Redirect back to dashboard
        window.location.href = "dashboard.html";
    });

    // Navigation buttons functionality (from second version)
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

    // Report button functionality (from second version)
    if (document.getElementById("report-btn")) {
        document.getElementById("report-btn").addEventListener("click", () => {
            localStorage.setItem("selectedReportId", extData.id || extData.extinguisher_id);
            window.location.href = "report.html";
        });
    }
});