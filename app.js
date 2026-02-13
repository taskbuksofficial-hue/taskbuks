/**
 * Mini Games Module for Task Buks
 * All 9 games: Ludo, Snake & Ladders, Trivia, Memory, Number Guess, Color Match, Coin Flip, Dice Roll, Dino Runner
 */

window.miniGames = {

    // ─── HELPERS ───────────────────────────────────────────
    openGame(gameName) {
        document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
        const reward = { 'Ludo': 40, 'Snake and Ladders': 40, 'Trivia Quiz': 5, 'Memory Game': 20, 'Number Guess': 15, 'Color Match': 12, 'Coin Flip': 10, 'Dice Roll': 15, 'Dino Runner': 20 };

        if (gameName === 'Ludo') {
            if (window.ads && window.ads.showInterstitial) window.ads.showInterstitial();
            document.getElementById('game-ludo')?.classList.remove('hidden');
            if (window.ads && window.ads.setBannerVisible) window.ads.setBannerVisible(true);
            setTimeout(() => this.ludo.init(), 100);
        } else if (gameName === 'Snake and Ladders') {
            document.getElementById('game-snl')?.classList.remove('hidden');
            setTimeout(() => this.snl.init(), 100);
        } else {
            // Generic container games
            document.getElementById('game-generic')?.classList.remove('hidden');
            const titleEl = document.getElementById('generic-game-title');
            const badgeEl = document.getElementById('generic-game-badge');
            if (titleEl) titleEl.textContent = gameName;
            if (badgeEl) badgeEl.textContent = `💰 ${reward[gameName] || 0}`;
            const body = document.getElementById('generic-game-body');
            if (!body) return;
            body.innerHTML = '';

            if (gameName === 'Trivia Quiz') this.trivia.init(body);
            else if (gameName === 'Memory Game') this.memory.init(body);
            else if (gameName === 'Number Guess') this.numberGuess.init(body);
            else if (gameName === 'Color Match') this.colorMatch.init(body);
            else if (gameName === 'Coin Flip') this.coinFlip.init(body);
            else if (gameName === 'Dice Roll') this.diceRoll.init(body);
            else if (gameName === 'Dino Runner') this.dino.init(body);
        }
    },

    closeGame(gameName) {
        if (gameName === 'Ludo' && window.ads && window.ads.setBannerVisible) window.ads.setBannerVisible(false);
        if (this.dino._raf) { cancelAnimationFrame(this.dino._raf); this.dino._raf = null; }
        document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
        document.getElementById('home')?.classList.remove('hidden');
    },

    // ─── TRIVIA QUIZ (5 coins) ─────────────────────────────
    trivia: {
        questions: [
            { q: "What is the capital of France?", o: ["Berlin", "Paris", "Rome", "Madrid"], a: 1 },
            { q: "What planet is known as the Red Planet?", o: ["Venus", "Jupiter", "Mars", "Saturn"], a: 2 },
            { q: "How many continents are there?", o: ["5", "6", "7", "8"], a: 2 },
            { q: "What is the largest ocean?", o: ["Atlantic", "Indian", "Arctic", "Pacific"], a: 3 },
            { q: "Who painted the Mona Lisa?", o: ["Picasso", "Van Gogh", "Da Vinci", "Monet"], a: 2 },
            { q: "What gas do plants breathe in?", o: ["Oxygen", "Nitrogen", "CO2", "Helium"], a: 2 },
            { q: "How many legs does a spider have?", o: ["6", "8", "10", "4"], a: 1 },
            { q: "What is H2O commonly known as?", o: ["Salt", "Water", "Acid", "Oil"], a: 1 },
            { q: "Which country has the most people?", o: ["USA", "India", "China", "Brazil"], a: 1 },
            { q: "What is the speed of light?", o: ["300k km/s", "150k km/s", "500k km/s", "100k km/s"], a: 0 }
        ],
        current: 0, score: 0, selected: [],

        init(container) {
            this.selected = [...this.questions].sort(() => Math.random() - 0.5).slice(0, 5);
            this.current = 0; this.score = 0;
            this.render(container);
        },

        render(container) {
            if (!container) container = document.getElementById('generic-game-body');
            if (this.current >= this.selected.length) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-6xl mb-4">${this.score >= 3 ? '🎉' : '😅'}</div>
                        <h3 class="text-2xl font-black mb-2 dark:text-white">${this.score}/${this.selected.length}</h3>
                        <p class="text-sm text-slate-400 mb-6">${this.score >= 3 ? 'Great job! +5 coins!' : 'Better luck next time!'}</p>
                        <button onclick="window.miniGames.trivia.init(document.getElementById('generic-game-body'))"
                            class="bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm">Play Again</button>
                    </div>`;
                if (this.score >= 3 && window.showToast) window.showToast('🎉 Trivia passed! +5 coins!');
                return;
            }
            const q = this.selected[this.current];
            container.innerHTML = `
                <div class="mb-4"><span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">Q${this.current + 1}/${this.selected.length}</span></div>
                <h3 class="text-lg font-bold dark:text-white mb-6">${q.q}</h3>
                <div class="space-y-3" id="trivia-options"></div>
                <p class="text-xs text-slate-400 mt-4 text-center">Score: ${this.score}</p>`;
            const optDiv = container.querySelector('#trivia-options');
            q.o.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 font-medium text-sm dark:text-white hover:border-indigo-300 transition-colors';
                btn.textContent = opt;
                btn.onclick = () => {
                    optDiv.querySelectorAll('button').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
                    if (i === q.a) { btn.style.borderColor = '#22C55E'; btn.style.background = '#f0fdf4'; btn.style.opacity = '1'; this.score++; }
                    else { btn.style.borderColor = '#EF4444'; btn.style.background = '#fef2f2'; btn.style.opacity = '1'; optDiv.children[q.a].style.borderColor = '#22C55E'; optDiv.children[q.a].style.background = '#f0fdf4'; optDiv.children[q.a].style.opacity = '1'; }
                    this.current++;
                    setTimeout(() => this.render(), 1200);
                };
                optDiv.appendChild(btn);
            });
        }
    },

    // ─── MEMORY GAME (20 coins) ────────────────────────────
    memory: {
        cards: [], flipped: [], matched: [], moves: 0,
        emojis: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'],

        init(container) {
            const pairs = this.emojis.slice(0, 6);
            this.cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
            this.flipped = []; this.matched = []; this.moves = 0;
            this.render(container);
        },

        render(container) {
            if (!container) container = document.getElementById('generic-game-body');
            container.innerHTML = `
                <div class="text-center mb-4">
                    <span class="text-xs font-bold text-slate-500">Moves: <span id="mem-moves">${this.moves}</span> | Pairs: <span id="mem-pairs">${this.matched.length / 2}/6</span></span>
                </div>
                <div class="grid grid-cols-4 gap-2" id="mem-grid"></div>`;
            const grid = container.querySelector('#mem-grid');
            this.cards.forEach((emoji, i) => {
                const card = document.createElement('div');
                const isFlipped = this.flipped.includes(i) || this.matched.includes(i);
                card.className = `aspect-square rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-300 ${isFlipped ? 'bg-indigo-50 dark:bg-indigo-900/30 scale-100' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'}`;
                card.textContent = isFlipped ? emoji : '?';
                card.style.userSelect = 'none';
                if (!isFlipped) {
                    card.onclick = () => this.flip(i);
                }
                grid.appendChild(card);
            });
        },

        flip(index) {
            if (this.flipped.length >= 2 || this.flipped.includes(index) || this.matched.includes(index)) return;
            this.flipped.push(index);
            this.render();
            if (this.flipped.length === 2) {
                this.moves++;
                const [a, b] = this.flipped;
                if (this.cards[a] === this.cards[b]) {
                    this.matched.push(a, b);
                    this.flipped = [];
                    if (this.matched.length === this.cards.length) {
                        setTimeout(() => {
                            const body = document.getElementById('generic-game-body');
                            body.innerHTML = `<div class="text-center py-8"><div class="text-6xl mb-4">🎉</div><h3 class="text-2xl font-black mb-2 dark:text-white">You Won!</h3><p class="text-sm text-slate-400 mb-2">Completed in ${this.moves} moves. +20 coins!</p><button onclick="window.miniGames.memory.init(document.getElementById('generic-game-body'))" class="bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm mt-4">Play Again</button></div>`;
                            if (window.showToast) window.showToast('🎉 Memory Game won! +20 coins!');
                        }, 500);
                    } else { this.render(); }
                } else {
                    setTimeout(() => { this.flipped = []; this.render(); }, 800);
                }
            }
        }
    },

    // ─── NUMBER GUESS (15 coins) ───────────────────────────
    numberGuess: {
        target: 0, attempts: 0, maxAttempts: 7, guesses: [],

        init(container) {
            this.target = Math.floor(Math.random() * 100) + 1;
            this.attempts = 0; this.guesses = [];
            this.render(container);
        },

        render(container, feedback) {
            if (!container) container = document.getElementById('generic-game-body');
            container.innerHTML = `
                <div class="text-center mb-6">
                    <div class="text-5xl mb-3">🔢</div>
                    <h3 class="text-lg font-bold dark:text-white mb-1">Guess the Number (1-100)</h3>
                    <p class="text-xs text-slate-400">You have ${this.maxAttempts - this.attempts} guesses left</p>
                </div>
                ${feedback ? `<div class="text-center mb-4 p-3 rounded-xl ${feedback.includes('🎉') ? 'bg-green-50 text-green-600' : feedback.includes('Game Over') ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'} font-bold text-sm">${feedback}</div>` : ''}
                <div class="flex gap-2 mb-4">
                    <input type="number" id="guess-input" min="1" max="100" placeholder="Enter number..."
                        class="flex-1 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-center font-bold text-lg focus:border-indigo-400 outline-none">
                    <button onclick="window.miniGames.numberGuess.guess()"
                        class="bg-indigo-500 text-white font-bold px-6 rounded-xl text-sm active:scale-95 transition-transform">Go</button>
                </div>
                <div class="flex flex-wrap gap-1.5 justify-center">${this.guesses.map(g => `<span class="px-2 py-1 rounded-lg text-[10px] font-bold ${g.dir === '=' ? 'bg-green-100 text-green-600' : g.dir === 'up' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}">${g.val} ${g.dir === 'up' ? '↑' : g.dir === 'down' ? '↓' : '✓'}</span>`).join('')}</div>`;
            setTimeout(() => document.getElementById('guess-input')?.focus(), 100);
        },

        guess() {
            const input = document.getElementById('guess-input');
            const val = parseInt(input?.value);
            if (isNaN(val) || val < 1 || val > 100) return;
            this.attempts++;
            if (val === this.target) {
                this.guesses.push({ val, dir: '=' });
                this.render(null, `🎉 Correct! The number was ${this.target}! +15 coins!`);
                if (window.showToast) window.showToast('🎉 Number Guess won! +15 coins!');
            } else if (this.attempts >= this.maxAttempts) {
                this.guesses.push({ val, dir: val < this.target ? 'up' : 'down' });
                this.render(null, `Game Over! The number was ${this.target}.`);
            } else {
                const dir = val < this.target ? 'up' : 'down';
                this.guesses.push({ val, dir });
                this.render(null, val < this.target ? '📈 Higher! Go up!' : '📉 Lower! Go down!');
            }
        }
    },

    // ─── COLOR MATCH (12 coins) ────────────────────────────
    colorMatch: {
        colors: [
            { name: 'Red', hex: '#EF4444' }, { name: 'Blue', hex: '#3B82F6' },
            { name: 'Green', hex: '#22C55E' }, { name: 'Yellow', hex: '#EAB308' },
            { name: 'Purple', hex: '#A855F7' }, { name: 'Orange', hex: '#F97316' },
            { name: 'Pink', hex: '#EC4899' }, { name: 'Cyan', hex: '#06B6D4' }
        ],
        score: 0, round: 0, maxRounds: 10, timeLeft: 0, timer: null,

        init(container) {
            this.score = 0; this.round = 0;
            this.nextRound(container);
        },

        nextRound(container) {
            if (!container) container = document.getElementById('generic-game-body');
            this.round++;
            if (this.round > this.maxRounds) {
                clearInterval(this.timer);
                container.innerHTML = `<div class="text-center py-8"><div class="text-6xl mb-4">${this.score >= 7 ? '🎉' : '😅'}</div><h3 class="text-2xl font-black mb-2 dark:text-white">${this.score}/${this.maxRounds}</h3><p class="text-sm text-slate-400 mb-4">${this.score >= 7 ? 'Great reflexes! +12 coins!' : 'Keep practicing!'}</p><button onclick="window.miniGames.colorMatch.init(document.getElementById('generic-game-body'))" class="bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm">Play Again</button></div>`;
                if (this.score >= 7 && window.showToast) window.showToast('🎉 Color Match won! +12 coins!');
                return;
            }
            // Pick a random color NAME and display it in a DIFFERENT color
            const textColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            const displayColor = this.colors.filter(c => c.name !== textColor.name)[Math.floor(Math.random() * (this.colors.length - 1))];
            // Generate 4 options with the correct answer
            let opts = [textColor];
            while (opts.length < 4) {
                const r = this.colors[Math.floor(Math.random() * this.colors.length)];
                if (!opts.find(o => o.name === r.name)) opts.push(r);
            }
            opts.sort(() => Math.random() - 0.5);
            this.timeLeft = 5;
            clearInterval(this.timer);

            container.innerHTML = `
                <div class="text-center mb-4"><span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">Round ${this.round}/${this.maxRounds}</span> <span class="text-xs font-bold text-slate-500 ml-2">Score: ${this.score}</span></div>
                <p class="text-xs text-slate-400 text-center mb-2">What COLOR is the TEXT written in?</p>
                <div class="text-center mb-6"><span class="text-4xl font-black" style="color:${displayColor.hex}">${textColor.name}</span></div>
                <div class="text-center mb-4"><span id="cm-timer" class="text-lg font-bold text-slate-500">${this.timeLeft}s</span></div>
                <div class="grid grid-cols-2 gap-3" id="cm-opts"></div>`;
            const optsDiv = container.querySelector('#cm-opts');
            opts.forEach(o => {
                const btn = document.createElement('button');
                btn.className = 'p-4 rounded-2xl font-bold text-sm text-white active:scale-95 transition-transform';
                btn.style.background = o.hex;
                btn.textContent = o.name;
                btn.onclick = () => {
                    clearInterval(this.timer);
                    if (o.name === displayColor.name) this.score++;
                    setTimeout(() => this.nextRound(), 400);
                };
                optsDiv.appendChild(btn);
            });
            this.timer = setInterval(() => {
                this.timeLeft--;
                const el = document.getElementById('cm-timer');
                if (el) el.textContent = this.timeLeft + 's';
                if (this.timeLeft <= 0) { clearInterval(this.timer); this.nextRound(); }
            }, 1000);
        }
    },

    // ─── COIN FLIP (10 coins) ──────────────────────────────
    coinFlip: {
        streak: 0, best: 0,

        init(container) {
            this.streak = 0; this.best = 0;
            this.render(container);
        },

        render(container, result) {
            if (!container) container = document.getElementById('generic-game-body');
            container.innerHTML = `
                <div class="text-center py-4">
                    <div id="coin-emoji" class="text-7xl mb-6 transition-transform duration-500">🪙</div>
                    <h3 class="text-lg font-bold dark:text-white mb-1">Predict the Flip!</h3>
                    <p class="text-xs text-slate-400 mb-6">Get 3 in a row to win coins</p>
                    ${result ? `<div class="mb-4 p-3 rounded-xl ${result.won ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'} font-bold text-sm">${result.msg}</div>` : ''}
                    <div class="flex gap-4 justify-center mb-6">
                        <button onclick="window.miniGames.coinFlip.flip('heads')"
                            class="bg-yellow-400 text-yellow-900 font-black px-8 py-4 rounded-2xl text-lg shadow-lg shadow-yellow-400/30 active:scale-90 transition-transform">👑 Heads</button>
                        <button onclick="window.miniGames.coinFlip.flip('tails')"
                            class="bg-gray-300 text-gray-700 font-black px-8 py-4 rounded-2xl text-lg shadow-lg shadow-gray-300/30 active:scale-90 transition-transform">🦅 Tails</button>
                    </div>
                    <div class="flex justify-center gap-6"><span class="text-xs font-bold text-slate-500">Streak: ${this.streak} 🔥</span><span class="text-xs font-bold text-slate-500">Best: ${this.best} ⭐</span></div>
                </div>`;
        },

        flip(choice) {
            const coin = document.getElementById('coin-emoji');
            if (coin) { coin.style.transform = 'rotateY(720deg)'; }
            setTimeout(() => {
                const result = Math.random() < 0.5 ? 'heads' : 'tails';
                if (coin) { coin.textContent = result === 'heads' ? '👑' : '🦅'; coin.style.transform = ''; }
                const won = choice === result;
                if (won) { this.streak++; if (this.streak > this.best) this.best = this.streak; }
                else { this.streak = 0; }
                const msg = won ? (this.streak >= 3 ? `🎉 ${result.toUpperCase()}! Streak ${this.streak}! +10 coins!` : `✅ ${result.toUpperCase()}! Streak: ${this.streak}`) : `❌ It was ${result.toUpperCase()}! Streak reset.`;
                if (this.streak === 3 && window.showToast) window.showToast('🎉 Coin Flip streak! +10 coins!');
                setTimeout(() => this.render(null, { won, msg }), 300);
            }, 600);
        }
    },

    // ─── DICE ROLL (15 coins) ──────────────────────────────
    diceRoll: {
        score: 0, cpuScore: 0, round: 0, maxRounds: 5,

        init(container) {
            this.score = 0; this.cpuScore = 0; this.round = 0;
            this.render(container);
        },

        render(container, result) {
            if (!container) container = document.getElementById('generic-game-body');
            if (this.round >= this.maxRounds) {
                const won = this.score > this.cpuScore;
                container.innerHTML = `<div class="text-center py-8"><div class="text-6xl mb-4">${won ? '🎉' : '😅'}</div><h3 class="text-2xl font-black mb-2 dark:text-white">${won ? 'You Win!' : this.score === this.cpuScore ? 'Draw!' : 'CPU Wins!'}</h3><p class="text-lg font-bold text-slate-500 mb-2">You: ${this.score} vs CPU: ${this.cpuScore}</p><p class="text-sm text-slate-400 mb-4">${won ? '+15 coins!' : 'Try again!'}</p><button onclick="window.miniGames.diceRoll.init(document.getElementById('generic-game-body'))" class="bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm">Play Again</button></div>`;
                if (won && window.showToast) window.showToast('🎉 Dice Roll won! +15 coins!');
                return;
            }
            container.innerHTML = `
                <div class="text-center mb-4"><span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">Round ${this.round + 1}/${this.maxRounds}</span></div>
                <div class="flex justify-around items-center mb-6">
                    <div class="text-center"><p class="text-xs font-bold text-green-500 mb-1">You</p><div id="player-die" class="text-5xl">🎲</div><p class="text-lg font-black text-slate-900 dark:text-white mt-1">${this.score}</p></div>
                    <span class="text-2xl font-black text-slate-300">VS</span>
                    <div class="text-center"><p class="text-xs font-bold text-red-500 mb-1">CPU</p><div id="cpu-die" class="text-5xl">🎲</div><p class="text-lg font-black text-slate-900 dark:text-white mt-1">${this.cpuScore}</p></div>
                </div>
                ${result ? `<div class="text-center mb-4 p-3 rounded-xl ${result.includes('You') ? 'bg-green-50 text-green-600' : result.includes('Tie') ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'} font-bold text-sm">${result}</div>` : ''}
                <div class="text-center"><button onclick="window.miniGames.diceRoll.roll()" class="bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-indigo-500/30 active:scale-90 transition-transform">🎲 Roll!</button></div>`;
        },

        roll() {
            const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            const pd = document.getElementById('player-die');
            const cd = document.getElementById('cpu-die');
            let count = 0;
            const anim = setInterval(() => {
                if (pd) pd.textContent = diceEmojis[Math.floor(Math.random() * 6)];
                if (cd) cd.textContent = diceEmojis[Math.floor(Math.random() * 6)];
                count++;
                if (count > 12) {
                    clearInterval(anim);
                    const pv = Math.floor(Math.random() * 6) + 1;
                    const cv = Math.floor(Math.random() * 6) + 1;
                    if (pd) pd.textContent = diceEmojis[pv - 1];
                    if (cd) cd.textContent = diceEmojis[cv - 1];
                    if (pv > cv) this.score++;
                    else if (cv > pv) this.cpuScore++;
                    this.round++;
                    const msg = pv > cv ? `You rolled ${pv} vs ${cv}. You win!` : pv < cv ? `You rolled ${pv} vs ${cv}. CPU wins!` : `Tie! Both rolled ${pv}.`;
                    setTimeout(() => this.render(null, msg), 800);
                }
            }, 70);
        }
    },

    // ─── DINO RUNNER (20 coins) ────────────────────────────
    dino: {
        _raf: null, canvas: null, ctx: null,
        dino_y: 0, vel: 0, jumping: false, gravity: 0.6,
        obstacles: [], score: 0, gameOver: false, speed: 3, groundY: 0, frameCount: 0,

        init(container) {
            container.innerHTML = `
                <div class="text-center mb-3"><p class="text-xs text-slate-400">Tap or press Space to jump!</p></div>
                <canvas id="dino-canvas" style="width:100%;border-radius:16px;background:#f8faf8;"></canvas>
                <div class="text-center mt-3"><p id="dino-score" class="text-sm font-bold text-slate-500">Score: 0</p>
                <p id="dino-msg" class="text-xs text-slate-400 mt-1"></p></div>`;
            this.canvas = document.getElementById('dino-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            const w = this.canvas.parentElement.clientWidth;
            this.canvas.width = w; this.canvas.height = 180;
            this.groundY = 150;
            this.dino_y = this.groundY; this.vel = 0; this.jumping = false;
            this.obstacles = []; this.score = 0; this.gameOver = false; this.speed = 3; this.frameCount = 0;
            // Input
            this.canvas.onclick = () => this.jump();
            this._keyHandler = (e) => { if (e.code === 'Space') { e.preventDefault(); this.jump(); } };
            document.addEventListener('keydown', this._keyHandler);
            if (this._raf) cancelAnimationFrame(this._raf);
            this.loop();
        },

        jump() {
            if (this.gameOver) { this.init(document.getElementById('generic-game-body')); return; }
            if (!this.jumping) { this.vel = -11; this.jumping = true; }
        },

        loop() {
            if (this.gameOver) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            ctx.clearRect(0, 0, w, 180);

            // Ground
            ctx.fillStyle = '#d1d5db';
            ctx.fillRect(0, this.groundY + 20, w, 2);

            // Dino
            this.vel += this.gravity;
            this.dino_y += this.vel;
            if (this.dino_y >= this.groundY) { this.dino_y = this.groundY; this.jumping = false; this.vel = 0; }
            ctx.font = '28px serif';
            ctx.fillText('🦖', 40, this.dino_y + 15);

            // Obstacles
            this.frameCount++;
            if (this.frameCount % Math.max(40, 80 - this.score) === 0) {
                const type = Math.random() > 0.5 ? '🌵' : '🪨';
                this.obstacles.push({ x: w, type });
            }

            this.obstacles.forEach(ob => {
                ob.x -= this.speed;
                ctx.font = '24px serif';
                ctx.fillText(ob.type, ob.x, this.groundY + 14);
            });
            this.obstacles = this.obstacles.filter(ob => ob.x > -30);

            // Collision
            this.obstacles.forEach(ob => {
                if (ob.x > 30 && ob.x < 70 && this.dino_y > this.groundY - 25) {
                    this.gameOver = true;
                }
            });

            // Score
            if (this.frameCount % 10 === 0) this.score++;
            if (this.score % 50 === 0 && this.score > 0) this.speed = 3 + this.score / 50;
            const scoreEl = document.getElementById('dino-score');
            if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;

            if (this.gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillRect(0, 0, w, 180);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 18px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Game Over! Tap to restart', w / 2, 90);
                ctx.textAlign = 'start';
                const msg = document.getElementById('dino-msg');
                if (this.score >= 50) {
                    if (msg) msg.textContent = '🎉 Great run! +20 coins!';
                    if (window.showToast) window.showToast('🎉 Dino Runner! +20 coins!');
                } else { if (msg) msg.textContent = `Need 50+ to earn coins. You got ${this.score}.`; }
                document.removeEventListener('keydown', this._keyHandler);
                return;
            }

            this._raf = requestAnimationFrame(() => this.loop());
        }
    },

    // ─── LUDO (Premium Apple-Quality UI) ────────────────────
    ludo: {
        canvas: null, ctx: null, cellSize: 0, boardSize: 15,
        players: [], turn: 0, dice: 0, isRolling: false, gameOver: false,
        safeSquares: [0, 8, 13, 21, 26, 34, 39, 47],
        layout: { boardY: 0, boardSize: 0, topH: 0, botH: 0 },

        init() {
            this.canvas = document.getElementById('ludo-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            const container = this.canvas.parentElement;
            const w = Math.min(container.clientWidth, 390);
            const h = w * 1.65;
            this.canvas.width = w; this.canvas.height = h;
            const boardSize = w * 0.92;
            const padX = (w - boardSize) / 2;
            const topH = h * 0.18;
            this.layout = { boardX: padX, boardY: topH, boardSize, topH };
            this.cellSize = boardSize / this.boardSize;
            this.players = [
                { id: 0, name: 'You', color: '#16a34a', darkColor: '#15803d', lightColor: '#4ade80', tokens: [-1, -1, -1, -1] },
                { id: 1, name: 'CPU', color: '#dc2626', darkColor: '#b91c1c', lightColor: '#f87171', tokens: [-1, -1, -1, -1] }
            ];
            this.turn = 0; this.dice = 0; this.isRolling = false; this.gameOver = false; this.dicePos = null;
            this.canvas.onclick = (e) => this.handleClick(e);
            this.updateStatus("Your turn!"); this.draw();
        },

        getCoord(playerIndex, pos) {
            const cs = this.cellSize; const { boardX, boardY } = this.layout;
            let lx = 0, ly = 0;
            if (pos === -1) return null;
            const P = [
                { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 },
                { x: 6, y: 9 }, { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 }, { x: 7, y: 14 },
                { x: 8, y: 14 }, { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 }, { x: 8, y: 9 },
                { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 7 },
                { x: 14, y: 6 }, { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 6 },
                { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 8, y: 0 }, { x: 7, y: 0 },
                { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 },
                { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }
            ];
            const offset = playerIndex === 0 ? 0 : 26;
            if (pos > 50) { const step = pos - 51; if (playerIndex === 0) { lx = 1 + step; ly = 7; } else { lx = 13 - step; ly = 7; } }
            else { const absIndex = (pos + offset) % 52; lx = P[absIndex].x; ly = P[absIndex].y; }
            return { x: boardX + lx * cs + cs / 2, y: boardY + ly * cs + cs / 2 };
        },

        draw() {
            const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
            const { boardX, boardY, boardSize } = this.layout, cs = this.cellSize;
            const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };

            // 1. BACKGROUND - Dark blue gradient with diagonal light rays
            const bg = ctx.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, '#0a1628'); bg.addColorStop(0.5, '#132044'); bg.addColorStop(1, '#0a1628');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
            // Light rays
            ctx.save(); ctx.globalAlpha = 0.06;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath(); const rx = W * 0.3 + i * W * 0.15;
                ctx.moveTo(rx, 0); ctx.lineTo(rx + W * 0.25, H); ctx.lineTo(rx + W * 0.05, H); ctx.lineTo(rx - W * 0.15, 0);
                ctx.fillStyle = '#4488ff'; ctx.fill();
            }
            ctx.restore();

            // 2. PLAYER INFO - Top (CPU) and Bottom (You) with avatars + dice
            const drawPlayerPanel = (pid, isTop) => {
                const p = this.players[pid];
                const py = isTop ? boardY * 0.5 : boardY + boardSize + (H - boardY - boardSize) * 0.45;
                const avatarX = isTop ? W - 70 : 50;
                const diceX = isTop ? W - 130 : 110;
                const active = this.turn === pid;

                // Avatar frame
                ctx.save();
                if (active) { ctx.shadowColor = p.color; ctx.shadowBlur = 15; }
                rr(avatarX - 28, py - 28, 56, 56, 12);
                ctx.fillStyle = '#fff'; ctx.fill();
                ctx.restore();
                // Inner colored circle
                rr(avatarX - 24, py - 24, 48, 48, 10);
                ctx.fillStyle = p.color; ctx.fill();
                // Avatar emoji
                ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff'; ctx.fillText(pid === 0 ? '👤' : '🤖', avatarX, py);
                // Name
                ctx.font = 'bold 11px -apple-system, sans-serif'; ctx.fillStyle = active ? '#fff' : '#64748b';
                ctx.fillText(p.name, avatarX, py + 38);
            };
            drawPlayerPanel(1, true); drawPlayerPanel(0, false);

            // Trophy badge (top center)
            ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center';
            ctx.fillText('🏆 50 Coins', W / 2, 20);

            // 3. BOARD - White base with rounded corners
            ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20;
            rr(boardX - 2, boardY - 2, boardSize + 4, boardSize + 4, 8);
            ctx.fillStyle = '#f8fafc'; ctx.fill();
            ctx.restore();

            // 4. COLORED QUADRANTS with white inner base boxes
            const quadColors = { Y: '#eab308', B: '#2563eb', G: '#16a34a', R: '#dc2626' };
            const drawBase = (bx, by, color, pid) => {
                // Outer colored quad
                ctx.fillStyle = color;
                ctx.fillRect(boardX + bx * cs, boardY + by * cs, 6 * cs, 6 * cs);
                // Inner white rounded box
                ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 6;
                const ix = boardX + (bx + 0.6) * cs, iy = boardY + (by + 0.6) * cs;
                rr(ix, iy, 4.8 * cs, 4.8 * cs, 10);
                ctx.fillStyle = '#fff'; ctx.fill();
                ctx.restore();
                // Draw base tokens if player matches
                if (pid !== null) {
                    const p = this.players[pid];
                    const positions = [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]];
                    p.tokens.forEach((pos, idx) => {
                        if (pos === -1) {
                            const tx = boardX + (bx + positions[idx][0]) * cs;
                            const ty = boardY + (by + positions[idx][1]) * cs;
                            this.drawPawn(ctx, tx, ty, cs, p.color, p.darkColor, p.lightColor, this.turn === pid && this.dice === 6);
                        }
                    });
                }
            };
            drawBase(0, 0, quadColors.Y, null);    // TL Yellow
            drawBase(9, 0, quadColors.B, 1);        // TR Blue (CPU)
            drawBase(0, 9, quadColors.G, 0);        // BL Green (You)
            drawBase(9, 9, quadColors.R, null);     // BR Red

            // 5. PATH CELLS - White cells with thin borders and colored safe zones
            const pathNodes = [
                { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 },
                { x: 6, y: 9 }, { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 }, { x: 7, y: 14 },
                { x: 8, y: 14 }, { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 }, { x: 8, y: 9 },
                { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 7 },
                { x: 14, y: 6 }, { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 6 },
                { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 8, y: 0 }, { x: 7, y: 0 },
                { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 },
                { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }
            ];
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.5;
            pathNodes.forEach((n, i) => {
                const x = boardX + n.x * cs, y = boardY + n.y * cs;
                ctx.fillStyle = '#fff';
                if (i === 0) ctx.fillStyle = '#16a34a'; // Green start
                if (i === 26) ctx.fillStyle = '#dc2626'; // Red start
                ctx.fillRect(x, y, cs, cs); ctx.strokeRect(x, y, cs, cs);
                // Stars on safe zones
                if ([8, 13, 21, 34, 39, 47].includes(i)) {
                    ctx.fillStyle = '#cbd5e1'; ctx.font = `${cs * 0.45}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('☆', x + cs / 2, y + cs / 2);
                }
                if (i === 0 || i === 26) { ctx.fillStyle = '#fff'; ctx.font = `${cs * 0.4}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▶', x + cs / 2, y + cs / 2); }
            });

            // 6. HOME STRETCHES - Colored cells leading to center
            for (let k = 1; k <= 5; k++) { ctx.fillStyle = '#16a34a'; ctx.fillRect(boardX + k * cs, boardY + 7 * cs, cs, cs); ctx.strokeRect(boardX + k * cs, boardY + 7 * cs, cs, cs); ctx.fillStyle = '#fff'; ctx.font = `${cs * 0.35}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☆', boardX + k * cs + cs / 2, boardY + 7 * cs + cs / 2); }
            for (let k = 13; k >= 9; k--) { ctx.fillStyle = '#dc2626'; ctx.fillRect(boardX + k * cs, boardY + 7 * cs, cs, cs); ctx.strokeRect(boardX + k * cs, boardY + 7 * cs, cs, cs); ctx.fillStyle = '#fff'; ctx.font = `${cs * 0.35}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☆', boardX + k * cs + cs / 2, boardY + 7 * cs + cs / 2); }
            for (let k = 1; k <= 5; k++) { ctx.fillStyle = '#eab308'; ctx.fillRect(boardX + 7 * cs, boardY + k * cs, cs, cs); ctx.strokeRect(boardX + 7 * cs, boardY + k * cs, cs, cs); }
            for (let k = 13; k >= 9; k--) { ctx.fillStyle = '#2563eb'; ctx.fillRect(boardX + 7 * cs, boardY + k * cs, cs, cs); ctx.strokeRect(boardX + 7 * cs, boardY + k * cs, cs, cs); }

            // 7. CENTER HOME - 4 colored triangles
            const cx = boardX + 7.5 * cs, cy = boardY + 7.5 * cs;
            const tri = (c, x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); };
            tri('#eab308', boardX + 6 * cs, boardY + 6 * cs, boardX + 9 * cs, boardY + 6 * cs);
            tri('#dc2626', boardX + 9 * cs, boardY + 6 * cs, boardX + 9 * cs, boardY + 9 * cs);
            tri('#2563eb', boardX + 9 * cs, boardY + 9 * cs, boardX + 6 * cs, boardY + 9 * cs);
            tri('#16a34a', boardX + 6 * cs, boardY + 9 * cs, boardX + 6 * cs, boardY + 6 * cs);
            // Center dot
            ctx.beginPath(); ctx.arc(cx, cy, cs * 0.4, 0, Math.PI * 2); ctx.fillStyle = '#f8fafc'; ctx.fill();

            // 8. TOKENS ON BOARD (3D Pawns)
            this.players.forEach(p => {
                const posCounts = {}, posDrawn = {};
                p.tokens.forEach(pos => posCounts[pos] = (posCounts[pos] || 0) + 1);
                p.tokens.forEach((pos, idx) => {
                    if (pos === -1) return; // Drawn in base
                    let tx, ty;
                    if (pos === 999) { tx = cx + (idx % 2 ? 1 : -1) * cs * 0.3; ty = cy + (idx < 2 ? -1 : 1) * cs * 0.3; }
                    else {
                        const c = this.getCoord(p.id, pos); tx = c.x; ty = c.y;
                        if (posCounts[pos] > 1) { const i = posDrawn[pos] || 0; tx += (i - (posCounts[pos] - 1) / 2) * (cs / 3); posDrawn[pos] = i + 1; }
                    }
                    const movable = this.turn === p.id && this.dice > 0 && this.canMove(p.id, idx);
                    this.drawPawn(ctx, tx, ty, cs, p.color, p.darkColor, p.lightColor, movable);
                });
            });

            // 9. DYNAMIC DICE & HINTS
            if ((this.dice > 0 || this.isRolling) && this.dicePos) {
                const { x, y } = this.dicePos;
                ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 15;
                rr(x - 22, y - 22, 44, 44, 10); ctx.fillStyle = '#fff'; ctx.fill();
                ctx.restore();
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; rr(x - 22, y - 22, 44, 44, 10); ctx.stroke();
                ctx.fillStyle = '#1e293b'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const pips = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                const val = this.dice > 0 ? this.dice : (this.isRolling ? Math.floor(Math.random() * 6) + 1 : 1);
                ctx.fillText(pips[val - 1], x, y + 2);
            }
            if (this.turn === 0 && this.dice === 0 && !this.isRolling) {
                ctx.save(); ctx.shadowColor = '#16a34a'; ctx.shadowBlur = 10;
                ctx.fillStyle = '#16a34a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText("TAP SCREEN TO ROLL", W / 2, H - boardY * 0.4 + 40);
                ctx.restore();
            }

            if (this.isRolling && !this.gameOver) requestAnimationFrame(() => this.draw());
        },

        // 3D Pawn drawing - realistic chess-piece style
        drawPawn(ctx, x, y, cs, color, dark, light, highlight) {
            const s = cs * 0.38;
            // Shadow
            ctx.beginPath(); ctx.ellipse(x, y + s * 0.8, s * 0.7, s * 0.25, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
            // Base (wide ellipse)
            ctx.beginPath(); ctx.ellipse(x, y + s * 0.4, s * 0.65, s * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = dark; ctx.fill();
            // Body (trapezoid)
            ctx.beginPath(); ctx.moveTo(x - s * 0.55, y + s * 0.4); ctx.lineTo(x - s * 0.25, y - s * 0.3);
            ctx.lineTo(x + s * 0.25, y - s * 0.3); ctx.lineTo(x + s * 0.55, y + s * 0.4); ctx.closePath();
            const bodyGrad = ctx.createLinearGradient(x - s * 0.5, y, x + s * 0.5, y);
            bodyGrad.addColorStop(0, dark); bodyGrad.addColorStop(0.3, light); bodyGrad.addColorStop(0.7, color); bodyGrad.addColorStop(1, dark);
            ctx.fillStyle = bodyGrad; ctx.fill();
            // Neck ring
            ctx.beginPath(); ctx.ellipse(x, y - s * 0.3, s * 0.28, s * 0.12, 0, 0, Math.PI * 2);
            ctx.fillStyle = dark; ctx.fill();
            // Head (sphere with gradient)
            ctx.beginPath(); ctx.arc(x, y - s * 0.6, s * 0.35, 0, Math.PI * 2);
            const headGrad = ctx.createRadialGradient(x - s * 0.1, y - s * 0.75, s * 0.05, x, y - s * 0.6, s * 0.35);
            headGrad.addColorStop(0, '#fff'); headGrad.addColorStop(0.3, light); headGrad.addColorStop(1, dark);
            ctx.fillStyle = headGrad; ctx.fill();
            // Highlight ring if movable
            if (highlight) {
                ctx.beginPath(); ctx.arc(x, y - s * 0.1, s * 0.9, 0, Math.PI * 2);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
            }
        },

        canMove(pid, tid) {
            const pos = this.players[pid].tokens[tid];
            if (pos === 999 || this.dice === 0) return false;
            if (pos === -1) return this.dice === 6;
            return pos + this.dice <= 56;
        },

        handleClick(e) {
            if (this.gameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const { boardX, boardY, boardSize } = this.layout;
            const cs = this.cellSize;
            const H = this.canvas.height;

            // Dice click (TAP ANYWHERE)
            if (this.turn === 0 && !this.isRolling && this.dice === 0) {
                this.dicePos = { x, y };
                this.rollDice(); return;
            }

            // Token click
            if (this.turn === 0 && this.dice > 0) {
                let clickedToken = -1;
                this.players[0].tokens.forEach((pos, idx) => {
                    let tx, ty;
                    if (pos === -1) {
                        const positions = [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]];
                        tx = boardX + (0 + positions[idx][0]) * cs;
                        ty = boardY + (9 + positions[idx][1]) * cs;
                    } else if (pos === 999) return;
                    else { const c = this.getCoord(0, pos); tx = c.x; ty = c.y; }
                    if (Math.sqrt((x - tx) ** 2 + (y - ty) ** 2) < cs * 0.6) clickedToken = idx;
                });
                if (clickedToken !== -1 && this.canMove(0, clickedToken)) this.moveToken(0, clickedToken);
            }
        },

        moveToken(pid, tid) {
            const p = this.players[pid];
            const oldPos = p.tokens[tid];
            let newPos = oldPos === -1 ? 0 : oldPos + this.dice;
            p.tokens[tid] = newPos;

            // Win
            if (newPos === 56) {
                p.tokens[tid] = 999;
                if (p.tokens.every(t => t === 999)) {
                    this.gameOver = true;
                    this.updateStatus(pid === 0 ? "🏆 YOU WON!" : "💀 CPU WON");
                    if (pid === 0 && window.showToast) window.showToast("🏆 LUDO CHAMPION! +50 Coins!");
                    this.draw(); return;
                }
            }
            // Capture
            if (newPos < 51) {
                const myOffset = pid === 0 ? 0 : 26;
                const myAbs = (newPos + myOffset) % 52;
                if (![0, 8, 13, 21, 26, 34, 39, 47].includes(myAbs)) {
                    const oppId = pid === 0 ? 1 : 0;
                    const opp = this.players[oppId];
                    const oppOffset = oppId === 0 ? 0 : 26;
                    opp.tokens.forEach((tPos, tIdx) => {
                        if (tPos >= 0 && tPos < 51 && tPos !== 999) {
                            if ((tPos + oppOffset) % 52 === myAbs) {
                                opp.tokens[tIdx] = -1; // Cut
                                window.showToast?.("🔪 Cut!");
                            }
                        }
                    });
                }
            }

            this.draw();

            if (this.dice === 6) {
                this.dice = 0; this.updateStatus("Roll again!");
                if (pid === 1) setTimeout(() => this.cpuTurn(), 1000);
            } else {
                this.turn = pid === 0 ? 1 : 0;
                this.dice = 0;
                this.updateStatus(this.turn === 0 ? "Your Turn" : "CPU Turn");
                this.draw();
                if (this.turn === 1) setTimeout(() => this.cpuTurn(), 1000);
                else this.updateStatus("Your turn!");
            }
        },

        rollDice() {
            if (this.isRolling || this.gameOver || this.turn !== 0) return;
            this.isRolling = true;
            const diceEl = document.getElementById('ludo-dice');
            const de = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            let c = 0;
            const ri = setInterval(() => {
                if (diceEl) diceEl.textContent = de[Math.floor(Math.random() * 6)];
                c++;
                if (c > 10) {
                    clearInterval(ri);
                    this.dice = Math.floor(Math.random() * 6) + 1;
                    if (diceEl) diceEl.textContent = de[this.dice - 1];
                    this.isRolling = false;

                    // Check available moves
                    const p = this.players[0];
                    const moves = p.tokens.map((t, i) => this.canMove(0, i));
                    if (!moves.some(m => m)) {
                        this.updateStatus(`Rolled ${this.dice}. No moves.`);
                        setTimeout(() => { this.turn = 1; this.dice = 0; this.cpuTurn(); }, 1500);
                    } else {
                        // If only 1 move possible, maybe auto move? 
                        // Or wait for click.
                        // If all tokens in base androlled 6, auto move one? No let user pick.
                        this.updateStatus(`Rolled ${this.dice}. Select token.`);
                        this.draw(); // Highlight moves
                    }
                }
            }, 80);
        },

        cpuTurn() {
            if (this.gameOver) return;
            this.updateStatus('CPU rolling...');
            // Set Dynamic Dice Pos for CPU (Top center-ish or near avatar)
            const { boardY } = this.layout;
            this.dicePos = { x: this.canvas.width / 2, y: boardY * 0.6 };
            const diceEl = document.getElementById('ludo-dice');
            const de = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            let c = 0;
            const ri = setInterval(() => {
                if (diceEl) diceEl.textContent = de[Math.floor(Math.random() * 6)];
                c++;
                if (c > 10) {
                    clearInterval(ri);
                    this.dice = Math.floor(Math.random() * 6) + 1;
                    if (diceEl) diceEl.textContent = de[this.dice - 1];

                    const p = this.players[1];
                    const moves = p.tokens.map((t, i) => ({ idx: i, valid: this.canMove(1, i) })).filter(m => m.valid);

                    if (moves.length === 0) {
                        this.updateStatus(`CPU rolled ${this.dice}. No moves.`);
                        setTimeout(() => { this.turn = 0; this.dice = 0; this.updateStatus("Your turn!"); }, 1500);
                    } else {
                        // Simple AI: Prioritize capture > Home > Exit Base > Advance
                        // Random for now
                        const best = moves[Math.floor(Math.random() * moves.length)];
                        setTimeout(() => this.moveToken(1, best.idx), 800);
                    }
                }
            }, 80);
        },

        updateStatus(msg) { const el = document.getElementById('ludo-status'); if (el) el.textContent = msg; },
        restart() { this.init(); }
    },


    // ─── SNAKE AND LADDERS (kept from before) ──────────────
    // ─── SNAKE & LADDERS (Vertical Dark Theme) ─────────────
    snl: {
        canvas: null, ctx: null, cellSize: 0, boardSize: 10,
        players: [], turn: 0, dice: 0, isRolling: false, gameOver: false,
        snakes: {}, ladders: {}, // Map start->end

        // Layout Config
        layout: { boardY: 0, boardSize: 0, topH: 0, botH: 0 },

        init() {
            this.canvas = document.getElementById('snl-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            const container = this.canvas.parentElement;
            const w = Math.min(container.clientWidth, 360);
            const h = w * 1.6; // Vertical Aspect Ratio
            this.canvas.width = w; this.canvas.height = h;

            // Calculate Layout
            // Top (10%): Title
            // Middle: Board
            // Bottom (20%): Controls
            const boardSize = w * 0.96; // 96% width
            const padX = (w - boardSize) / 2;
            const topH = (h - boardSize) * 0.4;

            this.layout = { boardX: padX, boardY: topH, boardSize: boardSize, topH: topH };
            this.cellSize = boardSize / this.boardSize;

            // Setup Game
            this.players = [
                { id: 0, name: 'You', color: '#fbbf24', pos: 1, avatar: '👤' }, // Yellow
                { id: 1, name: 'Com', color: '#ef4444', pos: 1, avatar: '🤖' }  // Red
            ];

            this.turn = 0; this.dice = 0; this.isRolling = false; this.gameOver = false;

            // Define Snakes (Head -> Tail)
            this.snakes = {
                16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78
            };
            // Define Ladders (Bottom -> Top)
            this.ladders = {
                1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100
            };

            this.canvas.onclick = (e) => this.handleClick(e);
            this.draw();
        },

        // Convert 1-100 to (x,y)
        getCoord(pos) {
            if (pos < 1) pos = 1; if (pos > 100) pos = 100;
            const cs = this.cellSize;
            const { boardX, boardY } = this.layout;

            // Row 0 is bottom (1-10)
            const row = Math.floor((pos - 1) / 10); // 0-9
            const col = (pos - 1) % 10;

            let x, y;
            // Rows 0, 2, 4... Left to Right
            // Rows 1, 3, 5... Right to Left
            if (row % 2 === 0) {
                x = col;
            } else {
                x = 9 - col;
            }
            // Invert Y (Row 0 is bottom)
            y = 9 - row;

            return {
                x: boardX + x * cs + cs / 2,
                y: boardY + y * cs + cs / 2
            };
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width;
            const H = this.canvas.height;
            const { boardX, boardY, boardSize } = this.layout;
            const cs = this.cellSize;

            // 1. Background (Dark Indigo)
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(0, 0, W, H);

            // 2. Title Area
            ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("Snake & Ladders", W / 2, boardY / 2);

            // 3. Board Grid
            const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7']; // Vibrant pattern

            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    const x = boardX + c * cs;
                    const y = boardY + r * cs;

                    // Logic to find number for coloring consistency
                    // Visual row 9 is actual row 0.
                    const actualRow = 9 - r;
                    const isLeftToRight = actualRow % 2 === 0;
                    const colIndex = isLeftToRight ? c : 9 - c;
                    const num = actualRow * 10 + colIndex + 1;

                    ctx.fillStyle = colors[(num) % colors.length];
                    ctx.fillRect(x, y, cs, cs);

                    // Grid lines
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x, y, cs, cs);

                    // Number
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.fillText(num, x + 2, y + 2);
                }
            }

            // 4. Draw Snakes & Ladders
            this.drawLadders(ctx);
            this.drawSnakes(ctx);

            // 5. Bottom Control Panel
            const panelY = boardY + boardSize + 20;
            const panelH = H - panelY;

            // Panel BG
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, panelY - 20, W, panelH + 20); // Extend a bit up

            // Avatar Left (You)
            const drawPanelAvatar = (pid, x, label) => {
                const y = panelY + 40;
                // Box
                const active = this.turn === pid;
                ctx.fillStyle = active ? '#334155' : '#1e293b'; // Highlight if active
                if (active) {
                    ctx.shadowColor = this.players[pid].color; ctx.shadowBlur = 10;
                    ctx.fillRect(x - 40, y - 30, 80, 60);
                    ctx.shadowBlur = 0;
                }
                ctx.strokeStyle = '#475569'; ctx.strokeRect(x - 40, y - 30, 80, 60);

                // Avatar
                ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(this.players[pid].avatar, x, y - 5);
                ctx.font = '12px sans-serif'; ctx.fillStyle = '#94a3b8';
                ctx.fillText(label, x, y + 20);
            };

            drawPanelAvatar(0, W * 0.2, "You");
            drawPanelAvatar(1, W * 0.8, "Com");

            // Dice Center
            const dx = W / 2, dy = panelY + 40;
            // Dice Box
            ctx.fillStyle = '#dc2626'; // Red dice
            const ds = 50;
            // roundedRect helper
            ctx.fillRect(dx - ds / 2, dy - ds / 2, ds, ds);
            ctx.strokeStyle = '#bd0f0f'; ctx.lineWidth = 2; ctx.strokeRect(dx - ds / 2, dy - ds / 2, ds, ds);

            // Pips
            ctx.fillStyle = '#fff'; ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const pips = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            // Show dice value or rolling state
            if (this.dice > 0) ctx.fillText(pips[this.dice - 1], dx, dy);
            else ctx.fillText("?", dx, dy);

            // Message
            ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
            if (this.gameOver) ctx.fillText(this.players[this.turn].name + " Won!", dx, dy - 40);
            else ctx.fillText(this.turn === 0 ? "Your Turn" : "Com Turn", dx, dy - 40);


            // 6. Draw Tokens on Board
            this.players.forEach((p, i) => {
                const c = this.getCoord(p.pos);
                // Offset if share pos
                let tx = c.x, ty = c.y;
                if (this.players[0].pos === this.players[1].pos) {
                    tx += (i === 0 ? -5 : 5);
                }

                // Shadow
                ctx.beginPath(); ctx.ellipse(tx, ty + cs * 0.3, cs * 0.2, cs * 0.1, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();

                // Pawn Body (Cone shape)
                ctx.beginPath();
                ctx.moveTo(tx, ty - cs * 0.4);
                ctx.lineTo(tx + cs * 0.15, ty + cs * 0.3);
                ctx.lineTo(tx - cs * 0.15, ty + cs * 0.3);
                ctx.closePath();
                ctx.fillStyle = p.color; ctx.fill(); ctx.stroke();

                // Head
                ctx.beginPath(); ctx.arc(tx, ty - cs * 0.4, cs * 0.15, 0, Math.PI * 2);
                ctx.fillStyle = p.color; ctx.fill(); ctx.stroke();
            });

            if (this.isRolling && !this.gameOver) requestAnimationFrame(() => this.draw());
        },

        drawLadders(ctx) {
            const cs = this.cellSize;
            ctx.lineWidth = 4; ctx.strokeStyle = '#fbbf24'; // Wood

            for (let start in this.ladders) {
                const end = this.ladders[start];
                const c1 = this.getCoord(parseInt(start));
                const c2 = this.getCoord(end);

                ctx.beginPath(); ctx.moveTo(c1.x - 5, c1.y); ctx.lineTo(c2.x - 5, c2.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(c1.x + 5, c1.y); ctx.lineTo(c2.x + 5, c2.y); ctx.stroke();

                // Rungs
                const dist = Math.sqrt((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2);
                const steps = Math.floor(dist / (cs / 2));
                for (let i = 1; i < steps; i++) {
                    const t = i / steps;
                    const rx = c1.x + (c2.x - c1.x) * t;
                    const ry = c1.y + (c2.y - c1.y) * t;
                    ctx.beginPath(); ctx.moveTo(rx - 5, ry); ctx.lineTo(rx + 5, ry); ctx.stroke();
                }
            }
        },

        drawSnakes(ctx) {
            // Snake Style: Curvy body, Head at Start (High num), Tail at End (Low num)
            for (let start in this.snakes) {
                const end = this.snakes[start]; // start > end
                const head = this.getCoord(parseInt(start));
                const tail = this.getCoord(end);

                // Bezier Control Points (Randomized or calculated for 'S' shape)
                const seed = parseInt(start) * 123;
                const deterministic = (s) => ((Math.sin(s) * 10000) % 1);

                const cx1 = head.x + (tail.x - head.x) * 0.33 + (deterministic(seed) - 0.5) * 50;
                const cy1 = head.y + (tail.y - head.y) * 0.33 + (deterministic(seed + 1) - 0.5) * 50;
                const cx2 = head.x + (tail.x - head.x) * 0.66 + (deterministic(seed + 2) - 0.5) * 50;
                const cy2 = head.y + (tail.y - head.y) * 0.66 + (deterministic(seed + 3) - 0.5) * 50;

                ctx.beginPath();
                ctx.moveTo(head.x, head.y);
                ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tail.x, tail.y);

                ctx.lineWidth = 6; ctx.strokeStyle = (parseInt(start) % 2 === 0) ? '#22c55e' : '#ef4444'; // Green or Red snake
                ctx.lineCap = 'round';
                ctx.stroke();

                // Head
                ctx.beginPath(); ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = ctx.strokeStyle; ctx.fill();
                // Eyes
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(head.x - 2, head.y - 2, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(head.x + 2, head.y - 2, 2, 0, Math.PI * 2); ctx.fill();
            }
        },

        handleClick(e) {
            if (this.gameOver || this.turn !== 0 || this.isRolling) return;

            this.rollDice();
        },

        rollDice() {
            if (this.isRolling || this.gameOver) return;
            this.isRolling = true;

            let c = 0;
            const ri = setInterval(() => {
                this.dice = Math.floor(Math.random() * 6) + 1;
                this.draw();
                c++;
                if (c > 15) {
                    clearInterval(ri);
                    this.isRolling = false;
                    this.moveDetails(this.turn);
                }
            }, 60);
        },

        moveDetails(pid) {
            const p = this.players[pid];
            const oldPos = p.pos;
            const newPos = oldPos + this.dice;

            if (newPos > 100) {
                // Stay pattern
                this.nextTurn();
                return;
            }

            p.pos = newPos;
            this.draw();

            // Check Win
            if (newPos === 100) {
                this.gameOver = true;
                this.draw();
                if (pid === 0 && window.showToast) window.showToast("🏆 You reached 100!");
                return;
            }

            // Check Snake/Ladder
            setTimeout(() => {
                if (this.snakes[newPos]) {
                    p.pos = this.snakes[newPos];
                    window.showToast?.("🐍 Snake catch!");
                    this.draw();
                } else if (this.ladders[newPos]) {
                    p.pos = this.ladders[newPos];
                    window.showToast?.("🪜 Ladder up!");
                    this.draw();
                }
                this.nextTurn();
            }, 500);
        },

        nextTurn() {
            if (this.gameOver) return;
            if (this.dice === 6) {
                if (this.turn === 1) setTimeout(() => this.rollDice(), 1000);
            } else {
                this.turn = this.turn === 0 ? 1 : 0;
                this.draw();
                if (this.turn === 1) setTimeout(() => this.rollDice(), 1000);
            }
        },

        restart() { this.init(); }
    },
};
/**
 * Task Buks App
 * Main Entry Point - UI Wiring
 * Wrapped in IIFE to prevent global namespace collisions
 */
