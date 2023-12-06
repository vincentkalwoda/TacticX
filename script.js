const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const path = require('path');
const {response} = require("express");
const app = express();
const bcrypt = require("bcrypt")
const ejs = require('ejs');

app.set('view engine', 'ejs');

const connection  = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'tacticx',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.get('/*.css', (req, res) => {
    res.type('text/css');
    res.sendFile(__dirname + req.url);
});
app.get('/*.js', (req, res) => {
    res.type('text/js');
    res.sendFile(__dirname + req.url);
});
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));

app.get('/', function (request, response) {
    if (!request.session.loggedin)
        response.redirect("/login")
    else {
        response.redirect("/dashboard")
    }
});

//Login-Check Datenbank
app.post('/auth', function(request, response) {
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/dashboard');
            } else {
                response.send('Incorrect Username and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

//Register-Check Datenbank
app.post('/auth2', function(request, response) {
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
            connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
                if (error) throw error;
                if (results.length > 0) {
                    response.send('User existiert bereits.')
                } else {
                    connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (error, results, fields) => {
                        if (error) {
                            console.error('Error executing query:', error);
                        } else {
                            console.log('User inserted successfully');
                        }
                    });
                    response.redirect("/")

                }
                response.end();
            });

    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

//Login HTML
app.get('/login', (request, response) => {
    response.sendFile(__dirname + '/login.html');
});

//Register HTML
app.get('/register', (request, response) => {
    response.sendFile(__dirname + '/register.html');
});

//Dashboard HTMl
app.get('/dashboard', function(request, response) {
    if (request.session.loggedin) {
        const username = request.session.username;
        loadUserData(username, function (userData) {
            if (userData)
                response.render('index', userData)
        })

    } else
        response.redirect('/login');
});

function loadUserData(username, callback) {
    connection.query('SELECT * FROM users WHERE username = ?', [username], function (error, results, fields) {
        if (error) {
            throw error;
        } else {
            let userData = null;
            if (results.length > 0) {
                userData = {
                    teamID: results[0].teamID,
                    teams: JSON.parse(results[0].teams),
                    kalendar: JSON.parse(results[0].kalendar),
                    spieltag: results[0].spieltag,
                    datum: results[0].datum,
                    username: username
                };
            }
            callback(userData);
        }
    });
}





app.listen(3000);