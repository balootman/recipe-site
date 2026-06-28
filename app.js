const STARTER_RECIPES = [
  {
    id: "starter-chicken-soy",
    title: "חזה עוף רך ב־10 דקות",
    summary: "עסיסי, מהיר וטעים גם למחרת במיקרו — ברוטב סויה, שום ותבלינים.",
    category: "עיקריות", time: 10, difficulty: "קל", image: "assets/chicken-soy.png",
    ingredients: [
      "1 ק״ג חזה עוף, חתוך לשניצלים או לקוביות", "2 כפות קורנפלור", "רוטב סויה, לפי הצורך",
      "1½ כפות שמן זית", "2 כפיות שום כתוש", "אבקת שום, לפי הטעם", "צ׳ילי חריף, לפי הטעם",
      "פלפל לבן, לפי הטעם", "תבלין פילדלפיה או פפריקה מתוקה, לפי הטעם", "מלח, לפי הטעם",
      "חמאת בוטנים — מומלץ, אך לא חובה", "דבש או סילאן, לזילוף"
    ],
    steps: [
      "מערבבים את חזה העוף עם רוטב הסויה, התבלינים וחמאת הבוטנים.",
      "מוסיפים שתי כפות קורנפלור ומערבבים עד שהתערובת אחידה.",
      "מחממים במחבת רחבה או בווק כף וחצי שמן זית. כשהשמן חם, מניחים את כל חזה העוף.",
      "צורבים שתי דקות, הופכים וצורבים שתי דקות נוספות לקבלת צבע כהה ויפה.",
      "מנמיכים את האש, מוסיפים שתי כפיות שום כתוש, עוד מעט סויה וזילוף דבש או סילאן.",
      "מבשלים עוד 4–5 דקות תוך ערבוב מדי פעם — וזה מוכן."
    ],
    notes: "חמאת הבוטנים מוסיפה עומק וקרמיות, אבל המתכון עובד מצוין גם בלעדיה.", createdAt: "2026-01-01"
  },
  {
    id: "starter-chicken-sweet-potato",
    title: "חזה עוף, בטטה וערמונים בסיר אחד",
    summary: "ארוחה ביתית קלה בסיר אחד, עם בטטה, ערמונים ורוטב מתקתק.",
    category: "עיקריות", time: 45, difficulty: "קל", image: "assets/chicken-sweet-potato.png",
    ingredients: [
      "חזה או פילה עוף, בכמות הרצויה — אפשר גם פרוסות", "2 בצלים או בצל אחד גדול מאוד, חתוכים לרצועות",
      "ערמונים, לפי הטעם", "1–2 בטטות, חתוכות לקוביות", "שמן לטיגון", "סילאן, לפי הטעם",
      "מעט כורכום", "פפריקה, לפי הטעם", "מלח ופלפל, לפי הטעם", "½ כוס מים"
    ],
    steps: [
      "מטגנים את רצועות הבצל בשמן עד להשחמה.", "מוסיפים את קוביות הבטטה ומשחימים.",
      "מפנים מקום בסוטאז׳, מוסיפים את חזה העוף וצורבים גם אותו.",
      "מתבלים בסילאן, מעט כורכום, פפריקה, מלח ופלפל ומערבבים היטב.",
      "מוסיפים חצי כוס מים ואת הערמונים החתוכים.",
      "מבשלים על להבה נמוכה 30–40 דקות ושמים לב שהתבשיל לא יתייבש.",
      "מעבירים לתנור שחומם ל־180 מעלות, חום עליון ותחתון, לכ־5 דקות של קירמול."
    ],
    notes: "בסרטון ההדרכה יש קינמון; בגרסה הזאת הקינמון הושמט.",
    video: "https://www.instagram.com/reel/C3xEuqLowBf/?igsh=ZnM0Mng2dnp6MDJt", createdAt: "2026-01-02"
  }
];

const STORAGE_KEY = "bamitbach-recipes-v1";
const FAVORITES_KEY = "bamitbach-favorites-v1";
const DRAFT_KEY = "bamitbach-draft-v1";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const safeJSON = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

let customRecipes = safeJSON(localStorage.getItem(STORAGE_KEY), []);
let favorites = new Set(safeJSON(localStorage.getItem(FAVORITES_KEY), []));
let selectedCategory = "הכול";
let currentView = "all";
let uploadedImage = "";
let saveTimer;
const allRecipes = () => [...customRecipes, ...STARTER_RECIPES];

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function recipeCard(recipe) {
  const saved = favorites.has(recipe.id);
  const image = recipe.image
    ? `<img class="card-image" src="${escapeHTML(recipe.image)}" alt="${escapeHTML(recipe.title)}" loading="lazy">`
    : `<div class="card-placeholder" aria-hidden="true">🍲</div>`;
  return `<article class="recipe-card" data-id="${escapeHTML(recipe.id)}" tabindex="0" aria-label="פתיחת המתכון ${escapeHTML(recipe.title)}">
    <button class="favorite-btn ${saved ? "saved" : ""}" data-favorite="${escapeHTML(recipe.id)}" aria-label="${saved ? "הסרה מהשמורים" : "שמירת המתכון"}" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button>
    ${image}
    <div class="card-body">
      <div class="card-meta"><span>${escapeHTML(recipe.category)}</span><span>•</span><span>${recipe.time} דקות</span></div>
      <h3>${escapeHTML(recipe.title)}</h3><p>${escapeHTML(recipe.summary || "מתכון ביתי שכדאי לשמור.")}</p>
      <div class="card-bottom"><span>רמת קושי: <strong>${escapeHTML(recipe.difficulty)}</strong></span><b>למתכון ←</b></div>
    </div>
  </article>`;
}