(function () {
    const store = window.store;
    const controller = window.controller;

    // --- UI RENDERERS ---

    function render() {
        console.log("Rendering UI...");
        const state = store.getState();
        const { user, wallet, tasks, transactions } = state;

        // 1. Balance
        document.querySelectorAll('.user-balance').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.currentBalance || 0).toFixed(2)}`
        );

        // Lifetime Earnings
        document.querySelectorAll('.user-lifetime-earnings').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.lifetimeEarnings || 0).toFixed(2)}`
        );

        // Withdraw progress
        const progressBar = document.getElementById('withdraw-progress-bar');
        const progressText = document.getElementById('withdraw-progress-text');
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (progressBar) {
            const balance = parseFloat(wallet.currentBalance || 0);
            const pct = Math.min((balance / 500) * 100, 100);
            progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `₹${balance.toFixed(0)} / ₹500`;
            if (withdrawBtn) withdrawBtn.disabled = balance < 500;
        }

        // 2. Tasks (Home)
        const taskContainer = document.getElementById('task-container');
        const topOfferContainer = document.getElementById('top-offer-container');

        if (taskContainer) {
            const availableTasks = tasks.available || [];

            // Handle Top Offer (Show the first AdGem offer as Top Offer)
            const adgemOffer = availableTasks.find(t => t.type === 'adgem');
            if (adgemOffer && topOfferContainer) {
                topOfferContainer.innerHTML = `
                    <div class="relative z-10">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                <img src="${adgemOffer.icon_url}" class="w-full h-full object-cover" alt="${adgemOffer.title}">
                            </div>
                            <div>
                                <h4 class="font-bold text-base dark:text-white leading-none">${adgemOffer.title}</h4>
                                <p class="text-[10px] text-slate-400 mt-1">High-paying game</p>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-gray-400 mb-4 leading-relaxed w-2/3">${adgemOffer.description}</p>
                        <div class="flex items-center gap-2">
                            <div class="bg-orange-500 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg shadow-orange-500/30">Start Earning ₹${adgemOffer.reward}</div>
                            <span class="text-[10px] font-bold text-orange-500 animate-pulse">Hot 🔥</span>
                        </div>
                    </div>
                    <div class="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-10">
                         <img src="${adgemOffer.icon_url}" class="w-32 h-32 object-cover rounded-full grayscale" alt="decoration">
                    </div>
                `;
                topOfferContainer.onclick = () => window.open(adgemOffer.link, '_blank');
            }

            if (availableTasks.length === 0) {
                taskContainer.innerHTML = `<div class="w-full text-center py-8 text-slate-400 text-xs">No tasks available right now.</div>`;
            } else {
                taskContainer.innerHTML = availableTasks.map(task => {
                    const reward = task.reward || task.payout_amount || 0;
                    const subtitle = task.description || task.subtitle || "Complete this task";
                    const bgColor = task.bg_color || task.bgColor || (task.type === 'adgem' ? 'bg-orange-500' : 'bg-indigo-500');
                    const iconUrl = task.icon_url || task.icon;

                    return `
                    <div class="min-w-[200px] bg-white dark:bg-gray-800 p-4 rounded-[24px] border border-gray-100 dark:border-gray-700 ios-shadow snap-start">
                        <div class="w-14 h-14 ${bgColor} rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                            ${iconUrl ? `<img src="${iconUrl}" class="w-full h-full object-cover" alt="${task.title}">` :
                            task.materialIcon ? `<span class="material-icons-round text-white text-3xl">${task.materialIcon}</span>` :
                                `<span class="text-white text-2xl font-black">${task.title.charAt(0)}</span>`}
                        </div>
                        <h4 class="font-bold text-base mb-1 dark:text-white truncate w-full">${task.title}</h4>
                        <div class="text-[11px] text-slate-400 dark:text-gray-400 line-clamp-2 mb-4 leading-snug min-h-[2.5em]">${subtitle}</div>
                        <div class="flex items-center bg-gray-50 dark:bg-gray-900 rounded-full p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors start-task-btn" data-id="${task.id}" data-link="${task.link}">
                            <span class="flex-1 text-center text-[11px] font-bold text-slate-400">Start</span>
                            <div class="bg-primary px-3 py-1.5 rounded-full flex items-center gap-1">
                                <span class="text-[11px] font-bold text-white">Get ₹${reward}</span>
                            </div>
                        </div>
                    </div>
                `;
                }).join('');

                // Attach listeners
                document.querySelectorAll('.start-task-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const id = btn.dataset.id;
                        const link = btn.dataset.link;

                        if (id.startsWith('adgem_') && link) {
                            window.open(link, '_blank');
                        } else {
                            console.log("Start Task Clicked:", id);
                            controller.startTask(id);
                            showToast("Task started! Check 'Ongoing'");
                        }
                    };
                });
            }
        }

        // 3. CPX Research Sync
        // 3. Rapido Reach Integration
        if (user && !window.rapidoInitialized) {
            console.log("Initializing Rapido Reach for user:", user.id);
            const container = document.getElementById('rapidoreach-container');
            if (container) {
                // Ensure unique load
                window.rapidoInitialized = true;

                // Load MD5 library for checksum
                const md5Script = document.createElement('script');
                md5Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js';
                md5Script.onload = () => {
                    const appId = '4pfOJz6QQrm';
                    const appKey = '8afcb7f89adf0d55c2805a3a2277299f';
                    const userId = user.id;

                    // Checksum: MD5(internalUserId + appId + appKey) -> first 10 chars
                    const rawHash = md5(userId + appId + appKey);
                    const checksum = rawHash.substring(0, 10);
                    const finalUserId = `${userId}-${appId}-${checksum}`;
                    const iframeUrl = `https://www.rapidoreach.com/ofw/?userId=${encodeURIComponent(finalUserId)}`;

                    console.log("Loading Rapido Reach:", iframeUrl);
                    container.innerHTML = `<iframe src="${iframeUrl}" style="width:100%; height:800px; border:none; border-radius:16px;" title="Rapido Reach"></iframe>`;
                };
                document.body.appendChild(md5Script);
            }
        }

        // 3.5 Render API Surveys (if any)
        const surveyList = tasks.surveys || [];
        const cpxContainer = document.getElementById('rapidoreach-container');
        if (cpxContainer && surveyList.length > 0) {
            let listContainer = document.getElementById('api-survey-list');
            if (!listContainer) {
                listContainer = document.createElement('div');
                listContainer.id = 'api-survey-list';
                listContainer.className = 'space-y-3 mb-6 px-1';
                cpxContainer.parentNode.insertBefore(listContainer, cpxContainer);
            }

            listContainer.innerHTML = surveyList.map(s => {
                const payout = s.payout || '?';
                const link = s.link || '#';
                return `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 ios-shadow flex items-center justify-between">
                    <div class="flex items-center gap-4">
                         <div class="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                            <span class="material-icons-round">poll</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-sm dark:text-white">Premium Survey</h4>
                            <p class="text-xs text-slate-400">Earn ₹${payout}</p>
                        </div>
                    </div>
                    <button class="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-primary/30" onclick="window.open('${link}', '_blank')">
                        Start
                    </button>
                </div>
            `;
            }).join('');
        }

        // 4. Refer Code
        const codeEl = document.getElementById('referral-code');
        if (codeEl && user) codeEl.textContent = user.referralCode;

        // 5. Transactions
        const txList = document.getElementById('transaction-list');
        if (txList) {
            const txs = transactions || [];
            if (txs.length === 0) {
                txList.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">
                    <span class="material-icons-round text-4xl block mb-2 opacity-30">receipt_long</span>
                    No transactions yet.<br><span class="text-xs">Complete tasks to start earning!</span>
                </div>`;
            } else {
                txList.innerHTML = txs.map(tx => {
                    const isCredit = tx.type === 'credit';
                    const date = tx.created_at || tx.date;
                    const icon = isCredit ? 'south_west' : 'north_east';
                    const iconBg = isCredit ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
                    const amountColor = isCredit ? 'text-green-500' : 'text-red-500';
                    const sign = isCredit ? '+' : '-';
                    return `
                    <div class="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                        <div class="flex items-center gap-3">
                             <div class="w-9 h-9 rounded-full ${iconBg} flex items-center justify-center">
                                <span class="material-icons-round text-sm">${icon}</span>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">${tx.description}</p>
                                <p class="text-[10px] text-slate-400">${date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                            </div>
                        </div>
                        <span class="text-sm font-bold ${amountColor}">${sign}₹${parseFloat(tx.amount).toFixed(2)}</span>
                    </div>
                `}).join('');
            }
        }
    }

    // --- DAILY BONUS RENDERING ---

    function renderStreak() {
        const state = store.getState();
        const streak = state.dailyStreak?.currentStreak || 0;
        const claimed = state.dailyStreak?.isClaimedToday || false;

        // Update streak badge
        const badge = document.getElementById('streak-badge');
        if (badge) badge.textContent = `🔥 ${streak} Day Streak`;

        // Update 7-day pills
        document.querySelectorAll('.streak-day').forEach(el => {
            const day = parseInt(el.dataset.day);
            const pill = el.querySelector('div');
            if (day <= streak) {
                pill.className = 'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold border-2 border-primary bg-primary text-white transition-all shadow-md shadow-primary/20';
                pill.innerHTML = '<span class="material-icons-round text-base">check</span>';
            }
        });

        // Update claim button
        const btn = document.getElementById('claim-bonus-btn');
        if (btn) {
            if (claimed) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-icons-round text-sm align-middle mr-1">check_circle</span> Claimed Today!';
                btn.className = 'w-full bg-gray-200 dark:bg-gray-700 text-slate-400 font-bold py-3 rounded-xl text-sm cursor-not-allowed';
            } else {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-icons-round text-sm align-middle mr-1">redeem</span> Claim ₹1 Daily Bonus';
                btn.className = 'w-full bg-primary text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all';
            }
        }
    }

    // Global function for the onclick
    window.claimDailyBonusUI = async function () {
        const state = store.getState();
        if (state.dailyStreak?.isClaimedToday) {
            showToast('Already claimed today!');
            return;
        }

        await controller.claimDailyBonus();

        // After claiming, show the modal
        const streak = store.getState().dailyStreak?.currentStreak || 1;
        const amount = streak >= 7 ? 2 : 1;

        // Set earned amount
        const amountEl = document.getElementById('bonus-earned-amount');
        if (amountEl) amountEl.textContent = amount;

        // Build mini streak pills in modal
        const modalPills = document.getElementById('modal-streak-pills');
        if (modalPills) {
            let html = '';
            for (let i = 1; i <= 7; i++) {
                const isComplete = i <= streak;
                const isDay7 = i === 7;
                const reward = isDay7 ? '₹2' : '₹1';
                const bg = isComplete
                    ? 'bg-primary text-white border-primary'
                    : (isDay7 ? 'bg-amber-50 text-amber-600 border-amber-400' : 'bg-gray-50 text-slate-400 border-gray-200');
                html += `
                    <div class="flex flex-col items-center">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold border-2 ${bg}">
                            ${isComplete ? '<span class="material-icons-round text-sm">check</span>' : reward}
                        </div>
                        <span class="text-[8px] text-slate-400 mt-0.5">Day ${i}</span>
                    </div>`;
            }
            modalPills.innerHTML = html;
        }

        // Show modal
        const modal = document.getElementById('bonus-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        // Re-render streak and balance
        renderStreak();
        render();
    };

    // --- SETUP ---

    function setupNavigation() {
        console.log("Setting up navigation...");
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.page-section');

        navItems.forEach(item => {
            item.onclick = (e) => {
                const targetId = item.dataset.target;
                console.log("Nav item clicked:", targetId);

                navItems.forEach(nav => {
                    nav.classList.remove('text-primary', 'active');
                    nav.classList.add('text-slate-400', 'dark:text-gray-500');
                });

                item.classList.remove('text-slate-400', 'dark:text-gray-500');
                item.classList.add('text-primary', 'active');

                sections.forEach(section => {
                    section.classList.add('hidden');
                    if (section.id === targetId) {
                        section.classList.remove('hidden');
                        if (targetId === 'surveys') {
                            controller.loadSurveys();
                        }
                    }
                });
            };
        });
    }

    // Global Helpers
    window.copyToClipboard = (text) => {
        console.log("Copy to clipboard:", text);
        navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
    };

    window.showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl z-[2000] transition-opacity duration-300 opacity-0';
        toast.textContent = message;
        document.body.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.remove('opacity-0');
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    };

    function setupGlobalListeners() {
        window.toggleTheme = () => {
            console.log("Toggle Theme clicked");
            const current = store.getState().ui.theme;
            const next = current === 'light' ? 'dark' : 'light';
            store.setState({ ui: { ...store.getState().ui, theme: next } });
            document.documentElement.classList.toggle('dark');
        };
    }

    function setupCarousel() {
        console.log("Setting up Home carousel...");
        const carousel = document.getElementById('home-carousel');
        const dots = document.querySelectorAll('.carousel-dot');
        if (!carousel || dots.length === 0) return;

        let currentIndex = 0;
        const slideCount = dots.length;

        // Auto slide
        const slideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slideCount;
            carousel.scrollTo({
                left: carousel.offsetWidth * currentIndex,
                behavior: 'smooth'
            });
        }, 4000);

        // Update dots on scroll
        carousel.onscroll = () => {
            const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
            dots.forEach((dot, i) => {
                dot.classList.toggle('bg-primary', i === index);
                dot.classList.toggle('bg-gray-300', i !== index);
            });
            currentIndex = index;
        };

        // Pause auto-slide on touch
        carousel.ontouchstart = () => clearInterval(slideInterval);
    }

    function setupGameCards() {
        console.log("Setting up Game Cards...");
        const buttons = document.querySelectorAll('.game-play-btn');
        buttons.forEach(btn => {
            btn.onclick = (e) => {
                const gameName = btn.dataset.game;
                const reward = btn.dataset.reward;
                console.log(`Playing ${gameName} for ${reward} coins`);

                // Route all games through miniGames
                if (window.miniGames) {
                    window.miniGames.openGame(gameName);
                } else {
                    showToast(`Starting ${gameName}...`);
                }
            };
        });
    }

    // Initialize
    const initApp = async () => {
        console.log("Initializing App...");

        // Initial setup
        setupNavigation();
        setupGlobalListeners();
        setupCarousel();
        setupGameCards();
        store.subscribe(() => { render(); renderStreak(); });

        // Show Loading Overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'app-loading-overlay';
        loadingOverlay.style.cssText = "position:fixed; inset:0; background:white; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10000; transition: opacity 0.3s;";
        loadingOverlay.innerHTML = `
            <div class="text-2xl font-black mb-4">Task<span class="text-primary">Buks</span></div>
            <div id="loading-spinner" class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div id="loading-status" class="mt-4 text-xs text-slate-400 text-center px-6">Connecting...</div>
            <div class="flex gap-4 mt-8">
                <button id="retry-init" class="hidden bg-primary text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg">Retry</button>
                <button id="skip-init" class="hidden bg-slate-100 text-slate-500 px-6 py-2 rounded-full text-xs font-bold">Ignore</button>
            </div>
        `;
        document.body.appendChild(loadingOverlay);

        const updateStatus = (msg, isError = false) => {
            const el = document.getElementById('loading-status');
            if (el) el.textContent = msg;
            if (isError) {
                document.getElementById('loading-spinner')?.classList.add('hidden');
                document.getElementById('retry-init')?.classList.remove('hidden');
                document.getElementById('skip-init')?.classList.remove('hidden');

                document.getElementById('retry-init').onclick = () => window.location.reload();
                document.getElementById('skip-init').onclick = cleanup;
            }
        };

        const cleanup = () => {
            console.log("Removing loading overlay");
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay.parentNode) loadingOverlay.remove();
            }, 300);
            render();
        };

        // Safety Timeout (15s)
        const timeout = setTimeout(() => {
            updateStatus("Connection taking longer than expected...", true);
        }, 15000);

        try {
            // Wait for Clerk
            let r = 0;
            while (!window.Clerk && r < 100) {
                await new Promise(res => setTimeout(res, 100));
                r++;
            }

            if (!window.Clerk) {
                updateStatus("Security module failed to load. Check connection.", true);
                return;
            }

            await window.Clerk.load();

            if (window.Clerk.user) {
                console.log("User logged in:", window.Clerk.user.id);
                updateStatus("Syncing account...");
                try {
                    const token = await window.Clerk.session.getToken();
                    await controller.loginWithClerk(token);
                } catch (e) {
                    console.warn("Backend sync failed", e);
                }

                updateStatus("Loading data...");
                await controller.loadDashboard();

                // Show Home and Nav
                document.getElementById('home').classList.remove('hidden');
                document.querySelector('nav').classList.remove('hidden');
                document.getElementById('login').classList.add('hidden');
            } else {
                console.log("User not logged in");
                // Show Login, Hide Home and Nav
                document.getElementById('login').classList.remove('hidden');
                document.getElementById('home').classList.add('hidden');
                document.querySelector('nav').classList.add('hidden');

                const loginBtn = document.getElementById('sign-in-btn');
                if (loginBtn) {
                    loginBtn.onclick = () => {
                        console.log("Sign In Clicked");
                        window.Clerk.openSignIn();
                    }
                }
            }

            clearTimeout(timeout);
            cleanup();
        } catch (err) {
            console.error("Init Error:", err);
            updateStatus("Critical Error: " + err.message, true);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
