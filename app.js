const DEFAULT_SETTINGS = {
  kcal: 1900,
  protein: 130,
  carbs: 190,
  fat: 70,
  water: 2000
};

let currentDate = new Date().toISOString().slice(0, 10);
let currentIngredients = [];

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
  const saved = localStorage.getItem("kk_products");
  return saved ? JSON.parse(saved) : [];
}

function saveProducts(products) {
  localStorage.setItem("kk_products", JSON.stringify(products));
}

function getRecipes() {
  return JSON.parse(localStorage.getItem("kk_recipes")) || [];
}

function saveRecipes(recipes) {
  localStorage.setItem("kk_recipes", JSON.stringify(recipes));
}

function showTab(tab) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active-screen"));
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));

  document.getElementById(tab).classList.add("active-screen");
  document.getElementById("tab-" + tab).classList.add("active");

  render();
}

function changeDay(offset) {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + offset);
  currentDate = d.toISOString().slice(0, 10);
  render();
}

function setDateFromPicker() {
  currentDate = document.getElementById("datePicker").value;
  render();
}

function addEntry(entry) {
  const foods = getFoods();
  foods.push({ id: Date.now() + Math.random(), ...entry });
  saveFoods(foods);
  render();
}

function addManualFood() {
  addEntry({
    name: document.getElementById("foodName").value || "Bez nosaukuma",
    kcal: Number(document.getElementById("kcal").value) || 0,
    protein: Number(document.getElementById("protein").value) || 0,
    carbs: Number(document.getElementById("carbs").value) || 0,
    fat: Number(document.getElementById("fat").value) || 0,
    mealType: "snack"
  });

  ["foodName", "kcal", "protein", "carbs", "fat"].forEach(id => document.getElementById(id).value = "");
}

function addPortionFood() {
  const id = document.getElementById("portionFood").value;
  const grams = Number(document.getElementById("portionGrams").value);
  const meal = document.getElementById("portionMeal").value;
  const p = getProducts().find(x => String(x.id) === String(id));

  if (!p || !grams) return alert("Izvēlies produktu un ievadi gramus.");

  const f = grams / 100;

  addEntry({
    name: `${p.name} ${grams}g`,
    kcal: Math.round(p.kcal * f),
    protein: +(p.protein * f).toFixed(1),
    carbs: +(p.carbs * f).toFixed(1),
    fat: +(p.fat * f).toFixed(1),
    mealType: meal
  });

  document.getElementById("portionGrams").value = "";
}

function deleteFood(id) {
  if (!confirm("Dzēst ierakstu?")) return;
  saveFoods(getFoods().filter(f => String(f.id) !== String(id)));
  render();
}

function resetDay() {
  if (!confirm("Dzēst izvēlēto dienu?")) return;
  localStorage.removeItem("foods_" + currentDate);
  render();
}

function saveProduct() {
  const name = document.getElementById("pName").value;
  if (!name) return alert("Ievadi nosaukumu.");

  const products = getProducts();

  products.push({
    id: Date.now(),
    name,
    kcal: Number(document.getElementById("pKcal").value) || 0,
    protein: Number(document.getElementById("pProtein").value) || 0,
    carbs: Number(document.getElementById("pCarbs").value) || 0,
    fat: Number(document.getElementById("pFat").value) || 0
  });

  saveProducts(products);

  ["pName", "pKcal", "pProtein", "pCarbs", "pFat"].forEach(id => document.getElementById(id).value = "");
  render();
}

function deleteProduct(id) {
  if (!confirm("Dzēst produktu?")) return;
  saveProducts(getProducts().filter(p => String(p.id) !== String(id)));
  render();
}

function addIngredient() {
  const id = document.getElementById("rProduct").value;
  const grams = Number(document.getElementById("rGrams").value);
  const p = getProducts().find(x => String(x.id) === String(id));

  if (!p || !grams) return alert("Izvēlies produktu un gramus.");

  currentIngredients.push({ productId: p.id, name: p.name, grams });
  document.getElementById("rGrams").value = "";
  renderIngredients();
}

function renderIngredients() {
  const box = document.getElementById("ingredientList");
  if (!box) return;

  box.innerHTML = "";

  currentIngredients.forEach((ing, index) => {
    const div = document.createElement("div");
    div.className = "quick-item";
    div.innerHTML = `
      <strong>${ing.name}</strong>
      <small>${ing.grams} g</small>
      <button onclick="removeIngredient(${index})">Dzēst</button>
    `;
    box.appendChild(div);
  });
}

