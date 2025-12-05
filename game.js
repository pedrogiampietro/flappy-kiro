const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const finalScoreDisplay = document.getElementById('final-score');
const finalStreakDisplay = document.getElementById('final-streak');
const restartBtn = document.getElementById('restart-btn');
const shareBtn = document.getElementById('share-btn');
const highScoreDisplay = document.getElementById('high-score-value');
const comboDisplay = document.getElementById('combo');
const comboCount = document.getElementById('combo-count');
const medalContainer = document.getElementById('medal-container');
const leaderboardList = document.getElementById('leaderboard-list');
const startLeaderboard = document.getElementById('start-leaderboard');
const newHighscoreDiv = document.getElementById('new-highscore');
const playerNameInput = document.getElementById('player-name');
const skinsContainer = document.getElementById('skins');
const tutorialScreen = document.getElementById('tutorial');
const tutorialClose = document.getElementById('tutorial-close');
const achievementPopup = document.getElementById('achievement-popup');
const achievementText = document.getElementById('achievement-text');
const achievementsUnlocked = document.getElementById('achievements-unlocked');
const newAchievements = document.getElementById('new-achievements');
const gameContainer = document.getElementById('game-container');

canvas.width = 400;
canvas.height = 600;

// Load assets
const ghostImg = new Image();
ghostImg.src = 'assets/ghosty.png';
const jumpSound = new Audio('assets/jump.wav');
const gameOverSound = new Audio('assets/game_over.wav');

// Skins - default usa a imagem ghosty.png
const skins = [
    { id: 'default', emoji: '👻', unlocked: true, requirement: null, useImage: true },
    { id: 'fire', emoji: '🔥', unlocked: false, requirement: 'Score 10 points', useImage: false },
    { id: 'star', emoji: '⭐', unlocked: false, requirement: 'Score 25 points', useImage: false },
    { id: 'alien', emoji: '👽', unlocked: false, requirement: 'Score 50 points', useImage: false },
    { id: 'robot', emoji: '🤖', unlocked: false, requirement: '5 streak combo', useImage: false }
];
let selectedSkin = 'default';

// Achievements
const achievements = {
    firstFlight: { id: 'firstFlight', name: 'Primeiro Voo', icon: '🐣', desc: 'Jogue pela primeira vez', unlocked: false },
    score10: { id: 'score10', name: 'Iniciante', icon: '🥉', desc: 'Faça 10 pontos', unlocked: false },
    score25: { id: 'score25', name: 'Intermediário', icon: '🥈', desc: 'Faça 25 pontos', unlocked: false },
    score50: { id: 'score50', name: 'Expert', icon: '🥇', desc: 'Faça 50 pontos', unlocked: false },
    combo5: { id: 'combo5', name: 'Em Chamas', icon: '🔥', desc: 'Combo de 5', unlocked: false },
    combo10: { id: 'combo10', name: 'Imparável', icon: '💥', desc: 'Combo de 10', unlocked: false },
    powerCollector: { id: 'powerCollector', name: 'Colecionador', icon: '⭐', desc: 'Colete 10 power-ups', unlocked: false },
    nightOwl: { id: 'nightOwl', name: 'Coruja', icon: '🦉', desc: 'Jogue no modo noturno', unlocked: false }
};

// Game state
let gameState = 'start';
let score = 0;
let highScore = 0;
let combo = 0;
let maxCombo = 0;
let animationId;
let isNightMode = false;
let nightModeTimer = 0;
let totalPowerUpsCollected = 0;
let sessionAchievements = [];


// Difficulty settings
const baseDifficulty = {
    pipeSpeed: 3,
    pipeGap: 160,
    pipeSpawnInterval: 90
};
let difficulty = { ...baseDifficulty };

// Ghost (player)
const ghost = {
    x: 80,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -9,
    rotation: 0,
    hasShield: false,
    shieldTimer: 0,
    hasSlowMo: false,
    slowMoTimer: 0
};

// Pipes & Power-ups
const pipes = [];
const powerUps = [];
const particles = [];
const pipeWidth = 60;
let pipeSpawnTimer = 0;

