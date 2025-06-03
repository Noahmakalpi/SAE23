// Variables globales
let selectedDays = 1;
let selectedCommuneData = null; // Pour stocker les données de la commune sélectionnée
let isDarkMode = false; // État du mode sombre

// Sélection des éléments
const codePostalInput = document.getElementById("code-postal");
const communeSelect = document.getElementById("communeSelect");
const validationButton = document.getElementById("validationButton");
const daySelector = document.getElementById("daySelector");
const additionalInfoSelector = document.getElementById("additionalInfoSelector");
const dayButtons = document.querySelectorAll(".day-button");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// NOUVEAU : Fonction pour basculer le thème
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  // Changer l'icône
  if (isDarkMode) {
    themeIcon.className = 'fas fa-sun';
    themeToggle.setAttribute('aria-label', 'Basculer vers le mode clair');
  } else {
    themeIcon.className = 'fas fa-moon';
    themeToggle.setAttribute('aria-label', 'Basculer vers le mode sombre');
  }
  
  // Sauvegarder la préférence dans le stockage local
  try {
    localStorage.setItem('darkMode', isDarkMode);
  } catch (e) {
    // Ignorer si localStorage n'est pas disponible
  }
}

// NOUVEAU : Charger la préférence de thème au démarrage
function loadThemePreference() {
  try {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      isDarkMode = true;
      document.body.classList.add('dark-mode');
      themeIcon.className = 'fas fa-sun';
      themeToggle.setAttribute('aria-label', 'Basculer vers le mode clair');
    }
  } catch (e) {
    // Ignorer si localStorage n'est pas disponible
  }
}

// Charger le thème au démarrage
document.addEventListener('DOMContentLoaded', loadThemePreference);

// NOUVEAU : Écouteur d'événement pour le bouton de thème
themeToggle.addEventListener('click', toggleTheme);

// Gestion des boutons de sélection de jours
dayButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Retirer la classe active de tous les boutons
    dayButtons.forEach(btn => btn.classList.remove("active"));
    // Ajouter la classe active au bouton cliqué
    button.classList.add("active");
    // Mettre à jour le nombre de jours sélectionné
    selectedDays = parseInt(button.dataset.days);
  });
});

// Fonction pour obtenir les informations supplémentaires sélectionnées
function getSelectedAdditionalInfo() {
  const checkboxes = document.querySelectorAll('input[name="additionalInfo"]:checked');
  return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// Fonction pour effectuer la requête API des communes en utilisant le code postal
async function fetchCommunesByCodePostal(codePostal) {
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom,code,codesPostaux,centre&format=json&geometry=centre`
    );
    const data = await response.json();
    console.table(data);
    return data;
  } catch (error) {
    console.error("Erreur lors de la requête API:", error);
    throw error;
  }
}

// Fonction pour afficher les communes dans la liste déroulante
function displayCommunes(data) {
  communeSelect.innerHTML = "";
  // S'il y a au moins une commune retournée dans data
  if (data.length) {
    data.forEach((commune) => {
      const option = document.createElement("option");
      option.value = commune.code;
      option.textContent = commune.nom;
      // Stocker les données complètes de la commune dans un attribut data
      option.dataset.communeData = JSON.stringify({
        nom: commune.nom,
        code: commune.code,
        lat: commune.centre.coordinates[1], // Latitude
        lon: commune.centre.coordinates[0]  // Longitude
      });
      communeSelect.appendChild(option);
    });
    communeSelect.style.display = "block";
    daySelector.style.display = "block";
    additionalInfoSelector.style.display = "block"; // NOUVEAU : Afficher les cases à cocher
    validationButton.style.display = "block";
  }
  else {
    // Supprimer un message précédent s'il existe déjà
    const existingMessage = document.getElementById("error-message");
    if (!existingMessage) {
      const message = document.createElement("p");
      message.id = "error-message";
      message.textContent = "Le code postal saisi n'est pas valide";
      message.classList.add('errorMessage');
      document.body.appendChild(message);
    }

    // Masquer les éléments inutiles
    communeSelect.style.display = "none";
    daySelector.style.display = "none";
    additionalInfoSelector.style.display = "none"; // NOUVEAU
    validationButton.style.display = "none";

    // Recharger la page après 3 secondes
    setTimeout(() => location.reload(), 3000);
  }
}

// Fonction pour effectuer la requête API de météo pour plusieurs jours
async function fetchMeteoByCommune(selectedCommune, days = 1) {
  try {
    const promises = [];
    for (let i = 0; i < days; i++) {
      const response = fetch(
        `https://api.meteo-concept.com/api/forecast/daily/${i}?token=4bba169b3e3365061d39563419ab23e5016c0f838ba282498439c41a00ef1091&insee=${selectedCommune}`
      );
      promises.push(response);
    }
    
    const responses = await Promise.all(promises);
    const dataPromises = responses.map(response => response.json());
    const data = await Promise.all(dataPromises);
    
    return data;
  } catch (error) {
    console.error("Erreur lors de la requête API:", error);
    throw error;
  }
}

// Gestionnaire d'événement pour la sélection de commune
communeSelect.addEventListener("change", () => {
  const selectedOption = communeSelect.options[communeSelect.selectedIndex];
  if (selectedOption.dataset.communeData) {
    selectedCommuneData = JSON.parse(selectedOption.dataset.communeData);
  }
});

// Ajout de l'écouteur d'événement "input" sur le champ code postal
codePostalInput.addEventListener("input", async () => {
  const codePostal = codePostalInput.value;
  communeSelect.style.display = "none";
  daySelector.style.display = "none";
  additionalInfoSelector.style.display = "none"; // NOUVEAU
  validationButton.style.display = "none";

  if (/^\d{5}$/.test(codePostal)) {
    try {
      const data = await fetchCommunesByCodePostal(codePostal);
      displayCommunes(data);
    } catch (error) {
      console.error(
        "Une erreur est survenue lors de la recherche de la commune :",
        error
      );
      throw error;
    }
  }
});

// Ajout de l'écouteur d'événement "click" sur le bouton de validation
validationButton.addEventListener("click", async () => {
  const selectedCommune = communeSelect.value;
  if (selectedCommune) {
    // S'assurer que nous avons les données de la commune
    if (!selectedCommuneData) {
      const selectedOption = communeSelect.options[communeSelect.selectedIndex];
      if (selectedOption.dataset.communeData) {
        selectedCommuneData = JSON.parse(selectedOption.dataset.communeData);
      }
    }

    try {
      const selectedAdditionalInfo = getSelectedAdditionalInfo();
      const data = await fetchMeteoByCommune(selectedCommune, selectedDays);
      createWeatherCards(data, selectedCommuneData, selectedAdditionalInfo);
    } catch (error) {
      console.error("Erreur lors de la requête API meteoConcept:", error);
      throw error;
    }
  }
});