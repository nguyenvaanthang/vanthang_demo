/* =====================================================
   RENTMAP - MAIN JAVASCRIPT CONNECTED TO SPRING BOOT & MYSQL
   Backend API: http://localhost:8080/api
===================================================== */

const API_BASE_URL = "http://localhost:8080/api";

// Dữ liệu mẫu (Mock Data) hiển thị khi chưa bật Spring Boot Server
const MOCK_PROPERTIES = [
    {
        id: "mock_1",
        title: "Phòng trọ cao cấp Vinhomes Grand Park",
        type: "vinhome",
        price: 4500000,
        area: 35,
        location: "Quận 9, TP. Thủ Đức, TP.HCM",
        address: "Quận 9, TP. Thủ Đức, TP.HCM",
        description: "Phòng mới full nội thất, giờ giấc tự do, an ninh 24/7.",
        lat: 10.8385,
        lng: 106.8342,
        imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        amenities: "Wi-Fi, Điều hòa, Chỗ để xe, Thang máy",
        status: "APPROVED",
        isVip: true,
        isRented: false,
        views: 128,
        ownerEmail: "nguyenvanthang@gmail.com"
    },
    {
        id: "mock_2",
        title: "Phòng trọ giá rẻ cho sinh viên Linh Trung",
        type: "room",
        price: 2500000,
        area: 20,
        location: "Phường Linh Trung, TP. Thủ Đức, TP.HCM",
        address: "Phường Linh Trung, TP. Thủ Đức, TP.HCM",
        description: "Gần trường đại học, điện nước giá dân, có ban công thoáng mát.",
        lat: 10.8651,
        lng: 106.7781,
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        amenities: "Wi-Fi, Chỗ để xe",
        status: "APPROVED",
        isVip: false,
        isRented: false,
        views: 85,
        ownerEmail: "sinhvien@gmail.com"
    },
    {
        id: "mock_3",
        title: "Căn hộ chung cư mini Cầu Giấy",
        type: "room",
        price: 3800000,
        area: 28,
        location: "Quận Cầu Giấy, Hà Nội",
        address: "Quận Cầu Giấy, Hà Nội",
        description: "Đầy đủ điều hòa, nóng lạnh, máy giặt chung, ô tô đỗ cửa.",
        lat: 21.0285,
        lng: 105.8542,
        imageUrl: "",
        amenities: "Wi-Fi, Điều hòa, Thang máy",
        status: "APPROVED",
        isVip: false,
        isRented: false,
        views: 42,
        ownerEmail: "chutrohanoi@gmail.com"
    }
];

let map = null;
let markers = [];
let userMarker = null;
let currentDetailPropertyId = null;
let selectedVipListingId = null;

let postMap = null;
let postPinMarker = null;
let selectedPinLocation = null;
let uploadedBase64Image = "";
let onlineProperties = [];

/* =====================================================
   1. KHỞI ĐỘNG VÀ MÀN HÌNH CHỜ (SPLASH SCREEN & SLIDER)
===================================================== */
document.addEventListener("DOMContentLoaded", function () {
    const splash = document.getElementById("rentmapSplash");
    if (splash) {
        setTimeout(function () {
            splash.classList.add("hide");
            setTimeout(function () {
                splash.style.display = "none";
                if (map) map.invalidateSize();
            }, 700);
        }, 1200);
    }

    if (localStorage.getItem("rentmapDarkMode") === "true") {
        document.body.classList.add("dark-mode");
    }

    initHeroSlider();
    initMap();
    initRegister();
    initLogin();
    initPostProperty();
    updateHeaderAuth();

    fetchOnlineDatabase();
});

/* CHUYỂN SLIDE ẢNH NỀN HERO MỖI 5 GIÂY (5000ms) */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides || slides.length === 0) return;

    let currentSlide = 0;

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

/* DARK MODE TOGGLE */
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("rentmapDarkMode", isDark ? "true" : "false");
}

/* =====================================================
   2. GỌI API JAVA SPRING BOOT LẤY DỮ LIỆU TỪ MYSQL
===================================================== */
async function fetchOnlineDatabase() {
    try {
        const response = await fetch(`${API_BASE_URL}/listings/approved`);
        if (response.ok) {
            onlineProperties = await response.json();
        } else {
            const resFallback = await fetch(`${API_BASE_URL}/listings`);
            if (resFallback.ok) {
                onlineProperties = await resFallback.json();
            } else {
                throw new Error("Không thể tải dữ liệu từ API Server");
            }
        }
    } catch (error) {
        console.warn("Chưa kết nối Backend Spring Boot (localhost:8080). Đang tải dữ liệu mẫu (Mock Data)...");
        onlineProperties = MOCK_PROPERTIES;
    } finally {
        renderHomePageList();
        showAll();

        const activePage = document.querySelector(".page-section.active-page");
        if (activePage && activePage.id === "adminPage") renderAdminDashboard();
        if (activePage && activePage.id === "myListingsPage") renderMyListings();
    }
}

function getApprovedProperties() {
    return onlineProperties.filter(item => item.status === "APPROVED" && !item.isRented);
}

/* =====================================================
   3. KHỞI TẠO BẢN ĐỒ LEAFLET CHÍNH
===================================================== */
function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement || typeof L === "undefined") return;

    map = L.map("map").setView([21.0285, 105.8542], 11);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    showAll();
}

function renderMarkers(list) {
    if (!map) return;
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    list.forEach(property => {
        const isRoom = property.type === "room";
        const color = property.isVip ? "#f59e0b" : (isRoom ? "#2563eb" : "#dc2626");

        const marker = L.circleMarker([property.lat || 21.0285, property.lng || 105.8542], {
            radius: property.isVip ? 12 : 9,
            color: color,
            fillColor: color,
            fillOpacity: 0.9,
            weight: 3
        });

        marker.bindPopup(`
            <div style="min-width:200px">
                ${property.isVip ? '<span style="background:#f59e0b; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">⭐ VIP</span><br>' : ''}
                <strong>${escapeHTML(property.title)}</strong><br><br>
                📍 ${escapeHTML(property.location || property.address)}<br>
                📐 ${property.area}m²<br>
                <strong style="color:#dc2626">${formatPrice(property.price)}</strong>/tháng<br><br>
                <button onclick="viewProperty('${property.id}')" style="padding:6px 12px; border:0; border-radius:6px; background:#2563eb; color:white; cursor:pointer;">Xem chi tiết</button>
            </div>
        `);

        marker.addTo(map);
        markers.push(marker);
    });
}

