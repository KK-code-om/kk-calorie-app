const DEFAULT_SETTINGS = { kcal: 1900, protein: 130, carbs: 190, fat: 70, water: 2000 };
const STARTER_PRODUCTS = [
  { id: 1001, name: "Banāns", kcal: 89, protein: 1.1, carbs: 23.0, fat: 0.3, favorite: false },
  { id: 1002, name: "Vārīta ola", kcal: 155, protein: 13.0, carbs: 1.1, fat: 11.0, favorite: false },
  { id: 1003, name: "Biezpiens 0.5%", kcal: 72, protein: 17.0, carbs: 3.4, fat: 0.5, favorite: false },
  { id: 1004, name: "Krējums 12%", kcal: 133, protein: 2.7, carbs: 4.0, fat: 12.0, favorite: false },
  { id: 1005, name: "Piens 2.5%", kcal: 52, protein: 3.2, carbs: 4.7, fat: 2.5, favorite: false },
  { id: 1006, name: "Instant oatmeal", kcal: 370, protein: 13.0, carbs: 60.0, fat: 7.0, favorite: false }
];
const DAY_NAMES = ["Svētdiena","Pirmdiena","Otrdiena","Trešdiena","Ceturtdiena","Piektdiena","Sestdiena"];

let currentDate = new Date().toISOString().slice(0, 10);
let currentIngredients = [];

function num(v) { return Number(String(v || "0").replace(",", ".").trim()) || 0; }
function clear(el) { if (el) el.textContent = ""; }
function getSettings() { return JSON.parse(localStorage.getItem("kk_settings")) || DEFAULT_SETTINGS; }
function saveSettingsData(s) { localStorage.setItem("kk_settings", JSON.stringify(s)); }
function getFoods(date = currentDate) { return JSON.parse(localStorage.getItem("foods_" + date)) || []; }
function saveFoods(foods, date = currentDate) { localStorage.setItem("foods_" + date, JSON.stringify(foods)); }
function getProducts() { return JSON.parse(localStorage.getItem("kk_products")) || []; }
function saveProducts(p) { localStorage.setItem("kk_products", JSON.stringify(p)); }
function ensureStarterProducts() { if (getProducts().length === 0) saveProducts(STARTER_PRODUCTS); }
function getRecipes() { return JSON.parse(localStorage.getItem("kk_recipes")) || []; }
function saveRecipes(r) { localStorage.setItem("kk_recipes", JSON.stringify(r)); }
function getTemplates() { return JSON.parse(localStorage.getItem("kk_meal_templates")) || []; }
function saveTemplates(t) { localStorage.setItem("kk_meal_templates", JSON.stringify(t)); }

function updateDayLabel() {
  const d = new Date(currentDate + "T12:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  let label;
  if (currentDate === today) label = "Šodien — " + DAY_NAMES[d.getDay()];
  else if (currentDate === yesterday) label = "Vakar — " + DAY_NAMES[d.getDay()];
  else if (currentDate === tomorrow) label = "Rīt — " + DAY_NAMES[d.getDay()];
  else label = DAY_NAMES[d.getDay()] + " · " + currentDate;
  const el = document.getElementById("dayName");
  if (el) el.textContent = label;
}

function showTab(tab) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active-screen"));
  document.getElementById(tab).classList.add("active-screen");
  if (tab === "overview") renderOverview();
  if (tab === "nutrition") { renderFoodList(); renderProductDatalist(); }
  if (tab === "products") renderProducts();
  if (tab === "recipes") { renderRecipes(); renderProductDatalist(); }
  if (tab === "recipe-detail") { renderProductDatalist(); }
  if (tab === "analytics") renderAnalytics();
  if (tab === "weight") renderWeight();
  if (tab === "settings") renderSettings();
}

function changeDay(offset) {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + offset);
  currentDate = d.toISOString().slice(0, 10);
  renderOverview(); renderFoodList();
}

function setDateFromPicker() {
  currentDate = document.getElementById("datePicker").value;
  renderOverview(); renderFoodList();
}

function addEntry(entry) {
  const foods = getFoods();
  foods.push({ id: Date.now() + Math.random(), ...entry });
  saveFoods(foods);
  renderOverview(); renderFoodList();
}

