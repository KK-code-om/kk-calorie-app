const DEFAULT_SETTINGS = {
  kcal: 1900,
  protein: 130,
  carbs: 190,
  fat: 70,
  water: 2000
};

const STARTER_PRODUCTS = [
  { id: 1001, name: "Banāns", kcal: 89, protein: 1.1, carbs: 23.0, fat: 0.3, favorite: false },
  { id: 1002, name: "Vārīta ola", kcal: 155, protein: 13.0, carbs: 1.1, fat: 11.0, favorite: false },
  { id: 1003, name: "Biezpiens 0.5%", kcal: 72, protein: 17.0, carbs: 3.4, fat: 0.5, favorite: false },
  { id: 1004, name: "Krējums 12%", kcal: 133, protein: 2.7, carbs: 4.0, fat: 12.0, favorite: false },
  { id: 1005, name: "Piens 2.5%", kcal: 52, protein: 3.2, carbs: 4.7, fat: 2.5, favorite: false },
  { id: 1006, name: "Instant oatmeal", kcal: 370, protein: 13.0, carbs: 60.0, fat: 7.0, favorite: false }
];

let currentDate = new Date().toISOString().slice(0, 10);
let currentIngredients = [];

function num(v) {
  return Number(String(v || "0").replace(",", ".").trim()) || 0;
}

function clear(el) {
  if (el) el.textContent = "";
}

function getSettings() {
  return JSON.parse(localStorage.getItem("kk_settings")) || DEFAULT_SETTINGS;
}

function saveSettingsData(s) {
  localStorage.setItem("kk_settings", JSON.stringify(s));
}

function getFoods(date = currentDate) {
  return JSON.parse(localStorage.getItem("foods_" + date)) || [];
}

function saveFoods(foods, date = currentDate) {
  localStorage.setItem("foods_" + date, JSON.stringify(foods));
}

function getProducts() {
  return JSON.parse(localStorage.getItem("kk_products")) || [];
}

function saveProducts(products) {
  localStorage.setItem("kk_products", JSON.stringify(products));
}

function ensureStarterProducts() {
  if (getProducts().length === 0) saveProducts(STARTER_PRODUCTS);
}

function getRecipes() {
  return JSON.parse(localStorage.getItem("kk_recipes")) || [];
}

function saveRecipes(recipes) {
  localStorage.setItem("kk_recipes", JSON.stringify(recipes));
}

function refreshFoodViews() {
  renderOverview();
  renderFoodList();
  renderQuickFoodPicker();
}

function refreshProductViews() {
  renderProducts();
  renderQuickFoodPicker();
  renderRecipes();
}

function showTab(tab) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active-screen"));
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
  document.getElementById(tab).classList.add("active-screen");
  const tabBtn = document.getElementById("tab-" + tab);
  if (tabBtn) tabBtn.classList.add("active");
  if (tab === "overview") renderOverview();
  if (tab === "nutrition") { renderFoodList(); renderProducts(); renderQuickFoodPicker(); }
  if (tab === "products") renderProducts();
  if (tab === "recipes") renderRecipes();
  if (tab === "settings") renderSettings();
}

function changeDay(offset) {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + offset);
  currentDate = d.toISOString().slice(0, 10);
  renderOverview();
  renderFoodList();
}

function setDateFromPicker() {
  currentDate = document.getElementById("datePicker").value;
  renderOverview();
  renderFoodList();
}

function addEntry(entry) {
  const foods = getFoods();
  foods.push({ id: Date.now() + Math.random(), ...entry });
  saveFoods(foods);
  refreshFoodViews();
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
  ["foodName", "kcal", "protein", "carbs", "fat"].forEach(id => document.getElementById(id).value = "");
}