function removeIngredient(index) {
  currentIngredients.splice(index, 1);
  renderIngredients();
}

function calculateRecipeTotals(recipe) {
  const products = getProducts();
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  recipe.ingredients.forEach(ing => {
    const p = products.find(x => String(x.id) === String(ing.productId));
    if (!p) return;

    const f = ing.grams / 100;
    totals.kcal += p.kcal * f;
    totals.protein += p.protein * f;
    totals.carbs += p.carbs * f;
    totals.fat += p.fat * f;
  });

  return {
    kcal: Math.round(totals.kcal),
    protein: +totals.protein.toFixed(1),
    carbs: +totals.carbs.toFixed(1),
    fat: +totals.fat.toFixed(1)
  };
}

function saveRecipe() {
  const name = document.getElementById("rName").value;
  const yieldGrams = Number(document.getElementById("rYield").value);

  if (!name || !yieldGrams || currentIngredients.length === 0) {
    return alert("Vajag nosaukumu, gatavo svaru un sastāvdaļas.");
  }

  const recipes = getRecipes();

  recipes.push({
    id: Date.now(),
    name,
    yieldGrams,
    ingredients: currentIngredients
  });

  saveRecipes(recipes);
  currentIngredients = [];

  document.getElementById("rName").value = "";
  document.getElementById("rYield").value = "";
  render();
}

function deleteRecipe(id) {
  if (!confirm("Dzēst recepti?")) return;
  saveRecipes(getRecipes().filter(r => String(r.id) !== String(id)));
  render();
}

function addRecipePortion() {
  const id = document.getElementById("recipeSelectToday").value;
  const grams = Number(document.getElementById("recipeConsumedGrams").value);
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
    mealType: "dinner"
  });

  document.getElementById("recipeConsumedGrams").value = "";
}

function saveWeight() {
  const weight = Number(document.getElementById("weightInput").value);
  if (!weight) return;

  let weights = JSON.parse(localStorage.getItem("weights")) || [];
  weights = weights.filter(w => w.date !== currentDate);
  weights.push({ date: currentDate, weight });
  weights.sort((a, b) => a.date.localeCompare(b.date));

  localStorage.setItem("weights", JSON.stringify(weights));
  document.getElementById("weightInput").value = "";
  render();
}

function saveSettings() {
  const s = {
    kcal: Number(document.getElementById("setKcal").value) || DEFAULT_SETTINGS.kcal,
    protein: Number(document.getElementById("setProtein").value) || DEFAULT_SETTINGS.protein,
    carbs: Number(document.getElementById("setCarbs").value) || DEFAULT_SETTINGS.carbs,
    fat: Number(document.getElementById("setFat").value) || DEFAULT_SETTINGS.fat,
    water: Number(document.getElementById("setWater").value) || DEFAULT_SETTINGS.water
  };

  saveSettingsData(s);
  alert("Settings saglabāti.");
  render();
}

function exportData() {
  const data = {};

  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("foods_") || k.startsWith("kk_") || k === "weights") {
      data[k] = localStorage.getItem(k);
    }
  });

  document.getElementById("backupBox").value = JSON.stringify(data, null, 2);
}

function importData() {
  try {
    const data = JSON.parse(document.getElementById("backupBox").value);
    Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
    alert("Import OK.");
    render();
  } catch {
    alert("Import kļūda.");
  }
}

function exportCSV() {
  const rows = [["date", "meal", "food", "kcal", "protein", "carbs", "fat"]];

  Object.keys(localStorage)
    .filter(k => k.startsWith("foods_"))
    .sort()
    .forEach(k => {
      const date = k.replace("foods_", "");
      const foods = JSON.parse(localStorage.getItem(k)) || [];
      foods.forEach(f => {
        rows.push([
          date,
          f.mealType || "",
          f.name || "",
          f.kcal || 0,
          f.protein || 0,
          f.carbs || 0,
          f.fat || 0
        ]);
      });
    });

  document.getElementById("backupBox").value = rows.map(r => r.join(",")).join("\n");
}

