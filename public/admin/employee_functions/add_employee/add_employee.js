window.onload = function () {
    console.log('add_employee.js loaded');
    
    const form = document.getElementById("addEmployee"); // Select the form
    console.log(form); // Check if form is selected

    if (form) {
        form.addEventListener("submit", async function (event) {
            console.log("Form submitted");
            event.preventDefault(); // Prevent default form submission

            // Collect form data
            const employeeForename = document.getElementById("forname").value.trim();
            const employeeSurname = document.getElementById("surname").value.trim();
            const employeeEmail = document.getElementById("employeeEmail").value.trim();
            const employeePassword = document.getElementById("employeePassword").value.trim();
            const employeeWage = document.getElementById("employeeWage").value.trim();
            const employeeRole = document.getElementById("employeeRole").value.trim();

            // Validation checks
            if (!employeeForename || !employeeSurname || !employeeEmail || !employeePassword || !employeeWage || !employeeRole) {
                alert('All fields are required.');
                return;
            }

            // Validate wage is a number and format it
            const wage = parseFloat(employeeWage);
            if (isNaN(wage) || wage < 0) {
                alert('Wage must be a valid number.');
                return;
            }
            const formattedWage = wage.toFixed(2); // Ensure 2 decimal places

            // Validate password: at least 7 characters, at least 1 letter and 1 number
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{7,}$/;
            if (!passwordRegex.test(employeePassword)) {
                alert('Password must be at least 7 characters long and contain at least one letter and one number.');
                return;
            }

            // Create data object to send
            const employeeData = {
                employee_forename: employeeForename,
                employee_surname: employeeSurname,
                employee_email: employeeEmail,
                employee_password: employeePassword,
                employee_wage: formattedWage,
                role: employeeRole
            };
            
            console.log(employeeData); // Debugging: Check the employeeData

            try {
                // Send data to the server using fetch
                const response = await fetch('/add_new_employee', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(employeeData)
                });

                if (response.ok) {
                    alert('Employee added successfully');
                    form.reset(); 
                } else if (response.status === 400) {
                    // If the email already exists, show an alert
                    const responseBody = await response.json();
                    alert(responseBody.message || 'Error: Unable to add employee');
                } else {
                    throw new Error('Error adding employee');
                }
            } catch (error) {
                console.error('Error adding employee:', error);
            }
        });
    } else {
        console.error('Form not found');
    }
};
