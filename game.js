/* ============================================
   SlitherZone — Game Engine
   ============================================ */

(() => {
    'use strict';

    // ==========================================
    // Constants & Config
    // ==========================================
    const CONFIG = {
        WORLD_SIZE: 6000,
        GRID_SIZE: 50,
        FOOD_COUNT: 800,
        BOT_COUNT: 25,
        INITIAL_LENGTH: 10,
        SEGMENT_SPACING: 12,
        SNAKE_RADIUS: 10,
        HEAD_RADIUS: 14,
        TURN_SPEED: 0.08,
        BASE_SPEED: 3.2,
        BOOST_SPEED: 5.8,
        BOOST_DRAIN: 0.6,
        BOOST_REGEN: 0.15,
        MAX_BOOST: 100,
        FOOD_RADIUS: 5,
        FOOD_VALUE: 1,
        BIG_FOOD_VALUE: 5,
        EAT_DISTANCE: 22,
        COLLISION_DISTANCE: 14,
        BOT_THINK_INTERVAL: 300,
        EJECT_COOLDOWN: 200,
        LEADERBOARD_SIZE: 10,
        CAMERA_LERP: 0.08,
        CAMERA_ZOOM_BASE: 1,
        CAMERA_ZOOM_MIN: 0.4,
        PARTICLE_COUNT_ON_DEATH: 30,
        BORDER_MARGIN: 100,
    };

    const SKIN_COLORS = [
        { c1: '#ff006e', c2: '#ff4da6', stripe: '#ff69b4' },
        { c1: '#00f5d4', c2: '#00bbf9', stripe: '#7df9ff' },
        { c1: '#fee440', c2: '#f15bb5', stripe: '#ffb3d9' },
        { c1: '#9b5de5', c2: '#f15bb5', stripe: '#d896ff' },
        { c1: '#80ed99', c2: '#57cc99', stripe: '#b5f5c8' },
        { c1: '#ff9e00', c2: '#ff0000', stripe: '#ff6347' },
        { c1: '#4cc9f0', c2: '#4361ee', stripe: '#7b93f0' },
        { c1: '#ffffff', c2: '#c0c0c0', stripe: '#e0e0e0' },
        { c1: '#e63946', c2: '#f4a261', stripe: '#e76f51' },
        { c1: '#2ec4b6', c2: '#011627', stripe: '#20a4f3' },
        { c1: '#ff595e', c2: '#ff924c', stripe: '#ffca3a' },
        { c1: '#8338ec', c2: '#3a86ff', stripe: '#6a5acd' },
    ];

    const BOT_NAMES = [
        'Viper', 'Cobra', 'Mamba', 'Python', 'Anaconda', 'Rattler',
        'Sidewinder', 'Taipan', 'Krait', 'Asp', 'Boa', 'Kingsnake',
        'Copperhead', 'Diamondback', 'Cottonmouth', 'Bushmaster',
        'NeonSerpent', 'ShadowFang', 'GhostScale', 'VenomStrike',
        'CyberViper', 'LaserSnake', 'PixelPython', 'TurboCoil',
        'SlitherKing', 'FangBoss', 'ScaleStorm', 'CoilMaster',
        'NoobSlayer', 'ProGamer42', 'xXSnakeXx', 'SnekLord',
    ];

    // ==========================================
    // State
    // ==========================================
    let canvas, ctx, minimapCanvas, minimapCtx;
    let gameRunning = false;
    let animFrameId = null;
    let lastTime = 0;
    let dt = 0;

    let player = null;
    let snakes = [];
    let food = [];
    let particles = [];
    let camera = { x: 0, y: 0, zoom: 1 };

    let mouse = { x: 0, y: 0 };
    let mouseWorld = { x: 0, y: 0 };
    let isBoosting = false;
    let playerName = 'Player';
    let playerSkin = 0;
    let kills = 0;
    let maxLength = 0;
    let startTime = 0;
    let messageTimeout = null;

    // ==========================================
    // DOM Elements
    // ==========================================
    const $startScreen = document.getElementById('start-screen');
    const $gameHud = document.getElementById('game-hud');
    const $deathScreen = document.getElementById('death-screen');
    const $playerName = document.getElementById('player-name');
    const $playBtn = document.getElementById('play-btn');
    const $respawnBtn = document.getElementById('respawn-btn');
    const $menuBtn = document.getElementById('menu-btn');
    const $scoreValue = document.getElementById('score-value');
    const $lengthValue = document.getElementById('length-value');
    const $killsValue = document.getElementById('kills-value');
    const $boostFill = document.getElementById('boost-fill');
    const $lbList = document.getElementById('lb-list');
    const $hudMessage = document.getElementById('hud-message');
    const $deathScore = document.getElementById('death-score');
    const $deathLength = document.getElementById('death-length');
    const $deathKills = document.getElementById('death-kills');
    const $deathTime = document.getElementById('death-time');
    const $deathKiller = document.getElementById('death-killer');
    const $onlineCount = document.getElementById('online-count');
    const $gamesPlayed = document.getElementById('games-played');
    const skinOptions = document.querySelectorAll('.skin-option');

    // ==========================================
    // Utility Functions
    // ==========================================
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randInt(min, max) {
        return Math.floor(rand(min, max + 1));
    }

    function dist(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function angleTo(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * t;
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function hexToRGB(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    // ==========================================
    // Snake Class
    // ==========================================
    class Snake {
        constructor(name, skinIndex, isPlayer = false) {
            this.name = name;
            this.skinIndex = skinIndex % SKIN_COLORS.length;
            this.skin = SKIN_COLORS[this.skinIndex];
            this.isPlayer = isPlayer;
            this.alive = true;
            this.score = 0;
            this.boost = CONFIG.MAX_BOOST;
            this.isBoosting = false;
            this.ejectCooldown = 0;

            // Position
            const margin = CONFIG.BORDER_MARGIN + 200;
            const halfWorld = CONFIG.WORLD_SIZE / 2;
            this.x = rand(margin, CONFIG.WORLD_SIZE - margin);
            this.y = rand(margin, CONFIG.WORLD_SIZE - margin);
            this.angle = rand(0, Math.PI * 2);
            this.targetAngle = this.angle;

            // Segments
            this.segments = [];
            for (let i = 0; i < CONFIG.INITIAL_LENGTH; i++) {
                this.segments.push({
                    x: this.x - Math.cos(this.angle) * i * CONFIG.SEGMENT_SPACING,
                    y: this.y - Math.sin(this.angle) * i * CONFIG.SEGMENT_SPACING,
                });
            }

            // Bot AI
            if (!isPlayer) {
                this.botTarget = null;
                this.botThinkTimer = rand(0, CONFIG.BOT_THINK_INTERVAL);
                this.botAggression = rand(0.2, 0.9);
                this.botSkill = rand(0.3, 1.0);
            }

            // Visual
            this.eyeOffset = 0;
            this.tongueTimer = 0;
            this.tongueOut = false;
        }

        get length() {
            return this.segments.length;
        }

        get headX() {
            return this.segments[0].x;
        }

        get headY() {
            return this.segments[0].y;
        }

        get radius() {
            return CONFIG.SNAKE_RADIUS + Math.min(this.length * 0.06, 6);
        }

        get speed() {
            const baseSpeed = CONFIG.BASE_SPEED + Math.min(this.length * 0.005, 0.5);
            return this.isBoosting ? CONFIG.BOOST_SPEED : baseSpeed;
        }

        grow(amount = 1) {
            for (let i = 0; i < amount; i++) {
                const last = this.segments[this.segments.length - 1];
                const prev = this.segments.length > 1 ? this.segments[this.segments.length - 2] : last;
                this.segments.push({
                    x: last.x + (last.x - prev.x) * 0.1,
                    y: last.y + (last.y - prev.y) * 0.1,
                });
            }
            this.score += amount;
        }

        shrink(amount = 1) {
            for (let i = 0; i < amount && this.segments.length > 3; i++) {
                const removed = this.segments.pop();
                // Drop food
                food.push(createFood(
                    removed.x + rand(-10, 10),
                    removed.y + rand(-10, 10),
                    this.skin.c1,
                    true
                ));
            }
        }

        update(dt) {
            if (!this.alive) return;

            // Boost logic
            if (this.isBoosting && this.boost > 0) {
                this.boost -= CONFIG.BOOST_DRAIN;
                // Lose a segment every 8 frames while boosting
                if (Math.random() < 0.12 && this.segments.length > 5) {
                    this.shrink(1);
                }
            } else {
                this.isBoosting = false;
                this.boost = Math.min(CONFIG.MAX_BOOST, this.boost + CONFIG.BOOST_REGEN);
            }

            if (this.ejectCooldown > 0) this.ejectCooldown -= 16;

            // Smooth turning
            this.angle = lerpAngle(this.angle, this.targetAngle, CONFIG.TURN_SPEED + (this.isBoosting ? 0.02 : 0));

            // Move head
            const speed = this.speed;
            this.x += Math.cos(this.angle) * speed;
            this.y += Math.sin(this.angle) * speed;

            // Border wrapping / boundary
            this.handleBorder();

            // Update segments
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;

            for (let i = 1; i < this.segments.length; i++) {
                const prev = this.segments[i - 1];
                const curr = this.segments[i];
                const dx = curr.x - prev.x;
                const dy = curr.y - prev.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > CONFIG.SEGMENT_SPACING) {
                    const ratio = CONFIG.SEGMENT_SPACING / d;
                    curr.x = prev.x + dx * ratio;
                    curr.y = prev.y + dy * ratio;
                }
            }

            // Tongue animation
            this.tongueTimer += 16;
            if (this.tongueTimer > 2000 + Math.random() * 3000) {
                this.tongueOut = !this.tongueOut;
                this.tongueTimer = 0;
            }

            // Bot AI
            if (!this.isPlayer) {
                this.updateBot();
            }
        }

        handleBorder() {
            const margin = CONFIG.BORDER_MARGIN;
            const worldSize = CONFIG.WORLD_SIZE;

            if (this.x < margin) {
                this.x = margin;
                this.targetAngle = rand(-Math.PI / 4, Math.PI / 4);
            }
            if (this.x > worldSize - margin) {
                this.x = worldSize - margin;
                this.targetAngle = rand(Math.PI * 3 / 4, Math.PI * 5 / 4);
            }
            if (this.y < margin) {
                this.y = margin;
                this.targetAngle = rand(Math.PI / 4, Math.PI * 3 / 4);
            }
            if (this.y > worldSize - margin) {
                this.y = worldSize - margin;
                this.targetAngle = rand(-Math.PI * 3 / 4, -Math.PI / 4);
            }
        }

        updateBot() {
            this.botThinkTimer -= 16;
            if (this.botThinkTimer > 0) return;
            this.botThinkTimer = CONFIG.BOT_THINK_INTERVAL * rand(0.5, 1.5);

            const headX = this.headX;
            const headY = this.headY;

            // Check for danger (nearby snake heads)
            let dangerAngle = null;
            let closestDanger = Infinity;

            for (const other of snakes) {
                if (other === this || !other.alive) continue;
                // Check if other snake's body is nearby
                for (let i = 0; i < Math.min(other.segments.length, 30); i++) {
                    const seg = other.segments[i];
                    const d = dist(headX, headY, seg.x, seg.y);
                    if (d < 100 && d < closestDanger) {
                        closestDanger = d;
                        dangerAngle = angleTo(headX, headY, seg.x, seg.y);
                    }
                }
            }

            // Avoid danger
            if (dangerAngle !== null && closestDanger < 80) {
                this.targetAngle = dangerAngle + Math.PI + rand(-0.5, 0.5);
                this.isBoosting = this.boost > 30 && Math.random() < this.botSkill;
                return;
            }

            this.isBoosting = false;

            // Aggressive behavior: try to cut off smaller snakes
            if (this.botAggression > 0.6 && this.length > 15) {
                let target = null;
                let targetDist = 400;

                for (const other of snakes) {
                    if (other === this || !other.alive || other.length >= this.length * 0.8) continue;
                    const d = dist(headX, headY, other.headX, other.headY);
                    if (d < targetDist) {
                        target = other;
                        targetDist = d;
                    }
                }

                if (target) {
                    // Try to get in front of target
                    const futureX = target.headX + Math.cos(target.angle) * 60;
                    const futureY = target.headY + Math.sin(target.angle) * 60;
                    this.targetAngle = angleTo(headX, headY, futureX, futureY);
                    if (targetDist < 200) {
                        this.isBoosting = this.boost > 40;
                    }
                    return;
                }
            }

            // Find food
            let closestFood = null;
            let closestFoodDist = 300;

            for (const f of food) {
                const d = dist(headX, headY, f.x, f.y);
                if (d < closestFoodDist) {
                    // Prefer bigger food
                    const adjustedDist = d / (f.big ? 3 : 1);
                    if (adjustedDist < closestFoodDist) {
                        closestFood = f;
                        closestFoodDist = adjustedDist;
                    }
                }
            }

            if (closestFood) {
                this.targetAngle = angleTo(headX, headY, closestFood.x, closestFood.y);
            } else {
                // Random wander
                this.targetAngle += rand(-0.8, 0.8);
            }
        }

        ejectMass() {
            if (this.ejectCooldown > 0 || this.segments.length < 8) return;
            this.ejectCooldown = CONFIG.EJECT_COOLDOWN;

            const ejectAngle = this.angle;
            const ejectX = this.headX + Math.cos(ejectAngle) * 30;
            const ejectY = this.headY + Math.sin(ejectAngle) * 30;

            food.push(createFood(ejectX, ejectY, this.skin.c1, true));
            this.shrink(2);
        }

        die(killerName = null) {
            if (!this.alive) return;
            this.alive = false;

            // Create food from body
            for (let i = 0; i < this.segments.length; i++) {
                if (i % 2 === 0) {
                    food.push(createFood(
                        this.segments[i].x + rand(-15, 15),
                        this.segments[i].y + rand(-15, 15),
                        i % 4 === 0 ? this.skin.c1 : this.skin.c2,
                        true
                    ));
                }
            }

            // Create death particles
            for (let i = 0; i < CONFIG.PARTICLE_COUNT_ON_DEATH; i++) {
                particles.push(createParticle(
                    this.headX, this.headY,
                    Math.random() < 0.5 ? this.skin.c1 : this.skin.c2,
                    rand(2, 6), rand(1, 3), rand(0, Math.PI * 2),
                    rand(40, 80)
                ));
            }

            if (this.isPlayer) {
                handlePlayerDeath(killerName);
            } else {
                // Respawn bot after delay
                setTimeout(() => {
                    if (gameRunning) {
                        const index = snakes.indexOf(this);
                        if (index !== -1) {
                            const newBot = new Snake(
                                BOT_NAMES[randInt(0, BOT_NAMES.length - 1)],
                                randInt(0, SKIN_COLORS.length - 1)
                            );
                            // Give bot some initial size
                            newBot.grow(randInt(3, 20));
                            snakes[index] = newBot;
                        }
                    }
                }, rand(2000, 5000));
            }
        }
    }

    // ==========================================
    // Food & Particles
    // ==========================================
    function createFood(x, y, color = null, big = false) {
        const hue = color ? null : rand(0, 360);
        return {
            x, y,
            radius: big ? rand(5, 8) : rand(3, 5),
            color: color || `hsl(${hue}, 80%, 65%)`,
            glow: color || `hsl(${hue}, 90%, 50%)`,
            big,
            value: big ? CONFIG.BIG_FOOD_VALUE : CONFIG.FOOD_VALUE,
            pulse: rand(0, Math.PI * 2),
            pulseSpeed: rand(0.02, 0.05),
            bobOffset: rand(0, Math.PI * 2),
        };
    }

    function createParticle(x, y, color, radius, speed, angle, life) {
        return {
            x, y, color, radius, speed, angle, life,
            maxLife: life,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
        };
    }

    function spawnFood() {
        while (food.length < CONFIG.FOOD_COUNT) {
            food.push(createFood(
                rand(CONFIG.BORDER_MARGIN, CONFIG.WORLD_SIZE - CONFIG.BORDER_MARGIN),
                rand(CONFIG.BORDER_MARGIN, CONFIG.WORLD_SIZE - CONFIG.BORDER_MARGIN),
                null,
                Math.random() < 0.1
            ));
        }
    }

    // ==========================================
    // Game Logic
    // ==========================================
    function initGame() {
        snakes = [];
        food = [];
        particles = [];
        kills = 0;
        maxLength = CONFIG.INITIAL_LENGTH;
        startTime = Date.now();

        // Create player
        player = new Snake(playerName, playerSkin, true);
        snakes.push(player);

        // Create bots
        for (let i = 0; i < CONFIG.BOT_COUNT; i++) {
            const bot = new Snake(
                BOT_NAMES[i % BOT_NAMES.length],
                randInt(0, SKIN_COLORS.length - 1)
            );
            // Give some bots extra length
            bot.grow(randInt(0, 30));
            snakes.push(bot);
        }

        // Spawn food
        spawnFood();

        // Camera to player
        camera.x = player.headX;
        camera.y = player.headY;
    }

    function update() {
        if (!gameRunning) return;

        // Update snakes
        for (const snake of snakes) {
            snake.update(dt);
        }

        // Player targeting
        if (player && player.alive) {
            const worldPos = screenToWorld(mouse.x, mouse.y);
            player.targetAngle = angleTo(player.headX, player.headY, worldPos.x, worldPos.y);
            player.isBoosting = isBoosting && player.boost > 0;

            maxLength = Math.max(maxLength, player.length);
        }

        // Check collisions
        checkCollisions();

        // Check food eating
        checkFoodEating();

        // Update particles
        updateParticles();

        // Ensure food count
        spawnFood();

        // Update camera
        updateCamera();

        // Update HUD
        updateHUD();
    }

    function checkCollisions() {
        for (let i = 0; i < snakes.length; i++) {
            const a = snakes[i];
            if (!a.alive) continue;

            for (let j = 0; j < snakes.length; j++) {
                if (i === j) continue;
                const b = snakes[j];
                if (!b.alive) continue;

                // Check if snake A's head hits snake B's body
                const headX = a.headX;
                const headY = a.headY;
                const collisionDist = a.radius + b.radius - 4;

                // Skip first 5 segments (head area)
                for (let k = 5; k < b.segments.length; k++) {
                    const seg = b.segments[k];
                    const d = dist(headX, headY, seg.x, seg.y);
                    if (d < collisionDist) {
                        // A dies, B gets credit
                        if (b.isPlayer) {
                            kills++;
                            showMessage(`🔥 You killed ${a.name}!`);
                        }
                        if (a.isPlayer) {
                            a.die(b.name);
                        } else {
                            a.die(b.name);
                        }
                        // Give killer score
                        b.grow(Math.min(Math.floor(a.length / 4), 20));
                        break;
                    }
                }
            }
        }

        // Check border collision
        for (const snake of snakes) {
            if (!snake.alive) continue;
            if (snake.headX <= 10 || snake.headX >= CONFIG.WORLD_SIZE - 10 ||
                snake.headY <= 10 || snake.headY >= CONFIG.WORLD_SIZE - 10) {
                snake.die('The Border');
            }
        }
    }

    function checkFoodEating() {
        for (const snake of snakes) {
            if (!snake.alive) continue;
            const hx = snake.headX;
            const hy = snake.headY;
            const eatDist = CONFIG.EAT_DISTANCE + snake.radius;

            for (let i = food.length - 1; i >= 0; i--) {
                const f = food[i];
                const d = dist(hx, hy, f.x, f.y);
                if (d < eatDist) {
                    snake.grow(f.value);
                    // Eat particle
                    particles.push(createParticle(
                        f.x, f.y, f.color,
                        f.radius, 1, rand(0, Math.PI * 2), 20
                    ));
                    food.splice(i, 1);
                }
            }
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life--;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function updateCamera() {
        if (!player || !player.alive) return;

        const targetX = player.headX;
        const targetY = player.headY;

        camera.x = lerp(camera.x, targetX, CONFIG.CAMERA_LERP);
        camera.y = lerp(camera.y, targetY, CONFIG.CAMERA_LERP);

        // Zoom based on snake length
        const targetZoom = Math.max(CONFIG.CAMERA_ZOOM_MIN,
            CONFIG.CAMERA_ZOOM_BASE - player.length * 0.002);
        camera.zoom = lerp(camera.zoom, targetZoom, 0.02);
    }

    // ==========================================
    // Rendering
    // ==========================================
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        renderBackground();

        // Save and apply camera
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);

        // Render grid
        renderGrid();

        // Render border
        renderBorder();

        // Render food
        renderFood();

        // Render snakes (render player last so it appears on top)
        const sortedSnakes = [...snakes].sort((a, b) => {
            if (a.isPlayer) return 1;
            if (b.isPlayer) return -1;
            return 0;
        });

        for (const snake of sortedSnakes) {
            if (snake.alive) renderSnake(snake);
        }

        // Render particles
        renderParticles();

        ctx.restore();

        // Render minimap
        renderMinimap();
    }

    function renderBackground() {
        // Deep dark gradient
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.8
        );
        gradient.addColorStop(0, '#0d0d24');
        gradient.addColorStop(1, '#060612');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function renderGrid() {
        const gridSize = CONFIG.GRID_SIZE;
        const startX = Math.floor((camera.x - canvas.width / 2 / camera.zoom) / gridSize) * gridSize;
        const startY = Math.floor((camera.y - canvas.height / 2 / camera.zoom) / gridSize) * gridSize;
        const endX = camera.x + canvas.width / 2 / camera.zoom;
        const endY = camera.y + canvas.height / 2 / camera.zoom;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            if (x < 0 || x > CONFIG.WORLD_SIZE) continue;
            ctx.moveTo(x, Math.max(0, startY));
            ctx.lineTo(x, Math.min(CONFIG.WORLD_SIZE, endY));
        }
        for (let y = startY; y <= endY; y += gridSize) {
            if (y < 0 || y > CONFIG.WORLD_SIZE) continue;
            ctx.moveTo(Math.max(0, startX), y);
            ctx.lineTo(Math.min(CONFIG.WORLD_SIZE, endX), y);
        }
        ctx.stroke();
    }

    function renderBorder() {
        const ws = CONFIG.WORLD_SIZE;

        // Danger zone gradient near border
        ctx.save();
        ctx.globalAlpha = 0.15;

        // Red glow at borders
        const borderWidth = CONFIG.BORDER_MARGIN;

        // Top
        const topGrad = ctx.createLinearGradient(0, 0, 0, borderWidth);
        topGrad.addColorStop(0, '#ff0040');
        topGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, ws, borderWidth);

        // Bottom
        const botGrad = ctx.createLinearGradient(0, ws, 0, ws - borderWidth);
        botGrad.addColorStop(0, '#ff0040');
        botGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, ws - borderWidth, ws, borderWidth);

        // Left
        const leftGrad = ctx.createLinearGradient(0, 0, borderWidth, 0);
        leftGrad.addColorStop(0, '#ff0040');
        leftGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, borderWidth, ws);

        // Right
        const rightGrad = ctx.createLinearGradient(ws, 0, ws - borderWidth, 0);
        rightGrad.addColorStop(0, '#ff0040');
        rightGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(ws - borderWidth, 0, borderWidth, ws);

        ctx.globalAlpha = 1;

        // Border line
        ctx.strokeStyle = '#ff0040';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0040';
        ctx.shadowBlur = 20;
        ctx.strokeRect(0, 0, ws, ws);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    function renderFood() {
        const viewLeft = camera.x - canvas.width / 2 / camera.zoom - 30;
        const viewRight = camera.x + canvas.width / 2 / camera.zoom + 30;
        const viewTop = camera.y - canvas.height / 2 / camera.zoom - 30;
        const viewBottom = camera.y + canvas.height / 2 / camera.zoom + 30;

        for (const f of food) {
            if (f.x < viewLeft || f.x > viewRight || f.y < viewTop || f.y > viewBottom) continue;

            f.pulse += f.pulseSpeed;
            const pulseScale = 1 + Math.sin(f.pulse) * 0.15;
            const radius = f.radius * pulseScale;

            // Glow
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.shadowColor = f.glow;
            ctx.shadowBlur = f.big ? 15 : 8;
            ctx.beginPath();
            ctx.arc(f.x, f.y, radius * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();
            ctx.restore();

            // Core
            ctx.beginPath();
            ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.arc(f.x - radius * 0.25, f.y - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
        }
    }

    function renderSnake(snake) {
        const segments = snake.segments;
        if (segments.length < 2) return;

        const viewPadding = 100;
        const viewLeft = camera.x - canvas.width / 2 / camera.zoom - viewPadding;
        const viewRight = camera.x + canvas.width / 2 / camera.zoom + viewPadding;
        const viewTop = camera.y - canvas.height / 2 / camera.zoom - viewPadding;
        const viewBottom = camera.y + canvas.height / 2 / camera.zoom + viewPadding;

        // Render body
        const baseRadius = snake.radius;
        const c1 = snake.skin.c1;
        const c2 = snake.skin.c2;
        const stripe = snake.skin.stripe;

        // Body segments (render back to front)
        for (let i = segments.length - 1; i >= 1; i--) {
            const seg = segments[i];
            // Culling
            if (seg.x < viewLeft || seg.x > viewRight || seg.y < viewTop || seg.y > viewBottom) continue;

            const t = i / segments.length;
            const radius = baseRadius * (1 - t * 0.4);

            // Glow
            if (snake.isPlayer || snake.isBoosting) {
                ctx.save();
                ctx.globalAlpha = snake.isBoosting ? 0.3 : 0.15;
                ctx.shadowColor = c1;
                ctx.shadowBlur = snake.isBoosting ? 25 : 12;
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, radius + 3, 0, Math.PI * 2);
                ctx.fillStyle = c1;
                ctx.fill();
                ctx.restore();
            }

            // Body circle
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);

            // Alternating colors for stripe pattern
            if (i % 6 < 3) {
                ctx.fillStyle = c1;
            } else {
                ctx.fillStyle = c2;
            }
            ctx.fill();

            // Outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Specular highlight
            const hlGrad = ctx.createRadialGradient(
                seg.x - radius * 0.3, seg.y - radius * 0.3, 0,
                seg.x, seg.y, radius
            );
            hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            hlGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
            hlGrad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = hlGrad;
            ctx.fill();
        }

        // Head
        const head = segments[0];
        const headRadius = CONFIG.HEAD_RADIUS + Math.min(snake.length * 0.05, 5);

        // Head glow
        ctx.save();
        ctx.shadowColor = c1;
        ctx.shadowBlur = snake.isBoosting ? 35 : 20;
        ctx.beginPath();
        ctx.arc(head.x, head.y, headRadius + 2, 0, Math.PI * 2);
        ctx.fillStyle = c1;
        ctx.globalAlpha = snake.isBoosting ? 0.4 : 0.2;
        ctx.fill();
        ctx.restore();

        // Head body
        const headGrad = ctx.createRadialGradient(
            head.x - headRadius * 0.2, head.y - headRadius * 0.2, 0,
            head.x, head.y, headRadius
        );
        headGrad.addColorStop(0, stripe);
        headGrad.addColorStop(0.5, c1);
        headGrad.addColorStop(1, c2);
        ctx.beginPath();
        ctx.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eyes
        const eyeAngle = snake.angle;
        const eyeSpread = 0.45;
        const eyeDist = headRadius * 0.55;
        const eyeRadius = headRadius * 0.35;
        const pupilRadius = eyeRadius * 0.55;

        for (let side = -1; side <= 1; side += 2) {
            const ex = head.x + Math.cos(eyeAngle + eyeSpread * side) * eyeDist;
            const ey = head.y + Math.sin(eyeAngle + eyeSpread * side) * eyeDist;

            // Eye white
            ctx.beginPath();
            ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Pupil
            const px = ex + Math.cos(eyeAngle) * eyeRadius * 0.2;
            const py = ey + Math.sin(eyeAngle) * eyeRadius * 0.2;
            ctx.beginPath();
            ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#111';
            ctx.fill();

            // Eye glint
            ctx.beginPath();
            ctx.arc(ex - pupilRadius * 0.3, ey - pupilRadius * 0.3, pupilRadius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
        }

        // Tongue (occasionally)
        if (snake.tongueOut) {
            const tongueLen = headRadius * 1.2;
            const tx = head.x + Math.cos(eyeAngle) * (headRadius + tongueLen * 0.3);
            const ty = head.y + Math.sin(eyeAngle) * (headRadius + tongueLen * 0.3);
            const forkLen = tongueLen * 0.3;

            ctx.save();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';

            // Main tongue
            ctx.beginPath();
            ctx.moveTo(head.x + Math.cos(eyeAngle) * headRadius, head.y + Math.sin(eyeAngle) * headRadius);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            // Fork
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.cos(eyeAngle - 0.4) * forkLen, ty + Math.sin(eyeAngle - 0.4) * forkLen);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.cos(eyeAngle + 0.4) * forkLen, ty + Math.sin(eyeAngle + 0.4) * forkLen);
            ctx.stroke();

            ctx.restore();
        }

        // Name tag
        if (!snake.isPlayer || camera.zoom < 0.7) {
            ctx.save();
            ctx.font = `600 ${Math.round(11 / camera.zoom * 0.6)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            // Background
            const nameText = snake.name;
            const scoreText = `(${snake.score})`;
            const metrics = ctx.measureText(nameText + ' ' + scoreText);
            const nameY = head.y - headRadius - 12;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            const pad = 4;
            ctx.beginPath();
            ctx.roundRect(
                head.x - metrics.width / 2 - pad,
                nameY - 14,
                metrics.width + pad * 2,
                18,
                4
            );
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.fillText(nameText, head.x - ctx.measureText(scoreText).width / 2, nameY);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = `400 ${Math.round(9 / camera.zoom * 0.6)}px Outfit, sans-serif`;
            ctx.fillText(scoreText, head.x + ctx.measureText(nameText).width / 2 + 4, nameY);

            ctx.restore();
        }

        // Boost trail
        if (snake.isBoosting) {
            for (let i = 0; i < 2; i++) {
                const trailSeg = segments[Math.min(2 + i, segments.length - 1)];
                particles.push(createParticle(
                    trailSeg.x + rand(-5, 5),
                    trailSeg.y + rand(-5, 5),
                    Math.random() < 0.5 ? c1 : c2,
                    rand(2, 4),
                    rand(0.5, 1.5),
                    snake.angle + Math.PI + rand(-0.5, 0.5),
                    rand(15, 30)
                ));
            }
        }
    }

    function renderParticles() {
        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        }
    }


    function renderMinimap() {
        if (!minimapCtx) return;

        const mw = minimapCanvas.width;
        const mh = minimapCanvas.height;
        const ws = CONFIG.WORLD_SIZE;

        minimapCtx.clearRect(0, 0, mw, mh);

        // Background
        minimapCtx.fillStyle = 'rgba(10, 10, 30, 0.8)';
        minimapCtx.fillRect(0, 0, mw, mh);

        // Border
        minimapCtx.strokeStyle = 'rgba(255, 0, 64, 0.3)';
        minimapCtx.lineWidth = 1;
        minimapCtx.strokeRect(1, 1, mw - 2, mh - 2);

        // Snakes as dots
        for (const snake of snakes) {
            if (!snake.alive) continue;
            const mx = (snake.headX / ws) * mw;
            const my = (snake.headY / ws) * mh;
            const size = snake.isPlayer ? 4 : 2;

            minimapCtx.beginPath();
            minimapCtx.arc(mx, my, size, 0, Math.PI * 2);

            if (snake.isPlayer) {
                minimapCtx.fillStyle = '#fff';
                minimapCtx.shadowColor = '#fff';
                minimapCtx.shadowBlur = 8;
            } else {
                minimapCtx.fillStyle = snake.skin.c1;
                minimapCtx.shadowBlur = 0;
            }
            minimapCtx.fill();
            minimapCtx.shadowBlur = 0;
        }

        // View area
        if (player && player.alive) {
            const vx = ((camera.x - canvas.width / 2 / camera.zoom) / ws) * mw;
            const vy = ((camera.y - canvas.height / 2 / camera.zoom) / ws) * mh;
            const vw = (canvas.width / camera.zoom / ws) * mw;
            const vh = (canvas.height / camera.zoom / ws) * mh;

            minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            minimapCtx.lineWidth = 1;
            minimapCtx.strokeRect(vx, vy, vw, vh);
        }
    }

    // ==========================================
    // HUD Updates
    // ==========================================
    function updateHUD() {
        if (!player) return;

        $scoreValue.textContent = player.score;
        $lengthValue.textContent = player.length;
        $killsValue.textContent = kills;
        $boostFill.style.width = `${(player.boost / CONFIG.MAX_BOOST) * 100}%`;

        // Leaderboard
        updateLeaderboard();
    }

    function updateLeaderboard() {
        const aliveSnakes = snakes.filter(s => s.alive);
        aliveSnakes.sort((a, b) => b.score - a.score);
        const top = aliveSnakes.slice(0, CONFIG.LEADERBOARD_SIZE);

        let html = '';
        for (let i = 0; i < top.length; i++) {
            const s = top[i];
            const isMe = s.isPlayer;
            const rankIcon = i === 0 ? '👑' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : ''));
            html += `<li class="${isMe ? 'player-self' : ''}">
                <span class="lb-rank">${rankIcon || (i + 1)}</span>
                <span class="lb-name">${s.name}</span>
                <span class="lb-score">${s.score}</span>
            </li>`;
        }
        $lbList.innerHTML = html;
    }

    function showMessage(text) {
        $hudMessage.textContent = text;
        $hudMessage.classList.add('show');
        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => {
            $hudMessage.classList.remove('show');
        }, 2500);
    }

    // ==========================================
    // Screen Management
    // ==========================================
    function showStartScreen() {
        $startScreen.classList.remove('hidden');
        $gameHud.classList.add('hidden');
        $deathScreen.classList.add('hidden');

        // Fake stats
        $onlineCount.textContent = randInt(847, 2341);
        $gamesPlayed.textContent = `${randInt(12, 89)}K`;
    }

    function startGame() {
        playerName = $playerName.value.trim() || 'Player';
        $startScreen.classList.add('hidden');
        $deathScreen.classList.add('hidden');
        $gameHud.classList.remove('hidden');

        gameRunning = true;
        initGame();
        if (!animFrameId) gameLoop(performance.now());
    }

    function handlePlayerDeath(killerName) {
        gameRunning = false;

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;

        $deathScore.textContent = player.score;
        $deathLength.textContent = maxLength;
        $deathKills.textContent = kills;
        $deathTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (killerName) {
            $deathKiller.innerHTML = `Killed by <strong>${killerName}</strong>`;
        } else {
            $deathKiller.innerHTML = '';
        }

        setTimeout(() => {
            $deathScreen.classList.remove('hidden');
        }, 500);
    }

    function respawn() {
        $deathScreen.classList.add('hidden');
        gameRunning = true;

        // Reset player
        player = new Snake(playerName, playerSkin, true);
        snakes = snakes.filter(s => s.alive || !s.isPlayer);
        snakes.unshift(player);
        kills = 0;
        maxLength = CONFIG.INITIAL_LENGTH;
        startTime = Date.now();

        camera.x = player.headX;
        camera.y = player.headY;
    }

    // ==========================================
    // Input Handling
    // ==========================================
    function screenToWorld(sx, sy) {
        return {
            x: (sx - canvas.width / 2) / camera.zoom + camera.x,
            y: (sy - canvas.height / 2) / camera.zoom + camera.y,
        };
    }

    function setupInput() {
        // Mouse move
        canvas.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        // Mouse down/up for boost
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) isBoosting = true;
        });
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) isBoosting = false;
        });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            mouse.x = t.clientX;
            mouse.y = t.clientY;
            isBoosting = e.touches.length > 1;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            mouse.x = t.clientX;
            mouse.y = t.clientY;
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            isBoosting = false;
        }, { passive: false });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                isBoosting = true;
            }
            if (e.code === 'KeyE' && player && player.alive) {
                player.ejectMass();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                isBoosting = false;
            }
        });

        // Prevent context menu
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // ==========================================
    // Game Loop
    // ==========================================
    function gameLoop(timestamp) {
        dt = Math.min(timestamp - lastTime, 33); // Cap dt at ~30fps
        lastTime = timestamp;

        if (gameRunning) {
            update();
        }
        render();

        animFrameId = requestAnimationFrame(gameLoop);
    }

    // ==========================================
    // Canvas Setup
    // ==========================================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ==========================================
    // Start Screen Animation
    // ==========================================
    function animateStartScreen() {
        const bgEl = document.getElementById('start-bg');
        if (!bgEl) return;

        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        bgEl.appendChild(bgCanvas);
        const bgCtx = bgCanvas.getContext('2d');

        const orbs = [];
        for (let i = 0; i < 40; i++) {
            orbs.push({
                x: rand(0, bgCanvas.width),
                y: rand(0, bgCanvas.height),
                radius: rand(2, 6),
                color: `hsla(${rand(180, 300)}, 80%, 60%, ${rand(0.1, 0.4)})`,
                vx: rand(-0.3, 0.3),
                vy: rand(-0.3, 0.3),
                pulse: rand(0, Math.PI * 2),
            });
        }

        function drawBg() {
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

            for (const orb of orbs) {
                orb.x += orb.vx;
                orb.y += orb.vy;
                orb.pulse += 0.02;

                if (orb.x < -10) orb.x = bgCanvas.width + 10;
                if (orb.x > bgCanvas.width + 10) orb.x = -10;
                if (orb.y < -10) orb.y = bgCanvas.height + 10;
                if (orb.y > bgCanvas.height + 10) orb.y = -10;

                const r = orb.radius + Math.sin(orb.pulse) * 1.5;

                bgCtx.save();
                bgCtx.shadowColor = orb.color;
                bgCtx.shadowBlur = 15;
                bgCtx.beginPath();
                bgCtx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
                bgCtx.fillStyle = orb.color;
                bgCtx.fill();
                bgCtx.restore();
            }

            if (!gameRunning || !$startScreen.classList.contains('hidden')) {
                requestAnimationFrame(drawBg);
            }
        }
        drawBg();
    }

    // ==========================================
    // Initialization
    // ==========================================
    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        minimapCanvas = document.getElementById('minimap-canvas');
        minimapCtx = minimapCanvas.getContext('2d');

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        setupInput();
        animateStartScreen();
        showStartScreen();

        // Skin selection
        skinOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                skinOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                playerSkin = parseInt(opt.dataset.skin);
            });
        });

        // Play button
        $playBtn.addEventListener('click', startGame);
        $playerName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') startGame();
        });

        // Respawn
        $respawnBtn.addEventListener('click', respawn);

        // Menu
        $menuBtn.addEventListener('click', () => {
            gameRunning = false;
            showStartScreen();
        });

        // Set initial mouse to center
        mouse.x = window.innerWidth / 2;
        mouse.y = window.innerHeight / 2;
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
