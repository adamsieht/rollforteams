document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    let inputField = document.getElementById("playerName");
    let playerList = document.getElementById("playerPool");
    let teamsContainer = document.querySelector(".teams-container");
    let teamCountDisplay = document.getElementById("team-count"); // from new arrow-based UI
  
    let players = [];
    let teamCount = 2; // Default number of teams
    let currentTeamIndex = 0; // For round-robin assignment
  
    // Add player on Enter key
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
  
      // Draw the wheel with dynamic slices if there are players
      if (players.length > 0) {
        let totalPlayers = players.length;
        let angleStep = (2 * Math.PI) / totalPlayers;
        // Colors for the slices (can be adjusted)
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
          ctx.font = "30px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(players[i], wheelSize / 2 - 40, 10);
          ctx.restore();
        }
        ctx.restore();
      }
  
      // Draw invisible selector line and an upside-down triangle at the top center
      ctx.beginPath();
      ctx.moveTo(wheelSize / 2, 0);
      ctx.lineTo(wheelSize / 2, wheelSize / 2);
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.stroke();
      ctx.beginPath();
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
      let spinTime = 3000; // Total spin duration (in ms)
      let startAngle = angle;
      // Random final angle for suspense (at least one full rotation)
      let finalAngle = startAngle + (Math.random() * 360 * 5 + 360);
      let startTime = performance.now();
  
      // Ease-out cubic function for deceleration
      function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
      }
  
      function animateSpin(currentTime) {
        let elapsed = currentTime - startTime;
        let t = Math.min(elapsed / spinTime, 1); // Normalize time
        let easedT = easeOut(t);
        angle = startAngle + (finalAngle - startAngle) * easedT;
        updateWheel();
        if (elapsed < spinTime) {
          requestAnimationFrame(animateSpin);
        } else {
          spinning = false;
          // Determine the winning slice (selector fixed at 270°)
          let normalizedAngle = ((angle % 360) + 360) % 360;
          let selectorFixed = 270;
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
      // Get the list of team ULs from the dynamically generated teams
      let teamList = document.querySelectorAll(".team ul");
      if (teamList.length === 0) return;
      let assignedTeam = teamList[currentTeamIndex];
      currentTeamIndex = (currentTeamIndex + 1) % teamCount;
  
      // Create an animated element for the player moving from the wheel to the team box
      let playerElement = document.createElement("li");
      playerElement.textContent = player;
      // New animation color instead of lightblue
      playerElement.classList.add("player-assign");
      document.body.appendChild(playerElement);
  
      // Calculate starting (wheel center) and ending (team center) positions
      const canvasRect = canvas.getBoundingClientRect();
      const startX = canvasRect.left + canvas.width / 2;
      const startY = canvasRect.top + canvas.height / 2;
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
  
      // Remove the player from the pool and update the UI
      players = players.filter(p => p !== player);
      updatePlayerList();
      updateWheel();
  
      // Continue spinning automatically if more players remain
      if (players.length > 0) {
        setTimeout(() => { spinWheel(); }, 1000);
      }
    }
  
    // Function to set the number of teams dynamically
    window.setTeamCount = function (count) {
      teamCount = count;
      currentTeamIndex = 0;
      if (!teamsContainer) return;
      teamsContainer.innerHTML = "";
      for (let i = 0; i < teamCount; i++) {
        let teamDiv = document.createElement("div");
        teamDiv.classList.add("team");
        teamDiv.id = "team-" + i;
        teamDiv.innerHTML = `<h3>Team ${i + 1}</h3><ul></ul>`;
        teamsContainer.appendChild(teamDiv);
      }
    };
  
    // Event listeners for the arrow buttons that update team count instantly
    document.getElementById("increase-teams").addEventListener("click", function () {
      teamCount++;
      teamCountDisplay.textContent = teamCount;
      setTeamCount(teamCount);
    });
  
    document.getElementById("decrease-teams").addEventListener("click", function () {
      if (teamCount > 1) {
        teamCount--;
        teamCountDisplay.textContent = teamCount;
        setTeamCount(teamCount);
      }
    });
  
        // Function to shuffle the players array and update the UI
    window.shufflePlayers = function () {
        // Shuffle the players array
        players = shuffleArray(players);
        // Update the player list and the wheel display ("the board")
        updatePlayerList();
        updateWheel();
    };
    
    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements at indices i and j
        [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    window.clearPlayers = function () {
        // 1. Clear the players array
        players = [];
      
        // 2. Clear any assigned players from teams (if you're storing them in .team ul)
        let teamLists = document.querySelectorAll(".team ul");
        teamLists.forEach(ul => ul.innerHTML = "");
      
        // 3. Update your player list display and wheel
        updatePlayerList();
        updateWheel();
      };
    // Initialize default teams and draw the initial wheel
    setTeamCount(teamCount);
    updateWheel();
  });
  