function showAll() { renderMarkers(getApprovedProperties()); }
function showRoomMap() { renderMarkers(getApprovedProperties().filter(p => p.type === "room")); }
function showVinhomeMap() { renderMarkers(getApprovedProperties().filter(p => p.type === "vinhome")); }

/* =====================================================
   4. TÌM KIẾM THÔNG MINH THEO KHOẢNG GIÁ & ĐỊA ĐIỂM
===================================================== */
function searchProperty() {
    const locationInput = document.getElementById("locationInput").value.trim().toLowerCase();
    const type = document.getElementById("propertyType").value;

    const priceFromInput = document.getElementById("priceFrom").value;
    const priceToInput = document.getElementById("priceTo").value;

    const priceFrom = priceFromInput !== "" ? Number(priceFromInput) : 0;
    const priceTo = priceToInput !== "" ? Number(priceToInput) : Infinity;

    const selectedAmenities = Array.from(document.querySelectorAll(".filterAmenity:checked")).map(cb => cb.value);
    const approvedList = getApprovedProperties();

    const results = approvedList.filter(p => {
        const locStr = (p.location || p.address || "").toLowerCase();

        const matchLocation = locationInput === "" ||
            locStr.includes(locationInput) ||
            locationInput.includes("hà nội") ||
            locationInput.includes("hồ chí minh");

        const matchType = type === "all" || p.type === type;
        const pPrice = Number(p.price) || 0;
        const matchPrice = pPrice >= priceFrom && pPrice <= priceTo;

        let pAmenities = p.amenities || [];
        if (typeof pAmenities === "string") pAmenities = pAmenities.split(",").map(a => a.trim());
        const matchAmenities = selectedAmenities.length === 0 || selectedAmenities.every(a => pAmenities.includes(a));

        return matchLocation && matchType && matchPrice && matchAmenities;
    });

    renderMarkers(results);
    renderHomePageList(results);

    if (results.length === 0) {
        alert("🔍 Không có phòng nào nằm trong khoảng giá hoặc địa điểm bạn chọn. Hệ thống hiển thị lại toàn bộ danh sách.");
        showAll();
        renderHomePageList(approvedList);
    } else {
        const container = document.getElementById("propertySection");
        if (container) container.scrollIntoView({ behavior: "smooth" });
    }
}

function locateUser() {
    if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ định vị.");
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!map) return;
        map.setView([lat, lng], 15);
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 Vị trí của bạn").openPopup();
    });
}

