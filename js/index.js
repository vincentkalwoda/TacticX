let apiKey = "60130162";
let gameData = {
    username: "",
    coins: 0,
    datum: "2023-07-01",
    liga: "",
    saison: "",
    team: "",
    spieltag: 2,
    formation: "",
    aufstellung: [],
    spieler: [],
    kalendar: [],
    ergebnisse: [],
    tabelle: [],
    teams: [],
    players: [],
    alleSpieler: []
};

$(document).ready(async function () {
    await loadIncomingMatches();
});

async function fetchDataAndLoad() {
    await loadIncomingMatches();
    await loadLatestResults();
}

//Schaut, ob es bereits einen User gibt
function login_checkUser() {
    //Schaut, ob im WebStorage ein Spielstand gespeichert ist -> Falls nicht zeigt es ein Modal an, um ein Profil zu erstellen
    if (localStorage.getItem("data") == null) {
        $(".login").modal('show')
        login_checkDropdown()
    } else {
        loadGameData();
    }
}

//Fügt beim Loginscreen ein Dropdown mit den Teams der ausgewählten Liga
function login_checkDropdown() {
    $('#ligaDropdown').change(async function () {
        if ($(this).val() !== '') {
            $("#teamDropdown").html(`<option value="">Ausw&auml;hlen</option>`)
            $('#teamDropdownGroup').show();
            const data = await getTeamsInLeague($(this).val())
            for (const team of data.teams) {
                $("#teamDropdown").append(`<option value="${team.idTeam}">${team.strTeam}</option>`);
            }
        } else {
            $('#teamDropdownGroup').hide();
        }
    });
    login_checkSubmit();
}

//Schaut, ob das Form richtig abgegeben wurde
function login_checkSubmit() {
    $('form').submit(async function (event) {
        event.preventDefault();
        await login_createUser();
    });
}

//User wird erstellt (Username, Team)
async function login_createUser() {
    gameData.username = $("#usernameInput").val();
    gameData.liga = $("#ligaDropdown").val();
    gameData.team = $("#teamDropdown").val();
    gameData.saison = "2023-2024"
    $(".spinner-border").show()
    $('.login-form').css('filter', 'blur(5px)');
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${gameData.team}`);
    const data = await response.json();
    gameData.spieler = data.player

    const response2 = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_teams.php?id=${gameData.liga}`);
    const data2 = await response2.json();
    gameData.teams = data2.teams

    const response3 = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsseason.php?id=${gameData.liga}&s=${gameData.saison}`);
    const data3 = await response3.json();
    gameData.kalendar = data3.events;
    gameData.kalendar.sort((x, y) => x.intRound - y.intRound);
    gameData.formation = "4-3-3"

    gameData.teams.forEach(x => {
        gameData.tabelle.push({
            idTeam: x.idTeam,
            strTeam: x.strTeam,
            strTeamBadge: x.strTeamBadge,
            intSpiele: 0,
            intSiege: 0,
            intUnentschieden: 0,
            intNiederlagen: 0,
            intTore: 0,
            intTordifferenz: 0,
            intPunkte: 0,
            strLetzteFuenf: ""
        })

    })

    for (const x of gameData.teams) {
        const response4 = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${x.idTeam}`);
        const data4 = await response4.json();
        data4.player.forEach(y => {
            gameData.alleSpieler.push(y);
        });
    }





    //TODO Aufstellung muss noch gesetzt werden
    gameData.aufstellung = []
    saveGameData();
    $(".spinner-border").hide()
    $(".login").modal('hide')
    location.reload();
}

async function fetchData() {
    /* const dbName = 'YourDatabaseName';
     const request = indexedDB.open(dbName, 1);

     request.onupgradeneeded = function (event) {
         const db = event.target.result;
         db.createObjectStore('players', { keyPath: 'id', autoIncrement: true });
     };

     request.onsuccess = async function (event) {
         const db = event.target.result;

         try {
             const response = await fetch("./assets/output.json");
             const playersData = await response.json();

             console.log('Fetched data:', playersData);

             const objectStore = db.transaction('players', 'readwrite').objectStore('players');

             // Clear existing data (optional)
             objectStore.clear();

             // Batch processing to prevent transaction timeouts
             const batchSize = 1000;
             for (let i = 0; i < playersData.length; i += batchSize) {
                 const batch = playersData.slice(i, i + batchSize);
                 await new Promise(resolve => {
                     const transaction = db.transaction('players', 'readwrite');
                     transaction.oncomplete = resolve;
                     transaction.onabort = function (event) {
                         console.error('Transaction aborted:', event.target.error);
                     };

                     const objectStore = transaction.objectStore('players');

                     // Add each player to the object store
                     batch.forEach(player => {
                         objectStore.add(player);
                     });
                 });
             }

             console.log('Data successfully stored in IndexedDB.');
         } catch (error) {
             console.error('Error fetching or storing data:', error);
         } finally {
             db.close();
         }
     };

     request.onerror = function (event) {
         console.error('Error opening IndexedDB:', event.target.error);
     };*/
}


