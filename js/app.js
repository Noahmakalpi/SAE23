// Variables globales
let selectedDays = 1;
let selectedCommuneData = null;
let isDarkMode = false;

// Sélection des éléments
const codePostalInput = document.getElementById("code-postal");
const communeSelect = document.getElementById("communeSelect");
const validationButton = document.getElementById("validationButton");
const daySelector = document.getElementById("daySelector");
const additionalInfoSelector = document.getElementById("additionalInfoSelector");
const dayButtons = document.querySelectorAll(".day-button");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const loadingIndicator = document.getElementById("loadingIndicator");

// Fonction pour basculer le thème
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.documentElement.classList.toggle('dark-mode', isDarkMode);
  
  // Changer l'icône
  if (isDarkMode) {
    themeIcon.className = 'fas fa-sun';
    themeToggle.setAttribute('aria-label', 'Basculer vers le mode clair');
  } else {
    themeIcon.className = 'fas fa-moon';
    themeToggle.setAttribute('aria-label', 'Basculer vers le mode sombre');
  }
}

// Charger la préférence de thème au démarrage (détection système)
function loadThemePreference() {
  // Détecter la préférence système
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDarkMode = true;
    document.documentElement.classList.add('dark-mode');
    themeIcon.className = 'fas fa-sun';
    themeToggle.setAttribute('aria-label', 'Basculer vers le mode clair');
  }
}

// Écouter les changements de préférence système
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!isDarkMode && e.matches) {
      toggleTheme();
    } else if (isDarkMode && !e.matches) {
      toggleTheme();
    }
  });
}

// Charger le thème au démarrage
document.addEventListener('DOMContentLoaded', loadThemePreference);

// Écouteur d'événement pour le bouton de thème
themeToggle.addEventListener('click', toggleTheme);

// Fonction utilitaire pour afficher/masquer le loading
function showLoading(show = true) {
  loadingIndicator.style.display = show ? 'flex' : 'none';
}

// Fonction utilitaire pour afficher les erreurs
function showError(message, duration = 5000) {
  // Supprimer un message précédent s'il existe
  const existingMessage = document.getElementById("error-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.id = "error-message";
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  
  // Insérer après le formulaire
  const formSection = document.getElementById("cityForm");
  formSection.parentNode.insertBefore(errorDiv, formSection.nextSibling);

  // Supprimer automatiquement après la durée spécifiée
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, duration);
}

// Gestion des boutons de sélection de jours
dayButtons.forEach(button => {
  button.addEventListener("click", () => {
    dayButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    selectedDays = parseInt(button.dataset.days);
  });
});

