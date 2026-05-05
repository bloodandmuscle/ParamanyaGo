const BOARD_DATA = [
    { n: "BAŞLANGIÇ", t: "start", p: 0, r: 0, c: "#64748b", x: 0, y: 0 },
    { n: "KADIKÖY", t: "prop", p: 200, r: 100, c: "#3b82f6", x: 1, y: 0 },
    { n: "ŞANS", t: "chance", p: 0, r: 0, c: "#f59e0b", x: 2, y: 0 },
    { n: "MODA", t: "prop", p: 250, r: 130, c: "#3b82f6", x: 3, y: 0 },
    { n: "VERGİ", t: "tax", p: 0, r: 150, c: "#ef4444", x: 4, y: 0 },
    { n: "BEŞİKTAŞ", t: "prop", p: 300, r: 180, c: "#10b981", x: 5, y: 0 },
    { n: "HAPİS", t: "visit", p: 0, r: 0, c: "#475569", x: 5, y: 1 },
    { n: "ETİLER", t: "prop", p: 350, r: 220, c: "#10b981", x: 5, y: 2 },
    { n: "HAZİNE", t: "chest", p: 0, r: 0, c: "#34d399", x: 5, y: 3 },
    { n: "BEBEK", t: "prop", p: 400, r: 260, c: "#10b981", x: 5, y: 4 },
    { n: "OTOPARK", t: "park", p: 0, r: 0, c: "#64748b", x: 5, y: 5 },
    { n: "NİŞANTAŞI", t: "prop", p: 450, r: 320, c: "#a855f7", x: 4, y: 5 },
    { n: "ŞANS", t: "chance", p: 0, r: 0, c: "#f59e0b", x: 3, y: 5 },
    { n: "BEYOĞLU", t: "prop", p: 500, r: 400, c: "#a855f7", x: 2, y: 5 },
    { n: "HAPSE GİT", t: "tojail", p: 0, r: 0, c: "#ef4444", x: 1, y: 5 },
    { n: "FLORYA", t: "prop", p: 600, r: 500, c: "#ec4899", x: 0, y: 5 },
    { n: "ADALAR", t: "prop", p: 700, r: 600, c: "#ec4899", x: 0, y: 4 },
    { n: "HAZİNE", t: "chest", p: 0, r: 0, c: "#34d399", x: 0, y: 3 },
    { n: "B.CADDE", t: "prop", p: 800, r: 800, c: "#ec4899", x: 0, y: 2 },
    { n: "GELİR", t: "tax", p: 0, r: 200, c: "#ef4444", x: 0, y: 1 }
];

const cards = {
    chance: [
        { m: "Hız Cezası! -200₺", a: (p) => p.money -= 200, i: "🏎️" },
        { m: "Miras Kaldı! +500₺", a: (p) => p.money += 500, i: "📜" },
        { m: "Hapse Girdin!", a: (p) => { p.pos = 6; p.jail = 3; }, i: "👮" }
    ],
    chest: [
        { m: "Hazine Buldun! +300₺", a: (p) => p.money += 300, i: "💰" },
        { m: "Yatırım Karı! +200₺", a: (p) => p.money += 200, i: "🏦" }
    ]
};

let state = { p1: { pos: 0, money: 2000, id: 'p1', name: 'Siz', emoji: '🎩', jail: 0 }, p2: { pos: 0, money: 2000, id: 'p2', name: 'Bot', emoji: '🏎️', jail: 0 }, owners: {}, turn: 1, moving: false };

// KONFETİ SİSTEMİ
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function createConfetti() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    for (let i = 0; i < 150; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height, 
                         r: Math.random() * 6 + 4, d: Math.random() * 150, color: `hsl(${Math.random() * 360}, 100%, 50%)`, 
                         tilt: Math.random() * 10, tiltAngleIncremental: Math.random() * 0.07 + 0.05, tiltAngle: 0 });
    }
    animateConfetti();
}
function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncremental; p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2; p.tilt = Math.sin(p.tiltAngle) * 15;
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + p.tilt + p.r / 4, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4); ctx.stroke();
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(animateConfetti);
}

// SES SİSTEMİ
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(freq, type = 'sine', dur = 0.1) {
    try {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime); osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch(e){}
}

function init() {
    const board = document.getElementById('board');
    BOARD_DATA.forEach((cell, i) => {
        const div = document.createElement('div'); div.className = 'cell'; div.style.width = '100px'; div.style.height = '100px';
        div.style.left = (cell.x * 100) + 'px'; div.style.top = (cell.y * 100) + 'px';
        div.innerHTML = `<div class="cell-header" style="background:${cell.c}"></div>${cell.n}<br>${cell.p > 0 ? cell.p + '₺' : ''}<div class="buildings"></div>`;
        board.appendChild(div);
    });
    updateUI();
}

async function roll() {
    if (state.moving) return;
    state.moving = true; const p = state.turn === 1 ? state.p1 : state.p2;
    const d1 = Math.floor(Math.random() * 6) + 1; const d2 = Math.floor(Math.random() * 6) + 1; const dice = d1 + d2;
    document.getElementById('dice-result').innerText = `🎲 ${d1}+${d2}`;

    if (p.jail > 0) {
        if (d1 === d2) { log(`${p.name} ÇİFT ATTI! Çıktı.`); p.jail = 0; }
        else { p.jail--; log(`${p.name} hapiste: ${p.jail + 1}`); setTimeout(endTurn, 1000); return; }
    }

    playSfx(300, 'square', 0.2);
    for (let i = 0; i < dice; i++) {
        p.pos = (p.pos + 1) % BOARD_DATA.length;
        if (p.pos === 0) { p.money += 200; log("Başlangıç +200₺"); }
        playSfx(200 + (i*20), 'sine', 0.05); updateUI(); await new Promise(r => setTimeout(r, 200));
    }
    processCell(p);
}

