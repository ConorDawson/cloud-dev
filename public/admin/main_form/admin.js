
document.addEventListener('DOMContentLoaded', function () {
    console.log('admin.js loaded'); //works
    fetchEmployees();//works
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
