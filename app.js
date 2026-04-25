const DEFAULT_SETTINGS = {
  kcal: 1910,
  protein: 130,
  carbs: 190,
  fat: 70,
  water: 2500
};

const DEFAULT_QUICK_FOODS = [
  { id: "kk-coffee", name: "KK kafija", kcal: 40, protein: 1.3, carbs: 6.5, fat: 1 },
  { id: "banana", name: "1 banāns", kcal: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { id: "egg", name: "1 ola", kcal: 70, protein: 6, carbs: 0.6, fat: 5 },
  { id: "chicken100", name: "Vistas fileja 100g", kcal: 165, protein: 31, carbs: 0, fat: 3.6 }
];

let currentDate = new Date().toISOString().slice(0, 10);

function getSettings() {
  return JSON.parse(localStorage.getItem("kk_settings")) || DEFAULT_SETTINGS;
}

function saveSettingsData(settings) {
  localStorage.setItem("kk_settings", JSON.stringify(settings));
}

function getFoods(date = currentDate) {
  return JSON.parse(localStorage.getItem("foods_" + date)) || [];
}

function saveFoods(foods, date = currentDate) {
  localStorage.setItem("foods_" + date, JSON.stringify(foods));
}

function getQuickFoods() {
  const saved = JSON.parse(localStorage.getItem("kk_quick_foods"));
  return saved && saved.length ? saved : DEFAULT_QUICK_FOODS;
}

function saveQuickFoods(foods) {
  localStorage.setItem("kk_quick_foods", JSON.stringify(foods));
}

function showTab(tabName) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active-screen"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  document.getElementById(tabName).classList.add("active-screen");
  document.getElementById("tab-" + tabName).classList.add("active");

  render();
}

function changeDay(offset) {
  const date = new Date(currentDate);
  date.setDate(date.getDate() + offset);
  currentDate = date.toISOString().slice(0, 10);
  render();
}

function setDateFromPicker() {
  currentDate = document.getElementById("datePicker").value;
  render();
}

function addFood() {
  const food = {
    id: Date.now(),
    name: document.getElementById("foodName").value || "Bez nosaukuma",
    kcal: Number(document.getElementById("kcal").value) || 0,
    protein: Number(document.getElementById("protein").value) || 0,
    carbs: Number(document.getElementById("carbs").value) || 0,
    fat: Number(document.getElementById("fat").value) || 0,
    mealType: document.getElementById("mealType").value
  };

  const foods = getFoods();
  foods.push(food);
  saveFoods(foods);
  clearInputs();
  render();
}

function addQuickFood(id) {
  const quick = getQuickFoods().find(q => q.id == id);
  if (!quick) return;

  const foods = getFoods();
  foods.push({
    id: Date.now(),
    name: quick.name,
    kcal: quick.kcal,
    protein: quick.protein,
    carbs: quick.carbs,
    fat: quick.fat,
    mealType: "snack"
  });

  saveFoods(foods);
  render();
}

function deleteFood(id) {
  if (!confirm("Dzēst ierakstu?")) return;
  const foods = getFoods().filter(food => food.id !== id);
  saveFoods(foods);
  render();
}

function resetDay() {
  if (confirm("Dzēst visus izvēlētās dienas ierakstus?")) {
    localStorage.removeItem("foods_" + currentDate);
    render();
  }
}

function clearInputs() {
  ["foodName", "kcal", "protein", "carbs", "fat"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

function saveQuickFood() {
  const name = document.getElementById("qName").value;
  if (!name) return alert("Ievadi nosaukumu.");

  const foods = getQuickFoods();

  foods.push({
    id: Date.now(),
    name,
    kcal: Number(document.getElementById("qKcal").value) || 0,
    protein: Number(document.getElementById("qProtein").value) || 0,
    carbs: Number(document.getElementById("qCarbs").value) || 0,
    fat: Number(document.getElementById("qFat").value) || 0
  });

  saveQuickFoods(foods);

  ["qName", "qKcal", "qProtein", "qCarbs", "qFat"].forEach(id => {
    document.getElementById(id).value = "";
  });

  render();
}

function deleteQuickFood(id) {
  if (!confirm("Dzēst quick food?")) return;
  const foods = getQuickFoods().filter(food => food.id != id);
  saveQuickFoods(foods);
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
  const weights = (JSON.parse(localStorage.getItem("weights")) || []).filter(w => w.date !== date);
  localStorage.setItem("weights", JSON.stringify(weights));
  render();
}

function saveSettings() {
  const settings = {
    kcal: Number(document.getElementById("setKcal").value) || DEFAULT_SETTINGS.kcal,
    protein: Number(document.getElementById("setProtein").value) || DEFAULT_SETTINGS.protein,
    carbs: Number(document.getElementById("setCarbs").value) || DEFAULT_SETTINGS.carbs,
    fat: Number(document.getElementById("setFat").value) || DEFAULT_SETTINGS.fat,
    water: Number(document.getElementById("setWater").value) || DEFAULT_SETTINGS.water
  };

  saveSettingsData(settings);
  alert("Settings saglabāti.");
  render();
}

function exportData() {
  const data = {};
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("foods_") || key.startsWith("kk_") || key === "weights") {
      data[key] = localStorage.getItem(key);
    }
  });

  document.getElementById("backupBox").value = JSON.stringify(data, null, 2);
}

