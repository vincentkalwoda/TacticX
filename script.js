const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const path = require('path');
const {response} = require("express");
const app = express();
const bcrypt = require("bcrypt")
const ejs = require('ejs');
const apiKey = "60130162"
const stringSimilarity = require('string-similarity');
const {json} = require("body-parser");

let playerData;
let aufstellung;

app.set('view engine', 'ejs');
app.use(json({limit: '10mb'}));

const connection  = mysql.createConnection({
    host: '91.151.17.12',
    user: 'u233744db1',
    password: 'tacticx',
    database: 'u233744db1',
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
        connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
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

//SelectTeam Datenbank
app.post('/selectTeam', async function (request, response) {
    if (request.session.loggedin) {
        await loadPlayerData();
        let league = request.body.ligaDropdown;
        let team = request.body.teamDropdown;
        let username = request.session.username;
        if (league && team) {
            const apiresponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${team}`);
            const data = await apiresponse.json();
            const spieler = JSON.stringify(data.player);

            const apiresponse2 = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_teams.php?id=${league}`);
            const data2 = await apiresponse2.json();
            let teams = data2.teams


            let players = []
            for (const x of data2.teams) {
                const apiresponse3 = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${x.idTeam}`);
                const data3 = await apiresponse3.json();
                for (const y of data3.player)
                    players.push(y)
            }

            const apiresponse3 = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsseason.php?id=${league}&s=2023-2024`);
            const data3 = await apiresponse3.json();
            let kalendar = data3.events;
            kalendar.sort((x, y) => {
                // Compare by intRound
                if (x.intRound !== y.intRound) {
                    return x.intRound - y.intRound;
                }

                // If intRound is equal, compare by dateEvent
                if (x.dateEvent !== y.dateEvent) {
                    return new Date(x.dateEvent) - new Date(y.dateEvent);
                }
            });

            kalendar = JSON.stringify(kalendar)

            let tabelle = []
            for (const x of data2.teams) {
                tabelle.push({
                    idTeam: x.idTeam,
                    strTeam: x.strTeam,
                    strTeamBadge: x.strTeamBadge,
                    intSpiele: 0,
                    intSiege: 0,
                    intUnentschieden: 0,
                    intNiederlagen: 0,
                    intTore: 0,
                    intGegentore: 0,
                    intTordifferenz: 0,
                    intPunkte: 0,
                    strLetzteFuenf: ""
                })
            }
            tabelle = JSON.stringify(tabelle);

            function normalizeString(str) {
                return str
                    .replace(/[ä]/g, 'a')
                    .replace(/[ü]/g, 'u')
                    .replace(/[ö]/g, 'o');
            }


            let status = false;
            for (let x = 0; x < players.length; x++) {
                let initials
                if (players[x].strPosition.includes("-") && !players[x].strPosition.includes("Manager"))
                    initials = players[x].strPosition.replace(/[^a-zA-Z-]/g, "").match(/\b\w/g).join('').toUpperCase();
                else if (!players[x].strPosition.includes("-") && !players[x].strPosition.includes("Manager"))
                    initials = players[x].strPosition.match(/\b\w/g)?.join('').toUpperCase() || '';
                if (initials === "A")
                    initials = "CF"
                else if (initials === "F")
                    initials = "ST"
                else if (initials === "D")
                    initials = "CB"
                else if (initials === "AM")
                    initials = "LM"
                else if (initials === "DM")
                    initials = "RM"
                else if (initials === "M")
                    initials = "CM"
                else if (initials === "G")
                    initials = "GK";
                for (const y of playerData) {
                    if (players[x].strPlayer.includes(normalizeString(y.short_name)) || players[x].strPlayer.includes(normalizeString(y.long_name)) || players[x].strPlayer === normalizeString(y.short_name) || players[x].strPlayer === normalizeString(y.long_name)) {
                        players[x] = {
                            idPlayer: players[x].idPlayer,
                            idTeam: players[x].idTeam,
                            idTeam2: players[x].idTeam2,
                            strNationality: players[x].strNationality,
                            strPlayer: players[x].strPlayer,
                            strTeam: players[x].strTeam,
                            strNumber: players[x].strNumber,
                            strCutout: players[x].strCutout,
                            strPosition: initials,
                            intRating: y.overall,
                            intMatchesPlayed: 0,
                            intGoals: 0,
                            intAssists: 0,
                            intAvgRating: 6
                        };
                        status = true;
                    }
                }
                if (status === false) {
                    players[x] = {
                        idPlayer: players[x].idPlayer,
                        idTeam: players[x].idTeam,
                        idTeam2: players[x].idTeam2,
                        strNationality: players[x].strNationality,
                        strPlayer: players[x].strPlayer,
                        strTeam: players[x].strTeam,
                        strNumber: players[x].strNumber,
                        strCutout: players[x].strCutout,
                        strPosition: initials,
                        intRating: 0,
                        intMatchesPlayed: 0,
                        intGoals: 0,
                        intAssists: 0,
                        intAvgRating: 0
                    };
                }
                status = false;
            }

            let shopIn = []
            let price
            while (shopIn.length !== 6) {
                let index = Math.floor(Math.random() * players.length);
                if (players[index].idTeam !== team && players[index].idTeam2 !== team && players[index].intRating !== 0 && players[index].strNumber !== "" && !shopIn.includes(players[index])) {
                    price = generateMarketPrice(players[index].intRating)
                    shopIn.push({idPlayer: players[index].idPlayer, price: price, typ: 0});
                }
            }

            let shopOut = []
            while (shopOut.length !== 6) {
                let index = Math.floor(Math.random() * players.length);
                if (players[index].idTeam === team && players[index].intRating !== 0 && players[index].strNumber !== "" && !shopOut.includes(players[index])) {
                    price = generateMarketPrice(players[index].intRating)
                    shopOut.push({idPlayer: players[index].idPlayer, price: price, typ: 1});
                }
            }

            let shop = JSON.stringify(shopIn.concat(shopOut));

            let positions = {
                'GK': 1,
                'LB': 2,
                'CB': [3, 4],
                'RB': 5,
                'LM': 6,
                'CM': [6, 7, 8],
                'RM': 8,
                'RW': 11,
                'CF': 10,
                'LW': 9,
                'ST': [9, 10, 11]
            };

            let play = [];
            for (const x of players) {
                if (x.idTeam === team || x.idTeam2 === team) {
                    play.push(x);
                }
            }

            play.sort((x, y) => y.intRating - x.intRating);

            const assignedPlayers = [];
            const positionsCount = {};

            for (const player of play) {
                const playerPositions = positions[player.strPosition];

                if (Array.isArray(playerPositions)) {
                    for (const pos of playerPositions) {
                        if (!positionsCount[pos] || positionsCount[pos] < 1) {
                            assignedPlayers.push({idPlayer: player.idPlayer, positionOnField: pos});
                            positionsCount[pos] = (positionsCount[pos] || 0) + 1;
                            break;
                        }
                    }
                } else {
                    if (!positionsCount[playerPositions] || positionsCount[playerPositions] < 1) {
                        assignedPlayers.push({idPlayer: player.idPlayer, positionOnField: playerPositions});
                        positionsCount[playerPositions] = (positionsCount[playerPositions] || 0) + 1;
                    }
                }
            }
            for (let i = 0; i < assignedPlayers; i++) {
                if (assignedPlayers[i].positionOnField === "undefined") assignedPlayers[i].positionOnField = i + 1;
            }

            assignedPlayers.sort((a, b) => a.positionOnField - b.positionOnField);

            aufstellung = JSON.stringify(assignedPlayers)


            for (let j = 0; j < teams.length; j++) {
                let play = [];
                for (const x of players) {
                    if (x.idTeam === teams[j].idTeam || x.idTeam2 === teams[j].idTeam) {
                        play.push(x);
                    }
                }

                play.sort((x, y) => y.intRating - x.intRating);

                const assignedPlayers = [];
                const positionsCount = {};

                for (const player of play) {
                    const playerPositions = positions[player.strPosition];

                    if (Array.isArray(playerPositions)) {
                        for (const pos of playerPositions) {
                            if (!positionsCount[pos] || positionsCount[pos] < 1) {
                                assignedPlayers.push({idPlayer: player.idPlayer, positionOnField: pos});
                                positionsCount[pos] = (positionsCount[pos] || 0) + 1;
                                break;
                            }
                        }
                    } else {
                        if (!positionsCount[playerPositions] || positionsCount[playerPositions] < 1) {
                            assignedPlayers.push({idPlayer: player.idPlayer, positionOnField: playerPositions});
                            positionsCount[playerPositions] = (positionsCount[playerPositions] || 0) + 1;
                        }
                    }
                }
                for (let i = 0; i < assignedPlayers; i++) {
                    if (assignedPlayers[i].positionOnField === "undefined") assignedPlayers[i].positionOnField = i + 1;
                }

                assignedPlayers.sort((a, b) => a.positionOnField - b.positionOnField);
                teams[j].strLocked = assignedPlayers;
            }
            teams = JSON.stringify(teams)


            players = JSON.stringify(players)
            connection.query('UPDATE users set coins=?, leagueID = ?, teamID = ?, spieltag=?, aufstellung = ?, spieler = ?, kalendar = ?, tabelle = ?, teams = ?, players = ?, shop = ?  WHERE username = ?', [0, league, team, 1, aufstellung, spieler, kalendar, tabelle, teams, players, shop, username], function (error, results, fields) {
                if (error) throw error;
                else
                    response.redirect('/dashboard');
                response.end();
            });
        } else {
            response.send('Please enter Username and Password!');
            response.end();
        }
    } else {
        response.redirect('/login');
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
app.get('/dashboard', async function (request, response) {
    if (request.session.loggedin) {
        try {
            const username = request.session.username;
            await loadUserData(username, function (userData) {
                if (userData)
                    response.render('index', userData);
            });

        } catch (error) {
            console.error('Error loading data:', error);
            response.status(500).send('Internal Server Error');
        }
    } else {
        response.redirect('/login');
    }
});

app.get('/liga', async function (request, response) {
    if (request.session.loggedin) {
        try {
            const username = request.session.username;
            await loadUserData(username, function (userData) {
                if (userData)
                    response.render('liga', userData);
            });

        } catch (error) {
            console.error('Error loading data:', error);
            response.status(500).send('Internal Server Error');
        }
    } else {
        response.redirect('/login');
    }
});

app.post('/getDashboard', async function (request, response) {
    if (request.session.loggedin) {
        response.redirect('/dashboard')
    } else {
        response.redirect('/login')
    }
})


app.post('/getLiga', async function (request, response) {
    if (request.session.loggedin) {
        response.redirect('/liga')
    } else {
        response.redirect('/login')
    }
})

app.get('/verein', async function (request, response) {
    if (request.session.loggedin) {
        try {
            const username = request.session.username;
            await loadUserData(username, function (userData) {
                if (userData)
                    response.render('verein', userData);
            });

        } catch (error) {
            console.error('Error loading data:', error);
            response.status(500).send('Internal Server Error');
        }
    } else {
        response.redirect('/login');
    }
});

app.post('/getVerein', async function (request, response) {
    if (request.session.loggedin) {
        response.redirect('/verein')
    } else {
        response.redirect('/login')
    }
})

app.get('/marktplatz', async function (request, response) {
    if (request.session.loggedin) {
        try {
            const username = request.session.username;
            await loadUserData(username, function (userData) {
                if (userData)
                    response.render('marktplatz', userData);
            });

        } catch (error) {
            console.error('Error loading data:', error);
            response.status(500).send('Internal Server Error');
        }
    } else {
        response.redirect('/login');
    }
});

app.post('/getMarktplatz', async function (request, response) {
    if (request.session.loggedin) {
        response.redirect('/marktplatz')
    } else {
        response.redirect('/login')
    }
})

app.post('/teamInfo', (req, res) => {
    const idTeam = req.body.teamId;  // Assuming you're using bodyParser or a similar middleware

    // Render your EJS template and pass the value to it
    res.render('index', {idTeam});
});


app.post('/updateKalendar', (request, response) => {
    const kalendar = JSON.stringify(request.body);
    if (request.session.loggedin) {
        const username = request.session.username;

        connection.query('UPDATE users SET kalendar = ? WHERE username = ?', [kalendar, username], function (error, results, fields) {
            if (error) {
                throw error;
            } else {
                // Handle success, if needed
                response.sendStatus(200);
            }
        });
    } else {
        response.sendStatus(401); // Unauthorized
    }
});
app.post('/updateTable', (request, response) => {
    const table = JSON.stringify(request.body);
    if (request.session.loggedin) {
        let username = request.session.username;

        connection.query('UPDATE users SET tabelle = ? WHERE username = ?', [table, username], async function (error, results, fields) {
            if (error) {
                throw error;
            } else {
            }
        });
    }
});

app.post('/updateAufstellung', (request, response) => {
    const aufstellung = JSON.stringify(request.body);
    if (request.session.loggedin) {
        let username = request.session.username;

        connection.query('UPDATE users SET aufstellung = ? WHERE username = ?', [aufstellung, username], async function (error, results, fields) {
            if (error) {
                throw error;
            } else {
            }
        });
    }
});

app.post('/updatePlayers', (request, response) => {
    const x = JSON.stringify(request.body);
    if (request.session.loggedin) {
        const username = request.session.username;

        connection.query('UPDATE users SET players = ? WHERE username = ?', [x, username], function (error, results, fields) {
            if (error) {
                throw error;
            } else {
                // Handle success, if needed
                response.sendStatus(200);
            }
        });
    } else {
        response.sendStatus(401); // Unauthorized
    }
});

app.post('/deleteProgress', (request, response) => {
    if (request.session.loggedin) {
        const username = request.session.username;

        connection.query('UPDATE users SET coins = ?, leagueID = ?, teamID = ? WHERE username = ?', [0, null, null, username], function (error, results, fields) {
            if (error) {
                throw error;
            } else {
                // Handle success, if needed
                response.sendStatus(200);
            }
        });
    } else {
        response.sendStatus(401); // Unauthorized
    }
});

app.post('/updateTeams', (request, response) => {
    const x = JSON.stringify(request.body);
    if (request.session.loggedin) {
        const username = request.session.username;

        connection.query('UPDATE users SET teams = ? WHERE username = ?', [x, username], function (error, results, fields) {
            if (error) {
                throw error;
            } else {
                // Handle success, if needed
                response.sendStatus(200);
            }
        });
    } else {
        response.sendStatus(401); // Unauthorized
    }
});

app.post('/updateSpieltag', (request, response) => {

    if (request.session.loggedin) {
        let username = request.session.username;

        connection.query('SELECT * FROM users WHERE username = ?', [username], function (error, results, fields) {
            if (error) {
                throw error;
            } else {
                let team = results[0].teamID
                let players = JSON.parse(results[0].players);
                let shopIn = []
                let price
                while (shopIn.length !== 6) {
                    let index = Math.floor(Math.random() * players.length);
                    if (players[index].idTeam !== team && players[index].idTeam2 !== team && players[index].intRating !== 0 && players[index].strNumber !== "" && !shopIn.includes(players[index])) {
                        price = generateMarketPrice(players[index].intRating)
                        shopIn.push({idPlayer: players[index].idPlayer, price: price, typ: 0});
                    }
                }

                let shopOut = []
                while (shopOut.length !== 6) {
                    let index = Math.floor(Math.random() * players.length);
                    if (players[index].idTeam === team && players[index].intRating !== 0 && players[index].strNumber !== "" && !shopOut.includes(players[index])) {
                        price = generateMarketPrice(players[index].intRating)
                        shopOut.push({idPlayer: players[index].idPlayer, price: price, typ: 1});
                    }
                }

                let shop = JSON.stringify(shopIn.concat(shopOut));


                connection.query('UPDATE users SET spieltag = ?, shop = ? WHERE username = ?', [results[0].spieltag + 1, shop, username], async function (error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                    }
                });
            }
        });
    }
});

app.post('/updateCoins', (request, response) => {
    let coins = request.body.coins;
    if (request.session.loggedin) {
        let username = request.session.username;

        connection.query('UPDATE users SET coins = ? WHERE username = ?', [coins, username], async function (error, results, fields) {
            if (error) {
                throw error;
            } else {
            }
        });
    }
});



async function loadUserData(username, callback) {
    const countriesResponse = await fetch("https://restcountries.com/v2/all");
    const countries = await countriesResponse.json();
    connection.query('SELECT * FROM users WHERE username = ?', [username], function (error, results, fields) {
        if (error) {
            throw error;
        } else {
            let userData = null;
            if (results.length > 0) {
                userData = {
                    username: username,
                    coins: results[0].coins,
                    datum: results[0].datum,
                    leagueID: results[0].leagueID,
                    saison: results[0].saison,
                    teamID: results[0].teamID,
                    spieltag: results[0].spieltag,
                    formation: results[0].formation,
                    aufstellung: JSON.parse(results[0].aufstellung),
                    spieler: JSON.parse(results[0].spieler),
                    kalendar: JSON.parse(results[0].kalendar),
                    tabelle: JSON.parse(results[0].tabelle),
                    teams: JSON.parse(results[0].teams),
                    players: JSON.parse(results[0].players),
                    countries: countries,
                    shop: JSON.parse(results[0].shop)
                };
            }
            callback(userData);
        }
    });
}

function loadPlayerData() {
    connection.query('SELECT * FROM player_data', [], function (error, results, fields) {
        if (error) {
            throw error;
        } else {
            playerData = results;
        }
    });
}

function generateMarketPrice(rating) {
    // Assuming a linear relationship between rating and market price
    const basePrice = 0;
    const pricePerRating = Math.floor(Math.random() + 3);

    const marketPrice = basePrice + rating * pricePerRating;

    return Math.max(0, marketPrice);
}

app.listen(3000);