function renderHomePageList(dataList) {
    const container = document.getElementById("propertyContainer");
    if (!container) return;

    const list = dataList || getApprovedProperties();
    if (list.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b; padding:40px;">Chưa có bài đăng nào được duyệt.</p>`;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="property-card ${item.isVip ? 'is-vip' : ''}" onclick="viewProperty('${item.id}')">
            ${item.isVip ? '<span class="vip-badge">⭐ VIP</span>' : ''}
            <div class="property-image ${item.type === 'room' ? 'room-image' : 'vinhome-image'}" style="${item.imageUrl ? `background-image:url('${item.imageUrl}')` : ''}">
                <span class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(this, '${item.id}')">♡</span>
                ${!item.imageUrl ? `<span class="image-icon">${item.type === 'room' ? '🏠' : '🏢'}</span>` : ''}
            </div>
            <div class="property-info">
                <span class="property-type ${item.type === 'room' ? 'room-label' : 'vinhome-label'}">${item.type === 'room' ? 'PHÒNG TRỌ' : 'VINHOME'}</span>
                <h3>${escapeHTML(item.title)}</h3>
                <p class="location">📍 ${escapeHTML(item.location || item.address)}</p>
                <div style="display:flex; justify-content:space-between; margin-top:10px;">
                    <p class="price">${formatPrice(item.price)}</p>
                    <span style="font-size:12px; color:#64748b;">👁 ${item.views || 0} lượt xem</span>
                </div>
            </div>
        </div>
    `).join("");
}

/* =====================================================
   5. CHUYỂN TRANG SPA & LỌC HEROBADGES
===================================================== */
function setActiveMenuLink(navKey) {
    if (!navKey) return;
    document.querySelectorAll(".menu a").forEach(link => {
        const isMatch = link.getAttribute("data-nav") === navKey || link.getAttribute("href") === "#" + navKey;
        link.classList.toggle("active", isMatch);
    });
    document.querySelectorAll(".bottom-nav a").forEach(link => {
        const isMatch = link.getAttribute("data-nav") === navKey;
        link.classList.toggle("active", isMatch);
    });
}

function scrollToSection(id) {
    showPage("home");
    setActiveMenuLink(id);
    setTimeout(() => {
        const section = document.getElementById(id);
        if (section) section.scrollIntoView({ behavior: "smooth" });
    }, 100);
}

function filterCategoryFromHeader(type) {
    showPage('home');

    const selectType = document.getElementById("propertyType");
    if (selectType) {
        selectType.value = type;
    }

    const approvedList = getApprovedProperties();
    const results = approvedList.filter(p => p.type === type);

    renderMarkers(results);
    renderHomePageList(results);

    setActiveMenuLink(type);

    setTimeout(() => {
        const section = document.getElementById("propertySection");
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    }, 150);
}

function filterNearMe() {
    showPage('home');
    locateUser();
    setTimeout(() => {
        const mapSec = document.getElementById("mapSection");
        if (mapSec) mapSec.scrollIntoView({ behavior: "smooth" });
    }, 150);
}

function filterCheapPrice() {
    showPage('home');

    const pTo = document.getElementById("priceTo");
    if (pTo) pTo.value = 3000000;

    const approvedList = getApprovedProperties();
    const cheapList = approvedList.filter(p => (Number(p.price) || 0) <= 3000000);

    renderMarkers(cheapList);
    renderHomePageList(cheapList);

    setTimeout(() => {
        const section = document.getElementById("propertySection");
        if (section) section.scrollIntoView({ behavior: "smooth" });
    }, 150);
}

function showPage(page) {
    document.querySelectorAll(".page-section").forEach(p => p.classList.remove("active-page"));
    const targetMap = {
        home: "homePage", login: "loginPage", register: "registerPage",
        profile: "profilePage", myListings: "myListingsPage", post: "postPage",
        favorites: "favoritesPage", propertyDetail: "propertyDetailPage", admin: "adminPage"
    };

    if (targetMap[page] && document.getElementById(targetMap[page])) {
        document.getElementById(targetMap[page]).classList.add("active-page");
    }

    setActiveMenuLink(page);

    if (page === "myListings") renderMyListings();
    if (page === "favorites") renderFavoritesPage();
    if (page === "admin") renderAdminDashboard();
    if (page === "post") initPostMap();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =====================================================
   6. ĐĂNG KÝ, ĐĂNG NHẬP & AUTHENTICATION
===================================================== */
function initRegister() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const phone = document.getElementById("phone").value.trim();

        const newUser = {
            id: "user_" + Date.now(),
            fullName: fullName,
            email: email,
            password: password,
            phone: phone,
            role: "USER",
            status: "ACTIVE"
        };

        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                alert("🎉 Đăng ký tài khoản thành công! Dữ liệu đã lưu vào Server.");
                showPage("login");
                return;
            }
        } catch (err) {
            console.warn("Server Offline: Lưu tài khoản vào danh sách dùng chung...");
        }

        let systemUsers = JSON.parse(localStorage.getItem("rentmapLocalUsers") || "[]");
        if (!systemUsers.some(u => u.email === email)) {
            systemUsers.push(newUser);
            localStorage.setItem("rentmapLocalUsers", JSON.stringify(systemUsers));
        }

        alert("🎉 Đăng ký thành công!");
        showPage("login");
    });
}

function initLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        if (email === "nguyenvanthang@gmail.com" && password === "15082006") {
            const adminUser = { id: 9999, fullName: "Nguyễn Văn Thắng (Admin)", email: "nguyenvanthang@gmail.com", role: "ADMIN" };
            localStorage.setItem("rentmapCurrentUser", JSON.stringify(adminUser));
            updateHeaderAuth();
            alert("🔑 Đăng nhập ADMIN thành công!");
            return showPage("admin");
        }

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const user = await res.json();
                localStorage.setItem("rentmapCurrentUser", JSON.stringify(user));
                updateHeaderAuth();
                alert("Đăng nhập thành công!");
                return showPage("home");
            }
        } catch (err) {
            console.warn("Đăng nhập offline...");
        }

        let systemUsers = JSON.parse(localStorage.getItem("rentmapLocalUsers") || "[]");
        const foundUser = systemUsers.find(u => u.email === email && u.password === password);

        if (foundUser) {
            localStorage.setItem("rentmapCurrentUser", JSON.stringify(foundUser));
            updateHeaderAuth();
            alert("Đăng nhập thành công!");
            showPage("home");
        } else {
            alert("Email hoặc mật khẩu không chính xác!");
        }
    });
}

function updateHeaderAuth() {
    const header = document.getElementById("headerAuthActions");
    if (!header) return;
    const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));

    if (!user) {
        header.innerHTML = `
            <button class="dark-mode-toggle" onclick="toggleDarkMode()">🌙</button>
            <a href="#" class="login-btn" onclick="showPage('login'); return false;">Đăng nhập</a>
            <a href="#" class="register-btn" onclick="showPage('register'); return false;">Đăng ký</a>
        `;
        return;
    }

    const isAdmin = user.role === "ADMIN";
    header.innerHTML = `
        <button class="dark-mode-toggle" onclick="toggleDarkMode()">🌙</button>
        <div class="account-menu">
            <button class="account-button" onclick="toggleAccountMenu()">
                <span>${isAdmin ? '🛡️' : '👤'}</span><span>${escapeHTML(user.fullName || user.email)}</span>
            </button>
            <div id="accountDropdown" class="account-dropdown">
                ${isAdmin ? '<a href="#" onclick="showPage(\'admin\'); return false;" style="color:#2563eb; font-weight:bold;">🛡️ Trang Quản Trị</a>' : ''}
                <a href="#" onclick="showProfile(); return false;">👤 Hồ sơ cá nhân</a>
                <a href="#" onclick="showPage('myListings'); return false;">📋 Tin của tôi</a>
                <a href="#" onclick="logoutUser(); return false;" style="color:#dc2626;">🚪 Đăng xuất</a>
            </div>
        </div>
    `;
}

function toggleAccountMenu() {
    const el = document.getElementById("accountDropdown");
    if (el) el.classList.toggle("show");
}

function logoutUser() {
    localStorage.removeItem("rentmapCurrentUser");
    updateHeaderAuth();
    showPage("home");
}

/* =====================================================
   7. ĐĂNG TIN VÀ TẢI ẢNH (POST PROPERTY TO SPRING BOOT)
===================================================== */
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        uploadedBase64Image = e.target.result;
        document.getElementById("imagePreviewBox").innerHTML = `<img src="${uploadedBase64Image}" alt="Preview" style="max-height:160px; border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
}

function initPostMap() {
    setTimeout(() => {
        const mapEl = document.getElementById("postMap");
        if (!mapEl) return;

        if (!postMap) {
            postMap = L.map("postMap").setView([21.0285, 105.8542], 12);
            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; OpenStreetMap'
            }).addTo(postMap);

            postMap.on("click", function (e) {
                setPostPin(e.latlng.lat, e.latlng.lng);
            });
        }

        postMap.invalidateSize();
    }, 200);
}