async function setInfos() {

}
async function generateMatches() {

}

async function getTeamsInLeague(leagueID) {
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_teams.php?id=${leagueID}`);
    return await response.json();
}

async function loadIncomingMatches() {
    try {
        let i = 0;
        for (const x of gameData.kalendar) {
            let team1, team2, team1_badge, team2_badge, stadium, date, gegner;
            if ((x.idHomeTeam === gameData.team || x.idAwayTeam === gameData.team) && x.intRound == gameData.spieltag + i && i < 4) {
                if (x.idHomeTeam === gameData.team) {
                    team1 = x.strHomeTeam;
                    team2 = x.strAwayTeam;
                } else if (x.idAwayTeam === gameData.team) {
                    team1 = x.strAwayTeam;
                    team2 = x.strHomeTeam;
                }
                stadium = x.strVenue;


                gameData.teams.forEach(y => {
                    if (y.strTeam == team1) team1_badge = y.strTeamBadge;
                    if (y.strTeam == team2) team2_badge = y.strTeamBadge;
                })

                if (x.idHomeTeam != gameData.team)
                    gegner = x.idHomeTeam;
                else gegner = x.idAwayTeam;

                const inputDate = x.dateEvent.split("-");
                const formattedDate = `${inputDate[2]}.${inputDate[1]}.${inputDate[0]}`;
                const inputTime = x.strTimeLocal.split(":");
                const formattedTime = `${inputTime[0]}:${inputTime[1]}`;
                date = `${formattedDate} | ${formattedTime}`;
                const inMilliseconds = Date.parse(x.dateEvent) - Date.parse(gameData.datum);
                const inDays = inMilliseconds / (24 * 60 * 60 * 1000);
                if (i >= 1) {
                    $("#matches").append(`
                    <div class="match">
                        <div class="info">
                            <div class="date">${date}</div>
                            <div class="stadium" id="match${i}-stadium">${stadium}</div>
                            <div class="text-wrapper-6">VS</div>
                        </div>
                        <div class="gegner" onclick="showTeamInfos(${gegner})">
                            <div class="gegner-text" id="match${i}-team2">${team2}</div>
                            <img class="icon" id="match${i}-img2" src=${team2_badge} draggable="false">
                            <div class="type-wrapper">
                                <div class="type">Gegner</div>
                            </div>
                        </div>
                        <div class="team" onclick="showTeamInfos(${gameData.team})">
                            <img class="img-2" id="match${i}-img1" src=${team1_badge} draggable="false">
                            <div class="team-text" id="match${i}-team1">${team1}</div>
                            <div class="team-type-wrapper">
                                <div class="team-type">Dein Team</div>
                            </div>
                        </div>
                    </div>
                `);
                } else {
                    $("#next-match").append(`
                    <div class="match-4">
                    <div class="gegner-4" onclick="showTeamInfos(${gegner})">
                        <div class="overlap-group-3">
                            <div class="type">Gegner</div>
                        </div>
                        <div class="gegner-text" id="match1-team2">${team2}</div>
                        <img class="img-3" id="match1-img2"
                             src=${team2_badge} draggable="false">
                    </div>
                    <div class="info-2">
                        <div class="info-date">${date}</div>
                        <div class="info-stadium" id="match1-stadium">${stadium}</div>
                        <div class="group-2">
                            <button class="overlap-group-4">
                                <div class="text-wrapper-7">${inDays} Tage</div>
                            </button>
                        </div>
                    </div>
                    <div class="team-2" onclick="showTeamInfos(${gameData.team})">
                        <img class="img-2" id="match1-img1"
                             src=${team1_badge} draggable="false">
                        <div class="team-text" id="match1-team1">${team1}</div>
                        <div class="team-type-wrapper">
                            <div class="team-type">Dein Team</div>
                        </div>
                    </div>
                </div>
                
                    `)
                }
                if (inDays == 0) {
                    $("#next-match .match-4:eq(" + i + ") .overlap-group-4").removeAttr("disabled");
                    $("#next-match .match-4:eq(" + i + ") .overlap-group-4 .text-wrapper-7").text("Simulieren");
                } else {
                    $("#next-match .match-4:eq(" + i + ") .overlap-group-4").prop("disabled", true);
                }

                i++;
            }
        }


    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function showTeamInfos(teamID) {
    $(".spinner-border").show()
    $(".tabelle").empty()
    $(".spiele").empty().scrollTop(0);
    $("#mannschaft").scrollTop(0);
    $("#torwart").empty();
    $("#verteidigung").empty();
    $("#mittelfeld").empty();
    $("#sturm").empty();
    gameData.teams.forEach(y => {
        if (y.idTeam == teamID) {
            $("#teamInfosLabel").text(y.strTeam);
            $("#teamInfos_badge").attr("src", y.strTeamBadge);
            gameData.kalendar.forEach(x => {
                let team1, team2, team1_badge, team2_badge, stadium, date, gegner;
                if ((x.idHomeTeam === y.idTeam || x.idAwayTeam === y.idTeam) && x.intRound >= gameData.spieltag) {
                    if (x.idHomeTeam === y.idTeam) {
                        team1 = x.strHomeTeam;
                        team2 = x.strAwayTeam;
                    } else if (x.idAwayTeam === y.idTeam) {
                        team1 = x.strAwayTeam;
                        team2 = x.strHomeTeam;
                    }
                    stadium = x.strVenue;

                    gameData.teams.forEach(y => {
                        if (y.strTeam == team1) team1_badge = y.strTeamBadge;
                        if (y.strTeam == team2) team2_badge = y.strTeamBadge;
                    })


                    if (x.idHomeTeam != y.idTeam)
                        gegner = x.idHomeTeam;
                    else gegner = x.idAwayTeam;

                    const inputDate = x.dateEvent.split("-");
                    const formattedDate = `${inputDate[2]}.${inputDate[1]}.${inputDate[0]}`;
                    date = `${formattedDate}`;
                    $(".spiele").append(`
                    <div class="spiel">
                        <div class="spiel_info">
                            <div class="spiel_date">${date}</div>
                            <div class="spiel_vs">VS</div>
                        </div>
                        <div class="spiel_gegner" onclick="showTeamInfos(${gegner})">
                            <div class="spiel_gegner_text">${team2}</div>
                            <img class="spiel_gegner_badge" src=${team2_badge} draggable="false">
                        </div>
                        <div class="spiel_team" onclick="showTeamInfos(${y.idTeam})">
                            <img class="spiel_team_badge" src=${team1_badge} draggable="false">
                            <div class="spiel_team_text">${team1}</div>
                        </div>
                    </div>
                `);
                }
            })
            gameData.tabelle.sort((a, b) => {
                if (a.intPunkte !== b.intPunkte) {
                    return b.intPunkte - a.intPunkte;
                } else {
                    return b.intTordifferenz - a.intTordifferenz;
                }
            })
            let i = 1;
            gameData.tabelle.forEach(x => {
                if (x.idTeam == teamID) {
                    $(".tabelle").append(`
                        <tr class="active">
                            <td>${i}</td>
                            <td onclick="showTeamInfos(${x.idTeam})"><img class="logo2" src="${x.strTeamBadge}" draggable="false">${x.strTeam}</td>
                            <td>${x.intSpiele}</td>
                            <td>${x.intSiege}</td>
                            <td>${x.intUnentschieden}</td>
                            <td>${x.intNiederlagen}</td>
                            <td>${x.intTore}</td>
                            <td>${x.intTordifferenz}</td>
                            <td>${x.intPunkte}</td>
                            <td>${x.strLetzteFuenf}</td>
                        </tr>
                    `)
                } else {
                    $(".tabelle").append(`
                        <tr>
                            <td>${i}</td>
                            <td onclick="showTeamInfos(${x.idTeam})"><img class="logo2" src="${x.strTeamBadge}" draggable="false">${x.strTeam}</td>
                            <td>${x.intSpiele}</td>
                            <td>${x.intSiege}</td>
                            <td>${x.intUnentschieden}</td>
                            <td>${x.intNiederlagen}</td>
                            <td>${x.intTore}</td>
                            <td>${x.intTordifferenz}</td>
                            <td>${x.intPunkte}</td>
                            <td>${x.strLetzteFuenf}</td>
                        </tr>
                    `)
                }
                i++;
            })
            $(".tabelle").append(`
                <thead>
                    <tr>
                        <th>PL</th>
                        <th>Klub</th>
                        <th>SP</th>
                        <th>S</th>
                        <th>U</th>
                        <th>N</th>
                        <th>T</th>
                        <th>TD</th>
                        <th>PKT</th>
                        <th>Letzte 5</th>
                    </tr>
                </thead>
            `)

        }
    })
    gameData.alleSpieler.forEach(x => {
        let badge;
        let rating;
        if (x.idTeam == teamID) {
            gameData.players.forEach(y => {
                console.log(y)
                if (y.long_name.includes(x.strPlayer) || y.short_name.includes(x.strPlayer)) {
                    rating = y.overall;
                }
            })
            let initials
            if (x.strPosition.includes("-"))
                initials = x.strPosition.replace(/[^a-zA-Z-]/g, "").match(/\b\w/g).join('').toUpperCase();
            else
                initials = x.strPosition.match(/\b\w/g).join('').toUpperCase();
            if (initials === "A")
                initials = "ST"
            else if (initials === "D")
                initials = "CB"
            else if (initials === "M")
                initials = "ZM"
            if (x.strCutout === null)
                badge = "data:image/png;base64,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"
            else
                badge = x.strCutout;
            if (x.strPosition === "Goalkeeper") {
                $("#torwart").append(`
                    <div class="spielerbox">
                        <img class="pb" src=${badge}>
                        <div class="infobox">
                            <div class="pos">TW</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${rating}</div>
                    </div>
                `)
            } else if (x.strPosition.includes("Back") || x.strPosition.includes("Defender")) {
                $("#verteidigung").append(`
                    <div class="spielerbox">
                        <img class="pb" src=${badge}>
                        <div class="infobox">
                            <div class="pos">${initials}</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${rating}</div>
                    </div>
                `)
            } else if (x.strPosition.includes("Midfield")) {
                $("#mittelfeld").append(`
                    <div class="spielerbox">
                        <img class="pb" src=${badge}>
                        <div class="infobox">
                            <div class="pos">${initials}</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${rating}</div>
                    </div>
                `)
            } else if (x.strPosition.includes("Attack") || x.strPosition.includes("Wing") || x.strPosition.includes("Forward")) {
                $("#sturm").append(`
                    <div class="spielerbox">
                        <img class="pb" src=${badge}>
                        <div class="infobox">
                            <div class="pos">${initials}</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${rating}</div>
                    </div>
                `)
            }
        }
    })
    $(".spinner-border").hide()
    $("#teamInfos").modal('show');


}

async function loadLatestResults() {

    for (const x of gameData.kalendar) {
        if(x.intRound==gameData.spieltag-1) {
            let date, team1_badge, team2_badge, team1, team2
            const inputDate = x.dateEvent.split("-");
            const formattedDate = `${inputDate[2]}.${inputDate[1]}.${inputDate[0]}`;
            const inputTime = x.strTimeLocal.split(":");
            const formattedTime = `${inputTime[0]}:${inputTime[1]}`;
            date = `${formattedDate} | ${formattedTime}`;

            gameData.teams.forEach(y => {
                if (x.idHomeTeam === y.idTeam) {
                    team1_badge = y.strTeamBadge;
                    team1 = x.idHomeTeam
                }
                if (x.idAwayTeam === y.idTeam) {
                    team2_badge = y.strTeamBadge;
                    team2 = x.idAwayTeam
                }
            })

            $(".ergebnisse").append(`
                <div class="ergebnis">
                    <div class="overlap-group-2">
                        <div class="text-wrapper-2">ENDSTAND</div>
                        <div class="datum">${date}</div>
                        <img class="ergebnis-team" src=${team2_badge} draggable="false" onclick="showTeamInfos(${team2})">
                        <img class="ergebnis-team-2" src=${team1_badge} draggable="false" onclick="showTeamInfos(${team1})">
                        <div class="ergebnis-text-wrapper">
                            <div class="text">${x.intHomeScore} - ${x.intAwayScore}</div>
                        </div>
                    </div>
                </div>
            `)
        }
    }
}

function saveGameData() {
    localStorage.setItem("data", JSON.stringify(gameData))
}

function loadGameData() {
    gameData = JSON.parse(localStorage.getItem("data"));
}