function getTotals(date = currentDate) {
  return getFoods(date).reduce((a, f) => {
    a.kcal += Number(f.kcal) || 0;
    a.protein += Number(f.protein) || 0;
    a.carbs += Number(f.carbs) || 0;
    a.fat += Number(f.fat) || 0;
    return a;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

function percent(v, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((v / target) * 100));
}

function getLast7Dates() {
  const dates = [];
  const base = new Date(currentDate);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates;
}

function renderOverview() {
  const s = getSettings();
  const t = getTotals();

  document.getElementById("datePicker").value = currentDate;
  document.getElementById("dateLabel").textContent = currentDate;

  document.getElementById("totalKcal").textContent = Math.round(t.kcal);
  document.getElementById("targetKcal").textContent = s.kcal;
  document.getElementById("remainingKcal").textContent = Math.round(s.kcal - t.kcal);

  document.querySelector(".gauge").style.setProperty("--p", percent(t.kcal, s.kcal) + "%");

  document.getElementById("kcalMini").textContent = Math.round(t.kcal);
  document.getElementById("proteinMini").textContent = t.protein.toFixed(1) + " g";
  document.getElementById("carbsMini").textContent = t.carbs.toFixed(1) + " g";
  document.getElementById("fatMini").textContent = t.fat.toFixed(1) + " g";

  renderMealSummary();
  renderAnalytics();
}

function renderMealSummary() {
  const meals = [
    ["breakfast", "Brokastis"],
    ["lunch", "Pusdienas"],
    ["dinner", "Vakariņas"],
    ["snack", "Uzkodas"]
  ];

  const foods = getFoods();
  const box = document.getElementById("mealSummary");
  box.innerHTML = "";

  meals.forEach(([key, label]) => {
    const kcal = foods
      .filter(f => f.mealType === key)
      .reduce((a, f) => a + (Number(f.kcal) || 0), 0);

    const div = document.createElement("div");
    div.className = "meal-box";
    div.innerHTML = `
      <div>
        <b>${label}</b>
        <small>${foods.filter(f => f.mealType === key).length} ieraksti</small>
      </div>
      <strong>${Math.round(kcal)} kcal</strong>
    `;
    box.appendChild(div);
  });
}

function renderAnalytics() {
  const s = getSettings();
  const dates = getLast7Dates();
  const totals = dates.map(d => getTotals(d));

  const kcalDays = totals.map(t => t.kcal);
  const avg = kcalDays.reduce((a, b) => a + b, 0) / 7;

  const proteinOkDays = totals.filter(t => t.protein >= s.protein).length;
  const compliance = Math.round((proteinOkDays / 7) * 100);

  const deficit = Math.round(s.kcal - avg);

  const weights = JSON.parse(localStorage.getItem("weights")) || [];
  const lastWeights = weights.slice(-7);

  let trend = "—";
  if (lastWeights.length >= 2) {
    const diff = +(lastWeights[lastWeights.length - 1].weight - lastWeights[0].weight).toFixed(1);
    trend = diff > 0 ? `+${diff} kg` : `${diff} kg`;
  }

  document.getElementById("avgKcal7").textContent = Math.round(avg);
  document.getElementById("proteinCompliance").textContent = compliance + "%";
  document.getElementById("deficitCalc").textContent = deficit;
  document.getElementById("weightTrend").textContent = trend;
}

function renderFoodList() {
  const list = document.getElementById("foodList");
  if (!list) return;

  const foods = getFoods();
  list.innerHTML = "";

  if (!foods.length) {
    list.innerHTML = "<p>Nav ierakstu.</p>";
    return;
  }

  foods.forEach(f => {
    const div = document.createElement("div");
    div.className = "food-item";
    div.innerHTML = `
      <strong>${f.name}</strong>
      <small>${f.mealType || ""}</small>
      <small>${f.kcal} kcal | P ${f.protein} | C ${f.carbs} | F ${f.fat}</small>
      <button onclick="deleteFood('${f.id}')">Dzēst</button>
    `;
    list.appendChild(div);
  });
}

function renderProducts() {
  const products = getProducts();

  ["portionFood", "rProduct"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;

    sel.innerHTML = "";

    products.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  });

  const list = document.getElementById("productList");
  if (!list) return;

  list.innerHTML = "";

  if (!products.length) {
    list.innerHTML = "<p>Produktu DB ir tukša.</p>";
    return;
  }

  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "quick-item";
    div.innerHTML = `
      <strong>${p.name}</strong>
      <small>100g: ${p.kcal} kcal | P ${p.protein} | C ${p.carbs} | F ${p.fat}</small>
      <button onclick="deleteProduct('${p.id}')">Dzēst</button>
    `;
    list.appendChild(div);
  });
}