function setPostPin(lat, lng) {
    selectedPinLocation = { lat, lng };
    document.getElementById("postCoordinates").textContent = `📍 Vị trí đã chọn: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    if (postPinMarker) postPinMarker.setLatLng([lat, lng]);
    else postPinMarker = L.marker([lat, lng]).addTo(postMap);
}

function initPostProperty() {
    const form = document.getElementById("postPropertyForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
        if (!user) {
            alert("Vui lòng đăng nhập trước khi đăng tin!");
            return showPage("login");
        }
        if (!selectedPinLocation) return alert("Vui lòng click chọn ghim vị trí trên bản đồ!");

        const selectedAmenities = Array.from(document.querySelectorAll(".postAmenity:checked")).map(cb => cb.value);

        const newListing = {
            ownerEmail: user.email,
            type: document.getElementById("postType").value,
            title: document.getElementById("postTitle").value.trim(),
            price: Number(document.getElementById("postPrice").value),
            area: Number(document.getElementById("postArea").value),
            location: document.getElementById("postAddress").value.trim(),
            address: document.getElementById("postAddress").value.trim(),
            description: document.getElementById("postDescription").value.trim(),
            lat: selectedPinLocation.lat,
            lng: selectedPinLocation.lng,
            imageUrl: uploadedBase64Image,
            amenities: selectedAmenities.join(", "),
            status: "PENDING",
            isVip: false,
            isRented: false,
            views: 0
        };

        try {
            const res = await fetch(`${API_BASE_URL}/listings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newListing)
            });

            if (res.ok) {
                alert("📤 Đăng tin thành công! Tin đăng đang chờ Admin duyệt.");
                await fetchOnlineDatabase();
                showPage("myListings");
            } else {
                alert("Đăng tin thất bại!");
            }
        } catch (err) {
            console.error("Lỗi đăng tin:", err);
            onlineProperties.push({ id: Date.now(), ...newListing });
            alert("📤 Đăng tin thành công! Tin đăng đang chờ Admin duyệt.");
            showPage("myListings");
        }
    });
}

/* =====================================================
   8. ADMIN DASHBOARD & QUẢN LÝ USER / BÁO CÁO FULL
===================================================== */
async function renderAdminDashboard() {
    const listings = onlineProperties;

    document.getElementById("adminTotalListings").textContent = listings.length;
    document.getElementById("adminPendingListings").textContent = listings.filter(l => l.status === "PENDING").length;
    document.getElementById("adminApprovedListings").textContent = listings.filter(l => l.status === "APPROVED").length;

    switchAdminTab('listings');
}

function switchAdminTab(tabName) {
    document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));

    const listingsTab = document.getElementById("adminListingsTab");
    const usersTab = document.getElementById("adminUsersTab");
    const reportsTab = document.getElementById("adminReportsTab");

    if (listingsTab) listingsTab.style.display = "none";
    if (usersTab) usersTab.style.display = "none";
    if (reportsTab) reportsTab.style.display = "none";

    if (tabName === "listings") {
        document.getElementById("tabListingsBtn").classList.add("active");
        if (listingsTab) listingsTab.style.display = "block";
        renderAdminListingsTab(onlineProperties);
    } else if (tabName === "users") {
        document.getElementById("tabUsersBtn").classList.add("active");
        if (usersTab) usersTab.style.display = "block";
        renderAdminUsersTab();
    } else if (tabName === "reports") {
        const btnRep = document.getElementById("tabReportsBtn");
        if (btnRep) btnRep.classList.add("active");
        if (reportsTab) reportsTab.style.display = "block";
        renderAdminReportsTab();
    }
}

