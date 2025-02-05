function runSimulation() {
    const model = document.getElementById('modelSelect').value;
    const temperature = parseFloat(document.getElementById('temInput').value);
    const humidity = parseFloat(document.getElementById('humidityInput').value);
    const windspeed = parseFloat(document.getElementById('windInput').value);

    if (isNaN(temperature) || isNaN(humidity) || isNaN(windspeed)) {
        alert("Please enter valid numbers for all inputs.");
        return;
    }

    let result;
    if (model === 'basic') {
        result = basicWeatherModel(temperature, humidity, windspeed);
    } else if (model === 'advanced') {
        result = advancedWeatherModel(temperature, humidity, windspeed);
    } else {
        alert("Please select a valid weather model.");
        return;
    }

    // Update the result in the correct output element
    document.getElementById('resultOutput').innerText = result;

    // Make sure the result div is visible
    document.getElementById('result').style.display = 'block';  // Show the result section
}

// Basic weather model
function basicWeatherModel(temperature, humidity, windSpeed) {
    if (temperature > 30) {
        return `High temperature prediction: ${temperature}°C, expect sunny weather.`;
    } else if (temperature <= 30 && temperature > 15) {
        return `Moderate temperature prediction: ${temperature}°C, expect mild weather.`;
    } else {
        return `Low temperature prediction: ${temperature}°C, expect cold weather.`;
    }
}

// Advanced weather model
function advancedWeatherModel(temperature, humidity, windSpeed) {
    let weatherDescription = "";

    if (humidity > 60) {
        weatherDescription = "High humidity detected, expect cloudy or rainy weather.";
    } else {
        weatherDescription = "Low humidity detected, expect blue skies.";
    }

    if (windSpeed > 50) {
        weatherDescription += ` Strong winds detected at ${windSpeed} km/h, possible storms.`;
    }

    if (temperature > 30) {
        return `Hot weather predicted: ${temperature}°C, ${weatherDescription}`;
    } else if (temperature <= 30 && temperature > 15) {
        return `Mild weather predicted: ${temperature}°C, ${weatherDescription}`;
    } else {
        return `Cold weather predicted: ${temperature}°C, ${weatherDescription}`;
    }
}
