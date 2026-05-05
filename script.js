// 40 Karelik Tam Monopoly Dizilimi
const BOARD_DATA = [];
const COORDS = [
    // Alt Kenar (0-10)
    ...Array.from({length: 11}, (_, i) => ({x: 10-i, y: 10})),
    // Sol Kenar (11-20)
    ...Array.from({length: 10}, (_, i) => ({x: 0, y: 9-i})),
    // Üst Kenar (21-30)
    ...Array.from({length: 10}, (_, i) => ({x: 1+i, y: 0})),
    // Sağ Kenar (31-39)
    ...Array.from({length: 9}, (_, i) => ({x: 10, y: 1+i}))
];

const NAMES = ["BAŞLANGIÇ", "KASIMPAŞA", "HAZİNE", "DOLAPDERE", "VERGİ", "HAYDARPAŞA", "SULTANAHMET", "ŞANS", "KARAKÖY", "SİRKECİ", "HAPİS ZİYARET", "FATİH", "ELEKTRİK", "BEŞİKTAŞ", "ORTAKÖY", "VAPUR", "NİŞANTAŞI", "HAZİNE", "TEŞVİKİYE", "MACKA", "ÜCRETSİZ OTOPARK", "BAKIRKÖY", "ŞANS", "YEŞİLKÖY", "FLORYA", "HAVALİMANI", "LEVENT", "ETİLER", "SU SİSTEMİ", "BEBEK", "HAPSE GİT", "GÖZTEPE", "ERENKÖY", "HAZİNE", "CADDEBOSTAN", "GAR", "ŞANS", "BAĞDAT CAD.", "LÜKS VERGİ", "MODA"];
const PRICES = [0, 60, 0, 80, 0, 200, 100, 0, 120, 140, 0, 160, 150, 180, 200, 200, 220, 0, 240, 260, 0, 280, 0, 300, 320, 200, 350, 380, 150, 400, 0, 450, 480, 0, 500, 200, 0, 600, 0, 800];
const COLORS = ["#94a3b8", "#78350f", "#f59e0b", "#78350f", "#ef4444", "#1e293b", "#3b82f6", "#f59e0b", "#3b82f6", "#3b82f6", "#475569", "#ec4899", "#fbbf24", "#ec4899", "#ec4899", "#1e293b", "#f97316", "#f59e0b", "#f97316", "#f97316", "#94a3b8", "#22c55e", "#f59e0b", "#22c55e", "#22c55e", "#1e293b", "#a855f7", "#a855f7", "#fbbf24", "#a855f7", "#ef4444", "#10b981", "#10b981", "#f59e0b", "#10b981", "#1e293b", "#f59e0b", "#4338ca", "#ef4444", "#4338ca"];

NAMES.forEach((n, i) => {
    BOARD_DATA.push({
        n, x: COORDS[i].x, y: COORDS[i].y, 
        p: PRICES[i], r: Math.floor(PRICES[i] * 0.4), 
        c: COLORS[i], t: PRICES[i] > 0 ? "prop" : (n.includes("ŞANS") ? "chance" : (n.includes("HAZİNE") ? "chest" : "special"))
    });
});

let players = [
    { id: 'p1', name: 'SİZ', pos: 0, money: 2000, emoji: '🎩', props: 0, jail: 0, bot: false },
    { id: 'p2', name: 'BOT 1', pos: 0, money: 2000, emoji: '🏎️', props: 0, jail: 0, bot: true },
    { id: 'p3', name: 'BOT 2', pos: 0, money: 2000, emoji: '🐕', props: 0, jail: 0, bot: true },
    { id: 'p4', name: 'BOT 3', pos: 0, money: 2000, emoji: '🚢', props: 0, jail: 0, bot: true }
];

let turn = 0, moving = false, owners = {};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(f, t='sine', d=0.1) { try { const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=t; o.frequency.setValueAtTime(f, audioCtx.currentTime); g.gain.setValueAtTime(0.05, audioCtx.currentTime); o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+d); } catch(e){} }

function init() {
    const b = document.getElementById('board');
    BOARD_DATA.forEach((c, i) => {
        const d = document.createElement('div'); d.className = 'cell';
        d.style.left = (c.x * 60) + 'px'; d.style.top = (c.y * 60) + 'px';
        d.innerHTML = `<div class="cell-header" style="background:${c.c}"></div>${c.n}<br>${c.p?c.p+'₺':''}<div class="b-cont"></div>`;
        b.appendChild(d);
    });
    updateUI();
}