function addManualFood() {
  addEntry({
    name: document.getElementById("foodName").value || "Bez nosaukuma",
    kcal: num(document.getElementById("kcal").value),
    protein: num(document.getElementById("protein").value),
    carbs: num(document.getElementById("carbs").value),
    fat: num(document.getElementById("fat").value),
    mealType: "snack"
  });
  ["foodName","kcal","protein","carbs","fat"].forEach(id => document.getElementById(id).value = "");
}

function addPortionFood() {
  const searchVal = (document.getElementById("portionFoodSearch")?.value || "").trim();
  const grams = document.getElementById("portionGrams").value;
  const meal = document.getElementById("portionMeal").value;
  const p = getProducts().find(x => x.name.toLowerCase() === searchVal.toLowerCase());
  if (!p) return alert("Produkts nav atrasts. Pārbaudi nosaukumu vai pievieno DB.");
  const g = num(grams);
  if (!g || g <= 0) return alert("Ievadi gramus.");
  const f = g / 100;
  addEntry({
    name: `${p.name} ${g}g`,
    kcal: Math.round(num(p.kcal) * f),
    protein: +(num(p.protein) * f).toFixed(1),
    carbs: +(num(p.carbs) * f).toFixed(1),
    fat: +(num(p.fat) * f).toFixed(1),
    mealType: meal || "snack"
  });
  document.getElementById("portionFoodSearch").value = "";
  document.getElementById("portionGrams").value = "";
}

function deleteFood(id) {
  if (!confirm("Dzēst ierakstu?")) return;
  saveFoods(getFoods().filter(f => String(f.id) !== String(id)));
  renderOverview(); renderFoodList();
}

function resetDay() {
  if (!confirm("Dzēst izvēlēto dienu?")) return;
  localStorage.removeItem("foods_" + currentDate);
  renderOverview(); renderFoodList();
}

function saveProduct() {
  const name = document.getElementById("pName").value.trim();
  if (!name) return alert("Ievadi nosaukumu.");
  const products = getProducts();
  products.push({
    id: Date.now(), name,
    kcal: num(document.getElementById("pKcal").value),
    protein: num(document.getElementById("pProtein").value),
    carbs: num(document.getElementById("pCarbs").value),
    fat: num(document.getElementById("pFat").value),
    favorite: false
  });
  saveProducts(products);
  ["pName","pKcal","pProtein","pCarbs","pFat"].forEach(id => document.getElementById(id).value = "");
  renderProducts();
  renderProductDatalist();
}

function deleteProduct(id) {
  if (!confirm("Dzēst produktu?")) return;
  saveProducts(getProducts().filter(p => String(p.id) !== String(id)));
  renderProducts();
  renderProductDatalist();
}

/* ===== CUSTOM FOOD PICKER ===== */
let pickerProducts = [];

function renderProductDatalist() {
  pickerProducts = getProducts();
  // Pre-populate both dropdowns empty (shown on focus/type)
  ["portionDropdown","rDropdown"].forEach(id => {
    const dd = document.getElementById(id);
    if (dd) dd.innerHTML = "";
  });
}

function pickerOpen(dropdownId) {
  const input = dropdownId === "portionDropdown"
    ? document.getElementById("portionFoodSearch")
    : document.getElementById("rProductSearch");
  pickerFilter(input.id, dropdownId);
}

function pickerFilter(inputId, dropdownId) {
  const input = document.getElementById(inputId);
  const dd = document.getElementById(dropdownId);
  if (!input || !dd) return;

  const q = input.value.toLowerCase().trim();
  const products = getProducts();
  const filtered = q
    ? products.filter(p => p.name.toLowerCase().includes(q))
    : products.slice(0, 30);

  dd.innerHTML = "";

  if (!filtered.length) {
    dd.classList.remove("open");
    return;
  }

  filtered.forEach(p => {
    const item = document.createElement("div");
    item.className = "picker-item";
    item.innerHTML = `${p.name}<small>${num(p.kcal)} kcal / 100g · P ${num(p.protein)} · O ${num(p.carbs)} · T ${num(p.fat)}</small>`;
    item.addEventListener("mousedown", e => {
      e.preventDefault();
      input.value = p.name;
      dd.classList.remove("open");
    });
    item.addEventListener("touchstart", e => {
      e.preventDefault();
      input.value = p.name;
      dd.classList.remove("open");
    }, { passive: false });
    dd.appendChild(item);
  });

  dd.classList.add("open");
}

