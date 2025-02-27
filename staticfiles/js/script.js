document.addEventListener("DOMContentLoaded", function () {
    let inputField = document.getElementById("playerName");
    let playerList = document.getElementById("playerPool");
    let teamsContainer = document.getElementById("teams");
    let players = [];
    let teamCount = 2; // Default number of teams

    // Allow Enter key to add a player
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addPlayer();
        }
    });

    window.addPlayer = function () {
        let playerName = inputField.value.trim();
        if (playerName === "") return;

        players.push(playerName);
        updatePlayerList();
        updateWheel(players); // Call function from animate.js
        inputField.value = "";
        inputField.focus();
    };

    function updatePlayerList() {
        playerList.innerHTML = "";
        players.forEach((player, index) => {
            let listItem = document.createElement("li");
            listItem.textContent = player;

            let removeBtn = document.createElement("button");
            removeBtn.textContent = "❌";
            removeBtn.onclick = function () {
                players.splice(index, 1);
                updatePlayerList();
                updateWheel(players); // Keep the wheel updated
            };

            listItem.appendChild(removeBtn);
            playerList.appendChild(listItem);
        });
    }

    window.spinWheel = function () {
        if (players.length === 0) return;
        startSpin(players); // Calls the spinning function from animate.js
    };

    window.setTeamCount = function (count) {
        teamCount = count;
        teamsContainer.innerHTML = ""; // Clear existing teams

        for (let i = 0; i < teamCount; i++) {
            let teamDiv = document.createElement("div");
            teamDiv.classList.add("team");
            teamDiv.id = `team-${i}`;
            teamDiv.innerHTML = `<h3>Team ${i + 1}</h3><ul></ul>`;
            teamsContainer.appendChild(teamDiv);
        }
    };

    window.assignPlayerToTeam = function (player) {
        let teamList = document.querySelectorAll(".team ul");
        if (teamList.length === 0) return;

        let assignedTeam = teamList[Math.floor(Math.random() * teamList.length)];
        let playerElement = document.createElement("li");
        playerElement.textContent = player;

        assignedTeam.appendChild(playerElement);
        players = players.filter(p => p !== player);
        updatePlayerList();
        updateWheel(players);
    };

    // Set default teams and update the wheel
    setTeamCount(teamCount);
    updateWheel(players);
});
