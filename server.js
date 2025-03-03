const express = require('express');
const dotenv = require('dotenv');
const pool = require('./db/pool');
const path = require('path');
const session = require('express-session');



dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


const axios = require('axios');


app.get('/api/client_hours', async (req, res) => {
  try {
    // Get start & end dates from frontend request
    const { start_date, end_date } = req.query;

    // Call Flask API with the provided dates
    const response = await axios.get('http://localhost:5001/api/client_hours', {
      params: { start_date, end_date }
    });

    res.json(response.data); // Send Flask response to frontend
  } catch (err) {
    console.error('Error fetching client hours from Flask:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/api/monthly_report', async (req, res) => {
  const { client, start_date, end_date } = req.query;

  if (!client || !start_date || !end_date) {
    return res.status(400).json({ error: "Client, Start Date, and End Date parameters are required" });
  }

  try {
    // Call the Flask API endpoint to get the monthly report
    const response = await axios.get('http://localhost:5001/api/monthly_report', {
      params: { client, start_date, end_date } // Pass client, start_date, and end_date as query parameters
    });
    res.json(response.data); // Send Flask data back to the client
  } catch (err) {
    console.error('Error fetching monthly report from Flask:', err);
    res.status(500).send('Server Error');
  }
});






// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));


// Middleware for JSON and URL-encoded parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query(
      'SELECT employee_id, employee_forename, employee_surname FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length > 0) {
      const { employee_id, employee_forename, employee_surname } = result.rows[0];

      // Store user data in session
      req.session.user = {
        employee_id,
        employee_forename,
        employee_surname,
      };

      res.json({
        message: "Login successful",
        employee_id,
        forename: employee_forename,
        surname: employee_surname,
      });
    } else {
      res.status(401).json({ error: "Invalid email or password." });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


// Handle Logout (clear session)
app.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }

    // Redirect to login page
    res.redirect('/');
  });
});

// Handle Current Graph Route
app.post('/current', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views/current_grahps.html'));
});


// Handle Current Graph Route
app.post('/my_report', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views/my_report.html'));
});



// Home Route (before successful login)
app.get('/home', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views/home.html'));
});


// Home Route (after successful login)
app.post('/home', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views/home.html'));
});



// Home Route (after successful login)
app.post('/predicted', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views/predicted_graphs.html'));
});

app.post('/admin', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public/admin/main_form/admin.html'));
});



// Serve employee management pages
app.post('/add_employee', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/employee_functions/add_employee/add_employee.html'));
});

// API Endpoints
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT company_name FROM clients');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/timesheet-hours', async (req, res) => {
  const { employee_id } = req.body;
  try {
      const result = await pool.query(
          'SELECT company_name, work_date, hours FROM timesheet_hours2 WHERE employee_id = $1 ORDER BY work_date',
          [employee_id]
      );
      res.json(result.rows);
  } catch (err) {
      console.error('Error fetching timesheet hours:', err);
      res.status(500).send('Server Error');
  }
});


app.post('/submitTimesheet', async (req, res) => {
  try {
      const response = await fetch('http://localhost:5001/submitTimesheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (response.ok) {
          res.status(200).json(data);
      } else {
          res.status(response.status).json(data);
      }
  } catch (error) {
      console.error('Error calling Flask server:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.post('/add_new_employee', async (req, res) => {
  try {
    const { employee_forename, employee_surname, employee_email, employee_password, employee_wage, role } = req.body;
    const response = await axios.post('http://localhost:5001/add_new_employee', {
      employee_forename, 
      employee_surname, 
      employee_email, 
      employee_password, 
      employee_wage,
      role
    });
    if (response.status === 200) {
      res.status(200).send('Employee added successfully');
    } else {
      console.log('Error response from Flask:', response.data); // Log the error data for debugging
      res.status(response.status).json({ message: response.data.message || 'Unknown error' });
    }
  } catch (err) {
    console.error('Error adding new Employee:', err);
    if (err.response) {
      console.error('Error response from Flask:', err.response.data); // Log the error response from Flask
      res.status(err.response.status).json({ message: err.response.data.message || 'Error from Flask' });
    } else {
      // If no response from Flask, it's a server error on Express side
      res.status(500).send('Server Error');
    }
  }
});

app.get('/getAllEmployees', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/getAllEmployees');
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).send('Server Error');
  }
}); 

app.post('/update_employee', async (req, res) => {
  console.log('reached server.js');
  try {
    const { email, employee_forename, employee_surname, employee_wage, role, employee_id } = req.body;
    const response = await axios.post('http://localhost:5001/update_employee', {
      email, 
      employee_forename, 
      employee_surname, 
      employee_wage,
      role,
      employee_id,
    });
    if (response.status === 200) {
      res.status(200).send('Employee updated successfully');
    } else {
      console.log('Error response from Flask:', response.data); // Log the error data for debugging
      res.status(response.status).json({ message: response.data.message || 'Unknown error' });
    }
  } catch (err) {
    console.error('Error adding new Employee:', err);
    if (err.response) {
      console.error('Error response from Flask:', err.response.data); // Log the error response from Flask
      res.status(err.response.status).json({ message: err.response.data.message || 'Error from Flask' });
    } else {
      // If no response from Flask, it's a server error on Express side
      res.status(500).send('Server Error');
    }
  }
});

app.post('/delete_employee', async (req, res) => {
  console.log('reached /delete_employee');
  const { employee_id } = req.body;
  console.log('employee_id:', employee_id);
  try{
    const response = await axios.post('http://localhost:5001/delete_employee', {
      employee_id
    });

    if (response.status === 200) {
      res.status(200).send('Employee deleted successfully');
    } else {
      console.log('Error response from Flask:', response.data); // Log the error data for debugging
      res.status(response.status).json({ message: response.data.message || 'Unknown error' });
    }

  }
  catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).send('Server Error');
  }
});


app.post('/getEmployeeWorkYears', async (req, res) => {
  const { employee_id } = req.body;
  try {
      const response = await axios.post('http://localhost:5001/getEmployeeWorkYears', {
          employee_id
      });
      res.json(response.data);
  } catch (err) {
      console.error('Error fetching employees:', err);
      res.status(500).send('Server Error');
  }
});


app.post('/getEmployeeYearlyWork', async (req, res) => {
  const { employee_id, year } = req.body;
  try {
      const response = await axios.post('http://localhost:5001/getEmployeeYearlyWork', {
          employee_id,
          year
      });
      res.json(response.data);
  } catch (err) {
      console.error('Error fetching employees:', err);
      res.status(500).send('Server Error');
  }
}
);

app.post('/getMonthlyIndividualClients', async (req, res) => {
  const { employee_id, year, company_name } = req.body;
  try {
      const response = await axios.post('http://localhost:5001/getMonthlyIndividualClients', {
          employee_id,
          year,
          company_name
      });
      res.json(response.data);
  } catch (err) {
      console.error('Error fetching employees:', err);
      res.status(500).send('Server Error');
  }
}
);
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
