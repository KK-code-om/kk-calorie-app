#!/bin/bash
set -e

cd /Users/GG/Documents/GitHub/kk-calorie-app

python3 <<'PY'
from pathlib import Path
import re

index_path = Path("index.html")
app_path = Path("app.js")

index = index_path.read_text(encoding="utf-8")
app = app_path.read_text(encoding="utf-8")

new_nutrition = r'''<!-- ===== NUTRITION ===== -->
    <section id="nutrition" class="screen">

      <section class="card">
        <h2>Produkts gramos</h2>
        <select id="portionFood"></select>
        <input id="portionGrams" type="number" placeholder="Grami" />
        <select id="portionMeal">
          <option value="breakfast">Brokastis</option>
          <option value="lunch">Pusdienas</option>
          <option value="dinner">Vakariņas</option>
          <option value="snack">Uzkoda</option>
        </select>
        <button onclick="addPortionFood()">Pievienot</button>
      </section>

      <section class="card">
        <h2>Manuāli</h2>
        <input id="foodName" placeholder="Ēdiens" />
        <input id="kcal" type="number" placeholder="kcal" />
        <input id="protein" type="number" step="0.1" placeholder="Proteīns g" />
        <input id="carbs" type="number" step="0.1" placeholder="Ogļhidrāti g" />
        <input id="fat" type="number" step="0.1" placeholder="Tauki g" />
        <button onclick="addManualFood()">Pievienot manuāli</button>
      </section>

      <section class="card">
        <h2>Ieraksti</h2>
        <div id="foodList"></div>
        <button class="danger" onclick="resetDay()">Dzēst dienu</button>
      </section>

      <section class="card">
        <h2>Šabloni</h2>
        <input id="tmplName" placeholder="Šablona nosaukums" />
        <button onclick="createTemplate()">Saglabāt šodienu kā šablonu</button>
        <div id="templateList"></div>
      </section>

    </section>
    <!-- ===== END NUTRITION ===== -->'''

new_lookup = r'''async function lookupBarcode() {
  const code = document.getElementById("barcodeInput").value.trim();
  const status = document.getElementById("barcodeStatus");

  if (!code) {
    status.textContent = "Ievadi EAN kodu.";
    return;
  }

  status.textContent = "Meklē OpenFoodFacts...";

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
    const data = await res.json();

    if (!data.product) {
      status.textContent = "Produkts nav atrasts.";
      return;
    }

    const product = data.product;
    const nutr = product.nutriments || {};

    const kcal =
      nutr["energy-kcal_100g"] ||
      nutr["energy-kcal"] ||
      (nutr["energy_100g"] ? nutr["energy_100g"] / 4.184 : 0) ||
      0;

    const protein =
      nutr["proteins_100g"] ||
      nutr["protein_100g"] ||
      nutr["proteins"] ||
      0;

    const carbs =
      nutr["carbohydrates_100g"] ||
      nutr["carbohydrates"] ||
      0;

    const fat =
      nutr["fat_100g"] ||
      nutr["fat"] ||
      0;

    document.getElementById("pName").value =
      product.product_name ||
      product.product_name_lv ||
      product.product_name_en ||
      "";

    document.getElementById("pKcal").value = Math.round(Number(kcal) || 0);
    document.getElementById("pProtein").value = Number(protein || 0).toFixed(1);
    document.getElementById("pCarbs").value = Number(carbs || 0).toFixed(1);
    document.getElementById("pFat").value = Number(fat || 0).toFixed(1);

    status.textContent = "Produkts atrasts. Pārbaudi datus un saglabā.";
  } catch (err) {
    status.textContent = "Kļūda barcode meklēšanā.";
  }
}'''

index_new, n1 = re.subn(
    r'<!-- ===== NUTRITION ===== -->[\s\S]*?<!-- ===== END NUTRITION ===== -->',
    new_nutrition,
    index,
    count=1
)

if n1 != 1:
    raise SystemExit("ERROR: nutrition section not found or not replaced")

app_new, n2 = re.subn(
    r'async\s+function\s+lookupBarcode\s*\(\)\s*\{[\s\S]*?\n\}',
    new_lookup,
    app,
    count=1
)

if n2 != 1:
    raise SystemExit("ERROR: lookupBarcode() not found or not replaced")

index_path.write_text(index_new, encoding="utf-8")
app_path.write_text(app_new, encoding="utf-8")

print("PATCH OK")
PY

git diff -- index.html app.js
