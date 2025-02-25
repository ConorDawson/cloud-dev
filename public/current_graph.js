window.onload = async function () {
    console.log(sessionStorage.getItem("lastname") + " " + sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("employee_id"));

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const generateReportButton = document.getElementById('generateReport');
    const tableBody = document.getElementById('reportTableBody');
    const modal = document.getElementById("clientModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    const closeModalBtn = document.getElementById("closeModal");

    // Get current date and first day of the year
    const today = new Date().toISOString().split('T')[0];
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    // Set default values
    startDateInput.value = startOfYear;
    endDateInput.value = today;
    endDateInput.max = today; // Prevent future dates

    async function fetchClientHours(startDate, endDate) {
        try {
            const response = await axios.get(`/api/client_hours`, {
                params: { start_date: startDate, end_date: endDate }
            });
            console.log("Client data fetched successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching client data:", error);
            return [];
        }
    }

    async function updateTable(startDate, endDate) {
        tableBody.innerHTML = ''; // Clear previous data
        const clientData = await fetchClientHours(startDate, endDate);

        clientData.forEach((client) => {
            // Calculate rounded profit/loss percentage and add an arrow
            const profitLossPercentage = parseFloat(client['Profit/Loss %']).toFixed(2);
            const profitLossSign = profitLossPercentage > 0 ? '↑' : profitLossPercentage < 0 ? '↓' : '';
            const profitLossColor = profitLossPercentage > 0 ? 'green' : profitLossPercentage < 0 ? 'red' : 'black';
            const profitLossStyle = `color: ${profitLossColor}; font-weight: bold;`;

            const clientName = 'client.Client; font-weight: bold;';
            const clientPayment = parseFloat(client['Client Payment']).toFixed(2);
            const cost = parseFloat(client.Cost).toFixed(2);
            const totalHoursWorked = parseFloat(client['Total Hours Worked']).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.Client}</td>
                <td>${totalHoursWorked}</td>
                <td>€${cost}</td>
                <td>€${clientPayment}</td>
                <td>${profitLossPercentage}% ${profitLossSign}</td>
                <td><button class="detailButton" data-client="${client.Client}" data-start-date="${startDate}" data-end-date="${endDate}"><i class="fa-solid fa-circle-info"></i></button></td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners for the "View Details" buttons
        document.querySelectorAll('.detailButton').forEach(button => {
            button.addEventListener('click', function () {
                const clientName = this.getAttribute("data-client");
                const startDate = this.getAttribute("data-start-date");
                const endDate = this.getAttribute("data-end-date");
                showClientToast(clientName, startDate, endDate);
            });
        });
    }

    function showClientToast(clientName, startDate, endDate) {
        // Create overlay if it doesn't exist
        let overlay = document.getElementById("toast-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "toast-overlay";
            document.body.appendChild(overlay);
        }

        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById("toast-container");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toast-container";
            document.body.appendChild(toastContainer);
        }

        // Create toast box
        let toast = document.createElement("div");
        toast.className = "toast show";
        toast.innerHTML = `
            <strong>${clientName} Monthly Breakdown Between ${startDate} and ${endDate}</strong>
            <table border="1" style="width: 100%; text-align: center; margin-top: 5px;">
                <tr>
                    <th>Month</th>
                    <th>Hours Worked</th>
                    <th>Cost</th>
                    <th>Client Payment</th>
                    <th>Profit/Loss %</th>
                </tr>
                <tbody id="toast-table-body">
                </tbody>
            </table>
            <button class="close-toast">Close</button>
            <button id="downloadDetailedReport">Download Report</button>
        `;

        toastContainer.appendChild(toast);
        overlay.style.display = "block"; // Show overlay

        // Close modal on button click
        toast.querySelector(".close-toast").addEventListener("click", function () {
            toast.classList.remove("show");
            overlay.style.display = "none"; // Hide overlay
            setTimeout(() => toast.remove(), 500); // Remove after animation
        });

        // Close modal when clicking outside
        overlay.addEventListener("click", function () {
            toast.classList.remove("show");
            overlay.style.display = "none";
            setTimeout(() => toast.remove(), 500);
        });

        // Fetch data from API and populate the table
        fetch(`/api/monthly_report?client=${clientName}&start_date=${startDate}&end_date=${endDate}`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById("toast-table-body");
                for (let month in data) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${month}</td>
                        <td>${data[month]["Total Hours Worked"]}</td>
                        <td>${data[month]["Total Cost"]}</td>
                        <td>${data[month]["Client Payment"]}</td>
                        <td>${data[month]["Profit/Loss %"]}</td>
                    `;
                    tableBody.appendChild(row);
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // Load default data on page load
    updateTable(startOfYear, today);

    // Fetch & update data when 'Generate Report' is clicked
    generateReportButton.addEventListener('click', () => {
        const selectedStartDate = startDateInput.value;
        const selectedEndDate = endDateInput.value;

        if (selectedStartDate > selectedEndDate) {
            alert("Start date cannot be after the end date.");
            return;
        }

        updateTable(selectedStartDate, selectedEndDate);
    });




    // Download main table as CSV
    document.getElementById('downloadReport').addEventListener('click', () => {
        const table = document.getElementById('reportTable');
        const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.innerText));
        const csvContent = rows.map(rowArray => rowArray.join(",")).join("\n");
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const fileName = `Current_Profit_Loss_Percentages_for_${startDate}_to_${endDate}.xlsx`;
    
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
};