// Power-up types
const powerUpTypes = [
    { type: 'shield', emoji: '🛡️', color: '#3498db', duration: 5000 },
    { type: 'slowmo', emoji: '⏱️', color: '#9b59b6', duration: 3000 },
    { type: 'bonus', emoji: '💎', color: '#f1c40f', points: 5 }
];

// Ground
const ground = { y: canvas.height - 50, height: 50 };

// Storage functions
function loadData() {
    highScore = parseInt(localStorage.getItem('flappyKiroHighScore')) || 0;
    highScoreDisplay.textContent = highScore;
    
    const savedSkins = JSON.parse(localStorage.getItem('flappyKiroSkins')) || [];
    savedSkins.forEach(id => {
        const skin = skins.find(s => s.id === id);
        if (skin) skin.unlocked = true;
    });
    
    const savedAchievements = JSON.parse(localStorage.getItem('flappyKiroAchievements')) || [];
    savedAchievements.forEach(id => {
        if (achievements[id]) achievements[id].unlocked = true;
    });
    
    totalPowerUpsCollected = parseInt(localStorage.getItem('flappyKiroPowerUps')) || 0;
    selectedSkin = localStorage.getItem('flappyKiroSelectedSkin') || 'default';
}

function saveData() {
    localStorage.setItem('flappyKiroHighScore', highScore);
    localStorage.setItem('flappyKiroSkins', JSON.stringify(skins.filter(s => s.unlocked).map(s => s.id)));
    localStorage.setItem('flappyKiroAchievements', JSON.stringify(Object.values(achievements).filter(a => a.unlocked).map(a => a.id)));
    localStorage.setItem('flappyKiroPowerUps', totalPowerUpsCollected);
    localStorage.setItem('flappyKiroSelectedSkin', selectedSkin);
}

function getLeaderboard() {
    return JSON.parse(localStorage.getItem('flappyKiroLeaderboard')) || [];
}

function saveToLeaderboard(name, score) {
    const leaderboard = getLeaderboard();
    leaderboard.push({ name, score, date: new Date().toLocaleDateString() });
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('flappyKiroLeaderboard', JSON.stringify(leaderboard.slice(0, 5)));
}

function displayLeaderboard(listElement) {
    const leaderboard = getLeaderboard();
    listElement.innerHTML = leaderboard.length === 0 
        ? '<li>Nenhum score ainda!</li>'
        : leaderboard.map((entry, i) => `<li>${i + 1}. ${entry.name}: ${entry.score}</li>`).join('');
}


// Achievement system
function unlockAchievement(id) {
    if (achievements[id] && !achievements[id].unlocked) {
        achievements[id].unlocked = true;
        sessionAchievements.push(achievements[id]);
        showAchievementPopup(achievements[id]);
        saveData();
    }
}

function showAchievementPopup(achievement) {
    achievementText.textContent = `${achievement.icon} ${achievement.name}`;
    achievementPopup.classList.remove('hidden');
    setTimeout(() => achievementPopup.classList.add('hidden'), 3000);
}

function checkAchievements() {
    if (score >= 10) { unlockAchievement('score10'); unlockSkin('fire'); }
    if (score >= 25) { unlockAchievement('score25'); unlockSkin('star'); }
    if (score >= 50) { unlockAchievement('score50'); unlockSkin('alien'); }
    if (combo >= 5) { unlockAchievement('combo5'); unlockSkin('robot'); }
    if (combo >= 10) unlockAchievement('combo10');
    if (totalPowerUpsCollected >= 10) unlockAchievement('powerCollector');
    if (isNightMode) unlockAchievement('nightOwl');
}

function unlockSkin(skinId) {
    const skin = skins.find(s => s.id === skinId);
    if (skin && !skin.unlocked) {
        skin.unlocked = true;
        saveData();
    }
}