function pickerClose(dropdownId) {
  const dd = document.getElementById(dropdownId);
  if (dd) dd.classList.remove("open");
}

// Close dropdowns on outside click/touch
document.addEventListener("click", e => {
  ["portionDropdown","rDropdown"].forEach(id => {
    const dd = document.getElementById(id);
    if (dd && !dd.contains(e.target) && e.target.id !== "portionFoodSearch" && e.target.id !== "rProductSearch") {
      dd.classList.remove("open");
    }
  });
});

function importProductsCSV() {
  const box = document.getElementById("csvImportBox");
  const status = document.getElementById("csvImportStatus");
  function setStatus(msg) { if (status) status.textContent = msg; }
  const raw = box.value.trim();
  if (!raw) return alert("CSV lauks ir tukšs.");
  const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (lines.length < 2) return alert("CSV vajag header + produktus.");
  const header = lines[0].split(",").map(x => x.trim().toLowerCase());
  const idx = { name: header.indexOf("name"), kcal: header.indexOf("kcal"), protein: header.indexOf("protein"), carbs: header.indexOf("carbs"), fat: header.indexOf("fat") };
  if (idx.name < 0 || idx.kcal < 0) return alert("Header jābūt: name,kcal,protein,carbs,fat");
  const products = getProducts();
  let added = 0, updated = 0, skipped = 0;
  lines.slice(1).forEach(line => {
    const c = line.split(",").map(x => x.trim());
    const name = c[idx.name];
    if (!name) { skipped++; return; }
    const item = { name, kcal: num(c[idx.kcal]), protein: num(c[idx.protein]), carbs: num(c[idx.carbs]), fat: num(c[idx.fat]) };
    const found = products.findIndex(p => String(p.name||"").toLowerCase().trim() === name.toLowerCase().trim());
    if (found >= 0) { products[found] = { ...products[found], ...item }; updated++; }
    else { products.push({ id: Date.now() + Math.floor(Math.random()*10000), ...item, favorite: false }); added++; }
  });
  saveProducts(products);
  box.value = "";
  const msg = `CSV OK. Pievienoti: ${added}, Atjaunoti: ${updated}, Izlaisti: ${skipped}`;
  setStatus(msg); alert(msg);
  renderProducts(); renderProductDatalist();
}

function addIngredient() {
  const searchVal = (document.getElementById("rProductSearch")?.value || "").trim();
  const grams = num(document.getElementById("rGrams").value);
  const p = getProducts().find(x => x.name.toLowerCase() === searchVal.toLowerCase());
  if (!p || !grams) return alert("Izvēlies produktu no saraksta un ievadi gramus.");
  currentIngredients.push({ productId: p.id, name: p.name, grams });
  document.getElementById("rGrams").value = "";
  document.getElementById("rProductSearch").value = "";
  renderIngredients();
}

function renderIngredients() {
  const box = document.getElementById("ingredientList");
  if (!box) return;
  clear(box);
  currentIngredients.forEach((ing, index) => {
    const div = document.createElement("div"); div.className = "quick-item";
    const name = document.createElement("strong"); name.textContent = ing.name;
    const g = document.createElement("small"); g.textContent = ing.grams + " g";
    const btn = document.createElement("button"); btn.textContent = "Dzēst";
    btn.addEventListener("click", () => { currentIngredients.splice(index, 1); renderIngredients(); });
    div.append(name, g, btn); box.appendChild(div);
  });
}

function calculateRecipeTotals(recipe) {
  const products = getProducts();
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  recipe.ingredients.forEach(ing => {
    const p = products.find(x => String(x.id) === String(ing.productId));
    if (!p) return;
    const f = ing.grams / 100;
    t.kcal += num(p.kcal)*f; t.protein += num(p.protein)*f; t.carbs += num(p.carbs)*f; t.fat += num(p.fat)*f;
  });
  return { kcal: Math.round(t.kcal), protein: +t.protein.toFixed(1), carbs: +t.carbs.toFixed(1), fat: +t.fat.toFixed(1) };
}