function renderRecipes() {
  const query = $("#search").value.trim().toLowerCase();
  let recipes = allRecipes().filter(recipe => {
    const haystack = [recipe.title, recipe.summary, ...(recipe.ingredients || [])].join(" ").toLowerCase();
    const categoryMatch = selectedCategory === "הכול" ||
      (selectedCategory === "מהיר" ? recipe.time <= 20 : recipe.category === selectedCategory);
    return haystack.includes(query) && categoryMatch && (currentView !== "favorites" || favorites.has(recipe.id));
  });
  $("#recipe-grid").innerHTML = recipes.map(recipeCard).join("");
  $("#empty-state").hidden = recipes.length > 0;
  $("#recipe-count").textContent = recipes.length === 1 ? "מתכון אחד" : `${recipes.length} מתכונים`;
}

function openRecipe(id) {
  const recipe = allRecipes().find(item => item.id === id);
  if (!recipe) return;
  const image = recipe.image ? `<img class="detail-image" src="${escapeHTML(recipe.image)}" alt="${escapeHTML(recipe.title)}">` : "";
  $("#recipe-detail").innerHTML = `${image}<div class="detail-content">
    <span class="eyebrow">${escapeHTML(recipe.category)}</span><h1 id="detail-title">${escapeHTML(recipe.title)}</h1>
    <p class="detail-summary">${escapeHTML(recipe.summary)}</p>
    <div class="detail-facts"><span>זמן כולל<b>${recipe.time} דקות</b></span><span>רמת קושי<b>${escapeHTML(recipe.difficulty)}</b></span><span>מצרכים<b>${recipe.ingredients.length} פריטים</b></span></div>
    <div class="detail-columns"><section><h2>מה צריך?</h2><ul class="ingredients">${recipe.ingredients.map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ul></section>
    <section><h2>איך מכינים?</h2><ol class="instructions">${recipe.steps.map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ol>
    ${recipe.notes ? `<div class="detail-note"><strong>טיפ קטן</strong><br>${escapeHTML(recipe.notes)}</div>` : ""}
    ${recipe.video ? `<div class="video-link"><a class="primary-btn" href="${escapeHTML(recipe.video)}" target="_blank" rel="noopener">צפייה בסרטון ההדרכה ↗</a></div>` : ""}
    </section></div></div>`;
  $("#recipe-modal").hidden = false;
  document.body.classList.add("modal-open");
  $("#recipe-modal .close-btn").focus();
}

function closeLayer(selector) {
  $(selector).hidden = true;
  if ($$(".modal-layer:not([hidden]), .drawer-layer:not([hidden])").length === 0) document.body.classList.remove("modal-open");
}

function toggleFavorite(id) {
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  renderRecipes();
  showToast(favorites.has(id) ? "המתכון נוסף לשמורים ♥" : "המתכון הוסר מהשמורים");
}

function addDynamicRow(type, value = "") {
  const isIngredient = type === "ingredient";
  const list = $(isIngredient ? "#ingredients-list" : "#steps-list");
  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.innerHTML = `<span class="row-index"></span>${isIngredient
    ? `<input name="ingredient" maxlength="160" placeholder="למשל: 2 כפות שמן זית" value="${escapeHTML(value)}" aria-label="מצרך">`
    : `<textarea name="step" rows="2" maxlength="400" placeholder="מתארים בקצרה מה עושים בשלב הזה" aria-label="שלב הכנה">${escapeHTML(value)}</textarea>`}
    <button class="remove-row" type="button" aria-label="מחיקת שורה">×</button>`;
  list.append(row);
  updateRowIndexes(list);
}

function updateRowIndexes(list) { $$(".dynamic-row", list).forEach((row, i) => $(".row-index", row).textContent = i + 1); }

function collectDraft() {
  const form = $("#recipe-form");
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.image; delete data.ingredient; delete data.step;
  data.ingredients = $$('[name="ingredient"]', form).map(x => x.value);
  data.steps = $$('[name="step"]', form).map(x => x.value);
  return data;
}

function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const draft = collectDraft();
    const hasContent = draft.title || draft.summary || draft.ingredients.some(Boolean) || draft.steps.some(Boolean);
    if (hasContent) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    $("#draft-note").textContent = "הטיוטה נשמרה עכשיו";
    setTimeout(() => $("#draft-note").textContent = "הטיוטה נשמרת אוטומטית", 1800);
  }, 450);
}