// Skin selector
function renderSkins() {
    skinsContainer.innerHTML = '';
    skins.forEach(skin => {
        const div = document.createElement('div');
        div.className = `skin-option ${skin.id === selectedSkin ? 'selected' : ''} ${!skin.unlocked ? 'locked' : ''}`;
        div.textContent = skin.emoji;
        div.title = skin.unlocked ? skin.id : skin.requirement;
        if (skin.unlocked) {
            div.onclick = () => {
                selectedSkin = skin.id;
                saveData();
                renderSkins();
            };
        }
        skinsContainer.appendChild(div);
    });
}

// Tutorial
function showTutorial() {
    if (!localStorage.getItem('flappyKiroTutorialSeen')) {
        tutorialScreen.classList.remove('hidden');
    }
}

tutorialClose.onclick = () => {
    tutorialScreen.classList.add('hidden');
    localStorage.setItem('flappyKiroTutorialSeen', 'true');
};

// Game functions
function resetGame() {
    ghost.y = canvas.height / 2;
    ghost.velocity = 0;
    ghost.rotation = 0;
    ghost.hasShield = false;
    ghost.shieldTimer = 0;
    ghost.hasSlowMo = false;
    ghost.slowMoTimer = 0;
    pipes.length = 0;
    powerUps.length = 0;
    particles.length = 0;
    score = 0;
    combo = 0;
    maxCombo = 0;
    pipeSpawnTimer = 0;
    sessionAchievements = [];
    difficulty = { ...baseDifficulty };
    scoreDisplay.textContent = '0';
    comboDisplay.classList.add('hidden');
    isNightMode = false;
    nightModeTimer = 0;
}

function updateDifficulty() {
    const level = Math.floor(score / 10);
    difficulty.pipeSpeed = Math.min(baseDifficulty.pipeSpeed + level * 0.5, 7);
    difficulty.pipeGap = Math.max(baseDifficulty.pipeGap - level * 5, 120);
    difficulty.pipeSpawnInterval = Math.max(baseDifficulty.pipeSpawnInterval - level * 5, 60);
}

function jump() {
    if (gameState === 'start') {
        gameState = 'playing';
        startScreen.classList.add('hidden');
        unlockAchievement('firstFlight');
        resetGame();
        gameLoop();
    } else if (gameState === 'playing') {
        ghost.velocity = ghost.jumpStrength;
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
        spawnParticles(ghost.x, ghost.y + ghost.height / 2, '#fff', 5);
    } else if (gameState === 'paused') {
        togglePause();
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseScreen.classList.remove('hidden');
        cancelAnimationFrame(animationId);
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseScreen.classList.add('hidden');
        gameLoop();
    }
}


function spawnPipe() {
    const minHeight = 80;
    const maxHeight = canvas.height - ground.height - difficulty.pipeGap - minHeight;
    const topHeight = Math.random() * maxHeight + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + difficulty.pipeGap,
        passed: false
    });
    
    // Chance to spawn power-up
    if (Math.random() < 0.2) {
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        powerUps.push({
            x: canvas.width + pipeWidth / 2,
            y: topHeight + difficulty.pipeGap / 2,
            ...type,
            collected: false
        });
    }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color,
            size: Math.random() * 5 + 2
        });
    }
}

function checkCollision() {
    if (ghost.y + ghost.height > ground.y || ghost.y < 0) return true;
    
    for (const pipe of pipes) {
        const ghostRight = ghost.x + ghost.width - 10;
        const ghostLeft = ghost.x + 10;
        const ghostTop = ghost.y + 10;
        const ghostBottom = ghost.y + ghost.height - 10;
        
        if (ghostRight > pipe.x && ghostLeft < pipe.x + pipeWidth) {
            if (ghostTop < pipe.topHeight || ghostBottom > pipe.bottomY) {
                if (ghost.hasShield) {
                    ghost.hasShield = false;
                    spawnParticles(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2, '#3498db', 15);
                    return false;
                }
                return true;
            }
        }
    }
    return false;
}