function processCell(p) {
    const cell = BOARD_DATA[p.pos];
    const idx = p.pos;

    if (cell.t === "prop") {
        if (!state.owners[idx]) {
            // SAHİPSİZ MÜLK
            if (p.id === 'p1') showModal("MÜLK AL", cell.n, "🏠", `${cell.p}₺'ye alalım mı?`, () => { buy(p, idx); endTurn(); }, true);
            else { if (p.money > cell.p + 250) buy(p, idx); endTurn(); }
        } else if (state.owners[idx] !== p.id) {
            // RAKİP MÜLKÜ (KİRA + EL KOYMA)
            const owner = state.owners[idx] === 'p1' ? state.p1 : state.p2;
            p.money -= cell.r; owner.money += cell.r;
            log(`${p.name} kira ödedi: ${cell.r}₺`);
            playSfx(80, 'sawtooth', 0.2);

            if (p.id === 'p1') {
                const takePrice = cell.p * 2;
                showModal("EL KOYMA", cell.n, "💣", `Kira ödendi. Bu mülkü ${takePrice}₺'ye zorla satın almak ister misin?`, () => {
                    if(p.money >= takePrice) {
                        p.money -= takePrice;
                        owner.money += takePrice;
                        buy(p, idx, true);
                        log("DÜŞMANIN MÜLKÜNE EL KOYDUNUZ!");
                    } else { alert("Yeterli paranız yok!"); }
                    endTurn();
                }, true);
            } else {
                // Bot zekası: Eğer çok parası varsa ve kira ödediyse mülkü geri alabilir
                if (p.money > cell.p * 3) {
                    p.money -= cell.p * 2;
                    state.p1.money += cell.p * 2;
                    buy(p, idx, true);
                    log("Bot mülkünüze EL KOYDU!");
                }
                endTurn();
            }
        } else endTurn();
    } else if (cell.t === "chance" || cell.t === "chest") {
        const pool = (cell.t === "chance" ? cards.chance : cards.chest);
        const card = pool[Math.floor(Math.random() * pool.length)];
        showModal(cell.t.toUpperCase(), card.m, card.i, "", () => { card.a(p); endTurn(); }, false);
    } else if (cell.t === "tojail") { p.pos = 6; p.jail = 3; log("Hapse!"); updateUI(); setTimeout(endTurn, 1000); }
    else if (cell.t === "tax") { p.money -= cell.r; log("Vergi!"); endTurn(); }
    else endTurn();
}

function buy(p, idx, force = false) {
    if(!force) p.money -= BOARD_DATA[idx].p;
    state.owners[idx] = p.id;
    const c = document.getElementsByClassName('cell')[idx];
    c.querySelector('.buildings').innerText = p.id === 'p1' ? '🏠' : '🏢';
    c.style.boxShadow = `inset 0 0 15px ${p.id === 'p1' ? 'rgba(239,68,68,0.7)' : 'rgba(59,130,246,0.7)'}`;
    updateUI(); playSfx(600, 'sine', 0.2);
}

function endTurn() {
    hideModal(); updateUI();
    if (state.p1.money <= 0 || state.p2.money <= 0) {
        const win = state.p1.money > 0;
        if(win) createConfetti();
        showModal("OYUN BİTTİ", win ? "KAZANDINIZ!" : "BOT KAZANDI", win ? "🏆" : "💀", "Tekrar oynamak için tıkla.", () => location.reload(), false);
        return;
    }
    state.turn = state.turn === 1 ? 2 : 1; state.moving = false;
    if (state.turn === 2) setTimeout(roll, 1000);
}

function updateUI() {
    document.getElementById('money-p1').innerText = state.p1.money + "₺";
    document.getElementById('money-p2').innerText = state.p2.money + "₺";
    const p1 = BOARD_DATA[state.p1.pos]; const p2 = BOARD_DATA[state.p2.pos];
    const t1 = document.getElementById('p1-token'); t1.style.left = (p1.x*100+20)+"px"; t1.style.top = (p1.y*100+20)+"px";
    const t2 = document.getElementById('p2-token'); t2.style.left = (p2.x*100+50)+"px"; t2.style.top = (p2.y*100+50)+"px";
}

function showModal(t, m, i, d, cb, isB) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-title').innerText = t; document.getElementById('modal-desc').innerHTML = `<b>${m}</b><br>${d}`;
    document.getElementById('decision-box').querySelector('.card-icon').innerText = i;
    document.getElementById('buy-btn').innerText = isB ? "AL / EL KOY" : "TAMAM"; document.getElementById('buy-btn').onclick = cb;
    document.getElementById('skip-btn').classList.toggle('hidden', !isB); document.getElementById('skip-btn').onclick = () => { hideModal(); endTurn(); };
}

function hideModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function log(m) { const l = document.getElementById('event-log'); const i = document.createElement('li'); i.innerText = m; l.prepend(i); }
document.getElementById('roll-btn').onclick = () => { audioCtx.resume(); roll(); };
init();