function saveRecipe() {
  const name = document.getElementById("rName").value.trim();
  const yieldGrams = num(document.getElementById("rYield").value);
  if (!name || !yieldGrams || currentIngredients.length === 0) return alert("Vajag nosaukumu, gatavo svaru un sastāvdaļas.");
  const recipes = getRecipes();
  recipes.push({ id: Date.now(), name, yieldGrams, ingredients: currentIngredients });
  saveRecipes(recipes);
  currentIngredients = [];
  document.getElementById("rName").value = "";
  document.getElementById("rYield").value = "";
  renderRecipes();
}

function deleteRecipe(id) {
  if (!confirm("Dzēst recepti?")) return;
  saveRecipes(getRecipes().filter(r => String(r.id) !== String(id)));
  renderRecipes();
}

function addRecipePortion() {
  const id = document.getElementById("recipeSelectToday").value;
  const grams = num(document.getElementById("recipeConsumedGrams").value);
  const meal = document.getElementById("recipeMealToday")?.value || "dinner";
  const r = getRecipes().find(x => String(x.id) === String(id));
  if (!r || !grams) return alert("Izvēlies recepti un gramus.");
  const totals = calculateRecipeTotals(r);
  const f = grams / r.yieldGrams;
  addEntry({
    name: `${r.name} ${grams}g`,
    kcal: Math.round(totals.kcal * f),
    protein: +(totals.protein * f).toFixed(1),
    carbs: +(totals.carbs * f).toFixed(1),
    fat: +(totals.fat * f).toFixed(1),
    mealType: meal
  });
  document.getElementById("recipeConsumedGrams").value = "";
}

function saveWeight() {
  const weight = num(document.getElementById("weightInput").value);
  if (!weight) return;
  let weights = JSON.parse(localStorage.getItem("weights")) || [];
  weights = weights.filter(w => w.date !== currentDate);
  weights.push({ date: currentDate, weight });
  weights.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem("weights", JSON.stringify(weights));
  document.getElementById("weightInput").value = "";
  renderWeight(); renderAnalytics();
}

function saveSettings() {
  const s = {
    kcal: num(document.getElementById("setKcal").value) || DEFAULT_SETTINGS.kcal,
    protein: num(document.getElementById("setProtein").value) || DEFAULT_SETTINGS.protein,
    carbs: num(document.getElementById("setCarbs").value) || DEFAULT_SETTINGS.carbs,
    fat: num(document.getElementById("setFat").value) || DEFAULT_SETTINGS.fat,
    water: num(document.getElementById("setWater").value) || DEFAULT_SETTINGS.water
  };
  saveSettingsData(s); alert("Saglabāts."); renderSettings(); renderOverview();
}

function exportData() {
  const data = {};
  Object.keys(localStorage).forEach(k => { if (k.startsWith("foods_") || k.startsWith("kk_") || k === "weights") data[k] = localStorage.getItem(k); });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `kk-calories-${new Date().toISOString().slice(0,10)}.json`; a.click();
}

function importDataFromFile(event) {
  const file = event.target.files && event.target.files[0];
  const status = document.getElementById("importStatus");
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const invalid = Object.keys(data).filter(k => !(k.startsWith("foods_") || k.startsWith("kk_") || k === "weights"));
      if (invalid.length) { alert("Import atteikts: " + invalid.join(", ")); return; }
      Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
      if (status) status.textContent = "Import OK."; alert("Import OK."); event.target.value = ""; renderAll();
    } catch { alert("Import kļūda."); }
  };
  reader.readAsText(file);
}

