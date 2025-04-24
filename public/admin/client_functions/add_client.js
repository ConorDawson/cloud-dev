window.onload = function () {
    console.log('add_client.js loaded');
    
    const form = document.getElementById("addClient"); // Select the form
    console.log(form); // Check if form is selected

    if (form) {
        form.addEventListener("submit", async function (event) {
            console.log("Form submitted");
            event.preventDefault(); // Prevent default form submission

            // Collect form data
            const companyName = document.getElementById("companyName").value.trim();
            const contactPerson = document.getElementById("contactPerson").value.trim();
            const email = document.getElementById("email").value.trim();
            const phoneNumber = document.getElementById("phoneNumber").value.trim();
            const city = document.getElementById("city").value.trim();
            const country = document.getElementById("country").value.trim();
            const clientPaymentAmount = document.getElementById("clientPaymentAmount").value.trim();
            const clientBillingSchedule = document.getElementById("clientBillingSchedule").value;

            // Validation checks
            if (!companyName || !contactPerson || !email || !phoneNumber || !city || !country || !clientPaymentAmount || !clientBillingSchedule) {
                alert('All fields are required.');
                return;
            }

            // Validate client payment amount is a number and format it
            const paymentAmount = parseFloat(clientPaymentAmount);
            if (isNaN(paymentAmount) || paymentAmount < 0) {
                alert('Client Payment Amount must be a valid number.');
                return;
            }
            const formattedPaymentAmount = paymentAmount.toFixed(2); // Ensure 2 decimal places

            // Create data object to send
            const clientData = {
                company_name: companyName,
                contact_person: contactPerson,
                email: email,
                phone_number: phoneNumber,
                city: city,
                country: country,
                client_payment_amount: formattedPaymentAmount,
                client_billing_schedule: clientBillingSchedule
            };

            console.log(clientData); // Debugging: Check the clientData

            try {
                // Send data to the server using fetch
                const response = await fetch('/add_new_client', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clientData)
                });

                if (response.ok) {
                    alert('Client added successfully');
                    form.reset(); // Reset the form
                } else if (response.status === 400) {
                    // If the client already exists or another error, show an alert
                    const responseBody = await response.json();
                    alert(responseBody.message || 'Error: Unable to add client');
                } else {
                    throw new Error('Error adding client');
                }
            } catch (error) {
                console.error('Error adding client:', error);
            }
        });
    } else {
        console.error('Form not found');
    }
};
