/* ===== GLOBAL STATE ===== */
let profiles = [];
let currentProfileIndex = 0;
let currentType = "animes"; // animes, films, series
let filterType = "tout"; // tout, animes, films, series
let sortBy = "date_new"; // date_new, date_old, rating_high, rating_low, name

let animes = [];
let films = [];
let series = [];
let watch = [];
let editIndex = null;

/* ===== FIREBASE LOADING ===== */
window.loadProfilesFromFirebase = async function() {
    if(!window.auth || !window.auth.currentUser) {
        console.log("Non connecté, utilisation du stockage local");
        loadProfilesLocal();
        return;
    }
    
    try {
        const data = window.userDataFromFirebase;
        if(data && data.profiles) {
            profiles = data.profiles;
            currentProfileIndex = data.currentProfileIndex || 0;
            console.log("Profils chargés depuis Firebase:", profiles);
        } else {
            loadProfilesLocal();
        }
    } catch(e) {
        console.error("Erreur Firebase:", e);
        loadProfilesLocal();
    }
    
    renderProfileSelect();
    renderProfile();
    render();
};

function loadProfilesLocal() {
    profiles = JSON.parse(localStorage.getItem("profiles")) || [];
    currentProfileIndex = JSON.parse(localStorage.getItem("currentProfileIndex")) || 0;
    
    if(profiles.length === 0) {
        profiles.push({
            name: "Profil 1",
            avatar: "https://via.placeholder.com/100",
            bio: "",
            animes: [],
            films: [],
            series: [],
            watch: []
        });
    }
}

/* ===== AUTH MODAL ===== */
window.toggleAuthOrProfile = function() {
    if(window.auth && window.auth.currentUser) {
        // L'utilisateur est connecté, afficher son profil
        window.openProfileModal();
    } else {
        // L'utilisateur n'est pas connecté, afficher le modal d'authentification
        window.openAuthModal();
    }
};

window.openAuthModal = function() {
    const modal = document.getElementById("authModal");
    if(modal) modal.classList.add("active");
};

window.closeAuthModal = function() {
    const modal = document.getElementById("authModal");
    if(modal) modal.classList.remove("active");
};

window.openProfileModal = function() {
    const p = profiles[currentProfileIndex];
    if(!p) return;
    
    // Remplir les informations du profil
    const avatar = document.getElementById("profileModalAvatar");
    const name = document.getElementById("profileModalName");
    const email = document.getElementById("profileModalEmail");
    const bio = document.getElementById("profileModalBio");
    
    if(avatar) avatar.src = p.avatar;
    if(name) name.textContent = p.name;
    if(email) email.textContent = window.auth && window.auth.currentUser ? window.auth.currentUser.email : "Non connecté";
    if(bio) bio.textContent = p.bio || "Aucune bio";
    
    const modal = document.getElementById("profileModal");
    if(modal) modal.classList.add("active");
};

window.closeProfileModal = function() {
    const modal = document.getElementById("profileModal");
    if(modal) modal.classList.remove("active");
};

window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authTitle = document.getElementById("authTitle");
    const buttons = document.querySelectorAll(".modal-content .tab-btn");
    
    buttons.forEach(btn => btn.classList.remove("active"));
    
    if(tab === "login") {
        if(loginForm) loginForm.style.display = "block";
        if(registerForm) registerForm.style.display = "none";
        if(authTitle) authTitle.textContent = "Se connecter";
        if(buttons[0]) buttons[0].classList.add("active");
    } else {
        if(loginForm) loginForm.style.display = "none";
        if(registerForm) registerForm.style.display = "block";
        if(authTitle) authTitle.textContent = "Créer un compte";
        if(buttons[1]) buttons[1].classList.add("active");
    }
};

window.updateAuthIcon = function() {
    const icon = document.getElementById("authIcon");
    if(!icon) return;
    if(window.auth && window.auth.currentUser) {
        icon.textContent = "✅";
        icon.title = window.auth.currentUser.email;
    } else {
        icon.textContent = "👤";
        icon.title = "Cliquez pour vous connecter";
    }
};