function resetForm(loadDraft = true) {
  const form = $("#recipe-form");
  form.reset(); uploadedImage = "";
  $("#image-preview").hidden = true; $("#upload-copy").hidden = false;
  $("#ingredients-list").innerHTML = ""; $("#steps-list").innerHTML = "";
  const draft = loadDraft ? safeJSON(localStorage.getItem(DRAFT_KEY), null) : null;
  if (draft) {
    for (const [key, value] of Object.entries(draft)) {
      if (!["ingredients", "steps"].includes(key) && form.elements[key]) form.elements[key].value = value;
    }
    (draft.ingredients?.length ? draft.ingredients : [""]).forEach(x => addDynamicRow("ingredient", x));
    (draft.steps?.length ? draft.steps : [""]).forEach(x => addDynamicRow("step", x));
  } else {
    addDynamicRow("ingredient"); addDynamicRow("ingredient"); addDynamicRow("ingredient");
    addDynamicRow("step"); addDynamicRow("step");
  }
}

function openForm() {
  resetForm(true);
  $("#form-drawer").hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => $('[name="title"]', $("#recipe-form")).focus(), 100);
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("יש לבחור קובץ תמונה"));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("התמונה גדולה מדי"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("לא הצלחנו לקרוא את התמונה"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("קובץ התמונה אינו תקין"));
      img.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .78));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

$("#recipe-grid").addEventListener("click", event => {
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favorite); return; }
  const card = event.target.closest(".recipe-card"); if (card) openRecipe(card.dataset.id);
});
$("#recipe-grid").addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && event.target.matches(".recipe-card")) openRecipe(event.target.dataset.id); });
$("#search").addEventListener("input", renderRecipes);
$$('[data-open-form]').forEach(button => button.addEventListener("click", openForm));
$$('[data-close-form]').forEach(button => button.addEventListener("click", () => closeLayer("#form-drawer")));
$$('[data-close-modal]').forEach(button => button.addEventListener("click", () => closeLayer("#recipe-modal")));
$$('[data-category]').forEach(button => button.addEventListener("click", () => {
  selectedCategory = button.dataset.category; $$('[data-category]').forEach(x => x.classList.toggle("active", x === button)); renderRecipes();
}));
$$('[data-view]').forEach(button => button.addEventListener("click", () => {
  currentView = button.dataset.view; $$('[data-view]').forEach(x => x.classList.toggle("active", x === button));
  $("#recipes-title").textContent = currentView === "favorites" ? "המתכונים ששמרת" : "מתכונים שכדאי לנסות";
  renderRecipes(); location.hash = "recipes";
}));
$("[data-add-ingredient]").addEventListener("click", () => { addDynamicRow("ingredient"); saveDraft(); });
$("[data-add-step]").addEventListener("click", () => { addDynamicRow("step"); saveDraft(); });
$("#recipe-form").addEventListener("click", event => {
  const remove = event.target.closest(".remove-row");
  if (!remove) return;
  const list = remove.closest(".dynamic-list");
  if ($$(".dynamic-row", list).length === 1) { $("input,textarea", remove.closest(".dynamic-row")).value = ""; return; }
  remove.closest(".dynamic-row").remove(); updateRowIndexes(list); saveDraft();
});
$("#recipe-form").addEventListener("input", event => { if (event.target.type !== "file") saveDraft(); });
$("#image-input").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    uploadedImage = await resizeImage(file);
    $("#image-preview").src = uploadedImage; $("#image-preview").hidden = false; $("#upload-copy").hidden = true;
  } catch (error) { showToast(error.message); event.target.value = ""; }
});
$("#recipe-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const ingredients = $$('[name="ingredient"]', form).map(x => x.value.trim()).filter(Boolean);
  const steps = $$('[name="step"]', form).map(x => x.value.trim()).filter(Boolean);
  if (!ingredients.length || !steps.length) { showToast("צריך להוסיף לפחות מצרך ושלב הכנה אחד"); return; }
  const recipe = {
    id: `recipe-${Date.now()}`, title: data.get("title").trim(), summary: data.get("summary").trim() || "מתכון ביתי שכדאי לשמור.",
    category: data.get("category"), time: Number(data.get("time")) || 30, difficulty: data.get("difficulty"),
    image: uploadedImage, ingredients, steps, notes: data.get("notes").trim(), video: data.get("video").trim(), createdAt: new Date().toISOString()
  };
  customRecipes.unshift(recipe);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(customRecipes)); }
  catch { customRecipes.shift(); showToast("אין מספיק מקום לשמירת התמונה. נסו תמונה קטנה יותר."); return; }
  localStorage.removeItem(DRAFT_KEY); closeLayer("#form-drawer"); renderRecipes(); showToast("המתכון נוסף בהצלחה! 🎉");
  setTimeout(() => openRecipe(recipe.id), 350);
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!$("#form-drawer").hidden) closeLayer("#form-drawer"); else if (!$("#recipe-modal").hidden) closeLayer("#recipe-modal");
});

renderRecipes();