function checkPowerUpCollision() {
    for (const pu of powerUps) {
        if (pu.collected) continue;
        
        const dx = (ghost.x + ghost.width / 2) - pu.x;
        const dy = (ghost.y + ghost.height / 2) - pu.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
            pu.collected = true;
            totalPowerUpsCollected++;
            spawnParticles(pu.x, pu.y, pu.color, 10);
            
            if (pu.type === 'shield') {
                ghost.hasShield = true;
                ghost.shieldTimer = pu.duration;
            } else if (pu.type === 'slowmo') {
                ghost.hasSlowMo = true;
                ghost.slowMoTimer = pu.duration;
            } else if (pu.type === 'bonus') {
                score += pu.points;
                scoreDisplay.textContent = score;
            }
            checkAchievements();
        }
    }
}

function update() {
    const speedMult = ghost.hasSlowMo ? 0.5 : 1;
    
    // Update ghost
    ghost.velocity += ghost.gravity * speedMult;
    ghost.y += ghost.velocity * speedMult;
    ghost.rotation = Math.min(Math.max(ghost.velocity * 3, -30), 90);
    
    // Update power-up timers
    if (ghost.hasShield) {
        ghost.shieldTimer -= 16;
        if (ghost.shieldTimer <= 0) ghost.hasShield = false;
    }
    if (ghost.hasSlowMo) {
        ghost.slowMoTimer -= 16;
        if (ghost.slowMoTimer <= 0) ghost.hasSlowMo = false;
    }
    
    // Night mode toggle
    nightModeTimer++;
    if (nightModeTimer >= 1800) { // ~30 seconds
        isNightMode = !isNightMode;
        nightModeTimer = 0;
    }
    
    // Spawn pipes
    pipeSpawnTimer++;
    if (pipeSpawnTimer >= difficulty.pipeSpawnInterval) {
        spawnPipe();
        pipeSpawnTimer = 0;
    }
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= difficulty.pipeSpeed * speedMult;
        
        if (!pipes[i].passed && pipes[i].x + pipeWidth < ghost.x) {
            pipes[i].passed = true;
            score++;
            combo++;
            maxCombo = Math.max(maxCombo, combo);
            scoreDisplay.textContent = score;
            updateDifficulty();
            checkAchievements();
            
            // Combo display
            if (combo >= 2) {
                comboDisplay.classList.remove('hidden');
                comboCount.textContent = combo;
            }
            
            // Particles on score
            spawnParticles(pipes[i].x + pipeWidth, ghost.y, '#4CAF50', 8);
        }
        
        if (pipes[i].x + pipeWidth < 0) pipes.splice(i, 1);
    }
    
    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].x -= difficulty.pipeSpeed * speedMult;
        if (powerUps[i].x < -30 || powerUps[i].collected) powerUps.splice(i, 1);
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    checkPowerUpCollision();
    
    if (checkCollision()) gameOver();
}


function drawBackground() {
    const skyTop = isNightMode ? '#1a1a2e' : '#87CEEB';
    const skyBottom = isNightMode ? '#2d2d44' : '#E0F6FF';
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, skyTop);
    gradient.addColorStop(1, skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars in night mode
    if (isNightMode) {
        ctx.fillStyle = 'white';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % canvas.width;
            const y = (i * 37) % (canvas.height - 100);
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Clouds
    ctx.fillStyle = isNightMode ? 'rgba(100, 100, 120, 0.5)' : 'rgba(255, 255, 255, 0.8)';
    drawCloud(50, 80, 40);
    drawCloud(200, 120, 50);
    drawCloud(320, 60, 35);
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
}

function drawPipes() {
    for (const pipe of pipes) {
        const pipeColor = isNightMode ? '#1B5E20' : '#388E3C';
        const capColor = isNightMode ? '#0D3311' : '#2E7D32';
        
        ctx.fillStyle = pipeColor;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY - ground.height);
        
        ctx.fillStyle = capColor;
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipeWidth + 10, 30);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 30);
    }
}

