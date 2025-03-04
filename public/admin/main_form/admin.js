
document.addEventListener('DOMContentLoaded', function () {
    console.log('admin.js loaded'); //works
    fetchEmployees();//works
    fetchClients();
    document.getElementById('saveUserChanges').addEventListener('click', updateUser); //eventListener is working


});

async function fetchEmployees() {
    console.log('Fetching employees...');
    try {
        const response = await fetch('/getAllEmployees');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const employees = await response.json();
        console.log('Employees:', employees);
        populateEmployeeTable(employees);
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Populate employee table dynamically
function populateEmployeeTable(employees) {
    const table = document.getElementById('reportTable');
    table.innerHTML = `
        <tr>
            <th>Employee ID</th>
            <th>Employee Forename</th>
            <th>Employee Surname</th>
            <th>Employee Email</th>
            <th>Employee Role</th>
            <th>Employee Wage</th>
            <th>Actions</th>
        </tr>
    `;

    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.employee_id}</td>
            <td>${employee.employee_forename}</td>
            <td>${employee.employee_surname}</td>
            <td>${employee.email}</td>
            <td>${employee.role}</td>
            <td>${employee.wage}</td>
            <td class="actions">
                <button class="update-btn" data-id="${employee.employee_id}" 
                        data-forename="${employee.employee_forename}" 
                        data-surname="${employee.employee_surname}" 
                        data-email="${employee.email}" 
                        data-role="${employee.role}" 
                        data-wage="${employee.wage}">
                    Update
                </button>
                <button class="delete-btn" data-id="${employee.employee_id}">Delete</button>
            </td>
        `;
        table.appendChild(row);
    });

    // Attach event listeners to update buttons
    document.querySelectorAll('.update-btn').forEach(button => {
        button.addEventListener('click', openUpdateToast);
    });

    // Attach event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteEmployee);
    });
}

function openUpdateToast(event) {
    const button = event.target;

    // Fill form with data
    document.getElementById('employeeId').value = button.dataset.id;
    document.getElementById('employeeForename').value = button.dataset.forename;
    document.getElementById('employeeSurname').value = button.dataset.surname;
    document.getElementById('employeeEmail').value = button.dataset.email;
    document.getElementById('employeeRole').value = button.dataset.role;
    document.getElementById('employeeWage').value = button.dataset.wage;

    // Show toast
    document.getElementById('t').style.display = 'block';

}


async function updateUser() {
    const employeeData = {
        email: document.getElementById('employeeEmail').value,
        employee_forename: document.getElementById('employeeForename').value,
        employee_surname: document.getElementById('employeeSurname').value,
        role: document.getElementById('employeeRole').value,
        employee_wage: document.getElementById('employeeWage').value,
        employee_id: document.getElementById('employeeId').value
    };
    console.log(employeeData); // prints correct information
    try {
        const response = await fetch('/update_employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employeeData)
        });

        if (response.ok) {
            alert('Employee updated successfully');
            fetchEmployees();
            document.getElementById('t').style.display = 'none';
        } else {
            throw new Error('Error updating employee');
        }
    } catch (error) {
        console.error('Error updating employee:', error);
    }
}


async function deleteEmployee(event) {
    const employeeId = event.target.dataset.id;
    console.log('Deleting employee:', employeeId);
    
    try {
        const response = await fetch('/delete_employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employee_id: employeeId })
        });

        if (response.ok) {
            alert('Employee deleted successfully');
            fetchEmployees();

        } else {
            throw new Error('Error deleting employee');
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
    }
}

// Close toast on cancel
document.getElementById('closeToast').addEventListener('click', () => {
    document.getElementById('t').style.display = 'none';
});



async function fetchClients() {
    console.log('Fetching clients...');
    try {
        const response = await fetch('/getAllClients');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const clients = await response.json();
        console.log('Clients:', clients);
        populateClientTable(clients);
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}


function populateClientTable(clients) {
    const table = document.getElementById('clientTable');
    table.innerHTML = `
        <tr>
            <th>Client ID</th>
            <th>Client Name</th>
            <th>Client Billing Schedule</th>
            <th>Payment Amount</th>
            <th>Actions</th>
        </tr>
    `;

    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.client_id}</td>
            <td>${client.company_name}</td>
            <td>${client.client_billing_schedule}</td>
            <td>${client.client_payment_amount}</td>
            <td class="actions">
                <button class="update-btn" data-id="${client.client_id}" 
                        data-company_name="${client.company_name}" 
                        data-billing_schedule="${client.client_billing_schedule}" 
                        data-payment_amount="${client.client_payment_amount}" >
                    Update
                </button>
                <button class="delete-client-btn" data-id="${client.client_id}">Delete</button>
            </td>
        `;
        table.appendChild(row);
    });

    // Attach event listeners to update buttons
    document.querySelectorAll('.update-btn').forEach(button => {
        button.addEventListener('click', openUpdateToast);
    });

    // Attach event listeners to delete buttons
    document.querySelectorAll('.delete-client-btn').forEach(button => {
        button.addEventListener('click', deleteClient);
    });
}

async function deleteClient(event) {
    const client_id = event.target.dataset.id;
    console.log('Deleting client:', client_id);
    
    try {
        const response = await fetch('/delete_client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: client_id })
        });

        if (response.ok) {
            alert('Client deleted successfully');
            fetchClients();

        } else {
            throw new Error('Error deleting client');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
    }
}




// Close toast on cancel
document.getElementById('closeToast').addEventListener('click', () => {
    document.getElementById('t').style.display = 'none';
});




