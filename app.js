const DEFAULT_SETTINGS = {
  kcal: 1910,
  protein: 130,
  carbs: 190,
  fat: 70,
  water: 2500
};

const DEFAULT_PRODUCTS = [
  { id: "kk-coffee", name: "KK kafija", kcal: 40, protein: 1.3, carbs: 6.5, fat: 1 },
  { id: "banana", name: "Banāns", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: "egg", name: "Ola", kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: "chicken", name: "Vistas fileja", kcal: 165, protein: 31, carbs: 0, fat: 3.6 }
];

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
  const saved = JSON.parse(localStorage.getItem("kk_products"));
  return saved && saved.length ? saved : DEFAULT_PRODUCTS;
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

function getTemplates() {
  return JSON.parse(localStorage.getItem("kk_templates")) || [];
}

function saveTemplates(t) {
  localStorage.setItem("kk_templates", JSON.stringify(t));
}

function showTab(tab) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active-screen"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
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
  foods.push({ id: Date.now(), ...entry });
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
    mealType: document.getElementById("mealType").value
  });

  ["foodName", "kcal", "protein", "carbs", "fat"].forEach(id => document.getElementById(id).value = "");
}

function addQuickFood(id) {
  const p = getProducts().find(x => x.id == id);
  if (!p) return;

  addEntry({
    name: p.name,
    kcal: p.kcal,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat,
    mealType: "snack"
  });
}

function addPortionFood() {
  const id = document.getElementById("portionFood").value;
  const grams = Number(document.getElementById("portionGrams").value);
  const p = getProducts().find(x => x.id == id);

  if (!p || !grams) return alert("Izvēlies produktu un ievadi gramus.");

  const factor = grams / 100;

  addEntry({
    name: `${p.name} ${grams}g`,
    kcal: Math.round(p.kcal * factor),
    protein: +(p.protein * factor).toFixed(1),
    carbs: +(p.carbs * factor).toFixed(1),
    fat: +(p.fat * factor).toFixed(1),
    mealType: document.getElementById("portionMeal").value
  });

  document.getElementById("portionGrams").value = "";
}

function deleteFood(id) {
  if (!confirm("Dzēst ierakstu?")) return;
  saveFoods(getFoods().filter(f => f.id !== id));
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
  saveProducts(getProducts().filter(p => p.id != id));
  render();
}

function addIngredient() {
  const id = document.getElementById("rProduct").value;
  const grams = Number(document.getElementById("rGrams").value);
  const p = getProducts().find(x => x.id == id);

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
    const p = products.find(x => x.id == ing.productId);
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
    return alert("Vajag nosaukumu, kopējo svaru un sastāvdaļas.");
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
  saveRecipes(getRecipes().filter(r => r.id != id));
  render();
}

function addRecipePortion() {
  const id = document.getElementById("recipeSelectToday").value;
  const grams = Number(document.getElementById("recipeConsumedGrams").value);
  const r = getRecipes().find(x => x.id == id);

  if (!r || !grams) return alert("Izvēlies recepti un gramus.");

  const totals = calculateRecipeTotals(r);
  const f = grams / r.yieldGrams;

  addEntry({
    name: `${r.name} ${grams}g`,
    kcal: Math.round(totals.kcal * f),
    protein: +(totals.protein * f).toFixed(1),
    carbs: +(totals.carbs * f).toFixed(1),
    fat: +(totals.fat * f).toFixed(1),
    mealType: document.getElementById("recipeMealToday").value
  });

  document.getElementById("recipeConsumedGrams").value = "";
}

function saveTodayAsTemplate() {
  const foods = getFoods();
  if (!foods.length) return alert("Šodien nav ierakstu.");

  const name = prompt("Template nosaukums:");
  if (!name) return;

  const templates = getTemplates();
  templates.push({
    id: Date.now(),
    name,
    foods: foods.map(f => ({
      name: f.name,
      kcal: f.kcal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      mealType: f.mealType
    }))
  });

  saveTemplates(templates);
  render();
}

function applyTemplate(id) {
  const t = getTemplates().find(x => x.id == id);
  if (!t) return;

  const foods = getFoods();
  t.foods.forEach(f => foods.push({ id: Date.now() + Math.random(), ...f }));
  saveFoods(foods);
  render();
}

function deleteTemplate(id) {
  if (!confirm("Dzēst template?")) return;
  saveTemplates(getTemplates().filter(t => t.id != id));
  render();
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

function deleteWeight(date) {
  if (!confirm("Dzēst svaru?")) return;
  localStorage.setItem("weights", JSON.stringify((JSON.parse(localStorage.getItem("weights")) || []).filter(w => w.date !== date)));
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
    if (k.startsWith("foods_") || k.startsWith("kk_") || k === "weights") data[k] = localStorage.getItem(k);
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

function resetAllData() {
  if (!confirm("Dzēst VISUS datus?")) return;
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("foods_") || k.startsWith("kk_") || k === "weights") localStorage.removeItem(k);
  });
  render();
}

function percent(v, target) {
  return Math.min(100, Math.round((v / target) * 100));
}

