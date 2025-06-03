// Fonction pour obtenir la direction du vent en texte
function getWindDirection(degrees) {
  const directions = [
    'Nord', 'Nord-Nord-Est', 'Nord-Est', 'Est-Nord-Est',
    'Est', 'Est-Sud-Est', 'Sud-Est', 'Sud-Sud-Est',
    'Sud', 'Sud-Sud-Ouest', 'Sud-Ouest', 'Ouest-Sud-Ouest',
    'Ouest', 'Ouest-Nord-Ouest', 'Nord-Ouest', 'Nord-Nord-Ouest'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Fonction pour créer plusieurs cartes météo avec informations supplémentaires
function createWeatherCards(dataArray, communeData, selectedAdditionalInfo) {
  const weatherSection = document.getElementById("weatherInformation");
  const requestSection = document.getElementById("cityForm");
  
  // Vider la section météo
  weatherSection.innerHTML = "";
  
  dataArray.forEach((data, index) => {
    // Créer la carte pour chaque jour
    const weatherDay = document.createElement("div");
    weatherDay.className = "weather-day";
    
    // Calculer la date
    const date = new Date();
    date.setDate(date.getDate() + index);
    const dateStr = index === 0 ? "Aujourd'hui" : 
                   index === 1 ? "Demain" : 
                   date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    
    // Informations de base
    let weatherContent = `
      <div class="weather-info">
        <strong>Température min</strong><br>
        ${data.forecast.tmin}°C
      </div>
      <div class="weather-info">
        <strong>Température max</strong><br>
        ${data.forecast.tmax}°C
      </div>
      <div class="weather-info">
        <strong>Probabilité de pluie</strong><br>
        ${data.forecast.probarain}%
      </div>
      <div class="weather-info">
        <strong>Ensoleillement</strong><br>
        ${displayHours(data.forecast.sun_hours)}
      </div>
    `;

    // Ajouter les informations supplémentaires selon la sélection
    if (selectedAdditionalInfo.includes('latitude')) {
      weatherContent += `
        <div class="weather-info additional-info">
          <strong>Latitude</strong><br>
          ${communeData.lat}°
        </div>
      `;
    }

    if (selectedAdditionalInfo.includes('longitude')) {
      weatherContent += `
        <div class="weather-info additional-info">
          <strong>Longitude</strong><br>
          ${communeData.lon}°
        </div>
      `;
    }

    if (selectedAdditionalInfo.includes('rain')) {
      weatherContent += `
        <div class="weather-info additional-info">
          <strong>Cumul de pluie</strong><br>
          ${data.forecast.rr10 || 0} mm
        </div>
      `;
    }

    if (selectedAdditionalInfo.includes('windSpeed')) {
      // Convertir m/s en km/h (multiplier par 3.6)
      const windSpeedKmh = Math.round(data.forecast.wind10m * 3.6);
      weatherContent += `
        <div class="weather-info additional-info">
          <strong>Vent moyen</strong><br>
          ${windSpeedKmh} km/h
        </div>
      `;
    }

    if (selectedAdditionalInfo.includes('windDirection')) {
      const windDirectionText = getWindDirection(data.forecast.dirwind10m);
      weatherContent += `
        <div class="weather-info additional-info">
          <strong>Direction du vent</strong><br>
          ${data.forecast.dirwind10m}° (${windDirectionText})
        </div>
      `;
    }
    
    weatherDay.innerHTML = `
      <h3>${dateStr}</h3>
      <div class="weather-day-content">
        ${weatherContent}
      </div>
    `;
    
    weatherSection.appendChild(weatherDay);
  });

  // Ajouter le bouton de retour
  const reloadButton = document.createElement("div");
  reloadButton.textContent = "Nouvelle recherche";
  reloadButton.classList.add("reloadButton");
  document.body.appendChild(reloadButton);
  
  reloadButton.addEventListener("click", function () {
    location.reload();
  });

  // Gérer la visibilité des sections
  requestSection.style.display = "none";
  weatherSection.style.display = "flex";
}

// Fonction pour une seule carte (gardée pour compatibilité)
function createCard(data, communeData, selectedAdditionalInfo) {
  createWeatherCards([data], communeData, selectedAdditionalInfo);
}

function displayHours(sunHours) {
  return sunHours + (sunHours > 1 ? " heures" : " heure");
}