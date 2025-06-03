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

// Fonction pour afficher les heures d'ensoleillement
function displayHours(sunHours) {
    return sunHours + (sunHours > 1 ? " heures" : " heure");
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
                <strong>Température min</strong>
                <div class="weather-value">${data.forecast.tmin}°C</div>
            </div>
            <div class="weather-info">
                <strong>Température max</strong>
                <div class="weather-value">${data.forecast.tmax}°C</div>
            </div>
            <div class="weather-info">
                <strong>Probabilité de pluie</strong>
                <div class="weather-value">${data.forecast.probarain}%</div>
            </div>
            <div class="weather-info">
                <strong>Ensoleillement</strong>
                <div class="weather-value">${displayHours(data.forecast.sun_hours)}</div>
            </div>
        `;

        // Ajouter les informations supplémentaires selon la sélection
        if (selectedAdditionalInfo.includes('latitude')) {
            weatherContent += `
                <div class="weather-info additional-info">
                    <strong>Latitude</strong>
                    <div class="weather-value">${parseFloat(communeData.lat).toFixed(4)}°</div>
                </div>
            `;
        }

        if (selectedAdditionalInfo.includes('longitude')) {
            weatherContent += `
                <div class="weather-info additional-info">
                    <strong>Longitude</strong>
                    <div class="weather-value">${parseFloat(communeData.lon).toFixed(4)}°</div>
                </div>
            `;
        }

        if (selectedAdditionalInfo.includes('rain')) {
            weatherContent += `
                <div class="weather-info additional-info">
                    <strong>Cumul de pluie</strong>
                    <div class="weather-value">${data.forecast.rr10 || 0} mm</div>
                </div>
            `;
        }

        if (selectedAdditionalInfo.includes('windSpeed')) {
            // Convertir m/s en km/h (multiplier par 3.6)
            const windSpeedKmh = Math.round(data.forecast.wind10m * 3.6);
            weatherContent += `
                <div class="weather-info additional-info">
                    <strong>Vent moyen</strong>
                    <div class="weather-value">${windSpeedKmh} km/h</div>
                </div>
            `;
        }

        if (selectedAdditionalInfo.includes('windDirection')) {
            const windDirectionText = getWindDirection(data.forecast.dirwind10m);
            weatherContent += `
                <div class="weather-info additional-info">
                    <strong>Direction du vent</strong>
                    <div class="weather-value">${data.forecast.dirwind10m}° (${windDirectionText})</div>
                </div>
            `;
        }
        
        weatherDay.innerHTML = `
            <h3>${dateStr}</h3>
            <div class="weather-content">
                ${weatherContent}
            </div>
        `;
        
        weatherSection.appendChild(weatherDay);
    });

    // Ajouter le bouton de retour
    const reloadButton = document.createElement("button");
    reloadButton.textContent = "Nouvelle recherche";
    reloadButton.className = "reload-button";
    reloadButton.addEventListener("click", () => location.reload());
    weatherSection.appendChild(reloadButton);

    // Masquer le formulaire et afficher la météo
    requestSection.style.display = "none";
    weatherSection.style.display = "block";
}

// Fonction pour une seule carte (gardée pour compatibilité avec l'ancienne version)
function createCard(data, communeData, selectedAdditionalInfo) {
    createWeatherCards([data], communeData, selectedAdditionalInfo);
}