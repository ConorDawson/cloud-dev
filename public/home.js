
let currentWeekStartDate = new Date();
// Assuming 'window.location.search' has the query string
const urlParams = new URLSearchParams(window.location.search);


sessionStorage.setItem("firstname" , urlParams.get('employee_forename'));
sessionStorage.setItem("lastname" , urlParams.get('employee_surname'));
sessionStorage.setItem("employee_id" , urlParams.get('employee_id'));




function fetchEmployeeName() {
    const urlParams = new URLSearchParams(window.location.search);
    const forename = urlParams.get('employee_forename');
    const surname = urlParams.get('employee_surname');

    if (forename && surname) {
        document.getElementById('employee-name').textContent = `Timesheet for ${forename} ${surname}`;
    }
}

console.log(sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("lastname") + " " + sessionStorage.getItem("employee_id"));


async function fetchClients() {
    try {
        // Fetch clients and timesheet hours concurrently
        const [clientsResponse, hoursResponse] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/timesheet-hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: sessionStorage.getItem("employee_id") })
            })
        ]);

        if (!clientsResponse.ok || !hoursResponse.ok) {
            throw new Error('Error fetching data');
        }

        const clients = await clientsResponse.json();
        const hours = await hoursResponse.json();

        console.log('Clients:', clients);
        console.log('Hours:', hours);

        const tableBody = document.getElementById('client-rows');
        const tableHeader = document.querySelector('thead tr');

        // Clear existing rows and headers
        tableBody.innerHTML = '';
        tableHeader.innerHTML = '<th>Client Name</th>';

        // Prepare table header (dates for the week)
        const weekDates = getWeekDates(currentWeekStartDate);
        weekDates.forEach(date => {
            const th = document.createElement('th');
            th.textContent = getFormattedDate(date);
            tableHeader.appendChild(th);
        });

        // Build table rows for each client
        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${client.company_name}</td>`;

            weekDates.forEach(date => {
                const formattedDate = formatDate(date); // Format current date for comparison
                const matchingEntry = hours.find(
                    hour => hour.company_name === client.company_name && formatDate(hour.work_date) === formattedDate
                );
                const hoursWorked = matchingEntry ? matchingEntry.hours : '';
                row.innerHTML += `<td><input type="text" class="day-input" data-date="${formattedDate}" value="${hoursWorked}"></td>`;
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}



function getWeekDates(startDate) {
    const weekDates = [];
    const startOfWeek = startDate.getDate() - startDate.getDay() + 1;

    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startOfWeek + i);
        weekDates.push(date);
    }

    return weekDates;
}

function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

window.onload = () => {
    fetchEmployeeName();
    fetchClients();

    document.getElementById('submit-button').addEventListener('click', submitTimesheet);
};

function goToPreviousWeek() {
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
    fetchClients();
}

function goToNextWeek() {
    const currentDate = new Date();
    if (currentWeekStartDate.getTime() < currentDate.getTime()) {
        currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
        fetchClients();
    } else {
        alert("You cannot go beyond the current week.");
    }
}

async function submitTimesheet() {
    const clientRows = document.querySelectorAll('#client-rows tr');
    const employee_id = sessionStorage.getItem("employee_id");
    const timesheetData = [];

    clientRows.forEach((row) => {
        const clientName = row.querySelector('td').textContent;
        const inputs = row.querySelectorAll('input');

        inputs.forEach((input) => {
            const date = input.getAttribute('data-date');
            const hours = input.value;
            
            if (hours) {
                timesheetData.push({ clientName, date, hours, employee_id });
            }
        });
    });

    if (timesheetData.length === 0) {
        alert("No timesheet data to submit!");
        return;
    }

    try {
        const response = await fetch('/submitTimesheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timesheetData),
        });

        if (response.ok) {
            alert('Timesheet submitted successfully!');
        } else {
            throw new Error('Error submitting timesheet');
        }
    } catch (error) {
        console.error('Error submitting timesheet:', error);
    }
}
