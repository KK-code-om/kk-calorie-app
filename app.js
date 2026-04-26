const DEFAULT_SETTINGS = {
  kcal: 1900,
  protein: 130,
  carbs: 190,
  fat: 70,
  water: 2000
};

let currentDate = new Date().toISOString().slice(0, 10);
let currentIngredients = [];

function num(v) {
  return Number(String(v || "0").replace(",", ".").trim()) || 0;
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
  const grams = document.getElementById("quickGrams").value;
  const meal = document.getElementById("quickMeal").value;
  addProductByGrams(productId, grams, meal);
}

function addPortionFood() {
  const id = document.getElementById("portionFood").value;
  const grams = document.getElementById("portionGrams").value;
  const meal = document.getElementById("portionMeal").value;
  addProductByGrams(id, grams, meal);
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
  const name = document.getElementById("pName").value.trim();
  if (!name) return alert("Ievadi nosaukumu.");

  const products = getProducts();

  products.push({
    id: Date.now(),
    name,
    kcal: num(document.getElementById("pKcal").value),
    protein: num(document.getElementById("pProtein").value),
    carbs: num(document.getElementById("pCarbs").value),
    fat: num(document.getElementById("pFat").value),
    favorite: false
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

  function setStatus(msg) {
    if (status) status.textContent = msg;
  }

  const raw = box.value.trim();
  if (!raw) return alert("CSV lauks ir tukšs.");

  const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (lines.length < 2) return alert("CSV vajag header + produktus.");

  const header = lines[0].split(",").map(x => x.trim().toLowerCase());

  const idx = {
    name: header.indexOf("name"),
    kcal: header.indexOf("kcal"),
    protein: header.indexOf("protein"),
    carbs: header.indexOf("carbs"),
    fat: header.indexOf("fat")
  };

  if (idx.name < 0 || idx.kcal < 0 || idx.protein < 0 || idx.carbs < 0 || idx.fat < 0) {
    return alert("Header jābūt: name,kcal,protein,carbs,fat");
  }

  const products = getProducts();
  let added = 0, updated = 0, skipped = 0;

  lines.slice(1).forEach(line => {
    const c = line.split(",").map(x => x.trim());
    const name = c[idx.name];

    if (!name) {
      skipped++;
      return;
    }

    const item = {
      name,
      kcal: num(c[idx.kcal]),
      protein: num(c[idx.protein]),
      carbs: num(c[idx.carbs]),
      fat: num(c[idx.fat])
    };

    const found = products.findIndex(p => String(p.name || "").toLowerCase().trim() === name.toLowerCase().trim());

    if (found >= 0) {
      products[found] = { ...products[found], ...item, favorite: Boolean(products[found].favorite) };
      updated++;
    } else {
      products.push({ id: Date.now() + Math.random(), ...item, favorite: false });
      added++;
    }
  });

  saveProducts(products);
  box.value = "";
  const msg = `CSV import OK. Pievienoti: ${added}, Atjaunoti: ${updated}, Izlaisti: ${skipped}`;
  setStatus(msg);
  alert(msg);
  render();
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

  box.innerHTML = "";

  currentIngredients.forEach((ing, index) => {
    const div = document.createElement("div");
    div.className = "quick-item";
    div.innerHTML = `<strong>${ing.name}</strong><small>${ing.grams} g</small><button onclick="removeIngredient(${index})">Dzēst</button>`;
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
    totals.kcal += num(p.kcal) * f;
    totals.protein += num(p.protein) * f;
    totals.carbs += num(p.carbs) * f;
    totals.fat += num(p.fat) * f;
  });

  return {
    kcal: Math.round(totals.kcal),
    protein: +totals.protein.toFixed(1),
    carbs: +totals.carbs.toFixed(1),
    fat: +totals.fat.toFixed(1)
  };
}

function saveRecipe() {
  const name = document.getElementById("rName").value.trim();
  const yieldGrams = num(document.getElementById("rYield").value);

  if (!name || !yieldGrams || currentIngredients.length === 0) {
    return alert("Vajag nosaukumu, gatavo svaru un sastāvdaļas.");
  }

  const recipes = getRecipes();
  recipes.push({ id: Date.now(), name, yieldGrams, ingredients: currentIngredients });
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
  const grams = num(document.getElementById("recipeConsumedGrams").value);
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
  const weight = num(document.getElementById("weightInput").value);
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
    kcal: num(document.getElementById("setKcal").value) || DEFAULT_SETTINGS.kcal,
    protein: num(document.getElementById("setProtein").value) || DEFAULT_SETTINGS.protein,
    carbs: num(document.getElementById("setCarbs").value) || DEFAULT_SETTINGS.carbs,
    fat: num(document.getElementById("setFat").value) || DEFAULT_SETTINGS.fat,
    water: num(document.getElementById("setWater").value) || DEFAULT_SETTINGS.water
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
      foods.forEach(f => rows.push([date, f.mealType || "", f.name, f.kcal, f.protein, f.carbs, f.fat]));
    });

  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kk-calories.csv";
  a.click();
}

