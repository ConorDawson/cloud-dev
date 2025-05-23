window.onload = async function () {
    console.log("individual_report.js loaded");
    console.log(sessionStorage.getItem("lastname") + " " + sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("employee_id"));

    forename = sessionStorage.getItem("firstname");
    surname = sessionStorage.getItem("lastname");
    employee_id = sessionStorage.getItem("employee_id");


    const years = await getEmployeeWorkYears();
    if (years && years.work_years.length > 0) {
        console.log("Employee work years:", years.work_years);

        const yearSelect = document.getElementById('select_year');
        yearSelect.innerHTML = ""; // Clear previous options

        for (let year of years.work_years) {
            const yearOption = document.createElement('option');
            yearOption.value = year;
            yearOption.textContent = year;
            yearSelect.appendChild(yearOption);
        }
    } else {
        console.log("No years available.");
    }

    const Year = document.getElementById("select_year").value;
    const initalReportData = await getEmployeeYearlyWork(Year);       
    generateReportTable(initalReportData.client_hours);
    getFullMonthlyWork(Year);


   

    document.getElementById("reportHeading").innerHTML = forename + " " + surname + " - My Work Breakdown " + Year;
// Event listener for generating the report
document.getElementById("generateReport").addEventListener("click", async function () {
    document.getElementById("reportHeading").innerHTML = "";
    const selectedYear = document.getElementById("select_year").value;
    const employee_id = sessionStorage.getItem("employee_id");
    document.getElementById("reportHeading").innerHTML = forename + " " + surname + " - My Work Breakdown " + selectedYear;

    if (!selectedYear) {
        console.error("No year selected.");
        alert("Please select a year before generating the report.");
        return;
    }
    console.log(`Generating report for Employee ID: ${employee_id}, Year: ${selectedYear}`);
    const reportData = await getEmployeeYearlyWork(selectedYear);

    if (reportData && reportData.client_hours) {
        console.log("Report Data:", reportData);
        // Generate the table with the data
        generateReportTable(reportData.client_hours);
    } else {
        console.error("Failed to generate report.");
        alert("Error generating report. Please try again.");
    }

    getFullMonthlyWork(selectedYear);
});
   
    
};

getEmployeeWorkYears = async () => {
    try {
        const response = await axios.post('/getEmployeeWorkYears', {
            employee_id
        });
        console.log(response.data);
        return response.data;
    } catch (err) {
        console.error('Error fetching employee work years:', err);
        return null;
    }
};


getEmployeeYearlyWork = async (year) => {
    try {
        const response = await axios.post('/getEmployeeYearlyWork', {
            employee_id,
            year
        });
        console.log(response.data);
        return response.data;
    } catch (err) {
        console.error('Error fetching employee yearly work:', err);
        return null;
    }
}


function generateReportTable(clientHours) {
    const tableBody = document.getElementById("individualReportTableBody");
    tableBody.innerHTML = '';  // Clear any previous data

    let totalHoursSum = 0;  // Variable to hold the total sum of hours

    // Loop through client_hours array and populate the table
    clientHours.forEach(([clientName, totalHours]) => {
        // Convert totalHours to a number to ensure accurate addition
        totalHours = parseFloat(totalHours);

        // Create a new row
        const row = document.createElement('tr');

        // Create and append client name cell
        const clientCell = document.createElement('td');
        clientCell.textContent = clientName;
        row.appendChild(clientCell);

        // Create and append total hours cell
        const hoursCell = document.createElement('td');
        hoursCell.textContent = totalHours.toFixed(2);  // Format as a number with two decimal places
        row.appendChild(hoursCell);

        // Create and append detail breakdown cell with button and icon
        const detailCell = document.createElement('td');
        const detailButton = document.createElement('button');
        detailButton.classList.add('detailButton'); // Add the 'detailButton' class
        detailButton.setAttribute('data-client', clientName); // Set client name in data-client
        detailButton.setAttribute('data-start-date', '2025-01-01'); // Example, set actual date as needed
        detailButton.setAttribute('data-end-date', '2025-12-31'); // Example, set actual date as needed

        // Create icon element
        const icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-circle-info'); // Add icon classes

        // Append icon to button
        detailButton.appendChild(icon);

        // Append button to detail cell
        detailCell.appendChild(detailButton);

        // Append detail cell to row
        row.appendChild(detailCell);

        // Append the row to the table body
        tableBody.appendChild(row);

        // Add the total hours for this client to the sum
        totalHoursSum += totalHours;

        detailButton.addEventListener('click', function() {
            const client = detailButton.getAttribute('data-client');  // Get client from the button's data-client attribute
            getMonthlyIndividualClients(client);  // Call the function with the client as an argument
        });
    });

    // Create a new row for the total
    const totalRow = document.createElement('tr');
    
    // Create and append empty cell for client name (leave it blank)
    const totalClientCell = document.createElement('td');
    totalClientCell.textContent = 'Total';
    totalClientCell.style.fontWeight = 'bold';  // Make it bold for the total row
    totalRow.appendChild(totalClientCell);

    // Create and append total hours cell
    const totalHoursCell = document.createElement('td');
    totalHoursCell.textContent = totalHoursSum.toFixed(2);  // Display the total sum of hours, formatted
    totalHoursCell.style.fontWeight = 'bold';  // Make it bold for the total row
    totalRow.appendChild(totalHoursCell);

    // Append an empty cell for the detail button in the total row
    const emptyCell = document.createElement('td');
    totalRow.appendChild(emptyCell);

    // Append the total row to the table body
    tableBody.appendChild(totalRow);
}