function renderRecipes() {
  const recipes = getRecipes();

  const select = document.getElementById("recipeSelectToday");
  if (select) {
    select.innerHTML = "";
    recipes.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      select.appendChild(opt);
    });
  }

  const list = document.getElementById("recipeList");
  if (!list) return;

  list.innerHTML = "";

  if (!recipes.length) {
    list.innerHTML = "<p>Nav recepšu.</p>";
    return;
  }

  recipes.forEach(r => {
    const t = calculateRecipeTotals(r);
    const per100 = r.yieldGrams ? {
      kcal: Math.round(t.kcal / r.yieldGrams * 100),
      protein: +(t.protein / r.yieldGrams * 100).toFixed(1),
      carbs: +(t.carbs / r.yieldGrams * 100).toFixed(1),
      fat: +(t.fat / r.yieldGrams * 100).toFixed(1)
    } : t;

    const div = document.createElement("div");
    div.className = "quick-item";
    div.innerHTML = `
      <strong>${r.name}</strong>
      <small>Kopā: ${t.kcal} kcal | ${r.yieldGrams} g</small>
      <small>100g: ${per100.kcal} kcal | P ${per100.protein} | C ${per100.carbs} | F ${per100.fat}</small>
      <button onclick="deleteRecipe('${r.id}')">Dzēst</button>
    `;
    list.appendChild(div);
  });

  renderIngredients();
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
    ? `Pēdējais svars: ${last.weight} kg (${last.date})`
    : "Nav svara ierakstu.";
}

function render() {
  renderOverview();
  renderFoodList();
  renderProducts();
  renderRecipes();
  renderSettings();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js?v=6-final.3");
}

render();


/* ===== KK CALORIE APP V5: SEARCH + FAVORITES + RECENT ===== */

let showFavoritesOnly = false;
let showProductFavoritesOnly = false;

function normalizeText(v) {
  return String(v || "").toLowerCase().trim();
}

function getRecentFoods() {
  return JSON.parse(localStorage.getItem("kk_recent_foods")) || [];
}

function saveRecentFoods(items) {
  localStorage.setItem("kk_recent_foods", JSON.stringify(items.slice(0, 12)));
}

function touchRecentFood(productId) {
  const p = getProducts().find(x => String(x.id) === String(productId));
  if (!p) return;

  let items = getRecentFoods().filter(x => String(x.id) !== String(productId));
  items.unshift({
    id: p.id,
    name: p.name,
    kcal: p.kcal,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat
  });

  saveRecentFoods(items);
}

function toggleFavorite(productId) {
  const products = getProducts().map(p => {
    if (String(p.id) === String(productId)) {
      return { ...p, favorite: !Boolean(p.favorite) };
    }
    return { ...p, favorite: Boolean(p.favorite) };
  });

  saveProducts(products);
  render();
}

function toggleFavoritesFilter() {
  showFavoritesOnly = !showFavoritesOnly;
  renderQuickFoodPicker();
}

function toggleProductFavoritesFilter() {
  showProductFavoritesOnly = !showProductFavoritesOnly;
  renderProducts();
}

function clearFoodSearch() {
  const el = document.getElementById("foodSearch");
  if (el) el.value = "";
  showFavoritesOnly = false;
  renderQuickFoodPicker();
}

function clearProductSearch() {
  const el = document.getElementById("productSearch");
  if (el) el.value = "";
  showProductFavoritesOnly = false;
  renderProducts();
}

function getFilteredProductsForQuick() {
  const q = normalizeText(document.getElementById("foodSearch")?.value);
  let products = getProducts().map(p => ({ ...p, favorite: Boolean(p.favorite) }));

  if (showFavoritesOnly) {
    products = products.filter(p => p.favorite);
  }

  if (q) {
    products = products.filter(p => normalizeText(p.name).includes(q));
  }

  products.sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return normalizeText(a.name).localeCompare(normalizeText(b.name));
  });

  return products;
}

