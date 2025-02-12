// Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
const apiKey = 'b9374fd26a2b080f0b931952dab1b66a';

// List of towns in Eastern Samar
const easternSamarTowns = [
    'Borongan', 'Balangiga', 'Can-avid', 'Dolores', 'Guiuan', 'Hernani',
    'Lawaan', 'Llorente', 'Maslog', 'Maydolong', 'Mercedes', 'Oras',
    'Quinapondan', 'Sulat', 'Taft', 'Salcedo', 'Jipapad', 'Arteche', 
    'San Policarpo', 'San Julian', 'Giporlos', 'Gen Macarthur', 'Balangakayan'
];

// Function to handle the simulation based on the selected model
async function runSimulation() {
    const model = document.getElementById('modelSelect').value;
    const city = document.getElementById('cityInput').value;
    const population = document.getElementById('populationInput').value;

    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    // Check if the entered city is valid for Eastern Samar
    if (!easternSamarTowns.includes(city)) {
        alert('Please enter a valid city or municipality from Eastern Samar.');
        return;
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},PH&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod !== 200) {
            document.getElementById('results').innerHTML = `<p>Error: ${data.message}</p>`;
            return;
        }

        if (model === 'temperature') {
            displayTemperatureForecast(data);
        } else if (model === 'rainfall') {
            displayRainfallPrediction(data);
        } else if (model === 'health') {
            if (!population) {
                alert('Please enter population size for Health Risk Simulation.');
                return;
            }
            displayHealthRisk(data, population);
        }
    } catch (error) {
        document.getElementById('results').innerHTML = `<p>Error fetching data: ${error.message}</p>`;
    }
}

// Display Temperature Forecast
function displayTemperatureForecast(data) {
    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    const humidity = data.main.humidity;
    const weatherDescription = data.weather && data.weather[0] ? data.weather[0].description : 'No description available';
    const windSpeed = data.wind.speed;

    document.getElementById('results').innerHTML = `
        <h2>Weather in ${data.name}, ${data.sys.country}</h2>
        <p><strong>Temperature:</strong> ${temp}°C (Feels like ${feelsLike}°C)</p>
        <p><strong>Weather:</strong> ${weatherDescription}</p>
        <p><strong>Humidity:</strong> ${humidity}%</p>
        <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
    `;
    generateChart([temp, feelsLike, humidity, windSpeed], ['Temperature', 'Feels Like', 'Humidity', 'Wind Speed'], 'Weather Data');
}

// Display Rainfall Prediction
function displayRainfallPrediction(data) {
    const rainfall = data.rain ? data.rain['1h'] || 0 : 0;
    const weatherDescription = data.weather && data.weather[0] ? data.weather[0].description : 'No description available';

    document.getElementById('results').innerHTML = `
        <h2>Weather in ${data.name}, ${data.sys.country}</h2>
        <p><strong>Weather:</strong> ${weatherDescription}</p>
        <p><strong>Rainfall in the last hour:</strong> ${rainfall} mm</p>
    `;
    generateChart([rainfall], ['Rainfall'], 'Rainfall Data');
}

// Display Health Risk Simulation
function displayHealthRisk(data, population) {
    const temp = data.main.temp;
    let riskFactor = 0;

    if (temp >= 35) {
        riskFactor = 0.05; // 5% risk
    } else if (temp <= 0) {
        riskFactor = 0.03; // 3% risk
    } else {
        riskFactor = 0.01; // 1% risk
    }

    const atRiskPopulation = Math.round(population * riskFactor);
    const weatherDescription = data.weather && data.weather[0] ? data.weather[0].description : 'No description available';

    document.getElementById('results').innerHTML = `
        <h2>Health Risk Simulation for ${data.name}, ${data.sys.country}</h2>
        <p><strong>Temperature:</strong> ${temp}°C (${weatherDescription})</p>
        <p><strong>Population at Risk:</strong> ${atRiskPopulation} out of ${population}</p>
    `;
    generateChart([population - atRiskPopulation, atRiskPopulation], ['Healthy', 'At Risk'], 'Population Risk');
}

// Generate Chart using Chart.js
function generateChart(data, labels, title) {
    const ctx = document.getElementById('resultsChart').getContext('2d');

    // Destroy previous chart if it exists
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: ['#4CAF50', '#FF5722'],
                borderColor: '#333',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