function generateMonthlyReportTable(response) {
    // Access the 'monthly_report' array from the response object
    const monthlyData = response.monthly_report;

    const modalTableBody = document.getElementById("modalTableBody");
    modalTableBody.innerHTML = ''; // Clear any existing rows

    // Populate the table with data
    monthlyData.forEach((data) => {
        const row = document.createElement('tr');
        
        // Create and append the month cell
        const monthCell = document.createElement('td');
        monthCell.textContent = data.month; 
        row.appendChild(monthCell);
        
        // Create and append the hours worked cell
        const hoursCell = document.createElement('td');
        hoursCell.textContent = data.total_hours; 
        row.appendChild(hoursCell);
        
        // Append the row to the modal table
        modalTableBody.appendChild(row);
    });

    // Set the modal title
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.textContent = "Monthly Report"; 

    // Show the modal by changing its display to 'block'
    const modal = document.getElementById("t");
    modal.style.display = "block"; 
}

// Event listener to close the modal when the button is clicked
document.getElementById("closeModal").addEventListener("click", function() {
    const modal = document.getElementById("t");
    modal.style.display = "none"; // Hide the modal
});

// Optional: Close the modal when clicking outside of the modal
window.addEventListener("click", function(event) {
    const modal = document.getElementById("t");
    if (event.target === modal) {
        modal.style.display = "none"; // Hide the modal when clicking outside
    }
});


function getMonthlyIndividualClients(client) {
    year = document.getElementById("select_year").value;
    employee_id = sessionStorage.getItem("employee_id");
    company_name = client;
    console.log("Client Name: ", company_name);
    console.log("Year: ", year);        
    console.log("Employee ID: ", employee_id);

    axios.post('/getMonthlyIndividualClients', {
        employee_id,
        year,
        company_name
    }).then((response) => {
        console.log(response.data);
        const monthlyData = response.data;
        generateMonthlyReportTable(monthlyData);
    }).catch((error) => {
        console.error('Error fetching monthly individual clients:', error);
        alert('Error fetching monthly individual clients. Please try again.');
    }
    );
}

function getFullMonthlyWork() {
    const year = document.getElementById("select_year").value;
    const employee_id = sessionStorage.getItem("employee_id");
    console.log("Year: ", year);
    console.log("Employee ID: ", employee_id);

    axios.post('/getFullMonthlyWorkEmployee', {
        employee_id,
        year
    }).then((response) => {
        console.log('getFullMonthlyWork', response.data);
        const monthlyChartData = response.data.monthly_chart; // Access the monthly_chart array
        console.log('monthlyChartData', monthlyChartData);
        createLineChart(monthlyChartData);

    }).catch((error) => {
        console.error('Error fetching monthly chart clients:', error);
        alert('Error fetching monthly chart clients. Please try again.');
    });
}


function createLineChart(monthlyChartData) {
    // Prepare data for Chart.js
    const labels = monthlyChartData.map(item => item.month);
    const totalHours = monthlyChartData.map(item => parseFloat(item.total_hours));

    // Create a new canvas element
    document.getElementById("monthlyBreakdownChart").innerHTML = "<canvas id='monthlyChart'></canvas>";
    year = document.getElementById("select_year").value;

    document.getElementById("monthlyBreakdownH1").textContent = "Monthly Work Breakdow for  " + year;

    // Get the context of the canvas element we just created
    const ctx = document.getElementById('monthlyChart').getContext('2d');

    // Create the line chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Hours',
                data: totalHours,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
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

    createPieChart();
}

async function createPieChart() {
    const year = document.getElementById("select_year").value;
    const employee_id = sessionStorage.getItem("employee_id");
    
    try {
        const response = await axios.post('/getEmployeeYearlyWork', {
            employee_id,
            year
        });
        console.log(response.data);
        const chartData = response.data.client_hours; // Access the client_hours array

        // Extract client names and hours from the response data
        const clientNames = chartData.map(item => item[0]);
        const totalHours = chartData.map(item => parseFloat(item[1]));

        // Create a new canvas element
        document.getElementById("clietnWorkBreakdown").innerHTML = "<canvas id='clientPieChart'></canvas>";

        // Get the context of the canvas element we just created
        const ctx = document.getElementById('clientPieChart').getContext('2d');

        // Create the pie chart
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: clientNames,
                datasets: [{
                    label: 'Client Work Hours',
                    data: totalHours,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });

    } catch (err) {
        console.error('Error fetching employee yearly work:', err);
        alert('Error fetching employee yearly work. Please try again.');
    }
}














