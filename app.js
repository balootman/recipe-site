const STARTER_RECIPES = [
  {
    id: "starter-chicken-soy",
    title: "חזה עוף רך ב־10 דקות", author: "המתכונים שלי",
    summary: "עסיסי, מהיר וטעים גם למחרת במיקרו — ברוטב סויה, שום ותבלינים.",
    category: "עיקריות", time: 10, difficulty: "קל", tags: ["מהיר", "עוף", "מחבת"], image: "assets/chicken-soy.png",
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
    title: "חזה עוף, בטטה וערמונים בסיר אחד", author: "המתכונים שלי",
    summary: "ארוחה ביתית קלה בסיר אחד, עם בטטה, ערמונים ורוטב מתקתק.",
    category: "עיקריות", time: 45, difficulty: "קל", tags: ["עוף", "סיר אחד", "ארוחת ערב"], image: "assets/chicken-sweet-potato.png",
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
const AUTHOR_KEY = "bamitbach-author-v1";
const EDIT_TOKENS_KEY = "bamitbach-edit-tokens-v1";
const CONFIG = window.RECIPE_APP_CONFIG || {};
const SHARED_ENABLED = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
const API_BASE = (CONFIG.supabaseUrl || "").replace(/\/$/, "");
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const safeJSON = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
function safeExternalUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
function safeImageUrl(value) {
  if (/^assets\/[a-z0-9._/-]+$/i.test(value || "")) return value;
  return safeExternalUrl(value);
}

let customRecipes = SHARED_ENABLED ? [] : safeJSON(localStorage.getItem(STORAGE_KEY), []);
let favorites = new Set(safeJSON(localStorage.getItem(FAVORITES_KEY), []));
let selectedCategory = "הכול";
let selectedTag = "";
let currentView = "all";
let uploadedImage = "";
let editingRecipeId = null;
let editingOriginalImage = "";
let editTokens = safeJSON(localStorage.getItem(EDIT_TOKENS_KEY), {});
let saveTimer;
const allRecipes = () => [...customRecipes, ...STARTER_RECIPES];
const createEditToken = () => `${crypto.randomUUID()}${crypto.randomUUID()}`;
function saveEditToken(recipeId, token) {
  editTokens[recipeId] = token;
  localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(editTokens));
}
function removeEditToken(recipeId) {
  delete editTokens[recipeId];
  localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(editTokens));
}


