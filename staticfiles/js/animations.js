document.addEventListener("DOMContentLoaded", function () {
    let inputField = document.getElementById("playerName");
    let playerList = document.getElementById("playerPool");
    let players = [];
    let teamCount = 2; // Default number of teams
    let currentTeamIndex = 0; // For round-robin assignment

    // Use the teams container element from HTML (ensure your HTML has a container with class "teams-container")
    let teamsContainer = document.querySelector(".teams-container");

    // Add player on Enter key (prevent duplicate addition)
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addPlayer();
        }
    });

    window.addPlayer = function () {
        let playerName = inputField.value.trim();
        if (playerName === "" || players.includes(playerName)) return;
        players.push(playerName);
        updatePlayerList();
        updateWheel();
        inputField.value = "";
        inputField.focus();
    };

    function updatePlayerList() {
        playerList.innerHTML = "";
        players.forEach((player, index) => {
            let li = document.createElement("li");
            li.textContent = player;
            let removeBtn = document.createElement("button");
            removeBtn.textContent = "❌";
            removeBtn.onclick = function () {
                players.splice(index, 1);
                updatePlayerList();
                updateWheel();
            };
            li.appendChild(removeBtn);
            playerList.appendChild(li);
        });
    }

    // Canvas & Wheel Setup
    const canvas = document.getElementById("wheel");
    const ctx = canvas.getContext("2d");
    const wheelSize = 300;
    canvas.width = wheelSize;
    canvas.height = wheelSize;
    let angle = 0;
    let spinning = false;

    function updateWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the wheel with dynamic slices
        if (players.length > 0) {
            let totalPlayers = players.length;
            let angleStep = (2 * Math.PI) / totalPlayers;
            let colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"];
            ctx.save();
            // Rotate by current angle
            ctx.translate(wheelSize / 2, wheelSize / 2);
            ctx.rotate(angle * Math.PI / 180);
            ctx.translate(-wheelSize / 2, -wheelSize / 2);
            for (let i = 0; i < totalPlayers; i++) {
                let start = i * angleStep;
                let end = start + angleStep;
                ctx.beginPath();
                ctx.moveTo(wheelSize / 2, wheelSize / 2);
                ctx.arc(wheelSize / 2, wheelSize / 2, wheelSize / 2, start, end);
                ctx.fillStyle = colors[i % colors.length];
                ctx.fill();
                ctx.stroke();
                // Draw player's name on the slice
                let textAngle = start + angleStep / 2;
                ctx.save();
                ctx.translate(wheelSize / 2, wheelSize / 2);
                ctx.rotate(textAngle);
                ctx.fillStyle = "white";
                ctx.font = "16px Arial";
                ctx.fillText(players[i], wheelSize / 2 - 40, 10);
                ctx.restore();
            }
            ctx.restore();
        }
        
        // Draw invisible selector line and an upside-down triangle at the top center
        ctx.beginPath();
        ctx.moveTo(wheelSize / 2, 0);
        ctx.lineTo(wheelSize / 2, wheelSize / 2);
        ctx.strokeStyle = "rgba(0, 0, 0, 0)"; // Invisible
        ctx.stroke();
        ctx.beginPath();
        // For an upside-down triangle, base at y=10 and apex at y=20
        ctx.moveTo(wheelSize / 2 - 10, 10);
        ctx.lineTo(wheelSize / 2 + 10, 10);
        ctx.lineTo(wheelSize / 2, 20);
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.fill();
    }

    window.spinWheel = function () {
        if (players.length === 0 || spinning) return;
        spinning = true;
        let spinTime = 3000; // Total spin duration: 3 seconds
        let startAngle = angle;
        // Randomly choose final angle: at least 1 full rotation plus extra for suspense
        let finalAngle = startAngle + (Math.random() * 360 * 5 + 360);
        let startTime = performance.now();
    
        // Ease-out cubic function for deceleration
        function easeOut(t) {
            return 1 - Math.pow(1 - t, 3);
        }
    
        function animateSpin(currentTime) {
            let elapsed = currentTime - startTime;
            let t = Math.min(elapsed / spinTime, 1); // Normalize elapsed time (0 to 1)
            let easedT = easeOut(t);
            angle = startAngle + (finalAngle - startAngle) * easedT;
            updateWheel();
            if (elapsed < spinTime) {
                requestAnimationFrame(animateSpin);
            } else {
                spinning = false;
                // Determine the selected slice based on the selector fixed at 270° (top center)
                let normalizedAngle = ((angle % 360) + 360) % 360; // Convert to 0-360°
                let selectorFixed = 270; // Selector position at the top center
                let effectiveAngle = (selectorFixed - normalizedAngle + 360) % 360;
                let sliceAngle = 360 / players.length;
                let chosenIndex = Math.floor(effectiveAngle / sliceAngle);
                if (chosenIndex < 0 || chosenIndex >= players.length) chosenIndex = 0;
                let chosenPlayer = players[chosenIndex];
                movePlayerToTeam(chosenPlayer);
            }
        }
        requestAnimationFrame(animateSpin);
    };

    function movePlayerToTeam(player) {
        // Assign players round-robin using the dynamic teams container
        let teamList = document.querySelectorAll(".team ul");
        if (teamList.length === 0) return;
        let assignedTeam = teamList[currentTeamIndex];
        currentTeamIndex = (currentTeamIndex + 1) % teamCount;

        // Create an animated element for the moving player
        let playerElement = document.createElement("li");
        playerElement.textContent = player;
        playerElement.classList.add("player-assign");
        document.body.appendChild(playerElement);
        
        // Get the center of the wheel
        const canvasRect = canvas.getBoundingClientRect();
        const startX = canvasRect.left + canvas.width / 2;
        const startY = canvasRect.top + canvas.height / 2;
        // Get the center of the target team box
        const teamRect = assignedTeam.getBoundingClientRect();
        const endX = teamRect.left + teamRect.width / 2;
        const endY = teamRect.top + teamRect.height / 2;
        
        playerElement.style.position = "absolute";
        playerElement.style.left = startX + "px";
        playerElement.style.top = startY + "px";
        playerElement.style.opacity = "0";
        playerElement.style.transition = "all 0.8s ease-out";
        
        requestAnimationFrame(() => {
            playerElement.style.opacity = "1";
            playerElement.style.left = endX + "px";
            playerElement.style.top = endY + "px";
        });
        setTimeout(() => {
            playerElement.style.transform = "scale(1.2)";
            playerElement.style.transition = "transform 0.2s ease-in-out";
            setTimeout(() => {
                playerElement.style.transform = "scale(1)";
                assignedTeam.appendChild(playerElement);
                playerElement.style.position = "static";
            }, 200);
        }, 800);
        
        // Remove the player from the pool and update UI
        players = players.filter(p => p !== player);
        updatePlayerList();
        updateWheel();
        // Continue spinning automatically until only one player remains
        if (players.length > 0) {
            setTimeout(() => { spinWheel(); }, 1000);
        }
    }

    // Function to dynamically set the number of teams (e.g., from user input)
    window.setTeamCount = function (count) {
        teamCount = count;
        currentTeamIndex = 0;
        if (!teamsContainer) return; // Ensure teams container exists
        teamsContainer.innerHTML = "";
        for (let i = 0; i < teamCount; i++) {
            let teamDiv = document.createElement("div");
            teamDiv.classList.add("team");
            teamDiv.id = "team-" + i;
            teamDiv.innerHTML = `<h3>Team ${i + 1}</h3><ul></ul>`;
            teamsContainer.appendChild(teamDiv);
        }
    };

    // Initialize default teams and draw the wheel
    setTeamCount(teamCount);
    updateWheel();
});