/* ===== TYPE SELECTION ===== */
window.switchType = function(type) {
    currentType = type;
    
    // Update buttons
    document.querySelectorAll(".type-tabs .tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if(btn.dataset.type === type) btn.classList.add("active");
    });
    
    // Load data for type
    const p = profiles[currentProfileIndex];
    if(p) {
        animes = p.animes || [];
        films = p.films || [];
        series = p.series || [];
    }
    
    render();
};

window.switchFilterType = function(type) {
    filterType = type;
    
    // Update buttons
    document.querySelectorAll(".type-tabs .tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if(btn.dataset.type === type) btn.classList.add("active");
    });
    
    // Update select
    const select = document.getElementById("filterType");
    if(select) select.value = type;
    
    render();
};

/* ===== UTILS ===== */
const stars = n => "⭐".repeat(n);

async function saveProfiles() {
    if(window.auth && window.auth.currentUser && window.db) {
        try {
            const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
            await updateDoc(doc(window.db, "users", window.auth.currentUser.uid), {
                profiles: profiles,
                currentProfileIndex: currentProfileIndex
            });
            console.log("Profils sauvegardés sur Firebase");
        } catch(e) {
            console.error("Erreur sauvegarde Firebase:", e);
            localStorage.setItem("profiles", JSON.stringify(profiles));
            localStorage.setItem("currentProfileIndex", JSON.stringify(currentProfileIndex));
        }
    } else {
        localStorage.setItem("profiles", JSON.stringify(profiles));
        localStorage.setItem("currentProfileIndex", JSON.stringify(currentProfileIndex));
    }
}

function renderProfileSelect() {
    if(!profileSelect) return;
    profileSelect.innerHTML = profiles.map((p,i)=>
        `<option value="${i}" ${i===currentProfileIndex?'selected':''}>${p.name}</option>`).join("");
}

function renderProfile() {
    const p = profiles[currentProfileIndex];
    if(!p) return;
    
    if(profileName) profileName.textContent = p.name;
    if(profileAvatar) profileAvatar.src = p.avatar;
    if(profileBio) profileBio.textContent = p.bio;

    if(profileNameInput) profileNameInput.value = p.name;
    if(profileAvatarInput) profileAvatarInput.value = p.avatar;
    if(profileBioInput) profileBioInput.value = p.bio;

    animes = p.animes || [];
    films = p.films || [];
    series = p.series || [];
    watch = p.watch || [];
}

const profileSelect = document.getElementById("profileSelect");
const profileName = document.getElementById("profileName");
const profileAvatar = document.getElementById("profileAvatar");
const profileBio = document.getElementById("profileBio");
const profileNameInput = document.getElementById("profileNameInput");
const profileAvatarInput = document.getElementById("profileAvatarInput");
const profileBioInput = document.getElementById("profileBioInput");

const animeListEl = document.getElementById("animeList");
const watchListEl = document.getElementById("watchList");

/* ===== CRUD OPERATIONS ===== */
function switchProfile(index) {
    currentProfileIndex = +index;
    renderProfile();
    render();
}

async function addProfile() {
    const name = prompt("Nom du nouveau profil ?") || "Profil";
    profiles.push({
        name,
        avatar: "https://via.placeholder.com/100",
        bio: "",
        animes: [],
        films: [],
        series: [],
        watch: []
    });
    currentProfileIndex = profiles.length - 1;
    await saveProfiles();
    renderProfileSelect();
    renderProfile();
    render();
}

async function deleteProfile() {
    if(profiles.length <= 1) {
        alert("Impossible de supprimer le dernier profil");
        return;
    }
    if(confirm(`Supprimer le profil ${profiles[currentProfileIndex].name} ?`)) {
        profiles.splice(currentProfileIndex, 1);
        currentProfileIndex = 0;
        await saveProfiles();
        renderProfileSelect();
        renderProfile();
        render();
    }
}

async function saveProfile() {
    const p = profiles[currentProfileIndex];
    p.name = profileNameInput.value || p.name;
    p.avatar = profileAvatarInput.value || p.avatar;
    p.bio = profileBioInput.value || "";
    await saveProfiles();
    renderProfile();
    renderProfileSelect();
}