function setSyncStatus(message, isError = false) {
  const status = $("#sync-status");
  status.textContent = message;
  status.style.color = isError ? "#a52d32" : "";
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      apikey: CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Shared database request failed (${response.status}): ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function normalizeSharedRecipe(row) {
  return {
    id: row.id, title: row.title, author: row.author_name || "אנונימי", summary: row.summary || "מתכון ביתי שכדאי לשמור.",
    category: row.category || "אחר", time: row.time_minutes || 30,
    difficulty: row.difficulty || "קל", image: row.image_url || "",
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    steps: Array.isArray(row.steps) ? row.steps : [], tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes || "", video: row.video_url || "", createdAt: row.created_at
  };
}

let syncInProgress = false;

async function migrateLocalRecipes() {
  let pending = safeJSON(localStorage.getItem(STORAGE_KEY), []);
  if (!pending.length) return 0;
  let migrated = 0;
  setSyncStatus(`מעבירים ${pending.length} מתכונים מהמכשיר לענן…`);
  for (const recipe of [...pending]) {
    const candidate = { ...recipe, author: recipe.author || localStorage.getItem(AUTHOR_KEY) || "אורח", tags: recipe.tags || [] };
    if (candidate.image?.startsWith("data:")) candidate.image = await uploadSharedImage(candidate.image);
    const token = createEditToken();
    const saved = await createSharedRecipe(candidate, token);
    saveEditToken(saved.id, token);
    pending = pending.filter(item => item.id !== recipe.id);
    pending.length ? localStorage.setItem(STORAGE_KEY, JSON.stringify(pending)) : localStorage.removeItem(STORAGE_KEY);
    migrated += 1;
  }
  return migrated;
}

async function loadSharedRecipes({ quiet = false } = {}) {
  if (!SHARED_ENABLED) {
    setSyncStatus("מצב מקומי — המתכונים נשמרים רק במכשיר הזה.", true);
    renderTagFilters(); renderRecipes(); return;
  }
  if (syncInProgress) return;
  syncInProgress = true;
  if (!quiet) setSyncStatus("טוענים מתכונים משותפים…");
  try {
    const migrated = await migrateLocalRecipes();
    const rows = await supabaseRequest("/rest/v1/recipes?select=*&order=created_at.desc&limit=200");
    customRecipes = rows.map(normalizeSharedRecipe);
    setSyncStatus(migrated ? `${migrated} מתכונים מהמכשיר הועברו ושמורים לכולם.` : "מסונכרן לכל המכשירים");
    renderTagFilters(); renderRecipes();
  } catch (error) {
    console.error(error); setSyncStatus("לא הצלחנו להסתנכרן. בדקו את החיבור ונסו לרענן.", true);
    renderTagFilters(); renderRecipes();
  } finally { syncInProgress = false; }
}

async function uploadSharedImage(dataUrl) {
  if (!dataUrl) return "";
  const blob = await fetch(dataUrl).then(response => response.blob());
  const fileName = `${Date.now()}-${crypto.randomUUID()}.jpg`;
  await supabaseRequest(`/storage/v1/object/recipe-images/${fileName}`, {
    method: "POST", headers: { "Content-Type": "image/jpeg", "x-upsert": "false" }, body: blob
  });
  return `${API_BASE}/storage/v1/object/public/recipe-images/${fileName}`;
}

function recipeRpcPayload(recipe) {
  return {
    p_author_name: recipe.author, p_title: recipe.title, p_summary: recipe.summary,
    p_category: recipe.category, p_time_minutes: recipe.time,
    p_difficulty: recipe.difficulty, p_image_url: recipe.image,
    p_ingredients: recipe.ingredients, p_steps: recipe.steps, p_tags: recipe.tags,
    p_notes: recipe.notes, p_video_url: recipe.video || null
  };
}

async function createSharedRecipe(recipe, token) {
  const rows = await supabaseRequest("/rest/v1/rpc/create_recipe", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...recipeRpcPayload(recipe), p_edit_token: token })
  });
  return normalizeSharedRecipe(rows[0]);
}

async function updateSharedRecipe(recipe, token) {
  const rows = await supabaseRequest("/rest/v1/rpc/update_recipe", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...recipeRpcPayload(recipe), p_id: recipe.id, p_edit_token: token })
  });
  return normalizeSharedRecipe(rows[0]);
}

async function deleteSharedRecipe(id, token) {
  return supabaseRequest("/rest/v1/rpc/delete_recipe", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_id: id, p_edit_token: token })
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function recipeCard(recipe) {
  const saved = favorites.has(recipe.id);
  const tagList = (recipe.tags || []).slice(0, 3).map(tag => `<span class="recipe-tag">${escapeHTML(tag)}</span>`).join("");
  const imageUrl = safeImageUrl(recipe.image);
  const image = imageUrl
    ? `<img class="card-image" src="${escapeHTML(imageUrl)}" alt="${escapeHTML(recipe.title)}" loading="lazy">`
    : `<div class="card-placeholder" aria-hidden="true">🍲</div>`;
  return `<article class="recipe-card" data-id="${escapeHTML(recipe.id)}" tabindex="0" aria-label="פתיחת המתכון ${escapeHTML(recipe.title)}">
    <button class="favorite-btn ${saved ? "saved" : ""}" data-favorite="${escapeHTML(recipe.id)}" aria-label="${saved ? "הסרה מהשמורים" : "שמירת המתכון"}" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button>
    ${image}
    <div class="card-body">
      <div class="card-meta"><span>${escapeHTML(recipe.category)}</span><span>•</span><span>${recipe.time} דקות</span></div>
      <h3>${escapeHTML(recipe.title)}</h3>${tagList ? `<div class="recipe-tags">${tagList}</div>` : ""}<p>${escapeHTML(recipe.summary || "מתכון ביתי שכדאי לשמור.")}</p>
      <div class="card-bottom"><span>מאת <strong>${escapeHTML(recipe.author || "אנונימי")}</strong></span><b>למתכון ←</b></div>
    </div>
  </article>`;
}

