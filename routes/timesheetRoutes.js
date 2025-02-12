const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// Get all timesheets
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM timesheets');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching timesheets:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Insert a timesheet
router.post('/', async (req, res) => {
  const { user_id, client_id, hours, date } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO timesheets (user_id, client_id, hours, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, client_id, hours, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting timesheet:', err);
    res.status(500).json({ message: 'Failed to insert timesheet' });
  }
});

module.exports = router;