/* ===== SAVE DATA ===== */
const saveData = async () => {
    const p = profiles[currentProfileIndex];
    p.animes = animes;
    p.films = films;
    p.series = series;
    p.watch = watch;
    await saveProfiles();
};

/* ===== ADD/EDIT/DELETE ===== */

function loadEditingData() {
    const editingItem = localStorage.getItem("editingItem");
    const editingType = localStorage.getItem("editingType");
    const editingIndex = localStorage.getItem("editingIndex");
    
    if(editingItem && editingType !== null && editingIndex !== null) {
        const item = JSON.parse(editingItem);
        const titleEl = document.getElementById("title");
        const imageEl = document.getElementById("image");
        const ratingEl = document.getElementById("rating");
        const dateEl = document.getElementById("date");
        const commentEl = document.getElementById("comment");
        
        if(titleEl) titleEl.value = item.title;
        if(imageEl) imageEl.value = item.image;
        if(ratingEl) ratingEl.value = item.rating;
        if(dateEl) dateEl.value = item.date;
        if(commentEl) commentEl.value = item.comment;
        
        // Sauvegarder les infos d'édition dans les variables globales
        window.editingType = editingType;
        window.editingIndex = parseInt(editingIndex);
        editIndex = parseInt(editingIndex);
    }
}

async function saveItem() {
    const titleEl = document.getElementById("title");
    const imageEl = document.getElementById("image");
    const ratingEl = document.getElementById("rating");
    const dateEl = document.getElementById("date");
    const commentEl = document.getElementById("comment");
    
    if(!titleEl || !titleEl.value) return alert("Nom requis");
    
    const item = {
        title: titleEl.value,
        image: imageEl ? imageEl.value || "https://via.placeholder.com/400x600" : "https://via.placeholder.com/400x600",
        rating: ratingEl ? parseFloat(ratingEl.value) || 1 : 1,
        date: dateEl ? dateEl.value : "",
        comment: commentEl ? commentEl.value : ""
    };
    
    // Déterminer le type à utiliser (edit type ou current type)
    const typeToUse = window.editingType || currentType;
    const currentList = typeToUse === "animes" ? animes : typeToUse === "films" ? films : series;
    
    const isNewItem = editIndex === null;
    
    if(editIndex === null) {
        currentList.push(item);
    } else {
        currentList[editIndex] = item;
    }
    
    editIndex = null;
    window.editingType = null;
    window.editingIndex = null;

    if(titleEl) titleEl.value = "";
    if(imageEl) imageEl.value = "";
    if(commentEl) commentEl.value = "";
    if(dateEl) dateEl.value = "";
    if(ratingEl) ratingEl.value = 1;

    await saveData();
    render();
    
    // Nettoyer les données d'édition du localStorage
    localStorage.removeItem("editingType");
    localStorage.removeItem("editingIndex");
    localStorage.removeItem("editingItem");
    
    // Redirection vers la bibliothèque seulement pour un nouvel ajout
    if(isNewItem) {
        window.location.href = "list.html";
    }
}

function editItem(i, typeParam = null) {
    // Déterminer le type à utiliser
    const type = typeParam || currentType;
    const currentList = type === "animes" ? animes : type === "films" ? films : series;
    const item = currentList[i];
    
    if(!item) return;
    
    // Sauvegarder les données d'édition dans localStorage
    localStorage.setItem("editingType", type);
    localStorage.setItem("editingIndex", i);
    localStorage.setItem("editingItem", JSON.stringify(item));
    
    // Naviguer vers la page d'ajout pour éditer
    window.location.href = "add.html";
}

async function deleteItem(i, typeParam = null) {
    if(confirm("Supprimer cet élément ?")) {
        const type = typeParam || currentType;
        const currentList = type === "animes" ? animes : type === "films" ? films : series;
        currentList.splice(i, 1);
        await saveData();
        render();
    }
}

/* ===== WATCHLIST ===== */
async function addWatch() {
    const watchInput = document.getElementById("watchInput");
    if(!watchInput || !watchInput.value) return;
    watch.push(watchInput.value);
    watchInput.value = "";
    await saveData();
    render();
}

async function watchToAnime(i) {
    const titleEl = document.getElementById("title");
    if(titleEl) titleEl.value = watch[i];
    watch.splice(i,1);
    await saveData();
    render();
}

