const cors = require('cors');
const bodyparser = require('body-parser');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt=require('jsonwebtoken');

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyparser.json());

 app.use(express.static('public'));
  
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/public/signup.html');
});
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
  });
  app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
  });
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
  });

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'rakhal18',
  database: 'user',
  connectionLimit:10,
  })

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Connected to the database');
    connection.release();
  });
  
  db.query('SELECT * FROM user',(err, res) => {
    if (err){
      console.error(err);
      return;
    }
    console.log(res);
  });

// Assuming you have already established a database connection

router.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the username exists in the database
  db.query('SELECT * FROM user WHERE username = ?', [username], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    // If the username does not exist
    if (results.length === 0) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const user = results[0];

    // Compare the provided password with the hashed password stored in the database
    bcrypt.compare(password, user.password, (bcryptError, isMatch) => {
      if (bcryptError) {
        console.error(bcryptError);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      // If the passwords do not match
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // If the passwords match, create a JSON Web Token (JWT) for authentication
      const payload = {
        user_id: user.id,
        username: user.username,
      };

      const secretKey = 'your_secret_key'; // Replace with your own secret key
      const options = { expiresIn: '1h' }; // Set the expiration time for the token

      jwt.sign(payload, secretKey, options, (jwtError, token) => {
        if (jwtError) {
          console.error(jwtError);
          res.status(500).json({ message: 'Internal server error' });
          return;
        }

        // Return the token to the client
        res.json({ token });
      });
    });
  });
});

router.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists in the database
  db.query('SELECT * FROM user WHERE username = ?', [username], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    // If the username already exists
    if (results.length > 0) {
      res.status(409).json({ message: 'Username already exists' });
      return;
    }

    // Hash the password before saving it to the database
    bcrypt.hash(password, 10, (bcryptError, hashedPassword) => {
      if (bcryptError) {
        console.error(bcryptError);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      // Save the user information to the database
      const newUser = { username, password: hashedPassword };
      db.query('INSERT INTO user SET ?', newUser, (insertError, insertResult) => {
        if (insertError) {
          console.error(insertError);
          res.status(500).json({ message: 'Internal server error' });
          return;
        }
        else{
        res.json({ message: 'Signup successful' });}
      });
    });
  });
});


app.use("/",router)

app.listen(3003, () => {
  console.log('Server is running on http://localhost:3003');
});