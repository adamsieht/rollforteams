document.addEventListener("DOMContentLoaded", function () {
  /************* Setup: DOM Elements and Global Variables *************/
  // Canvas & Wheel Setup
  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const wheelSize = 300;
  canvas.width = wheelSize;
  canvas.height = wheelSize;

  // Other DOM Elements
  const inputField = document.getElementById("playerName");
  const playerList = document.getElementById("playerPool");
  const teamsContainer = document.getElementById("teams") || document.querySelector(".teams-container");
  const teamCountDisplay = document.getElementById("team-count"); // if needed

  // Global Variables
  let players = [];
  let teamCount = 2; // Default number of teams
  let currentTeamIndex = 0; // For round-robin assignment
  let angle = 0;
  let spinning = false;

  /************* Utility Functions *************/
  // Logging Wrapper: Wraps functions to log when they are called.
  function withLogging(fn) {
    return function (...args) {
      console.log("Calling " + (fn.name || "anonymous function"));
      return fn.apply(this, args);
    };
  }

  // Fisher-Yates Shuffle Algorithm.
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Storage Helpers: Save and load players from localStorage.
  function storePlayers() {
    localStorage.setItem("players", JSON.stringify(players));
  }

  function loadPlayers() {
    const defaultPlayers = ["Alice", "Bob", "Charlie", "Diana", "Luke", "Moira", "Grant", "Adam"];
    let storedPlayers = localStorage.getItem("players");
    let playersFromStorage = [];
    if (storedPlayers) {
      try {
        playersFromStorage = JSON.parse(storedPlayers);
        if (!Array.isArray(playersFromStorage) || playersFromStorage.length === 0) {
          throw new Error("Invalid data");
        }
      } catch (error) {
        console.error("Error reading players from storage:", error);
        playersFromStorage = defaultPlayers;
        localStorage.setItem("players", JSON.stringify(defaultPlayers));
      }
    } else {
      playersFromStorage = defaultPlayers;
      localStorage.setItem("players", JSON.stringify(defaultPlayers));
    }
    return playersFromStorage;
  }

  /************* UI Update Functions *************/
  // Update the wheel drawing based on the current players array.
  function updateWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (players.length > 0) {
      const totalPlayers = players.length;
      const angleStep = (2 * Math.PI) / totalPlayers;
      const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"];
      ctx.save();
      
      // Rotate by current angle (converted to radians)
      ctx.translate(wheelSize / 2, wheelSize / 2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.translate(-wheelSize / 2, -wheelSize / 2);
      
      for (let i = 0; i < totalPlayers; i++) {
        const start = i * angleStep;
        const end = start + angleStep;
        ctx.beginPath();
        ctx.moveTo(wheelSize / 2, wheelSize / 2);
        ctx.arc(wheelSize / 2, wheelSize / 2, wheelSize / 2, start, end);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.stroke();
        
        // Draw player's name on the slice.
        const textAngle = start + angleStep / 2;
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
    
    // Draw a fixed selector: an invisible line and a triangle at the top center.
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

  // Update the list of players in the UI.
  function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach((player, index) => {
      const li = document.createElement("li");
      li.textContent = player;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "❌";
      removeBtn.onclick = function () {
        players.splice(index, 1);
        updatePlayerList();
        updateWheel();
        storePlayers();
      };
      li.appendChild(removeBtn);
      playerList.appendChild(li);
    });
  }

  /************* Core Functions *************/
  // Global spinWheel function: spins once (or auto-spins if enabled).
  window.spinWheel = withLogging(function spinWheel(initialSpeed = 360) {
    if (players.length === 0 || spinning) return;
    spinning = true;
    const spinTime = 3000; // Total spin duration (ms)
    const startAngle = angle;
    // Add random extra rotations and a random offset.
    const extraRotations = Math.floor(Math.random() * 5) + 3; // 3 to 7 extra rotations
    const randomOffset = Math.random() * 360; // Random offset in degrees
    const finalAngle = startAngle + extraRotations * 360 + randomOffset;
    const startTime = performance.now();

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animateSpin(currentTime) {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / spinTime, 1);
      const easedT = easeOut(t);
      angle = startAngle + (finalAngle - startAngle) * easedT;
      updateWheel();
      if (elapsed < spinTime) {
        requestAnimationFrame(animateSpin);
      } else {
        spinning = false;
        // Determine the winning slice (selector fixed at 270°)
        const normalizedAngle = ((angle % 360) + 360) % 360;
        const selectorFixed = 270;
        const effectiveAngle = (selectorFixed - normalizedAngle + 360) % 360;
        const sliceAngle = 360 / players.length;
        let chosenIndex = Math.floor(effectiveAngle / sliceAngle);
        if (chosenIndex < 0 || chosenIndex >= players.length) chosenIndex = 0;
        const chosenPlayer = players[chosenIndex];

        movePlayerToTeam(chosenPlayer);

        // Auto-spin check.
        if (document.getElementById("autoSpin").checked && players.length > 0) {
          setTimeout(() => { spinWheel(); }, 1000);
        }
      }
    }
    requestAnimationFrame(animateSpin);
  });

  // Animate moving a player from the wheel to a team.
  function movePlayerToTeam(player) {
    const teamList = document.querySelectorAll(".team ul");
    if (teamList.length === 0) return;
    const assignedTeam = teamList[currentTeamIndex];
    currentTeamIndex = (currentTeamIndex + 1) % teamCount;

    const playerElement = document.createElement("li");
    playerElement.textContent = player;
    playerElement.classList.add("player-team");
    document.body.appendChild(playerElement);

    // Calculate starting and ending positions for animation.
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
      playerElement.style.justifyContent = "center"
      setTimeout(() => {
        playerElement.style.transform = "scale(1)";
        assignedTeam.appendChild(playerElement);
        playerElement.style.position = "static";
      }, 200);
    }, 800);

    // Remove the player from the pool and update the UI.
    players = players.filter(p => p !== player);
    updatePlayerList();
    updateWheel();
    storePlayers();
  }

  // Global setTeamCount function: creates team containers.
  window.setTeamCount = withLogging(function setTeamCount(count) {
    teamCount = count;
    currentTeamIndex = 0;
    if (!teamsContainer) return;
    teamsContainer.innerHTML = "";
    for (let i = 0; i < teamCount; i++) {
      const teamDiv = document.createElement("div");
      teamDiv.classList.add("team");
      teamDiv.id = "team-" + i;
      teamDiv.innerHTML = `<h3>Team ${i + 1}</h3><ul></ul>`;
      teamsContainer.appendChild(teamDiv);
    }
  });

  // Global addPlayer function.
  window.addPlayer = withLogging(function addPlayer() {
    let playerName = inputField.value.trim();
    if (playerName === "" || players.includes(playerName)) return;
    players.push(playerName);
    updatePlayerList();
    updateWheel();
    storePlayers();
    inputField.value = "";
    inputField.focus();
  });

  /************* Additional Helper Functions *************/
  // Optionally, shuffle players.
  window.shufflePlayers = withLogging(function shufflePlayers() {
    players = shuffleArray(players);
    updatePlayerList();
    updateWheel();
  });

  // Optionally, clear players.
  window.clearPlayers = withLogging(function clearPlayers() {
    players = [];
    document.querySelectorAll(".team ul").forEach(ul => ul.innerHTML = "");
    updatePlayerList();
    updateWheel();
  });

  // Preload or Populate Players.
  function populatePlayerList() {
    players = loadPlayers();
    updatePlayerList();
  }

  // Optionally, preload a fixed list (if desired).
  function preloadPlayers() {
    players = ["Alice", "Bob", "Charlie", "Diana", "Luke", "Moira", "Grant", "Adam"];
    updatePlayerList();
    updateWheel();
  }

  /************* Event Listeners *************/
  // Add player on Enter key press.
  inputField.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      window.addPlayer();
    }
  });

  // Event listeners for adjusting team count.
  document.getElementById("increase-teams").addEventListener("click", function () {
    teamCount++;
    if (teamCountDisplay) {
      teamCountDisplay.textContent = teamCount;
    }
    setTeamCount(teamCount);
  });

  document.getElementById("decrease-teams").addEventListener("click", function () {
    if (teamCount > 1) {
      teamCount--;
      if (teamCountDisplay) {
        teamCountDisplay.textContent = teamCount;
      }
      setTeamCount(teamCount);
    }
  });

  /************* Initialization *************/
  populatePlayerList();
  setTeamCount(teamCount);
  preloadPlayers();  // Optional: preload a fixed list instead of stored list.
  updateWheel();
});