async function deleteFromWatch(i) {
    if(confirm("Supprimer de la watchlist ?")) {
        watch.splice(i, 1);
        await saveData();
        render();
    }
}

/* ===== SORT ===== */
function sortItems(type) {
    const currentList = currentType === "animes" ? animes : currentType === "films" ? films : series;
    
    if(type === "name") currentList.sort((a,b) => a.title.localeCompare(b.title));
    if(type === "rating") currentList.sort((a,b) => b.rating - a.rating);
    if(type === "date") currentList.sort((a,b) => new Date(b.date) - new Date(a.date));
    render();
}

// Fonction pour obtenir tous les items filtrés et triés
function getFilteredAndSortedItems() {
    let allItems = [];
    
    // Ajouter les items selon le filtre de type
    if(filterType === "tout") {
        allItems = [
            ...animes.map(a => ({...a, type: "animes"})),
            ...films.map(f => ({...f, type: "films"})),
            ...series.map(s => ({...s, type: "series"}))
        ];
    } else if(filterType === "animes") {
        allItems = animes.map(a => ({...a, type: "animes"}));
    } else if(filterType === "films") {
        allItems = films.map(f => ({...f, type: "films"}));
    } else if(filterType === "series") {
        allItems = series.map(s => ({...s, type: "series"}));
    }
    
    // Appliquer le tri
    switch(sortBy) {
        case "date_new":
            allItems.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
            break;
        case "date_old":
            allItems.sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0));
            break;
        case "rating_high":
            allItems.sort((a,b) => b.rating - a.rating);
            break;
        case "rating_low":
            allItems.sort((a,b) => a.rating - b.rating);
            break;
        case "name":
            allItems.sort((a,b) => a.title.localeCompare(b.title));
            break;
    }
    
    return allItems;
}

/* ===== STATS ===== */
function updateStats() {
    const statTotal = document.getElementById("statTotal");
    const statFilms = document.getElementById("statFilms");
    const statSeries = document.getElementById("statSeries");
    const statWatch = document.getElementById("statWatch");
    const statGrandTotal = document.getElementById("statGrandTotal");
    const statAvgRating = document.getElementById("statAvgRating");
    const statBestRating = document.getElementById("statBestRating");
    const statWithComments = document.getElementById("statWithComments");
    
    if(!statTotal) return;
    
    statTotal.textContent = animes.length;
    if(statFilms) statFilms.textContent = films.length;
    if(statSeries) statSeries.textContent = series.length;
    if(statWatch) statWatch.textContent = watch.length;
    
    // Nouvelles stats
    const allItems = [...animes, ...films, ...series];
    
    if(statGrandTotal) statGrandTotal.textContent = allItems.length;
    
    // Note moyenne
    if(statAvgRating && allItems.length > 0) {
        const avgRating = (allItems.reduce((acc, item) => acc + item.rating, 0) / allItems.length).toFixed(1);
        statAvgRating.textContent = avgRating + "⭐";
    } else if(statAvgRating) {
        statAvgRating.textContent = "0⭐";
    }
    
    // Meilleure note
    if(statBestRating && allItems.length > 0) {
        const bestRating = Math.max(...allItems.map(item => item.rating));
        statBestRating.textContent = bestRating + "⭐";
    } else if(statBestRating) {
        statBestRating.textContent = "0⭐";
    }
    
    // Nombre d'items avec avis
    if(statWithComments) {
        const withComments = allItems.filter(item => item.comment && item.comment.trim().length > 0).length;
        statWithComments.textContent = withComments;
    }
}

