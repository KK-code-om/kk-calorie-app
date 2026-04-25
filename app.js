const TARGETS = {
  kcal: 1910,
  protein: 130,
  fat: 70,
  carbs: 190
};

const todayKey = new Date().toISOString().slice(0, 10);

function getFoods() {
  return JSON.parse(localStorage.getItem("foods_" + todayKey)) || [];
}

function saveFoods(foods) {
  localStorage.setItem("foods_" + todayKey, JSON.stringify(foods));
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

function addKKCoffee() {
  const foods = getFoods();

  foods.push({
    id: Date.now(),
    name: "KK kafija",
    kcal: 40,
    protein: 1.3,
    carbs: 6.5,
    fat: 1,
    mealType: "snack"
  });

  saveFoods(foods);
  render();
}

function deleteFood(id) {
  const foods = getFoods().filter(food => food.id !== id);
  saveFoods(foods);
  render();
}

function resetToday() {
  if (confirm("Dzēst visus šodienas ierakstus?")) {
    localStorage.removeItem("foods_" + todayKey);
    render();
  }
}

function clearInputs() {
  document.getElementById("foodName").value = "";
  document.getElementById("kcal").value = "";
  document.getElementById("protein").value = "";
  document.getElementById("carbs").value = "";
  document.getElementById("fat").value = "";
}

function saveWeight() {
  const weight = Number(document.getElementById("weightInput").value);

  if (!weight) return;

  const weights = JSON.parse(localStorage.getItem("weights")) || [];

  weights.push({
    date: todayKey,
    weight
  });

  localStorage.setItem("weights", JSON.stringify(weights));
  document.getElementById("weightInput").value = "";

  renderWeight();
}

function renderWeight() {
  const weights = JSON.parse(localStorage.getItem("weights")) || [];
  const last = weights[weights.length - 1];

  document.getElementById("lastWeight").textContent = last
    ? `Pēdējais svars: ${last.weight} kg (${last.date})`
    : "Nav svara ierakstu.";
}

function render() {
  const foods = getFoods();

  const totals = foods.reduce((sum, food) => {
    sum.kcal += food.kcal;
    sum.protein += food.protein;
    sum.carbs += food.carbs;
    sum.fat += food.fat;
    return sum;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  document.getElementById("totalKcal").textContent = Math.round(totals.kcal);
  document.getElementById("remainingKcal").textContent = Math.round(TARGETS.kcal - totals.kcal);
  document.getElementById("totalProtein").textContent = totals.protein.toFixed(1) + " g";
  document.getElementById("totalCarbs").textContent = totals.carbs.toFixed(1) + " g";
  document.getElementById("totalFat").textContent = totals.fat.toFixed(1) + " g";

  const list = document.getElementById("foodList");
  list.innerHTML = "";

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

  renderWeight();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

render();