function addProductByGrams(productId, grams, mealType) {
  const p = getProducts().find(x => String(x.id) === String(productId));
  if (!p) return alert("Produkts nav atrasts.");
  const g = num(grams);
  if (!g || g <= 0) return alert("Ievadi gramus.");
  const f = g / 100;
  addEntry({
    name: `${p.name} ${g}g`,
    kcal: Math.round(num(p.kcal) * f),
    protein: +(num(p.protein) * f).toFixed(1),
    carbs: +(num(p.carbs) * f).toFixed(1),
    fat: +(num(p.fat) * f).toFixed(1),
    mealType: mealType || "snack"
  });
  touchRecentFood(productId);
}

function quickAddProduct(productId) {
  addProductByGrams(productId,
    document.getElementById("quickGrams")?.value,
    document.getElementById("quickMeal")?.value);
}

function addPortionFood() {
  addProductByGrams(
    document.getElementById("portionFood").value,
    document.getElementById("portionGrams").value,
    document.getElementById("portionMeal").value
  );
  document.getElementById("portionGrams").value = "";
}

function deleteFood(id) {
  if (!confirm("Dzēst ierakstu?")) return;
  saveFoods(getFoods().filter(f => String(f.id) !== String(id)));
  refreshFoodViews();
}

function resetDay() {
  if (!confirm("Dzēst izvēlēto dienu?")) return;
  localStorage.removeItem("foods_" + currentDate);
  refreshFoodViews();
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
  ["pName", "pKcal", "pProtein", "pCarbs", "pFat"].forEach(id => document.getElementById(id).value = "");
  refreshProductViews();
}

function deleteProduct(id) {
  if (!confirm("Dzēst produktu?")) return;
  saveProducts(getProducts().filter(p => String(p.id) !== String(id)));
  refreshProductViews();
}

function touchRecentFood(productId) {
  const p = getProducts().find(x => String(x.id) === String(productId));
  if (!p) return;
  let recent = JSON.parse(localStorage.getItem("kk_recent_foods")) || [];
  recent = recent.filter(x => String(x.id) !== String(productId));
  recent.unshift({ id: p.id, name: p.name });
  localStorage.setItem("kk_recent_foods", JSON.stringify(recent.slice(0, 12)));
}

function importProductsCSV() {
  const box = document.getElementById("csvImportBox");
  const status = document.getElementById("csvImportStatus");
  function setStatus(msg) { if (status) status.textContent = msg; }
  const raw = box.value.trim();
  if (!raw) return alert("CSV lauks ir tukšs.");
  const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (lines.length < 2) return alert("CSV vajag header + produktus.");
  const header = lines[0].split(",").map(x => x.trim().toLowerCase());
  const idx = {
    name: header.indexOf("name"), kcal: header.indexOf("kcal"),
    protein: header.indexOf("protein"), carbs: header.indexOf("carbs"), fat: header.indexOf("fat")
  };
  if (idx.name < 0 || idx.kcal < 0 || idx.protein < 0 || idx.carbs < 0 || idx.fat < 0)
    return alert("Header jābūt: name,kcal,protein,carbs,fat");
  const products = getProducts();
  let added = 0, updated = 0, skipped = 0;
  lines.slice(1).forEach(line => {
    const c = line.split(",").map(x => x.trim());
    const name = c[idx.name];
    if (!name) { skipped++; return; }
    const item = { name, kcal: num(c[idx.kcal]), protein: num(c[idx.protein]), carbs: num(c[idx.carbs]), fat: num(c[idx.fat]) };
    const found = products.findIndex(p => String(p.name || "").toLowerCase().trim() === name.toLowerCase().trim());
    if (found >= 0) { products[found] = { ...products[found], ...item, favorite: Boolean(products[found].favorite) }; updated++; }
    else { products.push({ id: Date.now() + Math.floor(Math.random() * 10000), ...item, favorite: false }); added++; }
  });
  saveProducts(products);
  box.value = "";
  const msg = `CSV import OK. Pievienoti: ${added}, Atjaunoti: ${updated}, Izlaisti: ${skipped}`;
  setStatus(msg); alert(msg); refreshProductViews();
}