/* ===== RENDER ===== */
function render() {
    if(animeListEl) {
        const searchEl = document.getElementById("search");
        const q = searchEl && searchEl.value ? searchEl.value.toLowerCase() : "";
        
        // Vérifier si nous sommes sur la page list.html
        const isListPage = document.getElementById("filterType") !== null;
        
        let itemsToShow;
        if(isListPage) {
            // Page de bibliothèque avec filtres avancés
            itemsToShow = getFilteredAndSortedItems()
                .filter(a => a.title.toLowerCase().includes(q));
        } else {
            // Page add.html avec type courant uniquement
            const currentList = currentType === "animes" ? animes : currentType === "films" ? films : series;
            itemsToShow = currentList
                .filter(a => a.title.toLowerCase().includes(q))
                .map(a => ({...a, type: currentType}));
        }
        
        animeListEl.innerHTML = itemsToShow
            .map((a, i) => {
                const typeLabel = a.type === "animes" ? "🎌" : a.type === "films" ? "🎬" : "📺";
                const typeName = a.type === "animes" ? "Animé" : a.type === "films" ? "Film" : "Série";
                
                // Trouver l'index réel dans le tableau original
                let realIndex = i;
                if(isListPage) {
                    // Sur la page list, on doit trouver l'index dans le tableau d'origine
                    const originalList = a.type === "animes" ? animes : a.type === "films" ? films : series;
                    realIndex = originalList.findIndex(item => item.title === a.title && item.date === a.date);
                }
                
                return `
            <div class="card">
                <img src="${a.image}" alt="${a.title}">
                <div class="card-content">
                    <div class="card-type">${typeLabel} ${typeName}</div>
                    <div class="card-title">${a.title}</div>
                    <div class="card-rating">${stars(a.rating)}</div>
                    <div class="card-meta">📅 ${a.date || "?"}</div>
                    <div class="card-comment">${a.comment || ""}</div>
                    <div class="card-actions">
                        <button class="btn-small" onclick="editItem(${realIndex}, '${a.type}')">✏️ Éditer</button>
                        <button class="btn-small btn-danger" onclick="deleteItem(${realIndex}, '${a.type}')">🗑️ Supprimer</button>
                    </div>
                </div>
            </div>`;
            }).join("");
        
        // Mettre à jour le compteur d'items
        const countEl = document.getElementById("countItems");
        if(countEl) countEl.textContent = itemsToShow.length;
    }

    if(watchListEl) {
        watchListEl.innerHTML = watch.map((w,i) => `
            <div class="card">
                <div style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
                    <div style="font-size: 48px; margin-bottom: 12px;">⏳</div>
                    <div style="font-size: 16px; font-weight: 600;">${w}</div>
                </div>
                <div class="card-content" style="text-align: center;">
                    <p style="color: var(--text-muted); font-size: 13px; margin: 12px 0;">En attente de visionnage</p>
                    <div class="card-actions">
                        <button class="btn-small" onclick="watchToAnime(${i})">✔️ Regardé</button>
                        <button class="btn-small btn-danger" onclick="deleteFromWatch(${i})">🗑️ Supprimer</button>
                    </div>
                </div>
            </div>`).join("");
        
        // Afficher/masquer le message vide
        const emptyWatch = document.getElementById("emptyWatch");
        if(emptyWatch) {
            emptyWatch.style.display = watch.length === 0 ? "block" : "none";
        }
        
        // Mettre à jour le compteur
        const countWatch = document.getElementById("countWatch");
        if(countWatch) countWatch.textContent = watch.length;
    }

    updateStats();
}

/* ===== INITIALISATION ===== */
setTimeout(() => {
    if(window.loadProfilesFromFirebase) {
        window.loadProfilesFromFirebase();
    } else {
        loadProfilesLocal();
        renderProfileSelect();
        renderProfile();
        render();
    }
    window.updateAuthIcon();
    
    // Initialiser le type actif si on est sur add.html
    const typeButtons = document.querySelectorAll(".type-tabs .tab-btn");
    if(typeButtons.length > 0) {
        // On est sur add.html - initialiser le premier type (animé)
        window.switchType("animes");
    }
    
    // Charger les filtres depuis les éléments si présents
    const filterTypeEl = document.getElementById("filterType");
    const sortByEl = document.getElementById("sortBy");
    
    if(filterTypeEl) {
        filterType = filterTypeEl.value || "tout";
        filterTypeEl.addEventListener("change", (e) => {
            filterType = e.target.value;
            window.switchFilterType(filterType);
        });
    }
    
    if(sortByEl) {
        sortBy = sortByEl.value || "date_new";
        sortByEl.addEventListener("change", (e) => {
            sortBy = e.target.value;
            render();
        });
    }
}, 500);
