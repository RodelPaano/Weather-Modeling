// API KEY
const apiKey = "b9374fd26a2b080f0b931952dab1b66a";

// List han mga lugar han Eastern Samar
const easternSamarTowns = [
  "Borongan",
  "Balangiga",
  "Can-avid",
  "Dolores",
  "Guiuan",
  "Hernani",
  "Lawaan",
  "Llorente",
  "Maslog",
  "Maydolong",
  "Mercedes",
  "Oras",
  "Quinapondan",
  "Sulat",
  "Taft",
  "Salcedo",
  "Jipapad",
  "Arteche",
  "San Policarpo",
  "San Julian",
  "Giporlos",
  "Gen Macarthur",
  "Balangakayan",
];

// Function han pag handle han simulation
async function runSimulation() {
  const model = document.getElementById("modelSelect").value;
  const city = document.getElementById("cityInput").value;
  const population = document.getElementById("populationInput").value;

  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  if (!easternSamarTowns.includes(city)) {
    alert("Please enter a valid city or municipality from Eastern Samar.");
    return;
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},PH&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city},PH&appid=${apiKey}&units=metric`;

  try {
    const currentResponse = await fetch(apiUrl);
    const currentData = await currentResponse.json();

    if (currentData.cod !== 200) {
      document.getElementById(
        "results"
      ).innerHTML = `<p>Error: ${currentData.message}</p>`;
      return;
    }

    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    if (forecastData.cod !== "200") {
      document.getElementById(
        "results"
      ).innerHTML = `<p>Error: ${forecastData.message}</p>`;
      return;
    }

    let totalRainfall = 0;
    forecastData.list.slice(0, 8).forEach((entry) => {
      if (entry.rain && entry.rain["3h"]) {
        totalRainfall += entry.rain["3h"];
      }
    });

    const hazardMessage = getHazardWarnings(currentData);
    const evacuationRoutes = getEvacuationRoutes(city);

    // ✅ FIX: Get at-risk areas only for the selected city
    const atRiskAreas = await getAtRiskAreas(forecastData, city);

    if (model === "temperature") {
      displayTemperatureForecast(
        currentData,
        hazardMessage,
        evacuationRoutes,
        atRiskAreas,
        totalRainfall
      );
    } else if (model === "rainfall") {
      displayRainfallPrediction(
        currentData,
        hazardMessage,
        evacuationRoutes,
        atRiskAreas,
        totalRainfall
      );
    } else if (model === "health") {
      if (!population) {
        alert("Please enter population size for Health Risk Simulation.");
        return;
      }
      displayHealthRisk(
        currentData,
        population,
        hazardMessage,
        evacuationRoutes,
        atRiskAreas
      );
    } else if (model === "areasatrisk") {
      displayAreasAtRisk(
        currentData,
        hazardMessage,
        evacuationRoutes,
        atRiskAreas
      );
    }
  } catch (error) {
    document.getElementById(
      "results"
    ).innerHTML = `<p>Error fetching data: ${error.message}</p>`;
  }
}

// Function para han hazard warnings
function getHazardWarnings(data) {
  let hazardMessage = "";

  if (data.main.temp >= 35) {
    hazardMessage += `<span style="color: red;">⚠️ Warning: Matinding Panganib dahil ang Hot ko (${data.main.temp}°C). Stay hydrated and avoid prolonged sun exposure.</span><br>`;
  }

  if (data.main.feels_like >= 35) {
    hazardMessage += `<span style="color: red;">⚠️ Warning: Pakiramdan ay matinding init (${data.main.feels_like}°C). Take precautions.</span><br>`;
  }

  const humidity = data.main.humidity;
  if (humidity > 80) {
    hazardMessage += `<span style="color: red;">⚠️ Warning: Mataas na humidity ang na detect (${humidity}%). Risk of heat exhaustion.</span><br>`;
  }

  const windSpeed = data.wind.speed;
  if (windSpeed > 20) {
    hazardMessage += `<span style="color: red;">⚠️ Warning: Malakas na hangin ang na detect (${windSpeed} m/s). Storm surge and debris risk.</span><br>`;
  }

  return hazardMessage || "No hazards detected.";
}

// Function para han evacuation routes
function getEvacuationRoutes(city) {
  const evacuationRoutes = {
    Borongan: ["Borongan City Hall", "Borongan Evacuation Center"],
    Balangiga: ["Balangiga Town Hall", "Barangay Hall"],
    "Can-avid": ["Can-avid Municipal Hall", "Barangay Hall"],
    Dolores: ["Dolores Municipal Hall", "Barangay Hall"],
    Guiuan: ["Guiuan Municipal Hall", "Barangay Hall"],
    Hernani: ["Hernani Municipal Hall", "Barangay Hall"],
    Lawaan: ["Lawaan Municipal Hall", "Barangay Hall"],
    Llorente: ["Llorente Municipal Hall", "Barangay Hall"],
    Maslog: ["Maslog Municipal Hall", "Barangay Hall"],
    Maydolong: ["Maydolong Municipal Hall", "Barangay Hall"],
    Mercedes: ["Mercedes Municipal Hall", "Barangay Hall"],
    Oras: ["Oras Municipal Hall", "Barangay Hall"],
    Quinapondan: ["Quinapondan Municipal Hall", "Barangay Hall"],
    Sulat: ["Sulat Municipal Hall", "Barangay Hall"],
    Taft: ["Taft Municipal Hall", "Barangay Hall"],
    Salcedo: ["Salcedo Municipal Hall", "Barangay Hall"],
    Jipapad: ["Jipapad Municipal Hall", "Barangay Hall"],
    Arteche: ["Arteche Municipal Hall", "Barangay Hall"],
    "San Policarpo": ["San Policarpo Municipal Hall", "Barangay Hall"],
    "San Julian": ["San Julian Municipal Hall", "Barangay Hall"],
    Giporlos: ["Giporlos Municipal Hall", "Barangay Hall"],
    "Gen Macarthur": ["Gen Macarthur Municipal Hall", "Barangay Hall"],
    Balangakayan: ["Balangakayan Municipal Hall", "Barangay Hall"],
  };

  return (
    evacuationRoutes[city] || ["No evacuation routes available for this city."]
  );
}

// Function para han areas at risk
async function getAtRiskAreas(forecastData, city) {
  if (!forecastData || !forecastData.list) {
    console.error("❌ Error: forecastData is undefined or has no list!");
    return []; // Return empty array para di mag-error an `forEach`
  }

  let totalRainfall = 0;
  let windSpeed = 0;

  // ✅ Only check the forecast data for the selected city
  forecastData.list.forEach((entry) => {
    if (entry.rain && entry.rain["3h"]) {
      totalRainfall += entry.rain["3h"];
    }
    if (entry.wind && entry.wind.speed) {
      windSpeed = Math.max(windSpeed, entry.wind.speed);
    }
  });

  let atRiskAreas = [];

  if (totalRainfall > 20) {
    atRiskAreas.push(`${city} (Heavy Rainfall) <br/>
      <span style="color: red;">⚠️ Warning: Mag ingat sa lugar na bahain mag evacuate agad habang hindi pa huli </span>`);
  }

  if (windSpeed > 20) {
    atRiskAreas.push(`${city} (Strong Winds) <br/>
      <span style="color: red;">⚠️ Warning: An harani han mga baybayon mag hinay ngan an mangirisda kay makusog an hangin may posibilidad na dagko an balod</span>`);
  }

  return atRiskAreas;
}

// Function para han Temperature Forecast
function displayTemperatureForecast(data, hazardMessage) {
  const temp = data.main.temp;
  const feelsLike = data.main.feels_like;
  const humidity = data.main.humidity;
  const weatherDescription =
    data.weather && data.weather[0]
      ? data.weather[0].description
      : "No description available";
  const windSpeed = data.wind.speed;

  // Weather icon basi han weather condition
  const weatherIcon = getWeatherIcon(data.weather[0].main);

  // Apply background animation based on weather condition
  applyWeatherBackground(data.weather[0].main);

  document.getElementById(
    "results"
  ).innerHTML = `<h2>Weather in ${data.name}, ${data.sys.country}</h2>
        <p><strong>Temperature:</strong> ${temp}°C</p>
        <p><strong>Feels Like:</strong> ${feelsLike}°C</p>
        <p><strong>Humidity:</strong> ${humidity}%</p>
        <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
        <p><strong>Weather:</strong> ${weatherIcon} ${weatherDescription}</p>
        <p><strong>Hazards:</strong><br>${hazardMessage}</p>
        `;

  generateChart(
    [temp, feelsLike, humidity, windSpeed],
    ["Temperature", "Feels Like", "Humidity", "Wind Speed"],
    "Weather Data"
  );
}

// Function para han Rainfall Prediction
function displayRainfallPrediction(
  data,
  hazardMessage,
  evacuationRoutes,
  atRiskAreas,
  totalRainfall
) {
  const weatherDescription =
    data.weather && data.weather[0]
      ? data.weather[0].description
      : "No description available";

  // Weather icon based on weather condition
  const weatherIcon = getWeatherIcon(data.weather[0].main);

  // Apply background animation based on weather condition
  applyWeatherBackground(data.weather[0].main);

  document.getElementById("results").innerHTML = `<h2>Weather in ${
    data.name
  }, ${data.sys.country}</h2>
        <p><strong>Weather:</strong> ${weatherIcon} ${weatherDescription}</p>
        <p><strong>Posibling pag ulan sa loob ng tatlong oras:</strong> ${totalRainfall.toFixed(
          2
        )} mm</p>
        <p><strong>Hazards:</strong><br>${hazardMessage}</p>
        <p><strong>Evacuation Routes:</strong><br>${evacuationRoutes.join(
          "<br>"
        )}</p>
        <p><strong>Areas at Risk:</strong><br>${atRiskAreas.join("<br>")}</p>`;

  generateChart([totalRainfall], ["Rainfall"], "Rainfall Data");
}

// Function para han Health Risk Simulation
// Function to display Health Risk Simulation
function displayHealthRisk(data, population, hazardMessage) {
  const temp = data.main.temp;
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;

  let riskFactor = 0.01; // Default 1% risk

  // Adjust risk factor based on conditions
  if (temp >= 35 || temp <= 0) {
    riskFactor += 0.05; // 5% extra risk for extreme temperatures
  }
  if (humidity > 80) {
    riskFactor += 0.03; // High humidity increases health risks
  }
  if (windSpeed > 15) {
    riskFactor += 0.02; // Strong winds may cause respiratory issues
  }

  // Calculate affected population
  const atRiskPopulation = Math.round(population * riskFactor);
  const healthyPopulation = population - atRiskPopulation;

  // Get weather condition
  const weatherDescription =
    data.weather && data.weather[0]
      ? data.weather[0].description
      : "No description available";

  // Update UI
  document.getElementById("results").innerHTML = `
      <h2>Health Risk Simulation for ${data.name}, ${data.sys.country}</h2>
      <p><strong>Temperature:</strong> ${temp}°C (${weatherDescription})</p>
      <p><strong>Humidity:</strong> ${humidity}%</p>
      <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
      <p><strong>Population at Risk:</strong> ${atRiskPopulation} out of ${population}</p>
      <p><strong>Hazards:</strong><br>${hazardMessage}</p>
  `;

  // Generate updated chart
  generateChart(
    [healthyPopulation, atRiskPopulation],
    ["Healthy", "At Risk"],
    "Population Health Risk"
  );
}

// Function para han Areas At Risk Simulation
function displayAreasAtRisk(
  data,
  hazardMessage,
  evacuationRoutes,
  atRiskAreas
) {
  console.log("At Risk Areas Data (city):", atRiskAreas); // DEBUGGING

  let highRiskAreas = [];
  let moderateRiskAreas = [];

  if (Array.isArray(atRiskAreas)) {
    atRiskAreas.forEach((city) => {
      // ✅ Convert string data to object format
      if (typeof city === "string") {
        let cleanArea = city.replace(/<\/?[^>]+(>|$)/g, "").trim(); // Remove HTML tags
        let riskLevel = cleanArea.includes("Heavy Rainfall")
          ? "high"
          : "moderate";

        // Convert to Object Format
        city = { name: cleanArea.split(" (")[0], severity: riskLevel };
      }

      // ✅ Ensure city is a valid object
      if (typeof city === "object" && city.name && city.severity) {
        if (city.severity === "high") {
          highRiskAreas.push(city.name);
        } else if (city.severity === "moderate") {
          moderateRiskAreas.push(city.name);
        }
      } else {
        console.warn("⚠️ Skipping invalid atRiskArea:", city);
      }
    });
  } else {
    console.error("❌ Error: atRiskAreas is not an array!");
  }

  console.log("✔ High Risk Areas:", highRiskAreas);
  console.log("✔ Moderate Risk Areas:", moderateRiskAreas);

  let highRiskList = highRiskAreas.length
    ? `<ul>${highRiskAreas.map((area) => `<li>${area}</li>`).join("")}</ul>`
    : "<p>✅ No high-risk areas detected.</p>";

  let moderateRiskList = moderateRiskAreas.length
    ? `<ul>${moderateRiskAreas.map((area) => `<li>${area}</li>`).join("")}</ul>`
    : "<p>✅ No moderate-risk areas detected.</p>";

  let resultsElement = document.getElementById("results");

  if (resultsElement) {
    resultsElement.innerHTML = `
        <h2>🌪️ Areas at Risk in ${data.name}, ${data.sys.country}</h2>
        <p><strong>Weather:</strong> ${data.weather[0].description}</p>
        <p><strong>Hazards:</strong><br>${hazardMessage}</p>

        <h3>🔥 High Risk Areas:</h3>
        ${highRiskList}

        <h3>🌦️ Moderate Risk Areas:</h3>
        ${moderateRiskList}

        <p><strong>🚨 Evacuation Routes:</strong><br>${evacuationRoutes.join(
          "<br>"
        )}</p>
    `;
  } else {
    console.error("❌ Error: 'results' element not found in the document.");
  }

  generateAtRiskChart(highRiskAreas, moderateRiskAreas);
}

function generateAtRiskChart(highRiskAreas, moderateRiskAreas) {
  const ctx = document.getElementById("atRiskChart").getContext("2d");

  const labels = ["High Risk Areas", "Moderate Risk Areas"];
  const data = [highRiskAreas.length, moderateRiskAreas.length];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Number of Affected Areas",
          data: data,
          backgroundColor: ["rgba(255, 0, 0, 0.5)", "rgba(255, 165, 0, 0.5)"],
          borderColor: ["rgba(255, 0, 0, 1)", "rgba(255, 165, 0, 1)"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Function para han weather icons
function getWeatherIcon(weatherCondition) {
  switch (weatherCondition.toLowerCase()) {
    case "clear":
      return "☀️";
    case "rain":
      return "🌧️";
    case "clouds":
      return "☁️";
    case "thunderstorm":
      return "⛈️";
    case "wind":
      return "🌬️";
    default:
      return "";
  }
}

// Function para han background animation
function applyWeatherBackground(weatherCondition) {
  const body = document.body;
  body.className = ""; // Clear any existing classes

  switch (weatherCondition.toLowerCase()) {
    case "clear":
      body.classList.add("clear-sky");
      break;
    case "rain":
      body.classList.add("rainy");
      break;
    case "clouds":
      body.classList.add("cloudy");
      break;
    case "thunderstorm":
      body.classList.add("thunderstorm");
      break;
    case "wind":
      body.classList.add("windy");
      break;
    default:
      body.classList.add("default-bg");
      break;
  }
}

// Function para han chart generation
function generateChart(data, labels, title) {
  const ctx = document.getElementById("resultsChart").getContext("2d");

  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: title,
          data: data,
          backgroundColor: ["#4CAF50", "#FF5722"],
          borderColor: "#333",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