function renderAdminListingsTab(listings) {
    const container = document.getElementById("adminListingsContainer");
    if (!container) return;
    if (listings.length === 0) {
        container.innerHTML = "<p style='padding:30px; text-align:center; color:#64748b;'>Chưa có tin đăng nào cần kiểm duyệt.</p>";
        return;
    }

    container.innerHTML = listings.map(item => `
        <div class="admin-card-item" style="display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid #334155; margin-bottom:10px;">
            <div>
                <h3 style="font-size:16px; font-weight:bold; color:#f8fafc;">${escapeHTML(item.title)} ${item.isVip ? '⭐ VIP' : ''}</h3>
                <p style="font-size:13px; color:#94a3b8; margin-top:4px;">👤 Người đăng: <strong>${escapeHTML(item.ownerEmail || 'Hệ thống')}</strong> | Trạng thái: <span class="status-badge ${item.status === 'APPROVED' ? 'status-approved' : 'status-pending'}">${item.status}</span></p>
            </div>
            <div style="display:flex; gap:8px;">
                ${item.status !== "APPROVED" ? `<button class="btn-approve" style="padding:8px 14px; background:#16a34a; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="adminApproveListing('${item.id}')">✅ Duyệt</button>` : ''}
                ${item.status !== "REJECTED" ? `<button class="btn-reject" style="padding:8px 14px; background:#dc2626; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="adminRejectListing('${item.id}')">❌ Từ chối</button>` : ''}
                <button class="btn-vip" style="padding:8px 14px; background:#f59e0b; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="toggleVipListing('${item.id}', ${!item.isVip})">${item.isVip ? '⭐ Bỏ VIP' : '⭐ Gán VIP'}</button>
            </div>
        </div>
    `).join("");
}

async function renderAdminUsersTab() {
    const container = document.getElementById("adminUsersContainer");
    if (!container) return;

    let users = [];

    try {
        const res = await fetch(`${API_BASE_URL}/users`);
        if (res.ok) {
            users = await res.json();
        }
    } catch (e) {
        console.warn("Chưa kết nối API Backend, tổng hợp từ bộ nhớ...");
    }

    let localUsers = JSON.parse(localStorage.getItem("rentmapLocalUsers") || "[]");
    localUsers.forEach(u => {
        if (!users.some(item => item.email === u.email)) {
            users.push(u);
        }
    });

    const adminUser = {
        id: "admin_root",
        fullName: "Nguyễn Văn Thắng (Admin)",
        email: "nguyenvanthang@gmail.com",
        phone: "0987654321",
        role: "ADMIN",
        status: "ACTIVE"
    };

    if (!users.some(u => u.email === adminUser.email)) {
        users.unshift(adminUser);
    }

    const currentUser = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
    if (currentUser && !users.some(u => u.email === currentUser.email)) {
        users.push(currentUser);
    }

    onlineProperties.forEach(p => {
        if (p.ownerEmail && !users.some(u => u.email === p.ownerEmail)) {
            users.push({
                id: "user_" + Math.random().toString(36).substr(2, 9),
                fullName: p.ownerEmail.split('@')[0],
                email: p.ownerEmail,
                phone: '0987654321',
                role: 'USER',
                status: 'ACTIVE'
            });
        }
    });

    if (users.length === 0) {
        container.innerHTML = "<p style='padding:30px; text-align:center; color:#94a3b8;'>Chưa có người dùng nào trong hệ thống.</p>";
        return;
    }

    container.innerHTML = users.map(u => `
        <div class="admin-card-item" style="display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid #334155; margin-bottom:10px;">
            <div>
                <h3 style="font-size:16px; font-weight:bold; color:#f8fafc; margin-bottom:4px;">
                    👤 ${escapeHTML(u.fullName || u.email)} 
                    <span class="status-badge ${u.role === 'ADMIN' ? 'status-rented' : 'status-approved'}">${u.role || 'USER'}</span>
                </h3>
                <p style="font-size:13px; color:#94a3b8;">
                    📧 Email: <strong>${escapeHTML(u.email)}</strong> | 📞 SĐT: ${escapeHTML(u.phone || 'Chưa cập nhật')}
                </p>
                <p style="font-size:12px; margin-top:4px;">
                    Trạng thái: <strong style="color: ${u.status === 'BLOCKED' ? '#ef4444' : '#22c55e'};">${u.status === 'BLOCKED' ? '🔒 Đã bị khóa' : '🟢 Đang hoạt động'}</strong>
                </p>
            </div>
            
            <div style="display:flex; gap:8px;">
                ${u.role !== 'ADMIN' ? `
                    <button class="btn-reject" style="padding:8px 14px; background:#e11d48; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="deleteUser('${u.id || u.email}', '${u.email}')">
                        🗑️ Xóa tài khoản
                    </button>
                    <button style="padding:8px 14px; background:${u.status === 'BLOCKED' ? '#16a34a' : '#f59e0b'}; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="toggleBlockUser('${u.id || u.email}', '${u.email}', '${u.status}')">
                        ${u.status === 'BLOCKED' ? '🔓 Mở khóa' : '🔒 Khóa'}
                    </button>
                ` : '<span style="font-size:13px; color:#f59e0b; font-weight:bold; padding:6px 12px; background:rgba(245,158,11,0.1); border-radius:6px;">🛡️ Tài khoản Admin Root</span>'}
            </div>
        </div>
    `).join("");
}

async function deleteUser(userId, email) {
    if (!confirm(`⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${email}" khỏi hệ thống?`)) return;

    try {
        await fetch(`${API_BASE_URL}/users/${userId}`, { method: "DELETE" });
    } catch (err) {
        console.warn("Xóa từ Local...");
    }

    let localUsers = JSON.parse(localStorage.getItem("rentmapLocalUsers") || "[]");
    localUsers = localUsers.filter(u => u.email !== email && u.id !== userId);
    localStorage.setItem("rentmapLocalUsers", JSON.stringify(localUsers));

    alert(`✅ Đã xóa thành công tài khoản ${email}`);
    renderAdminUsersTab();
}

async function toggleBlockUser(userId, email, currentStatus) {
    const newStatus = currentStatus === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    const actionName = newStatus === "BLOCKED" ? "KHÓA" : "MỞ KHÓA";

    if (!confirm(`Bạn có muốn ${actionName} tài khoản ${email}?`)) return;

    try {
        await fetch(`${API_BASE_URL}/users/${userId}/status?status=${newStatus}`, { method: "PUT" });
    } catch (err) {
        console.warn("Lỗi kết nối API khóa...");
    }

    let localUsers = JSON.parse(localStorage.getItem("rentmapLocalUsers") || "[]");
    const u = localUsers.find(item => item.email === email || item.id === userId);
    if (u) u.status = newStatus;
    localStorage.setItem("rentmapLocalUsers", JSON.stringify(localUsers));

    renderAdminUsersTab();
}

function renderAdminReportsTab() {
    const container = document.getElementById("adminReportsContainer");
    if (!container) return;

    let reports = JSON.parse(localStorage.getItem("rentmapReports") || "[]");

    const countEl = document.getElementById("adminTotalReports");
    if (countEl) countEl.textContent = reports.length;

    if (reports.length === 0) {
        container.innerHTML = "<p style='padding:30px; text-align:center; color:#94a3b8;'>Chưa có báo cáo vi phạm nào.</p>";
        return;
    }

    container.innerHTML = reports.map((r, index) => `
        <div class="admin-card-item" style="display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid #334155; margin-bottom:10px;">
            <div>
                <h3 style="font-size:15px; font-weight:bold; color:#ef4444;">🚩 Báo cáo tin: ${escapeHTML(r.title || 'Bài đăng #' + r.propertyId)}</h3>
                <p style="font-size:13px; color:#94a3b8; margin-top:4px;">Nội dung: <strong>${escapeHTML(r.reason || 'Bài đăng ảo / Sai giá')}</strong></p>
            </div>
            <button class="btn-reject" style="padding:8px 14px; background:#dc2626; color:white; border:none; border-radius:8px; cursor:pointer;" onclick="deleteReport(${index})">
                🗑️ Đã xử lý / Xóa
            </button>
        </div>
    `).join("");
}

function deleteReport(index) {
    let reports = JSON.parse(localStorage.getItem("rentmapReports") || "[]");
    reports.splice(index, 1);
    localStorage.setItem("rentmapReports", JSON.stringify(reports));
    renderAdminReportsTab();
}

function reportCurrentProperty() {
    if (!currentDetailPropertyId) return;
    const property = onlineProperties.find(p => p.id == currentDetailPropertyId);

    let allReports = JSON.parse(localStorage.getItem("rentmapReports") || "[]");
    allReports.push({
        propertyId: currentDetailPropertyId,
        title: property ? property.title : 'Phòng trọ',
        reason: 'Tin đăng có dấu hiệu ảo / Sai số điện thoại'
    });
    localStorage.setItem("rentmapReports", JSON.stringify(allReports));
    alert("🚩 Đã gửi báo cáo tin vi phạm tới Quản trị viên!");
}

async function adminApproveListing(id) {
    try {
        await fetch(`${API_BASE_URL}/listings/${id}/approve`, { method: "PUT" });
    } catch (err) {
        const p = onlineProperties.find(item => item.id == id);
        if (p) p.status = "APPROVED";
    }
    alert("✅ Đã duyệt tin thành công!");
    await fetchOnlineDatabase();
}

async function adminRejectListing(id) {
    try {
        await fetch(`${API_BASE_URL}/listings/${id}/reject`, { method: "PUT" });
    } catch (err) {
        const p = onlineProperties.find(item => item.id == id);
        if (p) p.status = "REJECTED";
    }
    alert("❌ Đã từ chối tin đăng!");
    await fetchOnlineDatabase();
}

async function toggleVipListing(id, isVip) {
    try {
        await fetch(`${API_BASE_URL}/listings/${id}/vip?isVip=${isVip}`, { method: "PUT" });
    } catch (err) {
        const p = onlineProperties.find(item => item.id == id);
        if (p) p.isVip = isVip;
    }
    await fetchOnlineDatabase();
}

/* =====================================================
   9. TIN CHO THUÊ CỦA TÔI
===================================================== */
function renderMyListings() {
    const container = document.getElementById("myListingsContainer");
    if (!container) return;
    const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
    if (!user) return;

    const listings = onlineProperties.filter(l => l.ownerEmail === user.email);
    if (listings.length === 0) {
        container.innerHTML = "<p style='padding:30px; text-align:center; color:#64748b;'>Bạn chưa đăng tin cho thuê nào.</p>";
        return;
    }

    container.innerHTML = listings.map(l => `
        <div class="my-listing-card" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:12px;">
            <div>
                <h3 style="font-size:16px; font-weight:bold;">${escapeHTML(l.title)} ${l.isVip ? '⭐ (Đã lên VIP)' : ''}</h3>
                <div style="margin-top:6px; display:flex; gap:8px;">
                    <span class="status-badge ${l.status === 'APPROVED' ? 'status-approved' : 'status-pending'}">Duyệt: ${l.status}</span>
                    <span class="status-badge ${l.isRented ? 'status-rented' : 'status-approved'}">${l.isRented ? '🔒 ĐÃ CHO THUÊ' : '🟢 CÒN TRỐNG'}</span>
                </div>
            </div>
            <div style="display:flex; gap:10px;">
                ${!l.isVip ? `<button class="btn-vip" style="padding:8px 14px; background:#f59e0b; color:white; border:none; border-radius:8px; cursor:pointer;" onclick="openPaymentModal('${l.id}')">💎 Nâng VIP</button>` : ''}
                <button class="btn-search" style="padding:8px 14px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer;" onclick="toggleRentedStatus('${l.id}', ${!l.isRented})">
                    ${l.isRented ? '🔓 Đánh dấu Trống' : '🔒 Đánh dấu Đã Thuê'}
                </button>
            </div>
        </div>
    `).join("");
}

async function toggleRentedStatus(id, isRented) {
    try {
        await fetch(`${API_BASE_URL}/listings/${id}/rented?isRented=${isRented}`, { method: "PUT" });
    } catch (err) {
        const p = onlineProperties.find(item => item.id == id);
        if (p) p.isRented = isRented;
    }
    await fetchOnlineDatabase();
}

/* =====================================================
   10. HỒ SƠ CÁ NHÂN
===================================================== */
function showProfile() {
    const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
    if (!user) return showPage("login");

    const isAdmin = user.role === "ADMIN";
    document.getElementById("profileName").textContent = user.fullName || "---";
    document.getElementById("profilePhone").textContent = user.phone || "Chưa cập nhật";
    document.getElementById("profileEmail").textContent = user.email || "---";

    const roleTextEl = document.getElementById("profileRoleText");
    if (roleTextEl) roleTextEl.textContent = isAdmin ? "Quản Trị Viên (Admin)" : "Thành viên";

    const badge = document.getElementById("profileRoleBadge");
    if (badge) {
        badge.textContent = isAdmin ? "🛡️ Quản Trị Viên" : "👤 Người dùng";
        badge.className = isAdmin ? "role-badge admin" : "role-badge";
    }

    showPage("profile");
}

/* =====================================================
   11. XEM CHI TIẾT & YÊU THÍCH & ĐẶT LỊCH HẸN
===================================================== */
function viewProperty(id) {
    currentDetailPropertyId = id;
    const property = onlineProperties.find(item => item.id == id);
    if (!property) return;

    property.views = (property.views || 0) + 1;
    document.getElementById("propertyDetailTitle").textContent = property.title;
    document.getElementById("propertyDetailLocation").textContent = "📍 " + (property.location || property.address);
    document.getElementById("propertyDetailArea").textContent = property.area + "m²";
    document.getElementById("propertyDetailPrice").textContent = formatPrice(property.price);

    const viewsEl = document.getElementById("propertyDetailViews");
    if (viewsEl) viewsEl.textContent = property.views;

    const descEl = document.getElementById("propertyDetailDescText");
    if (descEl) descEl.textContent = property.description || "Chưa có mô tả chi tiết cho bài đăng này.";

    const amenitiesEl = document.getElementById("propertyDetailAmenities");
    if (amenitiesEl) {
        let aStr = property.amenities;
        if (Array.isArray(aStr)) aStr = aStr.join(", ");
        amenitiesEl.textContent = aStr || "Khép kín";
    }

    const imgBox = document.getElementById("propertyDetailImgBox");
    if (imgBox) {
        const defaultImage = property.type === 'vinhome'
            ? "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
            : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";

        const displayImgUrl = property.imageUrl && property.imageUrl.trim() !== "" ? property.imageUrl : defaultImage;
        imgBox.style.backgroundImage = `url('${displayImgUrl}')`;
    }

    showPage("propertyDetail");
}

function handleBooking(event) {
    event.preventDefault();
    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    alert(`🎉 Đặt lịch hẹn xem phòng thành công vào lúc ${time} ngày ${date}! Chủ trọ sẽ liên hệ lại với bạn.`);
}

function toggleFavorite(element, propertyId) {
    let favorites = JSON.parse(localStorage.getItem("rentmapFavorites") || "[]");
    if (favorites.includes(propertyId)) {
        favorites = favorites.filter(id => id !== propertyId);
        element.classList.remove("liked");
        element.textContent = "♡";
    } else {
        favorites.push(propertyId);
        element.classList.add("liked");
        element.textContent = "♥";
    }
    localStorage.setItem("rentmapFavorites", JSON.stringify(favorites));
}

function showFavorites() { showPage("favorites"); }

function renderFavoritesPage() {
    const container = document.getElementById("favoritesContainer");
    if (!container) return;

    const favoriteIds = JSON.parse(localStorage.getItem("rentmapFavorites") || "[]");
    const favoriteProperties = onlineProperties.filter(p => favoriteIds.includes(p.id.toString()));

    if (favoriteProperties.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#6b7280; padding:30px;'>Chưa có tin yêu thích nào.</p>";
        return;
    }

    container.innerHTML = favoriteProperties.map(p => `
        <div class="my-listing-card" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border:1px solid #eee; border-radius:12px; margin-bottom:10px;">
            <div>
                <h3 style="font-size:16px; font-weight:bold;">${escapeHTML(p.title)}</h3>
                <p style="font-size:13px; color:#64748b; margin-top:4px;">📍 ${escapeHTML(p.location || p.address)} - 📐 ${p.area}m²</p>
                <strong style="color:#dc2626; font-size:16px;">${formatPrice(p.price)}</strong>
            </div>
            <button class="btn-search" style="padding:8px 16px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer;" onclick="viewProperty('${p.id}')">Xem chi tiết</button>
        </div>
    `).join("");
}

/* =====================================================
   12. THANH TOÁN MÔ PHỎNG NÂNG VIP
===================================================== */
function openPaymentModal(listingId) {
    selectedVipListingId = listingId;
    document.getElementById("paymentModal").classList.add("show");
}

function closePaymentModal() {
    document.getElementById("paymentModal").classList.remove("show");
}

async function confirmVipPayment() {
    if (!selectedVipListingId) return;
    await toggleVipListing(selectedVipListingId, true);
    closePaymentModal();
    alert("🎉 Đã nâng cấp tin đăng lên VIP thành công!");
    await fetchOnlineDatabase();
}

/* =====================================================
   13. HÀM BỔ TRỢ (UTILITIES)
===================================================== */
function togglePassword(id) {
    const input = document.getElementById(id);
    if (input) {
        input.type = input.type === "password" ? "text" : "password";
    }
}

function toggleLoginPassword() {
    const pwd = document.getElementById("loginPassword");
    if (pwd) {
        pwd.type = pwd.type === "password" ? "text" : "password";
    }
}

function formatPrice(p) { return new Intl.NumberFormat("vi-VN").format(p || 0) + "đ"; }
function escapeHTML(str) { const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }
function checkPostLogin() {
    const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
    if (!user) {
        alert("Vui lòng đăng nhập trước khi đăng tin!");
        return showPage("login");
    }
    showPage("post");
}

/* =====================================================
   14. HỆ THỐNG TRỢ LÝ AI SIÊU CẤP (4 TÍNH NĂNG ĐỈNH CAO)
===================================================== */
const GEMINI_API_KEY = ""; // Điền API Key của bạn nếu có

function toggleAiChat() {
    const chatBox = document.getElementById("aiChatBox");
    if (chatBox) chatBox.classList.toggle("show");
}

async function sendAiMessage() {
    const inputEl = document.getElementById("aiInput");
    const msgContainer = document.getElementById("aiChatMessages");
    const userText = inputEl.value.trim();

    if (!userText) return;

    msgContainer.innerHTML += `<div class="ai-msg user">${escapeHTML(userText)}</div>`;
    inputEl.value = "";
    msgContainer.scrollTop = msgContainer.scrollHeight;

    const loadingId = "msg_" + Date.now();
    msgContainer.innerHTML += `<div class="ai-msg bot" id="${loadingId}">🤖 AI đang suy nghĩ & phân tích dữ liệu...</div>`;
    msgContainer.scrollTop = msgContainer.scrollHeight;

    setTimeout(async () => {
        let botReply = "";

        if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== "") {
            botReply = await callGeminiApiReal(userText);
        } else {
            botReply = processSmartAiEngine(userText);
        }

        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.innerHTML = botReply;
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 600);
}

function processSmartAiEngine(query) {
    const q = query.toLowerCase().trim();
    const approved = getApprovedProperties();

    if (q.includes("dưới") || q.includes("rẻ hơn") || q.includes("khoảng")) {
        const matchPrice = q.match(/\d+/);
        if (matchPrice) {
            let maxPrice = parseInt(matchPrice[0]);
            if (maxPrice < 100) maxPrice = maxPrice * 1000000;

            document.getElementById("priceTo").value = maxPrice;
            searchProperty();

            return `🎯 **AI Action:** Tôi đã tự động đặt bộ lọc giá dưới **${formatPrice(maxPrice)}** và cập nhật lại danh sách phòng hiển thị phía sau cho bạn!`;
        }
    }

    if (q.includes("xem phòng trọ") || q.includes("tìm phòng trọ")) {
        filterCategoryFromHeader('room');
        return `🏠 Tôi đã chuyển giao diện sang mục **Phòng Trọ** và lọc danh sách tương ứng cho bạn rồi nhé!`;
    }

    if (q.includes("xem vinhome") || q.includes("tìm vinhome") || q.includes("căn hộ")) {
        filterCategoryFromHeader('vinhome');
        return `🏢 Tôi đã chuyển giao diện sang danh mục **Căn hộ Vinhome** cho bạn rồi nhé!`;
    }

    if (q.includes("gần tôi") || q.includes("gần đây") || q.includes("vị trí của tôi")) {
        filterNearMe();
        return `📍 Tôi đã bật định vị vị trí của bạn trên bản đồ RentMap!`;
    }

    if (q.includes("hồ chí minh") || q.includes("hcm") || q.includes("tphcm") || q.includes("thủ đức") || q.includes("quận 9")) {
        const hcmList = approved.filter(p => (p.location || p.address || "").toLowerCase().includes("thủ đức") || (p.location || p.address || "").toLowerCase().includes("hồ chí minh") || (p.location || p.address || "").toLowerCase().includes("tp.hcm"));
        if (hcmList.length > 0) {
            return `📍 Tại TP. Hồ Chí Minh / Thủ Đức hiện có ${hcmList.length} phòng nổi bật, ví dụ: **"${hcmList[0].title}"** giá ${formatPrice(hcmList[0].price)}/tháng.`;
        }
        return `📍 Các phòng tại TP.HCM đang được chủ nhà cập nhật liên tục trên bản đồ!`;
    }

    if (q.includes("hà nội") || q.includes("cầu giấy") || q.includes("bắc từ liêm")) {
        const hnList = approved.filter(p => (p.location || p.address || "").toLowerCase().includes("hà nội") || (p.location || p.address || "").toLowerCase().includes("cầu giấy"));
        if (hnList.length > 0) {
            return `🏛️ Tại Hà Nội hiện có ${hnList.length} chỗ ở phù hợp, ví dụ: **"${hnList[0].title}"** giá ${formatPrice(hnList[0].price)}/tháng.`;
        }
    }

    if (q.includes("đăng tin") || q.includes("cho thuê") || q.includes("đăng bài")) {
        return `📝 Để đăng tin, bạn bấm nút **"➕ Đăng tin"** trên thanh Menu, nhập thông tin, ghim vị trí bản đồ và bấm nút **"✨ Tạo mô tả bằng AI"** để AI tự viết bài giúp nhé!`;
    }

    if (q.includes("vip") || q.includes("nạp") || q.includes("thanh toán") || q.includes("quét qr")) {
        return `💎 Bạn muốn lên VIP? Hãy vào mục **"Tin của tôi"** trong Menu tài khoản và bấm nút **"💎 Nâng VIP"** để quét mã QR nhé!`;
    }

    if (q.includes("chào") || q.includes("hi") || q.includes("hello") || q.includes("ơi")) {
        return `🤖 Xin chào! Tôi là Trợ lý AI RentMap. Bạn có thể nhờ tôi:
• *"Tìm phòng dưới 4 triệu"* (Tôi sẽ tự lọc web)
• *"Xem phòng trọ / Vinhome"* (Tôi sẽ chuyển tab giúp)
• *"Tạo bài viết mô tả"* (Khi đăng tin cho thuê)`;
    }

    return `🤖 Bạn có thể thử các câu lệnh thông minh như:
• **"Tìm phòng dưới 3 triệu"** ➔ AI tự nhập giá & tìm kiếm.
• **"Xem căn hộ Vinhome"** ➔ AI tự chuyển danh mục.
• **"Gần tôi"** ➔ AI tự kích hoạt bản đồ định vị.`;
}

function aiGenerateDescription() {
    const type = document.getElementById("postType").value;
    const title = document.getElementById("postTitle").value.trim();
    const price = document.getElementById("postPrice").value;
    const area = document.getElementById("postArea").value;
    const address = document.getElementById("postAddress").value.trim();
    const amenities = Array.from(document.querySelectorAll(".postAmenity:checked")).map(cb => cb.value).join(", ");

    if (!title || !price || !area) {
        alert("⚠️ Vui lòng điền trước Tiêu đề, Giá thuê và Diện tích để AI có đủ dữ liệu tạo bài viết nhé!");
        return;
    }

    const typeName = type === "vinhome" ? "Căn hộ chung cư Vinhome cao cấp" : "Phòng trọ chính chủ";
    const formattedPrice = formatPrice(Number(price));

    const generatedText = `🔥 CHO THUÊ: ${title.toUpperCase()} 🔥

📍 Địa chỉ: ${address || "Khu vực trung tâm, giao thông thuận tiện"}
📐 Diện tích: ${area}m² thoáng mát, sạch sẽ, tối ưu không gian sống.
💰 Giá thuê cực ưu đãi: ${formattedPrice}/tháng (Cam kết không phát sinh chi phí ẩn).

⚡ TIỆN ÍCH NỔI BẬT:
${amenities ? "✔ " + amenities.split(", ").join("\n✔ ") : "✔ Đầy đủ tiện ích cơ bản, không gian an ninh tốt."}

🌟 ĐẶC ĐIỂM BẤT ĐỘNG SẢN:
- ${typeName} thiết kế hiện đại, ánh sáng tự nhiên ngập tràn.
- Giờ giấc đi lại tự do, an ninh đảm bảo 24/7.
- Vị trí đắc địa gần trường học, chợ, siêu thị và trạm xe bus.

📞 Liên hệ chính chủ ngay để hẹn lịch xem phòng trực tiếp!`;

    const descInput = document.getElementById("postDescription");
    if (descInput) {
        descInput.value = generatedText;
        alert("✨ AI đã tự động soạn thảo xong bài viết mô tả chuyên nghiệp cho bạn!");
    }
}

function aiSuggestPricing() {
    const type = document.getElementById("postType").value;
    const area = Number(document.getElementById("postArea").value) || 20;

    let suggestedPrice = 0;
    let minRange = 0;
    let maxRange = 0;

    if (type === "vinhome") {
        suggestedPrice = area * 150000;
        minRange = suggestedPrice * 0.9;
        maxRange = suggestedPrice * 1.25;
    } else {
        suggestedPrice = area * 110000;
        minRange = suggestedPrice * 0.85;
        maxRange = suggestedPrice * 1.15;
    }

    suggestedPrice = Math.round(suggestedPrice / 100000) * 100000;
    minRange = Math.round(minRange / 100000) * 100000;
    maxRange = Math.round(maxRange / 100000) * 100000;

    document.getElementById("postPrice").value = suggestedPrice;

    alert(`💡 GỢI Ý GIÁ TỪ AI RENTMAP:
- Mức giá đề xuất lý tưởng: ${formatPrice(suggestedPrice)}/tháng.
- Khoảng giá phù hợp khu vực: ${formatPrice(minRange)} - ${formatPrice(maxRange)}/tháng (Dựa trên diện tích ${area}m²).

AI đã tự động điền mức giá đề xuất vào ô giá thuê cho bạn!`);
}

async function callGeminiApiReal(userPrompt) {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userPrompt }] }]
            })
        });
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return processSmartAiEngine(userPrompt);
    }
}