// Fonction pour obtenir les informations supplémentaires sélectionnées
function getSelectedAdditionalInfo() {
  const checkboxes = document.querySelectorAll('input[name="additionalInfo"]:checked');
  return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// Fonction pour valider le code postal
function isValidCodePostal(codePostal) {
  return /^\d{5}$/.test(codePostal);
}

// Fonction pour effectuer la requête API des communes
async function fetchCommunesByCodePostal(codePostal) {
  if (!isValidCodePostal(codePostal)) {
    throw new Error("Code postal invalide");
  }

  showLoading(true);
  
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom,code,codesPostaux,centre&format=json&geometry=centre`
    );
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.table(data);
    return data;
  } catch (error) {
    console.error("Erreur lors de la requête API:", error);
    throw error;
  } finally {
    showLoading(false);
  }
}

// Fonction pour afficher les communes dans la liste déroulante
function displayCommunes(data) {
  communeSelect.innerHTML = "";
  
  if (data.length > 0) {
    // Ajouter une option par défaut
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Sélectionnez une commune";
    communeSelect.appendChild(defaultOption);

    data.forEach((commune) => {
      const option = document.createElement("option");
      option.value = commune.code;
      option.textContent = commune.nom;
      option.dataset.communeData = JSON.stringify({
        nom: commune.nom,
        code: commune.code,
        lat: commune.centre.coordinates[1],
        lon: commune.centre.coordinates[0]
      });
      communeSelect.appendChild(option);
    });
    
    communeSelect.style.display = "block";
    daySelector.style.display = "block";
    additionalInfoSelector.style.display = "block";
    validationButton.style.display = "block";
  } else {
    showError("Aucune commune trouvée pour ce code postal");
    hideFormElements();
  }
}

// Fonction pour masquer les éléments du formulaire
function hideFormElements() {
  communeSelect.style.display = "none";
  daySelector.style.display = "none";
  additionalInfoSelector.style.display = "none";
  validationButton.style.display = "none";
}

// Fonction pour effectuer la requête API de météo
async function fetchMeteoByCommune(selectedCommune, days = 1) {
  showLoading(true);
  
  try {
    const promises = [];
    for (let i = 0; i < days; i++) {
      const promise = fetch(
        `https://api.meteo-concept.com/api/forecast/daily/${i}?token=4bba169b3e3365061d39563419ab23e5016c0f838ba282498439c41a00ef1091&insee=${selectedCommune}`
      ).then(response => {
        if (!response.ok) {
          throw new Error(`Erreur API météo: ${response.status}`);
        }
        return response.json();
      });
      promises.push(promise);
    }
    
    const data = await Promise.all(promises);
    return data;
  } catch (error) {
    console.error("Erreur lors de la requête API météo:", error);
    throw error;
  } finally {
    showLoading(false);
  }
}

// Gestionnaire d'événement pour la sélection de commune
communeSelect.addEventListener("change", () => {
  const selectedOption = communeSelect.options[communeSelect.selectedIndex];
  if (selectedOption.dataset.communeData) {
    selectedCommuneData = JSON.parse(selectedOption.dataset.communeData);
  }
});

// Debounce pour l'input du code postal
let debounceTimer;
codePostalInput.addEventListener("input", async () => {
  const codePostal = codePostalInput.value.trim();
  
  // Clear previous timer
  clearTimeout(debounceTimer);
  
  // Masquer les éléments immédiatement
  hideFormElements();
  
  if (codePostal.length === 0) {
    return;
  }
  
  // Debounce de 500ms
  debounceTimer = setTimeout(async () => {
    if (isValidCodePostal(codePostal)) {
      try {
        const data = await fetchCommunesByCodePostal(codePostal);
        displayCommunes(data);
      } catch (error) {
        showError("Erreur lors de la recherche des communes");
        console.error("Erreur:", error);
      }
    } else if (codePostal.length === 5) {
      showError("Code postal invalide (5 chiffres requis)");
    }
  }, 500);
});

// Validation du formulaire avant soumission
function validateForm() {
  if (!selectedCommuneData) {
    showError("Veuillez sélectionner une commune");
    return false;
  }
  
  if (!communeSelect.value) {
    showError("Veuillez sélectionner une commune dans la liste");
    return false;
  }
  
  return true;
}

// Écouteur d'événement pour le bouton de validation
validationButton.addEventListener("click", async () => {
  if (!validateForm()) {
    return;
  }

  const selectedCommune = communeSelect.value;
  
  try {
    const selectedAdditionalInfo = getSelectedAdditionalInfo();
    const data = await fetchMeteoByCommune(selectedCommune, selectedDays);
    createWeatherCards(data, selectedCommuneData, selectedAdditionalInfo);
  } catch (error) {
    showError("Erreur lors de la récupération des données météo");
    console.error("Erreur météo:", error);
  }
});

// Gestion des touches du clavier
document.addEventListener('keydown', (e) => {
  // Échapper pour fermer les erreurs
  if (e.key === 'Escape') {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  }
  
  // Entrée pour valider si le bouton est visible
  if (e.key === 'Enter' && validationButton.style.display === 'block') {
    validationButton.click();
  }
});