function addIngredient() {
  const id = document.getElementById("rProduct").value;
  const grams = num(document.getElementById("rGrams").value);
  const p = getProducts().find(x => String(x.id) === String(id));
  if (!p || !grams) return alert("Izvēlies produktu un gramus.");
  currentIngredients.push({ productId: p.id, name: p.name, grams });
  document.getElementById("rGrams").value = "";
  renderIngredients();
}

function renderIngredients() {
  const box = document.getElementById("ingredientList");
  if (!box) return;
  clear(box);
  currentIngredients.forEach((ing, index) => {
    const div = document.createElement("div");
    div.className = "quick-item";
    const name = document.createElement("strong");
    name.textContent = ing.name;
    const grams = document.createElement("small");
    grams.textContent = `${ing.grams} g`;
    const btn = document.createElement("button");
    btn.textContent = "Dzēst";
    btn.addEventListener("click", () => removeIngredient(index));
    div.append(name, grams, btn);
    box.appendChild(div);
  });
}

function removeIngredient(index) {
  currentIngredients.splice(index, 1);
  renderIngredients();
}

function calculateRecipeTotals(recipe) {
  const products = getProducts();
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  recipe.ingredients.forEach(ing => {
    const p = products.find(x => String(x.id) === String(ing.productId));
    if (!p) return;
    const f = ing.grams / 100;
    t.kcal += num(p.kcal) * f; t.protein += num(p.protein) * f;
    t.carbs += num(p.carbs) * f; t.fat += num(p.fat) * f;
  });
  return { kcal: Math.round(t.kcal), protein: +t.protein.toFixed(1), carbs: +t.carbs.toFixed(1), fat: +t.fat.toFixed(1) };
}

function saveRecipe() {
  const name = document.getElementById("rName").value.trim();
  const yieldGrams = num(document.getElementById("rYield").value);
  if (!name || !yieldGrams || currentIngredients.length === 0)
    return alert("Vajag nosaukumu, gatavo svaru un sastāvdaļas.");
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
  renderSettings(); renderAnalytics();
}

function saveSettings() {
  const s = {
    kcal: num(document.getElementById("setKcal").value) || DEFAULT_SETTINGS.kcal,
    protein: num(document.getElementById("setProtein").value) || DEFAULT_SETTINGS.protein,
    carbs: num(document.getElementById("setCarbs").value) || DEFAULT_SETTINGS.carbs,
    fat: num(document.getElementById("setFat").value) || DEFAULT_SETTINGS.fat,
    water: num(document.getElementById("setWater").value) || DEFAULT_SETTINGS.water
  };
  saveSettingsData(s);
  alert("Settings saglabāti.");
  renderSettings(); renderOverview();
}

function exportData() {
  const data = {};
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("foods_") || k.startsWith("kk_") || k === "weights") data[k] = localStorage.getItem(k);
  });
  const today = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `kk-calories-${today}.json`;
  a.click(); URL.revokeObjectURL(a.href);
}

function importDataFromFile(event) {
  const file = event.target.files && event.target.files[0];
  const status = document.getElementById("importStatus");
  function setStatus(msg) { if (status) status.textContent = msg; }
  if (!file) { setStatus("Fails nav izvēlēts."); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const keys = Object.keys(data);
      const invalid = keys.filter(k => !(k.startsWith("foods_") || k.startsWith("kk_") || k === "weights"));
      if (invalid.length) { setStatus("Import atteikts: " + invalid.join(", ")); alert("Import atteikts: " + invalid.join(", ")); return; }
      keys.forEach(k => localStorage.setItem(k, data[k]));
      setStatus("Import OK."); alert("Import OK.");
      event.target.value = ""; renderAll();
    } catch (err) { setStatus("Import kļūda."); alert("Import kļūda."); }
  };
  reader.onerror = function() { setStatus("Faila lasīšanas kļūda."); };
  reader.readAsText(file);
}

