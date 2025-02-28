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

// Handle Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
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

      res.redirect(`/home?employee_id=${encodeURIComponent(employee_id)}&employee_forename=${encodeURIComponent(employee_forename)}&employee_surname=${encodeURIComponent(employee_surname)}`);
    } else {
      res.status(401).send('Invalid email or password.');
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal server error.');
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
  const timesheetData = req.body;

  if (!Array.isArray(timesheetData) || timesheetData.length === 0) {
    return res.status(400).send('Invalid timesheet data.');
  }

  const query = `
    INSERT INTO timesheet_hours2 (company_name, hours, work_date, employee_id) 
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (company_name, work_date, employee_id)
    DO UPDATE SET hours = EXCLUDED.hours
    RETURNING company_name, hours, work_date, employee_id;
  `;

  const client = await pool.connect();
  try {
    console.log("Beginning transaction...");
    await client.query('BEGIN');

    for (const entry of timesheetData) {
      const { clientName, hours, date, employee_id } = entry;
      const formattedHours = parseFloat(hours) || 0;
      const formatID = parseInt(employee_id) || 0;

      console.log(`Processing entry: ${clientName}, ${formattedHours}, ${date}, ${formatID}`);

      try {
        const result = await client.query(query, [clientName, formattedHours, date, formatID]);
        console.log('Query result:', result.rows);
      } catch (err) {
        console.error('Query failed for entry:', clientName, date, formattedHours, formatID, err);
        await client.query('ROLLBACK');
        return res.status(500).send('Error processing timesheet data.');
      }
    }

    await client.query('COMMIT');
    res.status(200).send('Timesheet submitted successfully');
  } catch (err) {
    console.error('Transaction failed:', err);
    await client.query('ROLLBACK');
    res.status(500).send('Internal server error');
  } finally {
    client.release();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