function getFilteredProductsForDb() {
  const q = normalizeText(document.getElementById("productSearch")?.value);
  let products = getProducts().map(p => ({ ...p, favorite: Boolean(p.favorite) }));

  if (showProductFavoritesOnly) {
    products = products.filter(p => p.favorite);
  }

  if (q) {
    products = products.filter(p => normalizeText(p.name).includes(q));
  }

  products.sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return normalizeText(a.name).localeCompare(normalizeText(b.name));
  });

  return products;
}

function quickAddProduct(productId, grams = null) {
  const p = getProducts().find(x => String(x.id) === String(productId));
  if (!p) return alert("Produkts nav atrasts.");

  const input = prompt("Grami:", grams || "100");
  const g = Number(String(input || "").replace(",", "."));
  if (!g || g <= 0) return;

  const meal = document.getElementById("portionMeal")?.value || "snack";
  const f = g / 100;

  addEntry({
    name: `${p.name} ${g}g`,
    kcal: Math.round(Number(p.kcal || 0) * f),
    protein: +(Number(p.protein || 0) * f).toFixed(1),
    carbs: +(Number(p.carbs || 0) * f).toFixed(1),
    fat: +(Number(p.fat || 0) * f).toFixed(1),
    mealType: meal
  });

  touchRecentFood(productId);
}

function renderRecentFoods() {
  const box = document.getElementById("recentFoodsBox");
  if (!box) return;

  const items = getRecentFoods();
  if (!items.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="recent-title">Nesen lietotie</div>
    <div class="recent-row">
      ${items.slice(0, 6).map(p => `
        <button type="button" class="chip" onclick="quickAddProduct(${JSON.stringify(p.id)})">${p.name}</button>
      `).join("")}
    </div>
  `;
}

function renderQuickFoodPicker() {
  const box = document.getElementById("quickFoodPicker");
  const favBtn = document.getElementById("favFilterBtn");
  if (!box) return;

  if (favBtn) {
    favBtn.classList.toggle("active-filter", showFavoritesOnly);
  }

  renderRecentFoods();

  const products = getFilteredProductsForQuick().slice(0, 30);

  if (!products.length) {
    box.innerHTML = `<p class="muted">Nav atrastu produktu.</p>`;
    return;
  }

  box.innerHTML = products.map(p => `
    <div class="product-row">
      <button type="button" class="favorite-star" onclick="toggleFavorite(${JSON.stringify(p.id)})">
        ${p.favorite ? "⭐" : "☆"}
      </button>
      <button type="button" class="product-main-btn" onclick="quickAddProduct(${JSON.stringify(p.id)})">
        <strong>${p.name}</strong>
        <small>${Number(p.kcal || 0)} kcal / 100g · P ${Number(p.protein || 0)} · O ${Number(p.carbs || 0)} · T ${Number(p.fat || 0)}</small>
      </button>
    </div>
  `).join("");
}

function renderProducts() {
  const box = document.getElementById("productList");
  if (!box) return;

  const favBtn = document.getElementById("productFavFilterBtn");
  if (favBtn) {
    favBtn.classList.toggle("active-filter", showProductFavoritesOnly);
  }

  const products = getFilteredProductsForDb();

  const portion = document.getElementById("portionFood");
  const rProduct = document.getElementById("rProduct");

  if (portion) {
    portion.innerHTML = getProducts()
      .map(p => `<option value="${p.id}">${p.favorite ? "⭐ " : ""}${p.name}</option>`)
      .join("");
  }

  if (rProduct) {
    rProduct.innerHTML = getProducts()
      .map(p => `<option value="${p.id}">${p.name}</option>`)
      .join("");
  }

  renderQuickFoodPicker();

  if (!products.length) {
    box.innerHTML = `<p class="muted">Nav produktu.</p>`;
    return;
  }

  box.innerHTML = products.map(p => `
    <div class="product-row">
      <button type="button" class="favorite-star" onclick="toggleFavorite(${JSON.stringify(p.id)})">
        ${p.favorite ? "⭐" : "☆"}
      </button>

      <div class="product-info">
        <strong>${p.name}</strong>
        <small>${Number(p.kcal || 0)} kcal / 100g · P ${Number(p.protein || 0)} · O ${Number(p.carbs || 0)} · T ${Number(p.fat || 0)}</small>
      </div>

      <button type="button" class="small-danger" onclick="deleteProduct(${JSON.stringify(p.id)})">Dzēst</button>
    </div>
  `).join("");
}

/* ===== END V5 ===== */