function exportCSV() {
  const rows = [["date", "meal", "food", "kcal", "protein", "carbs", "fat"]];
  Object.keys(localStorage).filter(k => k.startsWith("foods_")).sort().forEach(k => {
    const date = k.replace("foods_", "");
    const foods = JSON.parse(localStorage.getItem(k)) || [];
    foods.forEach(f => rows.push([date, f.mealType || "", f.name, f.kcal, f.protein, f.carbs, f.fat]));
  });
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "kk-calories.csv"; a.click();
}

/* ===== GAUGE FIX ===== */
function updateGauge(pct) {
  const arc = document.getElementById("gaugeArc");
  if (!arc) return;
  const total = 251.3;
  const offset = total - (total * Math.min(pct, 100) / 100);
  arc.style.strokeDashoffset = offset;
  arc.style.stroke = pct >= 100 ? "#e8533a" : "#e8533a";
}

function renderOverview() {
  const foods = getFoods();
  const s = getSettings();
  const totals = foods.reduce((a, f) => {
    a.kcal += num(f.kcal); a.protein += num(f.protein);
    a.carbs += num(f.carbs); a.fat += num(f.fat); return a;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  document.getElementById("datePicker").value = currentDate;
  document.getElementById("dateLabel").textContent = currentDate;
  document.getElementById("totalKcal").textContent = Math.round(totals.kcal);
  document.getElementById("targetKcal").textContent = s.kcal;
  document.getElementById("remainingKcal").textContent = Math.round(s.kcal - totals.kcal);
  document.getElementById("kcalMini").textContent = Math.round(totals.kcal);
  document.getElementById("proteinMini").textContent = totals.protein.toFixed(1) + " g";
  document.getElementById("carbsMini").textContent = totals.carbs.toFixed(1) + " g";
  document.getElementById("fatMini").textContent = totals.fat.toFixed(1) + " g";

  const pct = Math.round((totals.kcal / s.kcal) * 100);
  updateGauge(pct);

  renderMealSummary();
  renderAnalytics();
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
    const kcal = items.reduce((a, f) => a + num(f.kcal), 0);
    const protein = items.reduce((a, f) => a + num(f.protein), 0);
    const carbs = items.reduce((a, f) => a + num(f.carbs), 0);
    const fat = items.reduce((a, f) => a + num(f.fat), 0);
    const div = document.createElement("div");
    div.className = "meal-row";
    const info = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = names[meal];
    const small = document.createElement("small");
    small.textContent = `P ${protein.toFixed(1)} · O ${carbs.toFixed(1)} · T ${fat.toFixed(1)} g`;
    info.append(title, small);
    const kcalSpan = document.createElement("span");
    kcalSpan.className = "meal-kcal";
    kcalSpan.textContent = Math.round(kcal) + " kcal";
    div.append(info, kcalSpan);
    box.appendChild(div);
  });
  if (!box.children.length) {
    const p = document.createElement("p");
    p.className = "muted-text"; p.textContent = "Nav uztura ierakstu.";
    box.appendChild(p);
  }
}

function renderAnalytics() {
  const s = getSettings();
  let total7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - i);
    total7 += getFoods(d.toISOString().slice(0, 10)).reduce((a, f) => a + num(f.kcal), 0);
  }
  const avg = Math.round(total7 / 7);
  const todayProtein = getFoods().reduce((a, f) => a + num(f.protein), 0);
  document.getElementById("avgKcal7").textContent = avg;
  document.getElementById("proteinCompliance").textContent = Math.round((todayProtein / s.protein) * 100) + "%";
  document.getElementById("deficitCalc").textContent = Math.round(s.kcal - avg);
  const weights = (JSON.parse(localStorage.getItem("weights")) || [])
    .filter(w => w && w.date && num(w.weight)).sort((a, b) => a.date.localeCompare(b.date));
  const trendEl = document.getElementById("weightTrend");
  if (!trendEl) return;
  if (!weights.length) { trendEl.textContent = "—"; return; }
  if (weights.length === 1) { trendEl.textContent = num(weights[0].weight).toFixed(1) + " kg"; return; }
  if (weights.length < 6) {
    const diff = +(num(weights[weights.length-1].weight) - num(weights[0].weight)).toFixed(1);
    trendEl.textContent = (diff > 0.05 ? "↑" : diff < -0.05 ? "↓" : "→") + " " + Math.abs(diff).toFixed(1) + " kg";
    return;
  }
  const last3 = weights.slice(-3), prev3 = weights.slice(-6, -3);
  const aL = last3.reduce((a,w) => a+num(w.weight),0)/3;
  const aP = prev3.reduce((a,w) => a+num(w.weight),0)/3;
  const diff = +(aL - aP).toFixed(1);
  trendEl.textContent = (diff > 0.05 ? "↑" : diff < -0.05 ? "↓" : "→") + " " + Math.abs(diff).toFixed(1) + " kg";
}