function renderRecipes() {
  const query = $("#search").value.trim().toLowerCase();
  let recipes = allRecipes().filter(recipe => {
    const haystack = [recipe.title, recipe.summary, ...(recipe.ingredients || []), ...(recipe.tags || [])].join(" ").toLowerCase();
    const categoryMatch = selectedCategory === "הכול" ||
      (selectedCategory === "מהיר" ? recipe.time <= 20 : recipe.category === selectedCategory);
    const tagMatch = !selectedTag || (recipe.tags || []).includes(selectedTag);
    return haystack.includes(query) && categoryMatch && tagMatch && (currentView !== "favorites" || favorites.has(recipe.id));
  });
  $("#recipe-grid").innerHTML = recipes.map(recipeCard).join("");
  $("#empty-state").hidden = recipes.length > 0;
  $("#recipe-count").textContent = recipes.length === 1 ? "מתכון אחד" : `${recipes.length} מתכונים`;
}

function renderTagFilters() {
  const tags = [...new Set(allRecipes().flatMap(recipe => recipe.tags || []))].sort((a, b) => a.localeCompare(b, "he"));
  $("#tag-filters").innerHTML = tags.length ? `<button class="tag-chip ${!selectedTag ? "active" : ""}" data-tag="">כל התגיות</button>${tags.map(tag => `<button class="tag-chip ${selectedTag === tag ? "active" : ""}" data-tag="${escapeHTML(tag)}">#${escapeHTML(tag)}</button>`).join("")}` : "";
}

