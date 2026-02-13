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

    // ─── LUDO (kept from before) ───────────────────────────
    ludo: {
        canvas: null, ctx: null, cellSize: 0, boardSize: 13, dice: 0,
        turn: 'player', playerPos: -1, cpuPos: -1, playerPath: [], cpuPath: [],
        isRolling: false, gameOver: false, winner: null,

        init() {
            this.canvas = document.getElementById('ludo-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            const container = this.canvas.parentElement;
            const size = Math.min(container.clientWidth, 360);
            this.canvas.width = size; this.canvas.height = size;
            this.cellSize = size / this.boardSize;
            this.generatePaths();
            this.playerPos = -1; this.cpuPos = -1; this.dice = 0;
            this.turn = 'player'; this.gameOver = false; this.winner = null;
            this.updateStatus('Roll the dice to start! Need 6 to leave home.');
            this.draw();
        },

        generatePaths() {
            const bs = this.boardSize; const path = [];
            for (let i = 0; i < bs; i++) path.push({ x: i, y: bs - 1 });
            for (let i = bs - 2; i >= 0; i--) path.push({ x: bs - 1, y: i });
            for (let i = bs - 2; i >= 0; i--) path.push({ x: i, y: 0 });
            for (let i = 1; i < bs - 1; i++) path.push({ x: 0, y: i });
            this.playerPath = path;
            this.cpuPath = [...path.slice(Math.floor(path.length / 2)), ...path.slice(0, Math.floor(path.length / 2))];
        },

        draw() {
            const ctx = this.ctx, cs = this.cellSize, bs = this.boardSize, w = this.canvas.width;
            ctx.fillStyle = '#f8f4e8'; ctx.fillRect(0, 0, w, w);
            for (let r = 0; r < bs; r++) for (let c = 0; c < bs; c++) {
                const x = c * cs, y = r * cs;
                if (c >= 4 && c <= 8 && r >= 4 && r <= 8) ctx.fillStyle = (c === 6 && r === 6) ? '#FFD700' : '#f0ead6';
                else if (c < 4 && r > 8) ctx.fillStyle = '#22C55E30';
                else if (c > 8 && r < 4) ctx.fillStyle = '#EF444430';
                else if (c < 4 && r < 4) ctx.fillStyle = '#3B82F630';
                else if (c > 8 && r > 8) ctx.fillStyle = '#EAB30830';
                else ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, cs, cs); ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, cs, cs);
            }
            this.playerPath.forEach((p, i) => { if (i < 52) { ctx.fillStyle = i % 2 === 0 ? '#e0f2fe' : '#fef3c7'; ctx.fillRect(p.x * cs + 1, p.y * cs + 1, cs - 2, cs - 2); } });
            const drawToken = (pos, path, color, label, homeX, homeY) => {
                if (pos >= 0 && pos < path.length) {
                    const p = path[pos];
                    ctx.beginPath(); ctx.arc(p.x * cs + cs / 2, p.y * cs + cs / 2, cs * 0.35, 0, Math.PI * 2);
                    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = '#fff'; ctx.font = `bold ${cs * 0.3}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(label, p.x * cs + cs / 2, p.y * cs + cs / 2);
                } else if (pos === -1) {
                    ctx.beginPath(); ctx.arc(homeX * cs, homeY * cs, cs * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = '#fff'; ctx.font = `bold ${cs * 0.3}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(label, homeX * cs, homeY * cs);
                }
            };
            drawToken(this.playerPos, this.playerPath, '#22C55E', 'P', 2, bs - 2);
            drawToken(this.cpuPos, this.cpuPath, '#EF4444', 'C', bs - 2, 2);
            const cx = 6 * cs, cy = 6 * cs;
            ctx.fillStyle = '#FFD700'; ctx.fillRect(cx, cy, cs, cs);
            ctx.fillStyle = '#000'; ctx.font = `bold ${cs * 0.25}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('HOME', cx + cs / 2, cy + cs / 2);
        },

        rollDice() {
            if (this.isRolling || this.gameOver || this.turn !== 'player') return;
            this.isRolling = true;
            const diceEl = document.getElementById('ludo-dice');
            const de = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            let c = 0;
            const ri = setInterval(() => { if (diceEl) diceEl.textContent = de[Math.floor(Math.random() * 6)]; c++; if (c > 10) { clearInterval(ri); this.dice = Math.floor(Math.random() * 6) + 1; if (diceEl) diceEl.textContent = de[this.dice - 1]; this.movePlayer(); } }, 80);
        },

        movePlayer() {
            setTimeout(() => {
                if (this.playerPos === -1) {
                    if (this.dice === 6) { this.playerPos = 0; this.updateStatus('You rolled 6! Token out! Roll again.'); this.draw(); this.isRolling = false; return; }
                    else this.updateStatus(`You rolled ${this.dice}. Need 6.`);
                } else {
                    const np = this.playerPos + this.dice;
                    if (np >= 48) { this.playerPos = 48; this.gameOver = true; this.updateStatus('🎉 You Win! +40 coins!'); this.draw(); this.isRolling = false; if (window.showToast) window.showToast('🎉 Ludo won! +40 coins!'); return; }
                    this.playerPos = np;
                    if (this.cpuPos >= 0 && this.playerPath[this.playerPos] && this.cpuPath[this.cpuPos] && this.playerPath[this.playerPos].x === this.cpuPath[this.cpuPos].x && this.playerPath[this.playerPos].y === this.cpuPath[this.cpuPos].y) { this.cpuPos = -1; this.updateStatus(`Rolled ${this.dice}. Captured CPU! 🎯`); }
                    else this.updateStatus(`Rolled ${this.dice}. Moved to ${this.playerPos}.`);
                    if (this.dice === 6) { this.draw(); this.isRolling = false; this.updateStatus('Rolled 6! Roll again.'); return; }
                }
                this.draw(); this.turn = 'cpu'; this.isRolling = false;
                setTimeout(() => this.cpuTurn(), 1000);
            }, 300);
        },

        cpuTurn() {
            if (this.gameOver) return;
            this.updateStatus('CPU rolling...');
            const diceEl = document.getElementById('ludo-dice');
            const de = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            let c = 0;
            const ri = setInterval(() => {
                if (diceEl) diceEl.textContent = de[Math.floor(Math.random() * 6)]; c++; if (c > 10) {
                    clearInterval(ri); this.dice = Math.floor(Math.random() * 6) + 1; if (diceEl) diceEl.textContent = de[this.dice - 1];
                    setTimeout(() => {
                        if (this.cpuPos === -1) { if (this.dice === 6) { this.cpuPos = 0; this.updateStatus('CPU rolled 6! Token out!'); this.draw(); setTimeout(() => this.cpuTurn(), 1000); return; } else this.updateStatus(`CPU rolled ${this.dice}. Needs 6.`); }
                        else {
                            const np = this.cpuPos + this.dice; if (np >= 48) { this.cpuPos = 48; this.gameOver = true; this.updateStatus('CPU Wins!'); this.draw(); return; } this.cpuPos = np;
                            if (this.playerPos >= 0 && this.cpuPath[this.cpuPos] && this.playerPath[this.playerPos] && this.cpuPath[this.cpuPos].x === this.playerPath[this.playerPos].x && this.cpuPath[this.cpuPos].y === this.playerPath[this.playerPos].y) { this.playerPos = -1; this.updateStatus(`CPU rolled ${this.dice}. Captured you! 😱`); }
                            else this.updateStatus(`CPU rolled ${this.dice}. Your turn!`);
                            if (this.dice === 6) { this.draw(); setTimeout(() => this.cpuTurn(), 1000); return; }
                        }
                        this.draw(); this.turn = 'player';
                    }, 300);
                }
            }, 80);
        },

        updateStatus(msg) { const el = document.getElementById('ludo-status'); if (el) el.textContent = msg; },
        restart() { this.init(); }
    },

    // ─── SNAKE AND LADDERS (kept from before) ──────────────
    snl: {
        canvas: null, ctx: null, boardSize: 10, cellSize: 0,
        playerPos: 0, cpuPos: 0, dice: 0, turn: 'player',
        isRolling: false, gameOver: false,
        snakes: { 98: 78, 95: 56, 93: 73, 87: 36, 64: 60, 62: 19, 54: 34, 17: 7 },
        ladders: { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 51: 67, 72: 91, 80: 99 },

        init() {
            this.canvas = document.getElementById('snl-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            const size = Math.min(this.canvas.parentElement.clientWidth, 360);
            this.canvas.width = size; this.canvas.height = size;
            this.cellSize = size / this.boardSize;
            this.playerPos = 0; this.cpuPos = 0; this.dice = 0;
            this.turn = 'player'; this.isRolling = false; this.gameOver = false;
            this.updateStatus('Roll the dice to start!');
            this.draw();
        },

        getCellCoords(pos) {
            if (pos <= 0) return { x: 0, y: this.boardSize - 1 };
            const p = pos - 1, row = Math.floor(p / this.boardSize);
            const col = row % 2 === 0 ? p % this.boardSize : this.boardSize - 1 - p % this.boardSize;
            return { x: col, y: this.boardSize - 1 - row };
        },

        draw() {
            const ctx = this.ctx, cs = this.cellSize, w = this.canvas.width;
            ctx.clearRect(0, 0, w, w);
            const colors = ['#f0fdf4', '#fef9c3', '#ede9fe', '#fce7f3', '#e0f2fe', '#fef3c7'];
            for (let i = 1; i <= 100; i++) {
                const { x, y } = this.getCellCoords(i);
                ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(x * cs, y * cs, cs, cs);
                ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 0.5; ctx.strokeRect(x * cs, y * cs, cs, cs);
                ctx.fillStyle = '#64748b'; ctx.font = `bold ${cs * 0.22}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText(i, x * cs + cs / 2, y * cs + 2);
            }
            Object.entries(this.snakes).forEach(([h, t]) => { const hc = this.getCellCoords(+h), tc = this.getCellCoords(t); ctx.beginPath(); ctx.moveTo(hc.x * cs + cs / 2, hc.y * cs + cs / 2); ctx.lineTo(tc.x * cs + cs / 2, tc.y * cs + cs / 2); ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 3; ctx.stroke(); ctx.font = `${cs * 0.35}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐍', hc.x * cs + cs / 2, hc.y * cs + cs / 2 + cs * 0.15); });
            Object.entries(this.ladders).forEach(([b, t]) => { const bc = this.getCellCoords(+b), tc = this.getCellCoords(t); const ox = cs * 0.15; ctx.beginPath(); ctx.moveTo(bc.x * cs + cs / 2 - ox, bc.y * cs + cs / 2); ctx.lineTo(tc.x * cs + cs / 2 - ox, tc.y * cs + cs / 2); ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(bc.x * cs + cs / 2 + ox, bc.y * cs + cs / 2); ctx.lineTo(tc.x * cs + cs / 2 + ox, tc.y * cs + cs / 2); ctx.stroke(); ctx.font = `${cs * 0.3}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🪜', bc.x * cs + cs / 2, bc.y * cs + cs / 2 + cs * 0.15); });
            if (this.playerPos > 0) { const p = this.getCellCoords(this.playerPos); ctx.beginPath(); ctx.arc(p.x * cs + cs * 0.35, p.y * cs + cs * 0.65, cs * 0.2, 0, Math.PI * 2); ctx.fillStyle = '#22C55E'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `bold ${cs * 0.18}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', p.x * cs + cs * 0.35, p.y * cs + cs * 0.65); }
            if (this.cpuPos > 0) { const p = this.getCellCoords(this.cpuPos); ctx.beginPath(); ctx.arc(p.x * cs + cs * 0.65, p.y * cs + cs * 0.65, cs * 0.2, 0, Math.PI * 2); ctx.fillStyle = '#EF4444'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `bold ${cs * 0.18}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('C', p.x * cs + cs * 0.65, p.y * cs + cs * 0.65); }
            const f = this.getCellCoords(100); ctx.fillStyle = '#FFD700'; ctx.fillRect(f.x * cs + 1, f.y * cs + 1, cs - 2, cs - 2); ctx.fillStyle = '#000'; ctx.font = `bold ${cs * 0.22}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏆100', f.x * cs + cs / 2, f.y * cs + cs / 2);
        },

        rollDice() {
            if (this.isRolling || this.gameOver || this.turn !== 'player') return;
            this.isRolling = true;
            const diceEl = document.getElementById('snl-dice');
            const de = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            let c = 0;
            const ri = setInterval(() => { if (diceEl) diceEl.textContent = de[Math.floor(Math.random() * 6)]; c++; if (c > 10) { clearInterval(ri); this.dice = Math.floor(Math.random() * 6) + 1; if (diceEl) diceEl.textContent = de[this.dice - 1]; this.moveToken('player'); } }, 80);
        },

        moveToken(who) {
            setTimeout(() => {
                const isP = who === 'player'; let pos = isP ? this.playerPos : this.cpuPos;
                const np = pos + this.dice;
                if (np > 100) { this.updateStatus(`${isP ? 'You' : 'CPU'} rolled ${this.dice}. Too high!`); this.finishTurn(who); return; }
                if (np === 100) { if (isP) this.playerPos = 100; else this.cpuPos = 100; this.gameOver = true; this.draw(); if (isP) { this.updateStatus('🎉 You Win! +40 coins!'); if (window.showToast) window.showToast('🎉 Snake & Ladders won! +40 coins!'); } else this.updateStatus('CPU Wins!'); return; }
                pos = np; let msg = `${isP ? 'You' : 'CPU'} rolled ${this.dice} → ${pos}.`;
                if (this.snakes[pos]) { pos = this.snakes[pos]; msg += ` 🐍 Down to ${pos}!`; }
                if (this.ladders[pos]) { pos = this.ladders[pos]; msg += ` 🪜 Up to ${pos}!`; }
                if (isP) this.playerPos = pos; else this.cpuPos = pos;
                this.updateStatus(msg); this.draw(); this.finishTurn(who);
            }, 300);
        },

        finishTurn(who) {
            if (this.gameOver) return;
            if (who === 'player') { if (this.dice === 6) { this.isRolling = false; return; } this.turn = 'cpu'; this.isRolling = false; setTimeout(() => this.cpuTurn(), 1000); }
            else { if (this.dice === 6) { setTimeout(() => this.cpuTurn(), 1000); return; } this.turn = 'player'; this.isRolling = false; }
        },

        cpuTurn() {
            if (this.gameOver) return;
            this.updateStatus('CPU rolling...');
            const diceEl = document.getElementById('snl-dice');
            const de = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            let c = 0;
            const ri = setInterval(() => { if (diceEl) diceEl.textContent = de[Math.floor(Math.random() * 6)]; c++; if (c > 10) { clearInterval(ri); this.dice = Math.floor(Math.random() * 6) + 1; if (diceEl) diceEl.textContent = de[this.dice - 1]; this.moveToken('cpu'); } }, 80);
        },

        updateStatus(msg) { const el = document.getElementById('snl-status'); if (el) el.textContent = msg; },
        restart() { this.init(); }
    }
};
