document.addEventListener("DOMContentLoaded", () => {
    const selectedReportId = localStorage.getItem("selectedReportId");
    const savedInspections = JSON.parse(localStorage.getItem("inspectionRecords")) || {};
    const reportTable = document.getElementById("report-table");

    if (selectedReportId && savedInspections[selectedReportId] && savedInspections[selectedReportId].length > 0) {
        const inspections = savedInspections[selectedReportId];
        reportTable.innerHTML = "";

        inspections.forEach((inspection, index) => {
            // Basic extinguisher information
            reportTable.innerHTML += `
                <tr>
                    <th colspan="6" class="section-header">Inspection ${index + 1}</th>
                </tr>
                <tr>
                    <th>S.No</th><td>${inspection.id || 'N/A'}</td>
                    <th>Location</th><td>${inspection.location || 'N/A'}</td>
                    <th>Type</th><td>${inspection.type || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Weight</th><td>${inspection.weight || 'N/A'} kg</td>
                    <th>Manufacturing Date</th><td>${inspection.serviceDate || 'N/A'}</td>
                    <th>HPT Date</th><td>${inspection.hptDate || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Last Inspection</th><td>${inspection.inspectionDate || 'N/A'}</td>
                    <th>Next Due</th><td>${inspection.inspectionDueDate || 'N/A'}</td>
                    <th>Inspected By</th><td>${inspection.inspectedBy || 'N/A'}</td>
                </tr>
            `;
            
            // Checklist headers (removed the extra "Checklist" row)
            reportTable.innerHTML += `
                <tr>
                    <th colspan="2">Checklist</th>
                    <th>Yes/No</th>
                    <th colspan="3">Remarks</th>
                </tr>
            `;
            
            // Define the checklist names in case they're not properly stored in the inspection data
            const checklistNames = [
                "Located in Designated Place",
                "Readily Visible not obstructed",
                "Fire extinguisher is in good condition.",
                "Inspect tamper seal and safety pin ( which holds safety pin inplace )",
                "Check pressure gauge ( if green its good for use , red- overcharged, and yellow – low charged)",
                "Check fire extinguisher body for any corrosion/physical damage",
                "Inspect hose and nozzle for any defects"
            ];

            // Ensure the checklist array exists in the inspection data
            if (inspection.checklist && Array.isArray(inspection.checklist)) {
                // Display checklist items from inspection data
                inspection.checklist.forEach((item, i) => {
                    // Use the item's checklist text if available, otherwise fall back to predefined names
                    const checklistText = item.checklist || checklistNames[i] || `Checklist Item ${i+1}`;
                    const response = item.response || 'N/A';
                    const remarks = item.remarks || 'N/A';
                    
                    reportTable.innerHTML += `
                        <tr>
                            <td colspan="2">${checklistText}</td>
                            <td>${response}</td>
                            <td colspan="3">${remarks}</td>
                        </tr>
                    `;
                });
            } else {
                reportTable.innerHTML += `
                    <tr>
                        <td colspan="6">No checklist data available for this inspection.</td>
                    </tr>
                `;
            }
            
            // Add a spacer row between inspections
            if (index < inspections.length - 1) {
                reportTable.innerHTML += `
                    <tr>
                        <td colspan="6" style="height: 30px;"></td>
                    </tr>
                `;
            }
        });
        
    } else {
        reportTable.innerHTML = "<tr><td colspan='6'>No inspections found for this extinguisher.</td></tr>";
    }

    // Save Report functionality
    document.getElementById("save-report-btn").addEventListener("click", () => {
        if (!selectedReportId || !savedInspections[selectedReportId] || savedInspections[selectedReportId].length === 0) {
            alert("No inspection data available to save.");
            return;
        }
        
        const inspections = savedInspections[selectedReportId];
        
        // Format Data for CSV Download with proper formatting
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fire Extinguisher Report\n\n";
        csvContent += "S.No,Location,Type,Weight,Manufacturing Date,HPT Date,Inspected By,Inspection Date,Inspection Due Date\n";
        
        inspections.forEach((inspection, index) => {
            csvContent += `${inspection.id || 'N/A'},${inspection.location || 'N/A'},${inspection.type || 'N/A'},${inspection.weight || 'N/A'},${inspection.serviceDate || 'N/A'},${inspection.hptDate || 'N/A'},${inspection.inspectedBy || 'N/A'},${inspection.inspectionDate || 'N/A'},${inspection.inspectionDueDate || 'N/A'}\n`;
            
            // Add checklist for each inspection
            if (index === 0) {
                csvContent += "\nChecklist Details:\n";
                csvContent += "Inspection,Checklist Item,Status,Remarks\n";
            }
            
            if (inspection.checklist && Array.isArray(inspection.checklist)) {
                inspection.checklist.forEach(item => {
                    // Clean the data to avoid CSV formatting issues
                    const cleanText = item.checklist ? item.checklist.replace(/"/g, '""') : 'N/A';
                    const cleanResponse = item.response ? item.response.replace(/"/g, '""') : 'N/A';
                    const cleanRemarks = item.remarks ? item.remarks.replace(/"/g, '""') : 'N/A';
                    
                    csvContent += `"Inspection ${index + 1}","${cleanText}","${cleanResponse}","${cleanRemarks}"\n`;
                });
            }
            
            // Add a blank line between inspections
            csvContent += "\n";
        });

        // Add summary information
        csvContent += "\nSummary:\n";
        csvContent += `Total Inspections,${inspections.length}\n`;
        csvContent += `Last Inspection Date,${inspections[inspections.length - 1].inspectionDate || 'N/A'}\n`;
        csvContent += `Next Due Date,${inspections[inspections.length - 1].inspectionDueDate || 'N/A'}\n`;
        csvContent += `Report Generated On,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;

        // Download CSV file
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Fire_Extinguisher_Report_${selectedReportId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("Report saved successfully!");
    });

    // Navigation functionality
    document.getElementById("prev-btn").addEventListener("click", () => {
        window.history.back();
    });
    
    document.getElementById("next-btn").addEventListener("click", () => {
        window.history.forward();
    });
    
    document.getElementById("home-btn").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
});