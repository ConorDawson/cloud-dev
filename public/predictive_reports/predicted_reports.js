window.onload = async function () {
    console.log("Predicted Report JS Loaded");

    try {
        const clientData = await getPredictedReports();
        const grouped = groupMonthlyClientData(clientData);
        const yearly = groupYearlyData(grouped);
        const paySchedules = await getPaySchedules();

        console.log("Grouped Client Data:", grouped);
        console.log("Yearly Data:", yearly);
        console.log("Pay Schedules:", paySchedules);

        buildYearlyTable(yearly, paySchedules);
        createPieChart(yearly);       // Yearly cost breakdown
        createLineChart(grouped);     // Monthly hours
        monthlyGroupedData = groupMonthlyClientData(clientData);


    } catch (error) {
        console.error("Error during data fetching and table creation:", error);
    }


    
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

function getPredictedReports() {
    console.log("Fetching predicted reports...");

    return axios.post('/predicted_reports', {})
        .then(response => {
            console.log("Predicted reports response:", response.data);
            return response.data;
        })
        .catch(error => {
            console.error("Error fetching predicted reports:", error);
            return [];
        });
}

function groupMonthlyClientData(data) {
    const grouped = {};

    data.forEach(entry => {
        const client = entry["Client"];
        const month = entry["Month"];
        const hours = parseFloat(entry["Total Hours Worked"]) || 0;
        const cost = parseFloat(entry["Total Cost (£)"]) || 0;

        const key = `${client}_${month}`;

        if (!grouped[key]) {
            grouped[key] = {
                Client: client,
                Month: month,
                "Total Hours Worked": 0,
                "Total Cost (£)": 0
            };
        }

        grouped[key]["Total Hours Worked"] += hours;
        grouped[key]["Total Cost (£)"] += cost; 
    });

    return Object.values(grouped).sort((a, b) => {
        if (a.Client === b.Client) {
            return a.Month.localeCompare(b.Month);
        }
        return a.Client.localeCompare(b.Client);
    });
}


function groupYearlyData(data) {
    const yearlyGrouped = {};

    data.forEach(entry => {
        const client = entry["Client"];
        const hours = parseFloat(entry["Total Hours Worked"]) || 0;
        const cost = parseFloat(entry["Total Cost (£)"]) || 0;

        if (!yearlyGrouped[client]) {
            yearlyGrouped[client] = {
                Client: client,
                "Total Hours Worked": 0,
                "Total Cost (£)": 0
            };
        }

        yearlyGrouped[client]["Total Hours Worked"] += hours;
        yearlyGrouped[client]["Total Cost (£)"] += cost;
    });

    return Object.values(yearlyGrouped);
}

function getPaySchedules() {
    console.log("Fetching payschedules");

    return axios.post('/getClientPaySchedules', {})
        .then(response => {
            console.log("Pay Schedule response:", response.data);
            return response.data;
        })
        .catch(error => {
            console.error("Error fetching Pay schedules:", error);
            return [];
        });
}

function buildYearlyTable(yearlyData, paySchedules) {
    const tableBody = document.getElementById("reportTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    yearlyData.forEach(clientYear => {
        const clientName = clientYear["Client"];
        const hours = clientYear["Total Hours Worked"];
        const cost = clientYear["Total Cost (£)"];

        // Find matching payment data
        const payData = paySchedules.find(p => p.company_name === clientName);
        const payment = payData ? parseFloat(payData.client_payment_amount) : 0;

        const profitLoss = cost > 0 ? ((payment - cost) / cost) * 100 : 0;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${clientName}</td>
            <td>${hours.toFixed(2)}</td>
            <td>£${cost.toFixed(2)}</td>
            <td>£${payment.toFixed(2)}</td>
            <td>${profitLoss.toFixed(2)}%</td>
            <td><button onclick="monthlyToast('${clientName}')">View</button></td>
        `;

        tableBody.appendChild(row);
    });
}


function createPieChart(yearlyData) {
    const ctx = document.getElementById("costChart").getContext("2d");

    const labels = yearlyData.map(item => item.Client);
    const data = yearlyData.map(item => item["Total Cost (£)"]);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Yearly Cost (£)',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Yearly Cost Breakdown per Client'
                }
            }
        }
    });
}
function createLineChart(groupedData) {
    const monthsSet = new Set();
    const clientMap = {};
    let minVal = Infinity;
    let maxVal = -Infinity;

    groupedData.forEach(entry => {
        const client = entry.Client;
        const month = entry.Month;
        const hours = parseFloat(entry["Total Hours Worked"]) || 0;

        monthsSet.add(month);

        if (!clientMap[client]) {
            clientMap[client] = {};
        }

        clientMap[client][month] = hours;

        if (hours < minVal) minVal = hours;
        if (hours > maxVal) maxVal = hours;
    });

    const allMonths = Array.from(monthsSet).sort();
    const datasets = Object.entries(clientMap).map(([client, monthData], index) => {
        const color = `hsl(${(index * 60) % 360}, 70%, 60%)`;

        return {
            label: client,
            data: allMonths.map(month => monthData[month] || 0),
            borderColor: color,
            fill: false,
            tension: 0.3
        };
    });

    // Add padding to min and max
    const yMin = Math.floor(minVal - 1);
    const yMax = Math.ceil(maxVal + 1);

    const ctx = document.getElementById('profitLossChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: allMonths,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Hours Worked by Client'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: yMin,
                    max: yMax
                }
            }
        }
    });


    console.log("Line chart months:", allMonths);
console.log("Line chart datasets:", datasets);

}


function monthlyToast(clientName) {
    console.log("Client:", clientName);

    // Filter entries for the selected client
    const clientEntries = monthlyGroupedData.filter(entry => entry.Client === clientName);

    if (clientEntries.length === 0) {
        document.getElementById("modalTitle").innerText = `${clientName}`;
        document.getElementById("modalBody").innerHTML = `<p>No data available for this client.</p>`;
    } else {
        // Set modal title
        document.getElementById("modalTitle").innerText = `${clientName} - Monthly Breakdown`;

        // Build HTML for body
        let bodyHtml = `<table style="width: 100%; border-collapse: collapse;">`;
        bodyHtml += `
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Month</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Hours Worked</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Cost (£)</th>
            </tr>
        `;

        clientEntries.forEach(entry => {
            bodyHtml += `
                <tr>
                    <td>${entry.Month}</td>
                    <td>${entry["Total Hours Worked"].toFixed(2)}</td>
                    <td>£${entry["Total Cost (£)"].toFixed(2)}</td>
                </tr>
            `;
        });

        bodyHtml += `</table>`;
        document.getElementById("modalBody").innerHTML = bodyHtml;
    }

    // Show the toast/modal
    document.getElementById("t").style.display = "block";
}

function closeToast() {
    document.getElementById("t").style.display = "none";
}




