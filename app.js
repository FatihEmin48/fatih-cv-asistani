import { pipeline, cos_sim, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

env.allowLocalModels = false;

const CATEGORY_KEYWORDS = {
  "İletişim": ["iletişim", "telefon", "e-posta", "eposta", "email", "mail", "linkedin", "github", "ulaş", "scholar", "medium"],
  "Eğitim": ["eğitim", "okul", "üniversite", "lisans", "yüksek lisans", "mezun", "formasyon", "okuyor", "okudu"],
  "Teknik Yetenekler": ["beceri", "yetenek", "teknoloji", "araç", "programlama dil", "hangi dil", "kullandığı dil", "hakim"],
  "Mesleki Deneyim": ["deneyim", "iş yeri", "şirket", "firma", "kariyer", "staj", "işe girdi"],
  "Projeler": ["proje", "geliştirdiği proje", "hangi projelerde"],
  "Yayınlar": ["yayın", "makale", "publication", "dergi", "doi", "bilimsel"],
  "Referans": ["referans", "danışman", "tavsiye mektubu"],
  "Hakkımda": ["hakkında kim", "kimdir", "kendini tanıt", "biyografi"],
};

function matchCategories(question) {
  const q = question.toLocaleLowerCase("tr-TR");
  return Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => q.includes(k)))
    .map(([category]) => category);
}

const statusEl = document.getElementById("status");
const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("question");
const submitBtn = formEl.querySelector("button");

let extractor;
let kb = [];
let kbEmbeddings = [];

function setStatus(msg) {
  statusEl.textContent = msg;
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}

async function embed(text) {
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function init() {
  try {
    setStatus("CV bilgi tabanı yükleniyor...");
    const res = await fetch("data/kb.json");
    kb = await res.json();

    setStatus("Yapay zeka modeli tarayıcınıza indiriliyor (ilk seferde ~25MB, sonrasında önbellekten anında yüklenir)...");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

    setStatus("CV içeriği analiz ediliyor...");
    kbEmbeddings = [];
    for (const item of kb) {
      kbEmbeddings.push(await embed(`${item.category}. ${item.text}`));
    }

    setStatus("Hazır. Fatih hakkında bir soru sorabilirsin — cevaplar CV'sinden alınır.");
    inputEl.disabled = false;
    submitBtn.disabled = false;
    inputEl.focus();
  } catch (err) {
    console.error(err);
    setStatus("Model yüklenirken bir sorun oluştu. Sayfayı yenilemeyi deneyin.");
  }
}

async function answer(question) {
  const matchedCats = matchCategories(question);

  if (matchedCats.length === 0) {
    return "Bu konuyla ilgili CV'de bir bilgi bulamadım. Eğitim, iş deneyimi, projeler, teknik beceriler, yayınlar veya iletişim hakkında soru sorabilirsin.";
  }

  const qVec = await embed(question);
  const pool = kb.map((item, i) => ({ item, i })).filter(({ item }) => matchedCats.includes(item.category));

  const scored = pool.map(({ item, i }) => ({
    item,
    score: cos_sim(qVec, kbEmbeddings[i]),
  }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, Math.min(scored.length, 4));

  const groups = new Map();
  for (const s of top) {
    if (!groups.has(s.item.category)) groups.set(s.item.category, []);
    groups.get(s.item.category).push(s.item.text);
  }

  return [...groups.entries()]
    .map(([category, texts]) => `${category.toUpperCase()}\n${texts.map((t) => `• ${t}`).join("\n\n")}`)
    .join("\n\n");
}

async function handleQuestion(question) {
  addMessage("user", question);
  const pending = addMessage("bot", "Düşünüyorum...");
  try {
    const reply = await answer(question);
    pending.textContent = reply;
  } catch (err) {
    console.error(err);
    pending.textContent = "Bir hata oluştu, tekrar dener misin?";
  }
  chatEl.scrollTop = chatEl.scrollHeight;
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const question = inputEl.value.trim();
  if (!question) return;
  inputEl.value = "";
  handleQuestion(question);
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    if (inputEl.disabled) return;
    handleQuestion(chip.dataset.q);
  });
});

init();