function drawGhost() {
    ctx.save();
    ctx.translate(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);
    ctx.rotate(ghost.rotation * Math.PI / 180);
    
    // Shield effect
    if (ghost.hasShield) {
        ctx.beginPath();
        ctx.arc(0, 0, ghost.width / 2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // Slow-mo effect
    if (ghost.hasSlowMo) {
        ctx.shadowColor = '#9b59b6';
        ctx.shadowBlur = 20;
    }
    
    // Draw skin
    const currentSkin = skins.find(s => s.id === selectedSkin);
    if (currentSkin && currentSkin.useImage) {
        ctx.drawImage(ghostImg, -ghost.width / 2, -ghost.height / 2, ghost.width, ghost.height);
    } else if (currentSkin) {
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentSkin.emoji, 0, 0);
    }
    
    ctx.restore();
}

function drawPowerUps() {
    for (const pu of powerUps) {
        if (pu.collected) continue;
        
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Glow effect
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 15;
        ctx.fillText(pu.emoji, pu.x, pu.y + Math.sin(Date.now() / 200) * 5);
        ctx.shadowBlur = 0;
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawGround() {
    ctx.fillStyle = isNightMode ? '#3E2723' : '#8B4513';
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
    ctx.fillStyle = isNightMode ? '#1B5E20' : '#228B22';
    ctx.fillRect(0, ground.y, canvas.width, 15);
}

function draw() {
    drawBackground();
    drawPipes();
    drawPowerUps();
    drawParticles();
    drawGround();
    drawGhost();
}

function gameLoop() {
    if (gameState !== 'playing') return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}


function gameOver() {
    gameState = 'gameOver';
    cancelAnimationFrame(animationId);
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => {});
    
    // Screen shake + red flash
    gameContainer.classList.add('shake', 'game-over-flash');
    setTimeout(() => {
        gameContainer.classList.remove('shake', 'game-over-flash');
    }, 500);
    
    // Update displays
    finalScoreDisplay.textContent = score;
    finalStreakDisplay.textContent = maxCombo;
    
    // Medal
    let medal = '';
    if (score >= 50) medal = '🏆';
    else if (score >= 25) medal = '🥇';
    else if (score >= 10) medal = '🥈';
    else if (score >= 5) medal = '🥉';
    medalContainer.textContent = medal;
    
    // High score check
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        saveData();
    }
    
    newHighscoreDiv.classList.toggle('hidden', !isNewHighScore);
    playerNameInput.value = '';
    
    // Show session achievements
    if (sessionAchievements.length > 0) {
        achievementsUnlocked.classList.remove('hidden');
        newAchievements.innerHTML = sessionAchievements.map(a => 
            `<span class="achievement-badge" title="${a.desc}">${a.icon}</span>`
        ).join('');
    } else {
        achievementsUnlocked.classList.add('hidden');
    }
    
    displayLeaderboard(leaderboardList);
    gameOverScreen.classList.remove('hidden');
}

function restart() {
    // Save to leaderboard if name provided
    const name = playerNameInput.value.trim() || 'Anônimo';
    if (score > 0) saveToLeaderboard(name, score);
    
    gameOverScreen.classList.add('hidden');
    gameState = 'playing';
    resetGame();
    gameLoop();
}

function shareScore() {
    const text = `🎮 Flappy Kiro\n🚀 Pontuação: ${score}\n🔥 Melhor Combo: ${maxCombo}\n\nConsegue me superar?`;
    
    if (navigator.share) {
        navigator.share({ title: 'Flappy Kiro', text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Resultado copiado para a área de transferência!');
        });
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    } else if (e.code === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
        togglePause();
    }
});

canvas.addEventListener('click', () => {
    if (gameState !== 'paused') jump();
});

restartBtn.addEventListener('click', restart);
shareBtn.addEventListener('click', shareScore);

// Initialize
loadData();
renderSkins();
displayLeaderboard(startLeaderboard);
showTutorial();

ghostImg.onload = () => {
    drawBackground();
    drawGround();
    if (selectedSkin === 'default') {
        ctx.drawImage(ghostImg, ghost.x, ghost.y, ghost.width, ghost.height);
    } else {
        const skin = skins.find(s => s.id === selectedSkin);
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(skin.emoji, ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);
    }
};