function renderSummary() {
  const s = getSettings();
  const foods = getFoods();

  const t = foods.reduce((a, f) => {
    a.kcal += f.kcal;
    a.protein += f.protein;
    a.carbs += f.carbs;
    a.fat += f.fat;
    return a;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  document.getElementById("totalKcal").textContent = Math.round(t.kcal);
  document.getElementById("targetKcal").textContent = s.kcal;
  document.getElementById("remainingKcal").textContent = Math.round(s.kcal - t.kcal);

  document.getElementById("proteinText").textContent = `${t.protein.toFixed(1)} / ${s.protein} g`;
  document.getElementById("carbsText").textContent = `${t.carbs.toFixed(1)} / ${s.carbs} g`;
  document.getElementById("fatText").textContent = `${t.fat.toFixed(1)} / ${s.fat} g`;

  document.getElementById("kcalBar").style.width = percent(t.kcal, s.kcal) + "%";
  document.getElementById("proteinBar").style.width = percent(t.protein, s.protein) + "%";
  document.getElementById("carbsBar").style.width = percent(t.carbs, s.carbs) + "%";
  document.getElementById("fatBar").style.width = percent(t.fat, s.fat) + "%";

  const status = document.getElementById("dailyStatus");
  status.className = "status";

  if (t.kcal <= s.kcal && t.protein >= s.protein) {
    status.textContent = "Labi: kcal kontrolē + proteīns sasniegts";
    status.classList.add("good");
  } else if (t.kcal <= s.kcal) {
    status.textContent = "OK: kcal kontrolē, proteīns vēl jāpaceļ";
    status.classList.add("warn");
  } else {
    status.textContent = "Pāri kcal mērķim";
    status.classList.add("bad");
  }
}

function renderFoodList() {
  const list = document.getElementById("foodList");
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
      <small>${f.mealType}</small>
      <small>${f.kcal} kcal | P ${f.protein} g | C ${f.carbs} g | F ${f.fat} g</small>
      <button onclick="deleteFood(${f.id})">Dzēst</button>
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

  const quick = document.getElementById("quickButtons");
  quick.innerHTML = "";
  products.slice(0, 8).forEach(p => {
    const b = document.createElement("button");
    b.textContent = `+ ${p.name}`;
    b.onclick = () => addQuickFood(p.id);
    quick.appendChild(b);
  });

  const list = document.getElementById("productList");
  list.innerHTML = "";

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
  select.innerHTML = "";

  recipes.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.name;
    select.appendChild(opt);
  });

  const list = document.getElementById("recipeList");
  list.innerHTML = "";

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

function renderTemplates() {
  const list = document.getElementById("templateList");
  list.innerHTML = "";

  const templates = getTemplates();

  if (!templates.length) {
    list.innerHTML = "<p>Nav template.</p>";
    return;
  }

  templates.forEach(t => {
    const kcal = t.foods.reduce((a, f) => a + f.kcal, 0);
    const div = document.createElement("div");
    div.className = "quick-item";
    div.innerHTML = `
      <strong>${t.name}</strong>
      <small>${Math.round(kcal)} kcal | ${t.foods.length} ieraksti</small>
      <div class="inline-actions">
        <button onclick="applyTemplate('${t.id}')">Pievienot šodien</button>
        <button onclick="deleteTemplate('${t.id}')">Dzēst</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function renderWeight() {
  const weights = JSON.parse(localStorage.getItem("weights")) || [];
  const last = weights[weights.length - 1];

  document.getElementById("lastWeight").textContent = last
    ? `Pēdējais svars: ${last.weight} kg (${last.date})`
    : "Nav svara ierakstu.";

  const list = document.getElementById("weightList");
  list.innerHTML = "";

  weights.slice().reverse().forEach(w => {
    const div = document.createElement("div");
    div.className = "weight-item";
    div.innerHTML = `
      <strong>${w.weight} kg</strong>
      <small>${w.date}</small>
      <button onclick="deleteWeight('${w.date}')">Dzēst</button>
    `;
    list.appendChild(div);
  });

  drawWeightChart(weights);
}

function drawWeightChart(weights) {
  const canvas = document.getElementById("weightChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (weights.length < 2) {
    ctx.fillStyle = "#aaa";
    ctx.font = "16px Arial";
    ctx.fillText("Vajag vismaz 2 svara ierakstus", 30, 90);
    return;
  }

  const values = weights.map(w => w.weight);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const pad = 24;
  const width = canvas.width - pad * 2;
  const height = canvas.height - pad * 2;

  ctx.strokeStyle = "#555";
  ctx.strokeRect(pad, pad, width, height);

  ctx.strokeStyle = "#c62828";
  ctx.lineWidth = 3;
  ctx.beginPath();

  weights.forEach((w, i) => {
    const x = pad + (i / (weights.length - 1)) * width;
    const y = pad + height - ((w.weight - min) / (max - min)) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function renderSettings() {
  const s = getSettings();
  document.getElementById("setKcal").value = s.kcal;
  document.getElementById("setProtein").value = s.protein;
  document.getElementById("setCarbs").value = s.carbs;
  document.getElementById("setFat").value = s.fat;
  document.getElementById("setWater").value = s.water;
}

function render() {
  document.getElementById("datePicker").value = currentDate;
  renderSummary();
  renderFoodList();
  renderProducts();
  renderRecipes();
  renderTemplates();
  renderWeight();
  renderSettings();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js?v=3");
}

render();

function clearProductDatabase() {
  if (!confirm("Dzēst visu produktu datubāzi?")) return;
  localStorage.setItem("kk_products", JSON.stringify([]));
  render();
}
