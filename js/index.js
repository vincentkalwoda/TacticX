$(document).ready(function () {
    $('.dashboard').on('click', function () {
        location.reload();
    });

    $('.liga').on('click', function () {
        postData('/getLiga')
            .then(response => {
                // Handle the response, e.g., check for success and redirect if needed
                if (response.ok) {
                    window.location.href = '/liga';
                } else {
                    console.error('Error:', response.statusText);
                    // Handle the error, e.g., show an error message to the user
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle the error, e.g., show an error message to the user
            });
    });

    $('.verein').on('click', function () {
        postData('/getVerein')
            .then(response => {
                // Handle the response, e.g., check for success and redirect if needed
                if (response.ok) {
                    window.location.href = '/verein';
                } else {
                    console.error('Error:', response.statusText);
                    // Handle the error, e.g., show an error message to the user
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle the error, e.g., show an error message to the user
            });
    });
    $('.marktplatz').on('click', function () {
        postData('/getMarktplatz')
            .then(response => {
                // Handle the response, e.g., check for success and redirect if needed
                if (response.ok) {
                    window.location.href = '/marktplatz';
                } else {
                    console.error('Error:', response.statusText);
                    // Handle the error, e.g., show an error message to the user
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle the error, e.g., show an error message to the user
            });
    });

    function postData(url) {
        // Use fetch API to perform a POST request
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }


    $('.showTeam').on('click', function () {
        var clickedId = $(this).attr('id');
        showTeamInfos(clickedId)
    });

    function showTeamInfos(teamId) {
        $(".tabelle").empty()
        $(".spiele").empty().scrollTop(0);
        $("#mannschaft").scrollTop(0);
        $("#torwart").empty();
        $("#verteidigung").empty();
        $("#mittelfeld").empty();
        $("#sturm").empty();
        let teams = '<%= encodeURIComponent(JSON.stringify(teams)) %>';
        teams = JSON.parse(decodeURIComponent(teams));

        let kalendar = '<%= encodeURIComponent(JSON.stringify(kalendar)) %>';
        kalendar = JSON.parse(decodeURIComponent(kalendar));

        let tabelle = '<%= encodeURIComponent(JSON.stringify(tabelle)) %>';
        tabelle = JSON.parse(decodeURIComponent(tabelle));

        let players = '<%= encodeURIComponent(JSON.stringify(players))%>';
        players = JSON.parse(decodeURIComponent(players));

        let spieltag = '<%= spieltag %>';
        spieltag = parseInt(spieltag, 10);


        function decodeHTML(html) {
            var txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        }

        teams.forEach(y => {
            if (y.idTeam == teamId) {
                $("#teamInfosLabel").text(y.strTeam);
                $("#teamInfos_badge").attr("src", y.strTeamBadge);
                kalendar.forEach(x => {
                    let team1, team2, team1_badge, team2_badge, stadium, date, gegner;
                    if ((x.idHomeTeam === y.idTeam || x.idAwayTeam === y.idTeam) && x.intRound >= spieltag) {
                        if (x.idHomeTeam === y.idTeam) {
                            team1 = x.strHomeTeam;
                            team2 = x.strAwayTeam;
                        } else if (x.idAwayTeam === y.idTeam) {
                            team1 = x.strAwayTeam;
                            team2 = x.strHomeTeam;
                        }
                        stadium = x.strVenue;

                        teams.forEach(y => {
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
                        <div class="spiel_gegner">
                            <div class="spiel_gegner_text">${team2}</div>
                            <img class="spiel_gegner_badge" src="${team2_badge}" draggable="false">
                        </div>
                        <div class="spiel_team">
                            <img class="spiel_team_badge" src="${team1_badge}" draggable="false">
                            <div class="spiel_team_text">${team1}</div>
                        </div>
                    </div>
                `);
                    }
                })
                tabelle.sort((a, b) => {
                    if (a.intPunkte !== b.intPunkte) {
                        return b.intPunkte - a.intPunkte;
                    } else {
                        return b.intTordifferenz - a.intTordifferenz;
                    }
                })
                let i = 1;
                tabelle.forEach(x => {
                    if (x.idTeam == teamId) {
                        $(".tabelle").append(`
                        <tr class="active showTeam" id=${x.idTeam}>
                            <td>${i}</td>
                            <td><img class="logo2" src="${x.strTeamBadge}" draggable="false">${x.strTeam}</td>
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
                        <tr class="showTeam" id="${x.idTeam}">
                            <td>${i}</td>
                            <td><img class="logo2" src="${x.strTeamBadge}" draggable="false">${x.strTeam}</td>
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
        players.forEach(x => {
            if (x.idTeam == teamId) {
                let badge;
                let initials
                if (x.strPosition.includes("-"))
                    initials = x.strPosition.replace(/[^a-zA-Z-]/g, "").match(/\b\w/g).join('').toUpperCase();
                else
                    initials = x.strPosition.match(/\b\w/g)?.join('').toUpperCase() || '';
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
                        <img class="pb" src="${badge}">
                        <div class="infobox">
                            <div class="pos">TW</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${x.intRating}</div>
                    </div>
                `)
                } else if (x.strPosition.includes("Back") || x.strPosition.includes("Defender")) {
                    $("#verteidigung").append(`
                    <div class="spielerbox">
                        <img class="pb" src="${badge}">
                        <div class="infobox">
                            <div class="pos">${initials}</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${x.intRating}</div>
                    </div>
                `)
                } else if (x.strPosition.includes("Midfield")) {
                    $("#mittelfeld").append(`
                    <div class="spielerbox">
                        <img class="pb" src="${badge}">
                        <div class="infobox">
                            <div class="pos">${initials}</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${x.intRating}</div>
                    </div>
                `)
                } else if (x.strPosition.includes("Attack") || x.strPosition.includes("Wing") || x.strPosition.includes("Forward")) {
                    $("#sturm").append(`
                    <div class="spielerbox">
                        <img class="pb" src="${badge}">
                        <div class="infobox">
                            <div class="pos">${initials}</div>
                            <div class="name">${x.strPlayer}</div>
                        </div>
                        <div class="rating">${x.intRating}</div>
                    </div>
                `)
                }
            }
        })
        $(".spinner-border").hide()
        $("#teamInfos").modal('show');
    }
});