async function roll() {
    if (moving) return; moving = true;
    const p = players[turn];
    const d1 = Math.floor(Math.random()*6)+1, d2 = Math.floor(Math.random()*6)+1, dice = d1+d2;
    document.getElementById('dice-result').innerText = `🎲 ${d1}+${d2}`;

    if (p.jail > 0) {
        if (d1 === d2) { log(`${p.name} ÇİFT ATTI! Çıktı.`); p.jail = 0; }
        else { p.jail--; log(`${p.name} hapiste. Kalan: ${p.jail+1}`); setTimeout(endTurn, 1000); return; }
    }

    for (let i = 0; i < dice; i++) {
        p.pos = (p.pos + 1) % 40;
        if (p.pos === 0) { p.money += 200; playSfx(800, 'sine', 0.3); }
        playSfx(200 + (i*15)); updateUI(); await new Promise(r => setTimeout(r, 150));
    }
    processCell(p);
}

function processCell(p) {
    const idx = p.pos, c = BOARD_DATA[idx];
    if (c.t === "prop") {
        if (!owners[idx]) {
            if (!p.bot) showModal("MÜLK AL", c.n, "🏠", `${c.p}₺?`, () => { buy(p, idx); endTurn(); }, true);
            else { if (p.money > c.p + 300) buy(p, idx); endTurn(); }
        } else if (owners[idx] !== p.id) {
            const o = players.find(x => x.id === owners[idx]);
            p.money -= c.r; o.money += c.r; playSfx(100, 'sawtooth', 0.2);
            if (!p.bot) {
                const take = c.p * 2;
                showModal("EL KOYMA", c.n, "💣", `${take}₺'ye zorla al?`, () => { if(p.money>=take){p.money-=take; o.money+=take; o.props--; buy(p,idx,true);} endTurn(); }, true);
            } else { if(p.money > c.p*4) { p.money-=c.p*2; o.money+=c.p*2; o.props--; buy(p,idx,true); } endTurn(); }
        } else endTurn();
    } else if (c.n === "HAPSE GİT") { p.pos = 10; p.jail = 3; updateUI(); setTimeout(endTurn, 1000); }
    else endTurn();
}

function buy(p, idx, f = false) {
    if(!f) p.money -= BOARD_DATA[idx].p;
    p.props++; owners[idx] = p.id;
    const cell = document.getElementsByClassName('cell')[idx];
    cell.querySelector('.b-cont').innerHTML = `<div class="building-3d" style="border-color:${p.id==='p1'?'red':(p.id==='p2'?'blue':'green')}">${p.id==='p1'?'🏠':'🏢'}</div>`;
    updateUI(); playSfx(600);
}

function endTurn() {
    hideModal(); updateUI();
    if (players.some(x => x.money <= 0)) { alert("OYUN BİTTİ!"); location.reload(); return; }
    turn = (turn + 1) % 4; moving = false;
    document.getElementById('current-player-name').innerText = players[turn].name;
    if (players[turn].bot) setTimeout(roll, 1000);
}

function updateUI() {
    players.forEach(p => {
        document.getElementById(`money-${p.id}`).innerText = p.money + "₺";
        document.getElementById(`inv-${p.id}`).innerText = `🏠 x${p.props}`;
        const t = document.getElementById(`${p.id}-token`), cell = BOARD_DATA[p.pos];
        const offset = (players.indexOf(p) * 10);
        t.style.left = (cell.x * 60 + 10 + offset % 20) + "px";
        t.style.top = (cell.y * 60 + 10 + Math.floor(offset / 20) * 10) + "px";
    });
}

function showModal(t, m, i, d, cb, b) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-title').innerText = t; document.getElementById('modal-desc').innerHTML = `<b>${m}</b><br>${d}`;
    document.querySelector('.card-icon').innerText = i; document.getElementById('buy-btn').onclick = cb;
    document.getElementById('skip-btn').classList.toggle('hidden', !b); document.getElementById('skip-btn').onclick = endTurn;
}

function hideModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function log(m) { const l = document.getElementById('event-log'), i = document.createElement('li'); i.innerText = m; l.prepend(i); }
document.getElementById('roll-btn').onclick = () => { audioCtx.resume(); roll(); };
init();