function renderFoodList() {
  const box = document.getElementById("foodList");
  if (!box) return;
  const foods = getFoods();
  clear(box);
  if (!foods.length) {
    const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav ierakstu."; box.appendChild(p); return;
  }
  foods.forEach(f => {
    const div = document.createElement("div"); div.className = "food-item";
    const title = document.createElement("strong"); title.textContent = f.name;
    const small = document.createElement("small");
    small.textContent = `${Math.round(num(f.kcal))} kcal · P ${num(f.protein)} · O ${num(f.carbs)} · T ${num(f.fat)}`;
    const btn = document.createElement("button"); btn.textContent = "Dzēst";
    btn.addEventListener("click", () => deleteFood(f.id));
    div.append(title, small, btn); box.appendChild(div);
  });
}

function renderProducts() {
  const products = getProducts();
  const q = String(document.getElementById("productSearch")?.value || "").toLowerCase().trim();
  const filtered = q ? products.filter(p => String(p.name||"").toLowerCase().includes(q)) : products;
  const box = document.getElementById("productList");
  if (box) {
    clear(box);
    if (!filtered.length) {
      const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav produktu."; box.appendChild(p);
    } else {
      filtered.forEach(p => {
        const div = document.createElement("div"); div.className = "food-item";
        const title = document.createElement("strong"); title.textContent = p.name;
        const small = document.createElement("small");
        small.textContent = `${num(p.kcal)} kcal | P:${num(p.protein)} C:${num(p.carbs)} F:${num(p.fat)}`;
        const btn = document.createElement("button"); btn.textContent = "Dzēst";
        btn.addEventListener("click", () => deleteProduct(p.id));
        div.append(title, small, btn); box.appendChild(div);
      });
    }
  }
  const portion = document.getElementById("portionFood");
  if (portion) { clear(portion); products.forEach(p => { const o = document.createElement("option"); o.value = p.id; o.textContent = p.name; portion.appendChild(o); }); }
  const rProduct = document.getElementById("rProduct");
  if (rProduct) { clear(rProduct); products.forEach(p => { const o = document.createElement("option"); o.value = p.id; o.textContent = p.name; rProduct.appendChild(o); }); }
  renderQuickFoodPicker();
}

function renderQuickFoodPicker() {
  const box = document.getElementById("quickFoodList");
  if (!box) return;
  const q = String(document.getElementById("foodSearch")?.value || "").toLowerCase().trim();
  let products = getProducts();
  if (q) products = products.filter(p => String(p.name||"").toLowerCase().includes(q));
  products = products.slice(0, 12);
  clear(box);
  if (!products.length) { const p = document.createElement("p"); p.className = "muted-text"; p.textContent = "Nav atrastu produktu."; box.appendChild(p); return; }
  products.forEach(p => {
    const div = document.createElement("div"); div.className = "quick-item"; div.style.cursor = "pointer";
    const title = document.createElement("strong"); title.textContent = p.name;
    const small = document.createElement("small"); small.textContent = `${num(p.kcal)} kcal / 100g`;
    div.append(title, small);
    div.addEventListener("click", () => quickAddProduct(p.id));
    box.appendChild(div);
  });
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
    const div = document.createElement("div"); div.className = "food-item";
    const title = document.createElement("strong"); title.textContent = r.name;
    const small = document.createElement("small"); small.textContent = `${totals.kcal} kcal · ${r.yieldGrams}g`;
    const btn = document.createElement("button"); btn.textContent = "Dzēst";
    btn.addEventListener("click", () => deleteRecipe(r.id));
    div.append(title, small, btn); box.appendChild(div);
  });
}