function exportCSV() {
  const rows = [["date","meal","food","kcal","protein","carbs","fat"]];
  Object.keys(localStorage).filter(k => k.startsWith("foods_")).sort().forEach(k => {
    const date = k.replace("foods_", "");
    (JSON.parse(localStorage.getItem(k))||[]).forEach(f => rows.push([date, f.mealType||"", f.name, f.kcal, f.protein, f.carbs, f.fat]));
  });
  const blob = new Blob([rows.map(r=>r.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kk-calories.csv"; a.click();
}

function updateGauge(pct) {
  const arc = document.getElementById("gaugeArc");
  if (!arc) return;
  arc.style.strokeDashoffset = 251.3 - (251.3 * Math.min(pct, 100) / 100);
}

function renderOverview() {
  const foods = getFoods();
  const s = getSettings();
  const totals = foods.reduce((a, f) => { a.kcal+=num(f.kcal); a.protein+=num(f.protein); a.carbs+=num(f.carbs); a.fat+=num(f.fat); return a; }, {kcal:0,protein:0,carbs:0,fat:0});
  updateDayLabel();
  document.getElementById("datePicker").value = currentDate;
  document.getElementById("dateLabel").textContent = currentDate;
  document.getElementById("totalKcal").textContent = Math.round(totals.kcal);
  document.getElementById("targetKcal").textContent = s.kcal;
  document.getElementById("remainingKcal").textContent = Math.round(s.kcal - totals.kcal);
  document.getElementById("kcalMini").textContent = Math.round(totals.kcal);
  document.getElementById("proteinMini").textContent = totals.protein.toFixed(1) + " g";
  document.getElementById("carbsMini").textContent = totals.carbs.toFixed(1) + " g";
  document.getElementById("fatMini").textContent = totals.fat.toFixed(1) + " g";
  updateGauge(Math.round((totals.kcal / s.kcal) * 100));
  renderMealSummary();
}

function renderMealSummary() {
  const box = document.getElementById("mealSummary");
  if (!box) return;
  const foods = getFoods();
  const names = { breakfast: "🍳 Brokastis", lunch: "🥗 Pusdienas", dinner: "🍽 Vakariņas", snack: "🍎 Uzkodas" };
  clear(box);
  Object.keys(names).forEach(meal => {
    const items = foods.filter(f => f.mealType === meal);
    if (!items.length) return;
    const kcal = items.reduce((a,f) => a+num(f.kcal), 0);
    const protein = items.reduce((a,f) => a+num(f.protein), 0);
    const carbs = items.reduce((a,f) => a+num(f.carbs), 0);
    const fat = items.reduce((a,f) => a+num(f.fat), 0);
    const div = document.createElement("div"); div.className = "meal-row";
    const info = document.createElement("div");
    const title = document.createElement("b"); title.textContent = names[meal];
    const small = document.createElement("small"); small.textContent = `P ${protein.toFixed(1)} · O ${carbs.toFixed(1)} · T ${fat.toFixed(1)} g`;
    info.append(title, small);
    const kcalSpan = document.createElement("span"); kcalSpan.className = "meal-kcal"; kcalSpan.textContent = Math.round(kcal) + " kcal";
    div.append(info, kcalSpan); box.appendChild(div);
  });
  if (!box.children.length) { const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav uztura ierakstu."; box.appendChild(p); }
}

function renderAnalytics() {
  const s = getSettings();
  let total7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentDate); d.setDate(d.getDate() - i);
    total7 += getFoods(d.toISOString().slice(0,10)).reduce((a,f) => a+num(f.kcal), 0);
  }
  const avg = Math.round(total7 / 7);
  const todayProtein = getFoods().reduce((a,f) => a+num(f.protein), 0);
  const el7 = document.getElementById("avgKcal7"); if (el7) el7.textContent = avg;
  const elP = document.getElementById("proteinCompliance"); if (elP) elP.textContent = Math.round((todayProtein/s.protein)*100) + "%";
  const elD = document.getElementById("deficitCalc"); if (elD) elD.textContent = Math.round(s.kcal - avg);
  const weights = (JSON.parse(localStorage.getItem("weights"))||[]).filter(w=>w&&w.date&&num(w.weight)).sort((a,b)=>a.date.localeCompare(b.date));
  const trendEl = document.getElementById("weightTrend");
  if (trendEl) {
    if (!weights.length) { trendEl.textContent = "—"; }
    else if (weights.length === 1) { trendEl.textContent = num(weights[0].weight).toFixed(1) + " kg"; }
    else if (weights.length < 6) {
      const diff = +(num(weights[weights.length-1].weight) - num(weights[0].weight)).toFixed(1);
      trendEl.textContent = (diff > 0.05 ? "↑" : diff < -0.05 ? "↓" : "→") + " " + Math.abs(diff).toFixed(1) + " kg";
    } else {
      const aL = weights.slice(-3).reduce((a,w)=>a+num(w.weight),0)/3;
      const aP = weights.slice(-6,-3).reduce((a,w)=>a+num(w.weight),0)/3;
      const diff = +(aL-aP).toFixed(1);
      trendEl.textContent = (diff > 0.05 ? "↑" : diff < -0.05 ? "↓" : "→") + " " + Math.abs(diff).toFixed(1) + " kg";
    }
  }
  const weekBox = document.getElementById("weeklyList");
  if (weekBox) {
    clear(weekBox);
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentDate); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      const kcal = getFoods(key).reduce((a,f) => a+num(f.kcal), 0);
      const row = document.createElement("div"); row.className = "weekly-row";
      const label = document.createElement("span"); label.textContent = i === 0 ? "Šodien" : DAY_NAMES[d.getDay()] + " " + key.slice(5);
      const val = document.createElement("b"); val.textContent = Math.round(kcal) + " kcal";
      row.append(label, val); weekBox.appendChild(row);
    }
  }
}

