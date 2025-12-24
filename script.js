
const PASSWORD = "Sommernächte";

/* ===== element refs ===== */
const el = {
  gate: document.getElementById("gate"),
  memory: document.getElementById("memory"),
  quizScreen: document.getElementById("quizScreen"),
  result: document.getElementById("result"),
  popup: document.getElementById("popup"),
  pw: document.getElementById("pw"),
  error: document.getElementById("error"),
  memoryGrid: document.getElementById("memoryGrid"),
  meterBar: document.getElementById("meterBar"),
  quiz: document.getElementById("quiz"),
  resultDetails: document.getElementById("resultDetails"),
  popupCloseBtn: document.getElementById("popupCloseBtn"),
};

// expose for inline onclick
window.unlock = unlock;
window.submitQuiz = submitQuiz;
window.closePopup = closePopup;

/* ===== Gate ===== */
function unlock() {
  if (!el.pw) return;
  const ok = el.pw.value.trim().toLowerCase() === PASSWORD.toLowerCase();
  if (!ok) {
    if (el.error) el.error.textContent = "Leider falsch 💔";
    return;
  }
  el.gate?.classList.add("hidden");
  el.memory?.classList.remove("hidden");
  initMemory();
}

/* ===== Memory game: 6 pairs ===== */
let lock = true;
let first = null;
let second = null;
let matchedPairs = 0;

function initMemory() {
  const grid = el.memoryGrid;
  if (!grid) return;

  const cards = [...grid.querySelectorAll(".memory-card")];

  // build flip structure
  cards.forEach((card) => {
    const pair = card.dataset.pair;
    card.innerHTML = `
      <div class="inner">
        <div class="front"></div>
        <div class="back" style="background-image:url('images/pair${pair}.jpg')"></div>
      </div>
    `;
  });

  // shuffle once
  shuffleInDOM(grid, cards);

  // intro reveal: all open -> close -> shuffle anim -> playable
  lock = true;
  grid.classList.add("revealing");
  cards.forEach((c) => c.classList.add("open"));
  updateMeter();

  setTimeout(() => {
    cards.forEach((c) => c.classList.remove("open"));
    grid.classList.remove("revealing");

    grid.classList.add("shuffling");
    setTimeout(() => {
      shuffleInDOM(grid, [...grid.querySelectorAll(".memory-card")]);
      grid.classList.remove("shuffling");
      lock = false;
    }, 650);
  }, 1400);

  // click handlers (attach once)
  cards.forEach((card) => {
    card.addEventListener("click", () => onPick(card));
  });
}

function shuffleInDOM(grid, cards) {
  const arr = cards.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  arr.forEach((el) => grid.appendChild(el));
}

function onPick(card) {
  if (lock) return;
  if (card.classList.contains("matched")) return;
  if (card === first) return;

  card.classList.add("open");

  if (!first) {
    first = card;
    return;
  }

  second = card;
  lock = true;

  const a = first.dataset.pair;
  const b = second.dataset.pair;

  if (a === b) {
    first.classList.add("matched");
    second.classList.add("matched");
    matchedPairs++;
    first = null;
    second = null;
    updateMeter();

    if (matchedPairs === 8) {
      setTimeout(() => {
        el.memory?.classList.add("hidden");
        el.quizScreen?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 650);
    } else {
      lock = false;
    }
  } else {
    first.classList.add("wrong");
    second.classList.add("wrong");

    setTimeout(() => {
      first.classList.remove("open", "wrong");
      second.classList.remove("open", "wrong");
      first = null;
      second = null;
      lock = false;
    }, 850);
  }
}

function updateMeter() {
  if (!el.meterBar) return;
  const pct = Math.round((matchedPairs / 8) * 100);
  el.meterBar.style.width = pct + "%";
}

/* ===== Quiz ===== */
const quizData = [
  { q: "Was ist der beste Yogurt-Spot?", a: ["Oh My Yo", "Freo", "Yo-Chi", "Yogurberry"] },
  { q: "Wer hatte mehr Angst bei Bridge Climb?", a: ["Aylin", "Lionking Kerem", "Keiner von beiden – beide Löwen 🦁"] },
  { q: "Wer ist der grösste Bastard Prof?", a: ["Ray", "Arash", "Bruce"] },
  { q: "Korrekte Bezeichnung vom Bruder des Vaters?", a: ["mein Amo", "mein Schwager", "mein Onkel", "mayne Onkil"] },
  { q: "Aylin ist Kerems was?", a: ["Spatz", "Fisch", "Maus", "Lunge"] },
];

const correctKeys = [
  [2],        // Q1
  [2],        // Q2
  [1, 2],     // Q3
  [3],        // Q4
  [0, 1, 2, 3]// Q5
];

const answers = new Array(quizData.length).fill(null);

function renderQuiz() {
  if (!el.quiz) return;
  el.quiz.innerHTML = "";

  quizData.forEach((item, qi) => {
    const block = document.createElement("div");
    block.innerHTML = `<p><b>${qi + 1}. ${item.q}</b></p>`;

    item.a.forEach((opt, oi) => {
      const d = document.createElement("div");
      d.className = "quiz-option";
      d.textContent = opt;
      d.addEventListener("click", () => {
        answers[qi] = oi;
        [...block.querySelectorAll(".quiz-option")].forEach((x) => x.classList.remove("selected"));
        d.classList.add("selected");
      });
      block.appendChild(d);
    });

    el.quiz.appendChild(block);
  });
}
renderQuiz();

/* ===== Results + popup ===== */
function renderResults() {
  if (!el.resultDetails) return;
  el.resultDetails.innerHTML = "";

  quizData.forEach((q, qi) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="result-q"><b>${qi + 1}. ${q.q}</b></div>`;

    q.a.forEach((opt, oi) => {
      const div = document.createElement("div");
      div.className = "result-opt";
      const chosen = answers[qi] === oi;
      const correct = correctKeys[qi].includes(oi);

      if (correct) div.classList.add("correct");
      if (chosen && !correct) div.classList.add("wrong");
      if (chosen) div.classList.add("chosen");

      div.textContent = opt;
      wrap.appendChild(div);
    });

    el.resultDetails.appendChild(wrap);
  });
}

function submitQuiz() {
  const missing = answers.some((a) => a === null);
  if (missing) {
    alert("Bitte beantworte noch alle Fragen 💗");
    return;
  }

  el.quizScreen?.classList.add("hidden");
  el.result?.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  renderResults();

  // show popup now (not at start)
  openPopup();
}

function openPopup() {
  if (!el.popup) return;
  el.popup.classList.remove("hidden");
}

function closePopup() {
  if (!el.popup) return;
  el.popup.classList.add("hidden");
}

/* popup interactions */
document.addEventListener("click", (e) => {
  if (!el.popup) return;
  if (el.popupCloseBtn && e.target === el.popupCloseBtn) closePopup();
  if (e.target === el.popup) closePopup();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePopup();
});