function renderOverview() {
  const foods = getFoods();
  const s = getSettings();

  const totals = foods.reduce((a, f) => {
    a.kcal += num(f.kcal);
    a.protein += num(f.protein);
    a.carbs += num(f.carbs);
    a.fat += num(f.fat);
    return a;
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

  const pct = Math.min(100, Math.round((totals.kcal / s.kcal) * 100));
  document.getElementById("gauge").style.setProperty("--p", pct + "%");

  renderMealSummary(totals);
  renderAnalytics();
}

function renderMealSummary() {
  const box = document.getElementById("mealSummary");
  const foods = getFoods();

  const names = {
    breakfast: "Brokastis",
    lunch: "Pusdienas",
    dinner: "Vakariņas",
    snack: "Uzkodas"
  };

  box.innerHTML = "";

  Object.keys(names).forEach(meal => {
    const kcal = foods.filter(f => f.mealType === meal).reduce((a, f) => a + num(f.kcal), 0);
    const div = document.createElement("div");
    div.className = "meal-box";
    div.innerHTML = `<div><b>${names[meal]}</b><small>${Math.round(kcal)} kcal</small></div>`;
    box.appendChild(div);
  });
}

function renderAnalytics() {
  const s = getSettings();
  let total7 = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    total7 += getFoods(key).reduce((a, f) => a + num(f.kcal), 0);
  }

  const avg = Math.round(total7 / 7);
  const todayProtein = getFoods().reduce((a, f) => a + num(f.protein), 0);

  document.getElementById("avgKcal7").textContent = avg;
  document.getElementById("proteinCompliance").textContent = Math.round((todayProtein / s.protein) * 100) + "%";
  document.getElementById("deficitCalc").textContent = Math.round(s.kcal - avg);
  document.getElementById("weightTrend").textContent = "—";
}

function renderFoodList() {
  const box = document.getElementById("foodList");
  if (!box) return;

  const foods = getFoods();
  box.innerHTML = "";

  if (!foods.length) {
    box.innerHTML = '<p class="muted">Nav ierakstu.</p>';
    return;
  }

  foods.forEach(f => {
    const div = document.createElement("div");
    div.className = "food-item";
    div.innerHTML = `
      <strong>${f.name}</strong>
      <small>${Math.round(num(f.kcal))} kcal · P ${num(f.protein)} · O ${num(f.carbs)} · T ${num(f.fat)}</small>
      <button onclick="deleteFood(${f.id})">Dzēst</button>
    `;
    box.appendChild(div);
  });
}

function renderProducts() {
  const products = getProducts();
  const q = String(document.getElementById("productSearch")?.value || "").toLowerCase().trim();

  const filtered = q
    ? products.filter(p => String(p.name || "").toLowerCase().includes(q))
    : products;

  const box = document.getElementById("productList");
  if (box) {
    box.innerHTML = "";

    if (!filtered.length) {
      box.innerHTML = '<p class="muted">Nav produktu.</p>';
    } else {
      filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "food-item";
        div.innerHTML = `
          <strong>${p.name}</strong>
          <small>${num(p.kcal)} kcal | P:${num(p.protein)} C:${num(p.carbs)} F:${num(p.fat)}</small>
          <button onclick="deleteProduct(${p.id})">Dzēst</button>
        `;
        box.appendChild(div);
      });
    }
  }

  const portion = document.getElementById("portionFood");
  if (portion) {
    portion.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  }

  const rProduct = document.getElementById("rProduct");
  if (rProduct) {
    rProduct.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  }

  renderQuickFoodPicker();
}

function renderQuickFoodPicker() {
  const box = document.getElementById("quickFoodList");
  if (!box) return;

  const q = String(document.getElementById("foodSearch")?.value || "").toLowerCase().trim();
  let products = getProducts();

  if (q) {
    products = products.filter(p => String(p.name || "").toLowerCase().includes(q));
  }

  products = products.slice(0, 12);

  box.innerHTML = "";

  if (!products.length) {
    box.innerHTML = '<p class="muted">Nav atrastu produktu.</p>';
    return;
  }

  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "quick-item";
    div.style.cursor = "pointer";
    div.innerHTML = `
      <strong>${p.name}</strong>
      <small>${num(p.kcal)} kcal / 100g · P ${num(p.protein)} · O ${num(p.carbs)} · T ${num(p.fat)}</small>
    `;
    div.onclick = () => quickAddProduct(p.id);
    box.appendChild(div);
  });
}

function renderRecipes() {
  renderIngredients();

  const recipes = getRecipes();
  const box = document.getElementById("recipeList");
  const select = document.getElementById("recipeSelectToday");

  if (select) {
    select.innerHTML = recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  }

  if (!box) return;

  box.innerHTML = "";

  if (!recipes.length) {
    box.innerHTML = '<p class="muted">Nav recepšu.</p>';
    return;
  }

  recipes.forEach(r => {
    const totals = calculateRecipeTotals(r);
    const div = document.createElement("div");
    div.className = "food-item";
    div.innerHTML = `
      <strong>${r.name}</strong>
      <small>${totals.kcal} kcal kopā · ${r.yieldGrams}g</small>
      <button onclick="deleteRecipe(${r.id})">Dzēst</button>
    `;
    box.appendChild(div);
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
  navigator.serviceWorker.register("service-worker.js?v=7.2-stable");
}

render();