function renderFoodList() {
  const box = document.getElementById("foodList");
  if (!box) return;
  const foods = getFoods();
  clear(box);
  if (!foods.length) { const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav ierakstu."; box.appendChild(p); return; }
  foods.forEach(f => {
    const div = document.createElement("div"); div.className = "food-item";
    const info = document.createElement("div");
    const title = document.createElement("strong"); title.textContent = f.name;
    const small = document.createElement("small"); small.textContent = `${Math.round(num(f.kcal))} kcal · P ${num(f.protein)} · O ${num(f.carbs)} · T ${num(f.fat)}`;
    info.append(title, small);
    const btn = document.createElement("button"); btn.textContent = "Dzēst"; btn.addEventListener("click", () => deleteFood(f.id));
    div.append(info, btn); box.appendChild(div);
  });
}

function renderProducts() {
  const products = getProducts();
  const q = String(document.getElementById("productSearch")?.value || "").toLowerCase().trim();
  const filtered = q ? products.filter(p => String(p.name||"").toLowerCase().includes(q)) : products;
  const box = document.getElementById("productList");
  if (box) {
    clear(box);
    if (!filtered.length) { const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav produktu."; box.appendChild(p); }
    else filtered.forEach(p => {
      const div = document.createElement("div"); div.className = "food-item";
      const info = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = p.name;
      const small = document.createElement("small"); small.textContent = `${num(p.kcal)} kcal | P:${num(p.protein)} C:${num(p.carbs)} F:${num(p.fat)}`;
      info.append(title, small);
      const btn = document.createElement("button"); btn.textContent = "Dzēst"; btn.addEventListener("click", () => deleteProduct(p.id));
      div.append(info, btn); box.appendChild(div);
    });
  }
  renderProductDatalist();
}

function renderRecipes() {
  renderIngredients();
  const recipes = getRecipes();
  const select = document.getElementById("recipeSelectToday");
  if (select) { clear(select); recipes.forEach(r => { const o = document.createElement("option"); o.value = r.id; o.textContent = r.name; select.appendChild(o); }); }
  const box = document.getElementById("recipeList");
  if (!box) return;
  clear(box);
  if (!recipes.length) { const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav recepšu."; box.appendChild(p); return; }
  recipes.forEach(r => {
    const totals = calculateRecipeTotals(r);
    const div = document.createElement("div"); div.className = "food-item"; div.style.cursor = "pointer";
    const info = document.createElement("div"); info.style.flex = "1";
    const title = document.createElement("strong"); title.textContent = r.name;
    const small = document.createElement("small"); small.textContent = `${totals.kcal} kcal · ${r.yieldGrams}g · ${r.ingredients.length} sast.`;
    info.append(title, small);
    info.addEventListener("click", () => openRecipeDetail(r.id));
    const btnWrap = document.createElement("div"); btnWrap.style.display = "flex"; btnWrap.style.gap = "6px";
    const editBtn = document.createElement("button"); editBtn.textContent = "✏️"; editBtn.style.cssText = "background:#f0ede8;color:#1a1a1a;padding:7px 10px;font-size:14px;border-radius:10px;";
    editBtn.addEventListener("click", (e) => { e.stopPropagation(); openRecipeDetail(r.id); });
    const delBtn = document.createElement("button"); delBtn.textContent = "Dzēst"; delBtn.addEventListener("click", (e) => { e.stopPropagation(); deleteRecipe(r.id); });
    btnWrap.append(editBtn, delBtn);
    div.append(info, btnWrap); box.appendChild(div);
  });
}

function renderWeight() {
  const weights = JSON.parse(localStorage.getItem("weights")) || [];
  const last = weights[weights.length - 1];
  const lw = document.getElementById("lastWeight");
  if (lw) lw.textContent = last ? `Pēdējais: ${last.weight} kg (${last.date})` : "Nav ierakstu.";
  const box = document.getElementById("weightHistory");
  if (!box) return;
  clear(box);
  if (!weights.length) { const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav svara ierakstu."; box.appendChild(p); return; }
  [...weights].reverse().slice(0, 20).forEach(w => {
    const row = document.createElement("div"); row.className = "weight-row";
    const d = new Date(w.date + "T12:00:00");
    const label = document.createElement("span"); label.textContent = DAY_NAMES[d.getDay()] + " " + w.date;
    const val = document.createElement("b"); val.textContent = w.weight + " kg";
    row.append(label, val); box.appendChild(row);
  });
}

function renderSettings() {
  const s = getSettings();
  document.getElementById("setKcal").value = s.kcal;
  document.getElementById("setProtein").value = s.protein;
  document.getElementById("setCarbs").value = s.carbs;
  document.getElementById("setFat").value = s.fat;
  document.getElementById("setWater").value = s.water;
}

function renderTemplates() {
  const box = document.getElementById("templateList");
  if (!box) return;
  const templates = getTemplates();
  box.innerHTML = "";
  if (!templates.length) { box.innerHTML = '<p class="muted-text">Nav šablonu.</p>'; return; }
  templates.forEach(t => {
    const div = document.createElement("div"); div.className = "quick-item";
    const title = document.createElement("strong"); title.textContent = t.name;
    const addBtn = document.createElement("button"); addBtn.textContent = "Pievienot"; addBtn.onclick = () => {
      t.items.forEach(item => addEntry({ name:item.name, kcal:item.kcal, protein:item.protein, carbs:item.carbs, fat:item.fat, mealType:item.mealType }));
    };
    const delBtn = document.createElement("button"); delBtn.textContent = "Dzēst"; delBtn.onclick = () => {
      if (!confirm("Dzēst?")) return;
      saveTemplates(getTemplates().filter(x => x.id != t.id)); renderTemplates();
    };
    div.append(title, addBtn, delBtn); box.appendChild(div);
  });
}

function createTemplate() {
  const name = document.getElementById("tmplName").value.trim();
  if (!name) return alert("Ievadi nosaukumu.");
  const foods = getFoods();
  if (!foods.length) return alert("Nav ēdienu.");
  const templates = getTemplates();
  templates.push({ id: Date.now(), name, items: foods });
  saveTemplates(templates);
  document.getElementById("tmplName").value = "";
  renderTemplates();
}

async function lookupBarcode() {
  const code = document.getElementById("barcodeInput").value.trim();
  const status = document.getElementById("barcodeStatus");
  if (!code) { status.textContent = "Ievadi EAN kodu."; return; }
  status.textContent = "Meklē...";
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
    const data = await res.json();
    if (!data.product) { status.textContent = "Nav atrasts."; return; }
    const nutr = data.product.nutriments || {};
    const kcal = nutr["energy-kcal_100g"] || nutr["energy-kcal"] || (nutr["energy_100g"] ? nutr["energy_100g"]/4.184 : 0) || 0;
    document.getElementById("pName").value = data.product.product_name || data.product.product_name_en || "";
    document.getElementById("pKcal").value = Math.round(Number(kcal)||0);
    document.getElementById("pProtein").value = Number(nutr["proteins_100g"]||0).toFixed(1);
    document.getElementById("pCarbs").value = Number(nutr["carbohydrates_100g"]||0).toFixed(1);
    document.getElementById("pFat").value = Number(nutr["fat_100g"]||0).toFixed(1);
    status.textContent = "Atrasts. Pārbaudi un saglabā.";
  } catch { status.textContent = "Kļūda."; }
}


/* ===== RECIPE DETAIL & EDIT ===== */
let rdRecipeId = null;
let rdIngredients = [];

function openRecipeDetail(id) {
  const r = getRecipes().find(x => String(x.id) === String(id));
  if (!r) return;
  rdRecipeId = id;
  rdIngredients = r.ingredients.map(i => ({ ...i }));

  document.getElementById("rdTitle").textContent = r.name;
  document.getElementById("rdName").value = r.name;
  document.getElementById("rdYield").value = r.yieldGrams;

  renderRdSummary(r);
  renderRdIngredients();
  renderRdIngredientEdit();
  showTab("recipe-detail");
}

function renderRdSummary(r) {
  const box = document.getElementById("rdSummary");
  if (!box) return;
  const totals = calculateRecipeTotals(r);
  box.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><b style="font-size:22px">${totals.kcal}</b><br><small style="color:#aaa">kcal kopā</small></div>
      <div><b style="font-size:22px">${r.yieldGrams}g</b><br><small style="color:#aaa">gatavais svars</small></div>
      <div><b style="font-size:18px">P ${totals.protein}g</b><br><small style="color:#aaa">proteīns</small></div>
      <div><b style="font-size:18px">O ${totals.carbs}g · T ${totals.fat}g</b><br><small style="color:#aaa">ogļhidr. · tauki</small></div>
    </div>`;
}

function renderRdIngredients() {
  const box = document.getElementById("rdIngredients");
  if (!box) return;
  box.innerHTML = "";
  const products = getProducts();
  rdIngredients.forEach(ing => {
    const p = products.find(x => String(x.id) === String(ing.productId));
    const kcal = p ? Math.round(num(p.kcal) * ing.grams / 100) : 0;
    const row = document.createElement("div"); row.className = "meal-row";
    const info = document.createElement("div");
    const title = document.createElement("b"); title.textContent = ing.name;
    const small = document.createElement("small"); small.textContent = `${ing.grams}g · ${kcal} kcal`;
    info.append(title, small);
    row.append(info);
    box.appendChild(row);
  });
  if (!rdIngredients.length) box.innerHTML = '<p class="muted-text">Nav sastāvdaļu.</p>';
}

function renderRdIngredientEdit() {
  const box = document.getElementById("rdIngredientEdit");
  if (!box) return;
  box.innerHTML = "";
  rdIngredients.forEach((ing, index) => {
    const div = document.createElement("div"); div.className = "quick-item";
    const name = document.createElement("strong"); name.textContent = ing.name;
    const gramsInput = document.createElement("input");
    gramsInput.type = "number"; gramsInput.value = ing.grams;
    gramsInput.style.cssText = "width:70px;background:#f8f7f4;border:none;border-radius:8px;padding:6px 8px;font-size:14px;";
    gramsInput.addEventListener("change", () => { rdIngredients[index].grams = num(gramsInput.value); renderRdIngredients(); });
    const btn = document.createElement("button"); btn.textContent = "Dzēst";
    btn.style.cssText = "background:#ffe5e0;color:#e8533a;padding:7px 10px;font-size:12px;border-radius:10px;";
    btn.addEventListener("click", () => { rdIngredients.splice(index, 1); renderRdIngredients(); renderRdIngredientEdit(); });
    div.append(name, gramsInput, btn);
    box.appendChild(div);
  });
}

function rdAddIngredient() {
  const searchVal = (document.getElementById("rdProductSearch")?.value || "").trim();
  const grams = num(document.getElementById("rdGrams").value);
  const p = getProducts().find(x => x.name.toLowerCase() === searchVal.toLowerCase());
  if (!p || !grams) return alert("Izvēlies produktu un ievadi gramus.");
  rdIngredients.push({ productId: p.id, name: p.name, grams });
  document.getElementById("rdProductSearch").value = "";
  document.getElementById("rdGrams").value = "";
  renderRdIngredients();
  renderRdIngredientEdit();
}

function rdSaveRecipe() {
  const name = document.getElementById("rdName").value.trim();
  const yieldGrams = num(document.getElementById("rdYield").value);
  if (!name || !yieldGrams) return alert("Vajag nosaukumu un gatavo svaru.");
  if (!rdIngredients.length) return alert("Vajag vismaz vienu sastāvdaļu.");
  const recipes = getRecipes();
  const idx = recipes.findIndex(r => String(r.id) === String(rdRecipeId));
  if (idx < 0) return alert("Recepte nav atrasta.");
  recipes[idx] = { ...recipes[idx], name, yieldGrams, ingredients: rdIngredients };
  saveRecipes(recipes);
  alert("Recepte saglabāta.");
  showTab("recipes");
}
/* ===== END RECIPE DETAIL ===== */

function renderAll() {
  ensureStarterProducts();
  renderOverview();
  renderFoodList();
  renderProducts();
  renderProductDatalist();
  renderRecipes();
  renderTemplates();
  renderSettings();
}

function render() { renderAll(); }

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js?v=9.8");
}

document.addEventListener("DOMContentLoaded", renderAll);
