const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifytoken = require('./modules/verifytoken');

const app = express();
const saltRounds = 10;
const secret = "kldjasdj123kl3123asjd";

// create mysql connection
let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "test"
});

app.listen('3000', () => {
    console.log('server started');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hello");
});

/* User Creation and Authentication */

app.post('/user/create', (req, res) => {

    let { firstname, lastname, email_address, password } = req.body;

    bcrypt.hash(password, saltRounds)
    .then((hash) => {
        connection.execute("insert into users(firstname, lastname, email_address, password) values(?, ?, ?, ?)", [firstname, lastname, email_address, hash], (err) => {

            if(err){
                res.status(400).json({ message: "Unable to process the request. please try again later" });
            }
    
            res.json({ message: "User created successfully" });
        });
    })
    .catch((err) => {
        res.status(400).json({ message: "Unable to process the request. please try again later" });
    });

});

app.post('/login', (req, res) => {

    let { email_address, password } = req.body;

    connection.execute("select * from users where email_address = ?", [email_address], (err, results, fields) => {

        if(err){
            res.status(400).json({ message: "Unable to process the request. please try again later" });
        }

        if(results.length === 0){
            res.json({ message: "invalid credentials" });
        }

        bcrypt.compare(password, results[0].password)
        .then((result) => {
            if(result){

                let user = {
                    firstname: result.firstname,
                    lastname: result.lastname,
                    email_address: result.email_address
                }
                
                jwt.sign({data: user}, secret, { expiresIn: '30m' }, (err, token) => {
                    if(err){
                        res.status(400).json({ message: "Unable to process the request. please try again later" });
                    }

                    res.json({ message: "user authenticated successfully", token: token });
                });

                
            } else {
                res.json({ message: "invalid credentials" });
            }
        });
    });
});

/* blog routes */

// blogs list
app.get('/blogs', verifytoken, (req, res) => {

    jwt.verify(req.token, secret, (err, decodedToken) => {
        if(err){
            res.status(400).json({ message: err.message });
        }
    })

    connection.query("select * from blog", (err, results, fields) => {
        if(err){
            res.status(400).json({ message: "Unable to get the data. please try again later" });
        }

        res.json(results);
    });
});

// Add new blog
app.post('/blogs', verifytoken, (req, res) => {

    jwt.verify(req.token, secret, (err, decodedToken) => {
        if(err){
            res.status(400).json({ message: err.message });
        }        
    })

    let { title, description, short_description, author_id } = req.body;

    connection.execute("insert into blog(title, description, short_description, author_id, db_add_date) values(?, ?, ?, ?, NOW())", [title, description, short_description, author_id], (err) => {

        if(err){
            res.status(400).json({ message: "Unable to update the data. please try again later" });
        }

        res.json({ message: "record inserted successfully" });
    });
});

// get single blog
app.get('/blogs/:id', verifytoken, (req, res) => {
    jwt.verify(req.token, secret, (err, decodedToken) => {
        if(err){
            res.status(400).json({ message: err.message });
        }
    })

    connection.execute("select * from blog where id = ?", [req.params.id], (err, results, fields) => {
        if(err){
            res.json({ message: "Unable to get the data. please try again later" });
        }

        res.json(results);
    });
});

// update single blog
app.put('/blogs/:id', verifytoken, (req, res) => {

    jwt.verify(req.token, secret, (err, decodedToken) => {
        if(err){
            res.status(400).json({ message: err.message });
        }
    })

    let { title, description, short_description } = req.body;

    connection.execute("update blog set title = ?, description = ?, short_description  = ? where id = ?", [title, description, short_description, req.params.id], (err) => {
        if(err){
            res.json({ message: "Unable to update. please try again later" });
        }

        res.json({ message: "record updated successfully" });
    });
});

// delete single blog
app.delete('/blogs/:id', verifytoken, (req, res) => {
    jwt.verify(req.token, secret, (err, decodedToken) => {
        if(err){
            res.status(400).json({ message: err.message });
        }
    })

    connection.execute("delete from blog where id = ?", [req.params.id], (err) => {
        if(err){
            res.json({ message: "Unable to delete the data. please try again later" });
        }

        res.json({ message: "record deleted successfully" });
    });
});