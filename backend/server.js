// server.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY ='abber234pjfhfk';
const port = 3001; // Choose any available port
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/**',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
};


// MySQL database connection configuration
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Your MySQL username
  password: '', // Your MySQL password
  database: 'fitfiesta' // Your MySQL database name
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database: ', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Routes for handling login and register requests

    app.post('/login', (req, res) => {
        const { email, password } = req.body;
        const query = 'SELECT * FROM useres WHERE email = ? AND password = ?';
        connection.query(query, [email, password], (err, results) => {
          if (err) {
            console.error('Error executing MySQL query: ', err);
            res.status(500).json({ error: 'An error occurred' });
            return;
          }
          if (results.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
          } else {
            const user = results[0];

            const token = jwt.sign({ username: user.username, email: user.email }, SECRET_KEY);
            res.status(200).json({ message: 'Login successful',token });

          }
        });
      });
      

    app.post('/register', (req, res) => {
        const { username, email, password } = req.body;
        const query = 'INSERT INTO useres (username, email, password) VALUES (?, ?, ?)';
        connection.query(query, [username, email, password], (err, results) => {
          if (err) {
            console.error('Error executing MySQL query: ', err);
            res.status(500).json({ error: 'An error occurred' });
            return;
          }
          res.status(201).json({ message: 'User registered successfully' });
        });
      });
    
      app.post('/api/buyplan', (req, res) => {
        const { PlanName, username, email, duration, amount, startDate, endDate} = req.body;
        const query = 'SELECT * FROM plans WHERE planname = ?';
        connection.query(query, [PlanName], (err, results) => {
          if (err) {
            console.error('Error executing MySQL query: ', err);
            res.status(500).json({ error: 'An error occurred' });
            return;
          }
          const plan_id = results[0].plan_id;
          var pay_id = getRandomInt(1,100);
          const {amount, startDate} = req.body;
          const query1 = 'INSERT INTO Payment (pay_id, amount, paydate) VALUES (?,?,?)';
          connection.query(query1,[pay_id,amount, startDate],(err,result)=>{
            if (err) {
              console.error('Error executing MySQL query: ', err);
              pay_id = getRandomInt(pay_id,100+1);
              res.status(500).json({ error: 'An error occurred' });
              return;
            }
            const memb_id = getRandomInt(1,100);
            var pay_status = "Done"
            const query1 = 'INSERT INTO Membership (memb_id, plan_id, username, startDate, endDate, pay_id, pay_status) VALUES (?,?,?,?,?,?,?)';
            connection.query(query1,[memb_id, plan_id, username, startDate, endDate, pay_id,pay_status],(err,result1)=>{
              if (err) {
                console.error('Error executing MySQL query: ', err);
                res.status(500).json({ error: 'An error occurred' });
                return;
              }
              res.status(201).json({ message: 'plan/membership/payment data stored successfully!' });
            });
          });
        });
      });

      app.post('/api/joinclass',(req,res)=>{
        const { serviceName, username, duration, startDate, endDate,} = req.body;
        const query = 'SELECT class_id FROM class WHERE className = ? AND duration = ?';
        connection.query(query,[serviceName, duration],(err,results) =>{
          if (err){
            console.error('Error executing MySQL query:',err);
            res.sendStatus(500).json({error:'An error occurred'});
            return;
          }
          const class_id = results[0].class_id;
          const query1 = 'INSERT INTO class_join (class_id,username,startDate,endDate) VALUES (?,?,?,?)';
          connection.query(query1,[class_id,username,startDate,endDate],(err,results1)=>{
            if (err){
              console.error('Error executing MySQL query: ', err);
              res.status(500).json({ error: 'An error occurred' });
              return;
            }
            res.status(201).json({ message: ' Class Join data stored successfully!' });
          })

        })
      });


      app.get('/api/currentplans', (req, res) => {
        // Assuming you have a database where user plans are stored
        // Fetch user's current plans from the database
        const { username } = req.query;
        console.log(username); // Assuming you have authentication middleware to get the user ID
        // Example query to fetch user's current plans from the database
        const query = 'SELECT p.planname, m.* FROM plans p, membership m WHERE m.username = ? AND m.endDate > NOW() and m.plan_id = p.plan_id';
        connection.query(query, [username], (err, results) => {
          if (err) {
            console.error('Error fetching current plans:', err);
            res.status(500).json({ error: 'An error occurred while fetching current plans' });
          } else {
              res.status(200).json(results); // Send the fetched plans data as JSON response
          }
        });
      });

      app.get('/api/currentclasses', (req, res) => {
        // Assuming you have a database where user plans are stored
        // Fetch user's current plans from the database
        const { username } = req.query;
        console.log(username); // Assuming you have authentication middleware to get the user ID
        // Example query to fetch user's current plans from the database
        const query = 'SELECT c.className, j.* FROM class c, class_join j WHERE j.username = ? AND j.endDate > NOW() and j.class_id = c.class_id';
        connection.query(query, [username], (err, results) => {
          if (err) {
            console.error('Error fetching current plans:', err);
            res.status(500).json({ error: 'An error occurred while fetching current classes' });
          } else {
              res.status(200).json(results); // Send the fetched plans data as JSON response
          }
        });
      });
      app.get('/api/paymenthistory', (req, res) => {
        // Assuming you have a database where user plans are stored
        // Fetch user's current plans from the database
        const { username } = req.query;
        console.log(username); // Assuming you have authentication middleware to get the user ID
        // Example query to fetch user's current plans from the database
        const query = 'SELECT p.amount, p.paydate, m.pay_status FROM payment p, membership m WHERE m.username = ? AND m.pay_id = p.pay_id';
        connection.query(query, [username], (err, results) => {
          if (err) {
            console.error('Error fetching payments:', err);
            res.status(500).json({ error: 'An error occurred while fetching Payments' });
          } else {
              res.status(200).json(results); // Send the fetched plans data as JSON response
          }
        });
      });

    //   app.delete('/api/deleteplan/:id/:membid/:startDate/:username', (req, res) => {
    //     const planId = req.params.id;
    //     const membId = req.params.membid;
    //     const startDate = req.params.startDate;
    //     const username = req.params.username;
    //     console.log(planId, startDate, username);
    
    //     const query = 'SELECT pay_id FROM membership WHERE username = ? AND startDate = ? AND memb_id = ? AND plan_id = ?';
    //     connection.query(query, [username, startDate, membId, planId], (err, results) => {
    //         if (err) {
    //             console.error('Error selecting pay_id:', err);
    //             res.status(500).json({ error: 'An error occurred while selecting the pay_id' });
    //             return;
    //         }
    
    //         if (results.length === 0) {
    //             console.error('No membership found for the provided criteria:', username, startDate, planId);
    //             res.status(404).json({ error: 'No membership found for the provided criteria' });
    //             return;
    //         }
    
    //         const payId = results[0].pay_id;
    //         console.log('pay_id:', payId);
    
    //         const query1 = 'DELETE FROM payment WHERE pay_id = ?; DELETE FROM membership WHERE plan_id = ?';
    //         connection.query(query1, [payId, planId], (err, result1) => {
    //             if (err) {
    //                 console.error('Error deleting plan:', err);
    //                 res.status(500).json({ error: 'An error occurred while deleting the plan' });
    //                 return;
    //             }
    //             res.status(200).json({ message: 'Plan deleted successfully' });
    //         });
    //     });
    // });
    
    
    

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
