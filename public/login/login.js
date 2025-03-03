document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent default form submission
  
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem("firstname", data.forename);
            sessionStorage.setItem("lastname", data.surname);
            sessionStorage.setItem("employee_id", data.employee_id);

            window.location.href = "/home";
        } else {
            document.getElementById("error-message").textContent = data.error;
            document.getElementById("error-message").style.display = "block";
        }
    } catch (error) {
        console.error("Error during login:", error);
    }
});