function importData() {
  try {
    const data = JSON.parse(document.getElementById("backupBox").value);
    Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
    alert("Import OK.");
    render();
  } catch {
    alert("Import kļūda. JSON nav derīgs.");
  }
}

function resetAllData() {
  if (!confirm("Dzēst VISUS app datus?")) return;

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("foods_") || key.startsWith("kk_") || key === "weights") {
      localStorage.removeItem(key);
    }
  });

  render();
}

function percent(value, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function renderSummary() {
  const settings = getSettings();
  const foods = getFoods();

  const totals = foods.reduce((sum, food) => {
    sum.kcal += food.kcal;
    sum.protein += food.protein;
    sum.carbs += food.carbs;
    sum.fat += food.fat;
    return sum;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  document.getElementById("totalKcal").textContent = Math.round(totals.kcal);
  document.getElementById("targetKcal").textContent = settings.kcal;
  document.getElementById("remainingKcal").textContent = Math.round(settings.kcal - totals.kcal);

  document.getElementById("proteinText").textContent = `${totals.protein.toFixed(1)} / ${settings.protein} g`;
  document.getElementById("carbsText").textContent = `${totals.carbs.toFixed(1)} / ${settings.carbs} g`;
  document.getElementById("fatText").textContent = `${totals.fat.toFixed(1)} / ${settings.fat} g`;

  document.getElementById("kcalBar").style.width = percent(totals.kcal, settings.kcal) + "%";
  document.getElementById("proteinBar").style.width = percent(totals.protein, settings.protein) + "%";
  document.getElementById("carbsBar").style.width = percent(totals.carbs, settings.carbs) + "%";
  document.getElementById("fatBar").style.width = percent(totals.fat, settings.fat) + "%";

  const status = document.getElementById("dailyStatus");
  status.className = "status";

  if (totals.kcal <= settings.kcal && totals.protein >= settings.protein) {
    status.textContent = "Labi: kcal kontrolē + proteīns sasniegts";
    status.classList.add("good");
  } else if (totals.kcal <= settings.kcal) {
    status.textContent = "OK: kcal kontrolē, proteīns vēl jāpaceļ";
    status.classList.add("warn");
  } else {
    status.textContent = "Pāri kcal mērķim";
    status.classList.add("bad");
  }
}

function renderFoodList() {
  const foods = getFoods();
  const list = document.getElementById("foodList");
  list.innerHTML = "";

  if (!foods.length) {
    list.innerHTML = "<p>Nav ierakstu.</p>";
    return;
  }

  foods.forEach(food => {
    const item = document.createElement("div");
    item.className = "food-item";
    item.innerHTML = `
      <strong>${food.name}</strong>
      <small>${food.mealType}</small>
      <small>${food.kcal} kcal | P ${food.protein} g | C ${food.carbs} g | F ${food.fat} g</small>
      <button onclick="deleteFood(${food.id})">Dzēst</button>
    `;
    list.appendChild(item);
  });
}

function renderQuickFoods() {
  const quicks = getQuickFoods();

  const buttonBox = document.getElementById("quickButtons");
  buttonBox.innerHTML = "";

  quicks.forEach(food => {
    const btn = document.createElement("button");
    btn.textContent = `+ ${food.name}`;
    btn.onclick = () => addQuickFood(food.id);
    buttonBox.appendChild(btn);
  });

  const list = document.getElementById("quickFoodList");
  list.innerHTML = "";

  quicks.forEach(food => {
    const item = document.createElement("div");
    item.className = "quick-item";
    item.innerHTML = `
      <strong>${food.name}</strong>
      <small>${food.kcal} kcal | P ${food.protein} g | C ${food.carbs} g | F ${food.fat} g</small>
      <button onclick="deleteQuickFood('${food.id}')">Dzēst</button>
    `;
    list.appendChild(item);
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
    const item = document.createElement("div");
    item.className = "weight-item";
    item.innerHTML = `
      <strong>${w.weight} kg</strong>
      <small>${w.date}</small>
      <button onclick="deleteWeight('${w.date}')">Dzēst</button>
    `;
    list.appendChild(item);
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
  ctx.lineWidth = 1;
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

  ctx.fillStyle = "#fff";
  ctx.font = "12px Arial";
  ctx.fillText(max.toFixed(1), 2, pad + 5);
  ctx.fillText(min.toFixed(1), 2, pad + height);
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
  renderQuickFoods();
  renderWeight();
  renderSettings();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js?v=2");
}

render();
