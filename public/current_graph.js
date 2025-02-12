window.onload = async function() {
    console.log(sessionStorage.getItem("lastname") + " " + sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("employee_id"));

    let clientHoursChart;  // Store the chart instance

    try {
        // Fetch client data for dropdown
        const response = await axios.get('/api/client_hours');
        const clientData = response.data;

        // Populate the client dropdown with the available client names
        const clientDropdown = document.getElementById('client');
        Object.keys(clientData).forEach(client => {
            const option = document.createElement('option');
            option.value = client;
            option.textContent = client;
            clientDropdown.appendChild(option);
        });

        // Populate the year dropdown with years from 2010 to the current year
        const yearDropdown = document.getElementById('year');
        const currentYear = new Date().getFullYear();
        for (let year = 2010; year <= currentYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearDropdown.appendChild(option);
        }

        // Event listener for when user selects client and year and clicks the "Generate Report" button
        document.getElementById('generateReport').addEventListener('click', async () => {
            const selectedClient = clientDropdown.value;
            const selectedYear = yearDropdown.value;

            if (selectedClient && selectedYear) {
                try {
                    // Fetch the monthly breakdown data for the selected client and year
                    const reportResponse = await axios.get('/api/monthly_report', {
                        params: { client: selectedClient, year: selectedYear }
                    });

                    const monthlyData = reportResponse.data;

                    // Prepare the data for the chart (12 months)
                    const months = [];
                    const hours = [];
                    for (let i = 1; i <= 12; i++) {
                        months.push(i);
                        hours.push(monthlyData[i] || 0);  // Use 0 if no data for that month
                    }

                    // If chart already exists, destroy it before creating a new one
                    if (clientHoursChart) {
                        clientHoursChart.destroy();  
                    }

                    // Create a new chart
                    const ctx = document.getElementById('clientHoursChart').getContext('2d');
                    clientHoursChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: months,
                            datasets: [{
                                label: 'Total Hours Worked',
                                data: hours,
                                backgroundColor: 'white',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 20
                                    }
                                }
                            }
                        }
                    });

                    // Update the report heading
                    document.getElementById('reportHeading').textContent = `${selectedClient} Report for ${selectedYear}`;

                    // Generate the table for monthly hours
                    const tableBody = document.getElementById('reportTableBody');
                    tableBody.innerHTML = '';  // Clear any existing rows
                    months.forEach((month, index) => {
                        const row = document.createElement('tr');
                        const monthCell = document.createElement('td');
                        const hoursCell = document.createElement('td');
                        monthCell.textContent = month;
                        hoursCell.textContent = hours[index];
                        row.appendChild(monthCell);
                        row.appendChild(hoursCell);
                        tableBody.appendChild(row);
                    });

                } catch (error) {
                    console.error("Error fetching monthly report data:", error);
                }
            } else {
                alert("Please select both client and year");
            }
        });

    } catch (error) {
        console.error("Error fetching client data: ", error);
    }

};


document.getElementById('downloadReport').addEventListener('click', () => {
    const selectedClient = document.getElementById('client').value;
    const selectedYear = document.getElementById('year').value;

    if (selectedClient && selectedYear) {
        const wb = XLSX.utils.book_new(); // Create a new workbook
        const wsData = [
           
            ['Month', 'Total Hours Worked']
        ];

        // Add table data to worksheet
        const rows = document.querySelectorAll('#reportTableBody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const month = cells[0].textContent;
            const hours = cells[1].textContent;
            wsData.push([month, hours]);
        });

        // Append worksheet to workbook
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Create a Blob from the workbook and trigger download
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedClient}_report_for_${selectedYear}.xlsx`;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link); // Clean up

    } else {
        alert("Please select both client and year");
    }
});

