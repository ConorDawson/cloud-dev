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
            console.log("Start Date:", startDate);
            console.log("End Date:", endDate);
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
        
        let allHoursWorked = 0;
        let totalCost = 0;
        let totalClientPayment = 0;
        
        // Function to sort data
        const sortData = (data, column, isAscending) => {
            return data.sort((a, b) => {
                let aValue = a[column];
                let bValue = b[column];
    
                // Convert values to numbers if they are numeric
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }
    
                // Handle string and number sorting
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return isAscending 
                        ? aValue.localeCompare(bValue) 
                        : bValue.localeCompare(aValue);
                } else {
                    return isAscending ? aValue - bValue : bValue - aValue;
                }
            });
        };
    
        // Dropdown element for sorting
        const sortDropdown = document.getElementById('sortDropdown');
        let isAscending = true;
    
        // Listen for changes in the dropdown
        sortDropdown.addEventListener('change', () => {
            const column = sortDropdown.value;
            isAscending = !isAscending; // Toggle ascending/descending every time the dropdown is changed
            const sortedData = sortData(clientData, column, isAscending);
            renderTable(sortedData);
        });
        
        // Function to render sorted data
        function renderTable(sortedData) {
            tableBody.innerHTML = ''; // Clear existing rows before rendering sorted ones
            let allHoursWorked = 0;
            let totalCost = 0;
            let totalClientPayment = 0;
    
            sortedData.forEach((client) => {
                // Parse numerical values safely
                const totalHoursWorked = parseFloat(client['Total Hours Worked']) || 0;
                const cost = parseFloat(client.Cost) || 0;
                const clientPayment = parseFloat(client['Client Payment']) || 0;
        
                // Accumulate totals
                allHoursWorked += totalHoursWorked;
                totalCost += cost;
                totalClientPayment += clientPayment;
        
                // Calculate rounded profit/loss percentage with arrow sign
                const profitLossPercentage = ((clientPayment - cost) / (cost || 1)) * 100;
                const profitLossSign = profitLossPercentage > 0 ? '↑' : profitLossPercentage < 0 ? '↓' : '';
                const profitLossColor = profitLossPercentage > 0 ? 'green' : profitLossPercentage < 0 ? 'red' : 'black';
                const profitLossStyle = `color: ${profitLossColor}; font-weight: bold;`;
        
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class ="clientName"><strong>${client.Client}</strong></td>
                    <td>${totalHoursWorked.toFixed(1)}</td>
                    <td>€${cost.toFixed(2)}</td>
                    <td>€${clientPayment.toFixed(2)}</td>
                    <td style="${profitLossStyle}">${profitLossPercentage.toFixed(2)}% ${profitLossSign}</td>
                    <td><button class="detailButton" data-client="${client.Client}" data-start-date="${startDate}" data-end-date="${endDate}"><i class="fa-solid fa-circle-info"></i></button></td>
                `;
                tableBody.appendChild(row);
            });
    
            // Test negative value for demonstration
            const testnegative = -1000;
            const testProfitLossPercentage = ((testnegative - 1000) / (1000 || 1)) * 100;
            const testProfitLossColor = testProfitLossPercentage < 0 ? 'red' : 'green';
            const testProfitLossSign = testProfitLossPercentage > 0 ? '↑' : testProfitLossPercentage < 0 ? '↓' : '';
            const testProfitLossStyle = `color: ${testProfitLossColor}; font-weight: bold;`;
    
            const testRow = document.createElement('tr');
            testRow.innerHTML = `
                <td class ="clientName">Test</td>
                <td>Test</td>
                <td>Test</td>
                <td>Test</td>
                <td style="${testProfitLossStyle}">${testProfitLossPercentage.toFixed(2)}%${testProfitLossSign}</td>
                <td>Test</td>
            `;
            tableBody.appendChild(testRow);
    
            // Calculate overall profit/loss percentage
            const totalProfitLossPercentage = ((totalClientPayment - totalCost) / (totalCost || 1)) * 100;
            const totalProfitLossSign = totalProfitLossPercentage > 0 ? '↑' : totalProfitLossPercentage < 0 ? '↓' : '';
            const totalProfitLossColor = totalProfitLossPercentage > 0 ? 'green' : totalProfitLossPercentage < 0 ? 'red' : 'black';
            const totalProfitLossStyle = `color: ${totalProfitLossColor}; font-weight: bold;`;
        
            // Create and append the total row
            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `
                <td ><strong>Total</strong></td>
                <td><strong>${allHoursWorked.toFixed(1)}</strong></td>
                <td><strong>€${totalCost.toFixed(2)}</strong></td>
                <td><strong>€${totalClientPayment.toFixed(2)}</strong></td> 
                <td style="${totalProfitLossStyle}"><strong>${totalProfitLossPercentage.toFixed(2)}% ${totalProfitLossSign}</strong></td>
                <td></td>
            `;
            tableBody.appendChild(totalRow);
        
            // Add event listeners for "View Details" buttons
            document.querySelectorAll('.detailButton').forEach(button => {
                button.addEventListener('click', function () {
                    const clientName = this.getAttribute("data-client");
                    const startDate = this.getAttribute("data-start-date");
                    const endDate = this.getAttribute("data-end-date");
                    showClientToast(clientName, startDate, endDate);
                });
            });
        }
    
        // Initially render the table with unsorted data
        renderTable(clientData);
    }

       
    
      
    
        async function createCharts(startDate, endDate) {
            
            Chart.helpers.each(Chart.instances, function(instance){
                instance.destroy();
            });
            const clientData = await fetchClientHours(startDate, endDate);
            
            console.log("Client Data:", clientData); 

            document.querySelector('.paymentsChartHeader').innerText = "Client Payments (€)";
            document.querySelector('.profitLossChartHeader').innerText = "Profit/Loss Percentage (%)";
            document.querySelector('.costChartHeader').innerText = "Cost Distribution (€)";
    
            const clients = clientData.map(client => client.Client);
            const hoursWorked = clientData.map(client => parseFloat(client['Total Hours Worked']) || 0);
            const costs = clientData.map(client => parseFloat(client.Cost) || 0);
            const payments = clientData.map(client => parseFloat(client['Client Payment']) || 0);
            const profitLossPercentages = clientData.map(client => {
                const profitLossPercentage = ((parseFloat(client['Client Payment']) - parseFloat(client.Cost)) / (parseFloat(client.Cost) || 1)) * 100;
                return profitLossPercentage.toFixed(2);
            });
    
            console.log("Clients:", clients); 
            console.log("Payments:", payments);
            console.log("Profit/Loss Percentages:", profitLossPercentages);
    
            // Bar Chart for Client Payments
            const paymentsChartContext = document.getElementById('paymentsChart').getContext('2d');
            new Chart(paymentsChartContext, {
                type: 'bar',
                data: {
                    labels: clients,
                    datasets: [{
                        label: 'Client Payments (€)',
                        data: payments,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            indexAxis: '1000'
                        }
                    }
                }
            });
    
            // Line Chart for Profit/Loss Percentage
            const profitLossChartContext = document.getElementById('profitLossChart').getContext('2d');
            new Chart(profitLossChartContext, {
                type: 'line',
                data: {
                    labels: clients,
                    datasets: [{
                        label: 'Profit/Loss Percentage (%)',
                        data: profitLossPercentages,
                        borderColor: 'rgb(227, 125, 227)',
                        borderWidth: 2,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
    
            // Pie Chart for Cost Distribution
            const costChartContext = document.getElementById('costChart').getContext('2d');
            new Chart(costChartContext, {
                type: 'pie',
                data: {
                    labels: clients,
                    datasets: [{
                        label: 'Costs (€)',
                        data: costs,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)',
                            'rgba(199, 199, 199, 0.6)',
                            'rgba(83, 102, 255, 0.6)',
                            'rgba(183, 159, 64, 0.6)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(199, 199, 199, 1)',
                            'rgba(83, 102, 255, 1)',
                            'rgba(183, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true
                }
            });
            
        }
        
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        createCharts(startDate, endDate);
    
    
    
        

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
        overlay.style.display = "block"; 

        // Close modal on button click
        toast.querySelector(".close-toast").addEventListener("click", function () {
            toast.classList.remove("show");
            overlay.style.display = "none"; 
            setTimeout(() => toast.remove(), 500); 
        });

        // Close modal when clicking outside
        overlay.addEventListener("click", function () {
            toast.classList.remove("show");
            overlay.style.display = "none";
            setTimeout(() => toast.remove(), 500);
        });

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
        createCharts(selectedStartDate, selectedEndDate);
    });




    // Download main table as CSV
    document.getElementById('downloadReport').addEventListener('click', () => {
        const table = document.getElementById('reportTable');
        const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.innerText));
        const csvContent = rows.map(rowArray => rowArray.join(",")).join("\n");
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const fileName = `Current_Profit_Loss_Percentages_for_${startDate}_to_${endDate}.csv`;
    
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
};
