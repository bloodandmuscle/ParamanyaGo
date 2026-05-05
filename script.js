const BOARD_DATA = [
    { n: "BAŞLANGIÇ", t: "start", p: 0, r: 0, c: "#64748b", x: 0, y: 0 },
    { n: "KADIKÖY", t: "prop", p: 200, r: 60, c: "#3b82f6", x: 1, y: 0 },
    { n: "ŞANS", t: "chance", p: 0, r: 0, c: "#f59e0b", x: 2, y: 0 },
    { n: "MODA", t: "prop", p: 250, r: 80, c: "#3b82f6", x: 3, y: 0 },
    { n: "VERGİ", t: "tax", p: 0, r: 150, c: "#ef4444", x: 4, y: 0 },
    { n: "BEŞİKTAŞ", t: "prop", p: 300, r: 100, c: "#10b981", x: 5, y: 0 },
    { n: "ZİYARET", t: "visit", p: 0, r: 0, c: "#475569", x: 5, y: 1 },
    { n: "ETİLER", t: "prop", p: 350, r: 140, c: "#10b981", x: 5, y: 2 },
    { n: "HAZİNE", t: "chance", p: 0, r: 0, c: "#f59e0b", x: 5, y: 3 },
    { n: "BEBEK", t: "prop", p: 400, r: 180, c: "#10b981", x: 5, y: 4 },
    { n: "PARK", t: "park", p: 0, r: 0, c: "#64748b", x: 5, y: 5 },
    { n: "NİŞANTAŞI", t: "prop", p: 450, r: 220, c: "#a855f7", x: 4, y: 5 },
    { n: "ŞANS", t: "chance", p: 0, r: 0, c: "#f59e0b", x: 3, y: 5 },
    { n: "BEYOĞLU", t: "prop", p: 500, r: 260, c: "#a855f7", x: 2, y: 5 },
    { n: "HAPİS", t: "jail", p: 0, r: 0, c: "#ef4444", x: 1, y: 5 },
    { n: "FLORYA", t: "prop", p: 600, r: 350, c: "#ec4899", x: 0, y: 5 },
    { n: "ADALAR", t: "prop", p: 700, r: 450, c: "#ec4899", x: 0, y: 4 },
    { n: "HAZİNE", t: "chance", p: 0, r: 0, c: "#f59e0b", x: 0, y: 3 },
    { n: "B.CADDE", t: "prop", p: 800, r: 600, c: "#ec4899", x: 0, y: 2 },
    { n: "GELİR", t: "tax", p: 0, r: 200, c: "#ef4444", x: 0, y: 1 }
];

const chanceCards = [
    { m: "Miras Kaldı! +400₺", a: (p) => p.money += 400 },
    { m: "Trafik Cezası! -150₺", a: (p) => p.money -= 150 },
    { m: "Piyango! +200₺", a: (p) => p.money += 200 },
    { m: "Hapse Girdin!", a: (p) => p.pos = 6 }
];

let state = { p1: { pos: 0, money: 2000, id: 'p1' }, p2: { pos: 0, money: 2000, id: 'p2' }, owners: {}, turn: 1, moving: false };

// SES SENTEZLEYİCİ (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(freq, type = 'sine', dur = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.fadeOutAtTime = audioCtx.currentTime + dur;
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function init() {
    const board = document.getElementById('board');
    BOARD_DATA.forEach((cell, i) => {
        const div = document.createElement('div');
        div.className = 'cell'; div.style.width = '100px'; div.style.height = '100px';
        div.style.left = (cell.x * 100) + 'px'; div.style.top = (cell.y * 100) + 'px';
        div.innerHTML = `<div class="cell-header" style="background:${cell.c}"></div>${cell.n}<br>${cell.p}₺`;
        board.appendChild(div);
    });
    updateUI();
}

async function roll() {
    if (state.moving) return;
    state.moving = true;
    playSfx(300, 'square', 0.2); // Zar sesi
    const dice = Math.floor(Math.random() * 6) + 1;
    document.getElementById('dice-result').innerText = "🎲 " + dice;
    const player = state.turn === 1 ? state.p1 : state.p2;
    
    for (let i = 0; i < dice; i++) {
        player.pos = (player.pos + 1) % BOARD_DATA.length;
        if (player.pos === 0) { player.money += 200; log("Başlangıç bonusu +200₺"); }
        playSfx(150 + (i*50), 'sine', 0.05); // Adım sesi
        updateUI();
        await new Promise(r => setTimeout(r, 250));
    }
    processCell(player);
}

function processCell(p) {
    const cell = BOARD_DATA[p.pos];
    if (cell.t === "prop") {
        if (!state.owners[p.pos]) {
            if (p.id === 'p1') {
                showModal(cell.n, `${cell.p}₺'ye almak ister misin?`, () => { buy(p, p.pos); endTurn(); });
            } else { if (p.money > cell.p + 200) buy(p, p.pos); endTurn(); }
        } else if (state.owners[p.pos] !== p.id) {
            const rent = cell.r; p.money -= rent;
            (state.turn === 1 ? state.p2 : state.p1).money += rent;
            log(`${p.id} kira ödedi: ${rent}₺`);
            playSfx(100, 'sawtooth', 0.3); // Para kaybı sesi
            endTurn();
        } else endTurn();
    } else if (cell.t === "chance") {
        const card = chanceCards[Math.floor(Math.random() * chanceCards.length)];
        log(card.m); card.a(p); playSfx(600, 'triangle', 0.4);
        endTurn();
    } else { if(cell.r > 0) p.money -= cell.r; endTurn(); }
}

function buy(p, idx) {
    p.money -= BOARD_DATA[idx].p; state.owners[idx] = p.id;
    log(`${p.id} satın aldı: ${BOARD_DATA[idx].n}`);
    updateUI(); playSfx(800, 'sine', 0.2); // Satın alma sesi
}

function endTurn() {
    hideModal(); updateUI();
    if (state.p1.money <= 0 || state.p2.money <= 0) { playSfx(1000, 'sine', 1); alert("Oyun Bitti!"); location.reload(); }
    state.turn = state.turn === 1 ? 2 : 1;
    state.moving = false;
    if (state.turn === 2) setTimeout(roll, 1000);
}

function updateUI() {
    document.getElementById('money-p1').innerText = state.p1.money + "₺";
    document.getElementById('money-p2').innerText = state.p2.money + "₺";
    document.getElementById('p1-token').style.left = (BOARD_DATA[state.p1.pos].x * 100 + 20) + "px";
    document.getElementById('p1-token').style.top = (BOARD_DATA[state.p1.pos].y * 100 + 20) + "px";
    document.getElementById('p2-token').style.left = (BOARD_DATA[state.p2.pos].x * 100 + 55) + "px";
    document.getElementById('p2-token').style.top = (BOARD_DATA[state.p2.pos].y * 100 + 55) + "px";
}

function log(m) { const l = document.getElementById('event-log'); const i = document.createElement('li'); i.innerText = m; l.prepend(i); }
function showModal(t, d, cb) { document.getElementById('modal-overlay').classList.remove('hidden'); document.getElementById('modal-title').innerText = t; document.getElementById('modal-desc').innerText = d; document.getElementById('buy-btn').onclick = cb; document.getElementById('skip-btn').onclick = endTurn; }
function hideModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

document.getElementById('roll-btn').onclick = roll;
init();