function renderSettings() {
  const s = getSettings();
  document.getElementById("setKcal").value = s.kcal;
  document.getElementById("setProtein").value = s.protein;
  document.getElementById("setCarbs").value = s.carbs;
  document.getElementById("setFat").value = s.fat;
  document.getElementById("setWater").value = s.water;
  const weights = JSON.parse(localStorage.getItem("weights")) || [];
  const last = weights[weights.length - 1];
  document.getElementById("lastWeight").textContent = last
    ? `Pēdējais svars: ${last.weight} kg (${last.date})` : "Nav svara ierakstu.";
}

function renderAll() {
  ensureStarterProducts();
  renderOverview();
  renderFoodList();
  renderProducts();
  renderRecipes();
  renderTemplates();
  renderSettings();
}

function render() { renderAll(); }

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js?v=9.4");
}

document.addEventListener("DOMContentLoaded", renderAll);

/* ===== MEAL TEMPLATES ===== */
function getTemplates() { return JSON.parse(localStorage.getItem("kk_meal_templates")) || []; }
function saveTemplates(t) { localStorage.setItem("kk_meal_templates", JSON.stringify(t)); }

function createTemplate() {
  const name = document.getElementById("tmplName").value.trim();
  if (!name) return alert("Ievadi nosaukumu.");
  const foods = getFoods();
  if (!foods.length) return alert("Nav ēdienu, ko saglabāt.");
  const templates = getTemplates();
  templates.push({ id: Date.now(), name, items: foods });
  saveTemplates(templates);
  document.getElementById("tmplName").value = "";
  renderTemplates();
}

function applyTemplate(id) {
  const t = getTemplates().find(x => x.id == id);
  if (!t) return;
  t.items.forEach(item => addEntry({ name: item.name, kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat, mealType: item.mealType }));
}

function deleteTemplate(id) {
  if (!confirm("Dzēst šablonu?")) return;
  saveTemplates(getTemplates().filter(t => t.id != id));
  renderTemplates();
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
    const addBtn = document.createElement("button"); addBtn.textContent = "Pievienot"; addBtn.onclick = () => applyTemplate(t.id);
    const delBtn = document.createElement("button"); delBtn.textContent = "Dzēst"; delBtn.onclick = () => deleteTemplate(t.id);
    div.append(title, addBtn, delBtn); box.appendChild(div);
  });
}

/* ===== BARCODE EAN LOOKUP ===== */
async function lookupBarcode() {
  const code = document.getElementById("barcodeInput").value.trim();
  const status = document.getElementById("barcodeStatus");
  if (!code) { status.textContent = "Ievadi EAN kodu."; return; }
  status.textContent = "Meklē...";
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
    const data = await res.json();
    if (!data.product) { status.textContent = "Produkts nav atrasts."; return; }
    const nutr = data.product.nutriments || {};
    const kcal = nutr["energy-kcal_100g"] || nutr["energy-kcal"] || (nutr["energy_100g"] ? nutr["energy_100g"]/4.184 : 0) || 0;
    document.getElementById("pName").value = data.product.product_name || data.product.product_name_en || "";
    document.getElementById("pKcal").value = Math.round(Number(kcal)||0);
    document.getElementById("pProtein").value = Number(nutr["proteins_100g"]||0).toFixed(1);
    document.getElementById("pCarbs").value = Number(nutr["carbohydrates_100g"]||0).toFixed(1);
    document.getElementById("pFat").value = Number(nutr["fat_100g"]||0).toFixed(1);
    status.textContent = "Atrasts. Pārbaudi un saglabā.";
  } catch (err) { status.textContent = "Kļūda meklēšanā."; }
}