function openRecipe(id) {
  const recipe = allRecipes().find(item => item.id === id);
  if (!recipe) return;
  const imageUrl = safeImageUrl(recipe.image);
  const image = imageUrl ? `<img class="detail-image" src="${escapeHTML(imageUrl)}" alt="${escapeHTML(recipe.title)}">` : "";
  const detailTags = (recipe.tags || []).map(tag => `<span class="detail-tag">#${escapeHTML(tag)}</span>`).join("");
  const canManage = Boolean(editTokens[recipe.id]);
  const manageActions = canManage ? `<div class="recipe-actions"><button class="secondary-btn" data-edit-recipe="${escapeHTML(recipe.id)}">עריכת המתכון</button><button class="danger-btn" data-delete-recipe="${escapeHTML(recipe.id)}">מחיקה</button></div>` : "";
  $("#recipe-detail").innerHTML = `${image}<div class="detail-content">
    <span class="eyebrow">${escapeHTML(recipe.category)}</span><h1 id="detail-title">${escapeHTML(recipe.title)}</h1>
    <p class="detail-author">מתכון של <strong>${escapeHTML(recipe.author || "אנונימי")}</strong></p>
    <p class="detail-summary">${escapeHTML(recipe.summary)}</p>${detailTags ? `<div class="detail-tags">${detailTags}</div>` : ""}${manageActions}
    <div class="detail-facts"><span>זמן כולל<b>${recipe.time} דקות</b></span><span>רמת קושי<b>${escapeHTML(recipe.difficulty)}</b></span><span>מצרכים<b>${recipe.ingredients.length} פריטים</b></span></div>
    <div class="detail-columns"><section><h2>מה צריך?</h2><ul class="ingredients">${recipe.ingredients.map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ul></section>
    <section><h2>איך מכינים?</h2><ol class="instructions">${recipe.steps.map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ol>
    ${recipe.notes ? `<div class="detail-note"><strong>טיפ קטן</strong><br>${escapeHTML(recipe.notes)}</div>` : ""}
    ${safeExternalUrl(recipe.video) ? `<div class="video-link"><a class="primary-btn" href="${escapeHTML(safeExternalUrl(recipe.video))}" target="_blank" rel="noopener noreferrer">צפייה בסרטון ההדרכה ↗</a></div>` : ""}
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
  if (editingRecipeId) return;
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
  editingRecipeId = null; editingOriginalImage = "";
  resetForm(true);
  const form = $("#recipe-form");
  if (!form.elements.author.value) form.elements.author.value = localStorage.getItem(AUTHOR_KEY) || "";
  $("#form-title").textContent = "מתכון חדש";
  $(".submit-btn", form).textContent = "שמירת המתכון";
  $("#form-drawer").hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => form.elements.title.focus(), 100);
}

function openEditForm(id) {
  const recipe = allRecipes().find(item => item.id === id);
  if (!recipe || !editTokens[id]) return;
  editingRecipeId = id; editingOriginalImage = recipe.image || "";
  resetForm(false);
  const form = $("#recipe-form");
  form.elements.author.value = recipe.author || ""; form.elements.title.value = recipe.title;
  form.elements.summary.value = recipe.summary || ""; form.elements.tags.value = (recipe.tags || []).join(", ");
  form.elements.category.value = recipe.category; form.elements.time.value = recipe.time;
  form.elements.difficulty.value = recipe.difficulty; form.elements.notes.value = recipe.notes || "";
  form.elements.video.value = recipe.video || "";
  $("#ingredients-list").innerHTML = ""; recipe.ingredients.forEach(value => addDynamicRow("ingredient", value));
  $("#steps-list").innerHTML = ""; recipe.steps.forEach(value => addDynamicRow("step", value));
  if (recipe.image) { $("#image-preview").src = recipe.image; $("#image-preview").hidden = false; $("#upload-copy").hidden = true; }
  if (recipe.notes || recipe.video) $(".optional-fields").open = true;
  $("#form-title").textContent = "עריכת מתכון"; $(".submit-btn", form).textContent = "שמירת שינויים";
  closeLayer("#recipe-modal"); $("#form-drawer").hidden = false; document.body.classList.add("modal-open");
  setTimeout(() => form.elements.title.focus(), 100);
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("יש לבחור קובץ תמונה"));
    if (file.size > 3 * 1024 * 1024) return reject(new Error("התמונה גדולה מדי — אפשר להעלות עד 3MB"));
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
$("#tag-filters").addEventListener("click", event => {
  const button = event.target.closest("[data-tag]"); if (!button) return;
  selectedTag = button.dataset.tag; renderTagFilters(); renderRecipes();
});
$$('[data-open-form]').forEach(button => button.addEventListener("click", openForm));
$$('[data-close-form]').forEach(button => button.addEventListener("click", () => closeLayer("#form-drawer")));
$$('[data-close-modal]').forEach(button => button.addEventListener("click", () => closeLayer("#recipe-modal")));
$$('[data-category]').forEach(button => button.addEventListener("click", () => {
  selectedCategory = button.dataset.category; $$('[data-category]').forEach(x => x.classList.toggle("active", x === button)); renderRecipes();
}));
$$('[data-view]').forEach(button => button.addEventListener("click", () => {
  currentView = button.dataset.view; $$('[data-view]').forEach(x => x.classList.toggle("active", x === button));
  $("#recipes-title").textContent = currentView === "favorites" ? "המתכונים ששמרת" : "כל המתכונים";
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
$("#recipe-detail").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit-recipe]");
  if (editButton) { openEditForm(editButton.dataset.editRecipe); return; }
  const deleteButton = event.target.closest("[data-delete-recipe]");
  if (!deleteButton) return;
  const id = deleteButton.dataset.deleteRecipe;
  if (!confirm("למחוק את המתכון? אי אפשר לבטל את הפעולה.")) return;
  deleteButton.disabled = true; deleteButton.textContent = "מוחקים…";
  try {
    if (SHARED_ENABLED) await deleteSharedRecipe(id, editTokens[id]);
    customRecipes = customRecipes.filter(item => item.id !== id);
    if (!SHARED_ENABLED) localStorage.setItem(STORAGE_KEY, JSON.stringify(customRecipes));
    removeEditToken(id); closeLayer("#recipe-modal"); renderTagFilters(); renderRecipes(); showToast("המתכון נמחק");
  } catch (error) { console.error(error); showToast("לא הצלחנו למחוק את המתכון"); deleteButton.disabled = false; deleteButton.textContent = "מחיקה"; }
});
$("#recipe-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const ingredients = $$('[name="ingredient"]', form).map(x => x.value.trim()).filter(Boolean);
  const steps = $$('[name="step"]', form).map(x => x.value.trim()).filter(Boolean);
  if (!ingredients.length || !steps.length) { showToast("צריך להוסיף לפחות מצרך ושלב הכנה אחד"); return; }
  const recipe = {
    id: editingRecipeId || `recipe-${Date.now()}`, author: data.get("author").trim(), title: data.get("title").trim(), summary: data.get("summary").trim() || "מתכון ביתי שכדאי לשמור.",
    category: data.get("category"), time: Number(data.get("time")) || 30, difficulty: data.get("difficulty"),
    image: uploadedImage, ingredients, steps,
    tags: [...new Set((data.get("tags") || "").split(/[,#]/).map(tag => tag.trim()).filter(Boolean))].slice(0, 8),
    notes: data.get("notes").trim(), video: data.get("video").trim(), createdAt: new Date().toISOString()
  };
  const submit = $(".submit-btn", form); submit.disabled = true; submit.textContent = "שומרים…";
  try {
    let savedRecipe = recipe;
    const sharedSave = SHARED_ENABLED;
    const isEditing = Boolean(editingRecipeId);
    if (isEditing) {
      savedRecipe.image = uploadedImage ? (SHARED_ENABLED ? await uploadSharedImage(uploadedImage) : uploadedImage) : editingOriginalImage;
      if (SHARED_ENABLED) savedRecipe = await updateSharedRecipe(savedRecipe, editTokens[editingRecipeId]);
      customRecipes = customRecipes.map(item => item.id === editingRecipeId ? savedRecipe : item);
    } else {
      const token = createEditToken();
      if (SHARED_ENABLED) {
        setSyncStatus("שומרים את המתכון לכולם…");
        savedRecipe.image = await uploadSharedImage(uploadedImage);
        savedRecipe = await createSharedRecipe(savedRecipe, token);
      }
      saveEditToken(savedRecipe.id, token);
      customRecipes.unshift(savedRecipe);
    }
    if (!SHARED_ENABLED) localStorage.setItem(STORAGE_KEY, JSON.stringify(customRecipes));
    localStorage.setItem(AUTHOR_KEY, recipe.author); localStorage.removeItem(DRAFT_KEY);
    editingRecipeId = null; editingOriginalImage = ""; setSyncStatus(SHARED_ENABLED ? "מסונכרן לכל המכשירים" : "מצב מקומי", !SHARED_ENABLED);
    closeLayer("#form-drawer"); renderTagFilters(); renderRecipes();
    showToast(isEditing ? "השינויים נשמרו" : (sharedSave ? "המתכון נוסף וגלוי לכולם! 🎉" : "המתכון נשמר רק במכשיר הזה"));
    setTimeout(() => openRecipe(savedRecipe.id), 350);
  } catch (error) {
    console.error(error); setSyncStatus("שמירת המתכון נכשלה. נסו שוב.", true); showToast("לא הצלחנו לשמור את המתכון");
  } finally { submit.disabled = false; submit.textContent = "שמירת המתכון"; }
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!$("#form-drawer").hidden) closeLayer("#form-drawer"); else if (!$("#recipe-modal").hidden) closeLayer("#recipe-modal");
});

loadSharedRecipes();
window.addEventListener("focus", () => loadSharedRecipes({ quiet: true }));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") loadSharedRecipes({ quiet: true });
});
setInterval(() => loadSharedRecipes({ quiet: true }), 60000);
