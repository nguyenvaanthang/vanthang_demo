/* =====================================================
   RENTMAP - MAIN JAVASCRIPT WITH FIREBASE FIRESTORE
===================================================== */

// Cấu hình Firebase dự án duanthuephong
const firebaseConfig = {
  apiKey: "AIzaSyAF4QW3secCXfyuktjeThEvEYYAKB2kMkY",
  authDomain: "duanthuephong.firebaseapp.com",
  projectId: "duanthuephong",
  storageBucket: "duanthuephong.firebasestorage.app",
  messagingSenderId: "130500767479",
  appId: "1:130500767479:web:67eaba346eb1f750bdedf2",
  measurementId: "G-Q8H22CPC74"
};

// Khởi tạo Firebase SDK v9 Compat
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

const defaultProperties = [
    {
        id: "default_1",
        type: "room",
        title: "Phòng trọ 25m² gần Đại học Quốc gia",
        location: "Cầu Giấy, Hà Nội",
        price: 3000000,
        area: 25,
        lat: 21.036,
        lng: 105.790,
        status: "APPROVED",
        isVip: true,
        isRented: false,
        views: 120,
        amenities: ["Wi-Fi", "Điều hòa", "Chỗ để xe"],
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        description: "Phòng rộng rãi, khép kín, có điều hòa, bình nóng lạnh. Gần xe bus và trường ĐHQG."
    },
    {
        id: "default_2",
        type: "room",
        title: "Phòng trọ đầy đủ nội thất",
        location: "Nam Từ Liêm, Hà Nội",
        price: 3500000,
        area: 30,
        lat: 21.006,
        lng: 105.765,
        status: "APPROVED",
        isVip: false,
        isRented: false,
        views: 85,
        amenities: ["Wi-Fi", "Thang máy", "Chỗ để xe"],
        imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        description: "Full nội thất chỉ việc xách vali vào ở. Có thang máy, khóa vân tay an toàn."
    },
    {
        id: "default_3",
        type: "vinhome",
        title: "Căn hộ Vinhome Ocean Park",
        location: "Gia Lâm, Hà Nội",
        price: 8000000,
        area: 55,
        lat: 21.001,
        lng: 105.940,
        status: "APPROVED",
        isVip: true,
        isRented: false,
        views: 230,
        amenities: ["Wi-Fi", "Điều hòa", "Thang máy", "Bảo vệ"],
        imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        description: "Căn hộ 2PN view đẹp, đầy đủ tiện ích Vinhome: bể bơi, công viên, siêu thị."
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

function getApprovedProperties() {
    const approvedOnline = onlineProperties.filter(item => item.status === "APPROVED" && !item.isRented);
    return [...defaultProperties, ...approvedOnline];
}

/* KHỞI ĐỘNG VÀ MÀN HÌNH CHỜ (SPLASH SCREEN) */
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

    initMap();
    initRegister();
    initLogin();
    initPostProperty();
    updateHeaderAuth();
    renderHomePageList();

    // Tải & Lắng nghe cơ sở dữ liệu Firebase trực tuyến
    listenOnlineDatabase();
});

/* DARK MODE TOGGLE */
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("rentmapDarkMode", isDark ? "true" : "false");
}

/* KHỞI TẠO BẢN ĐỒ CHÍNH */
function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement || typeof L === "undefined") return;

    map = L.map("map").setView([21.0285, 105.8542], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(map);

    showAll();
}

function renderMarkers(list) {
    if (!map) return;
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    list.forEach(property => {
        const isRoom = property.type === "room";
        const color = property.isVip ? "#f59e0b" : (isRoom ? "#2563eb" : "#dc2626");

        const marker = L.circleMarker([property.lat, property.lng], {
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
                📍 ${escapeHTML(property.location)}<br>
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

/* LẮNG NGHE DỮ LIỆU REALTIME FIREBASE */
function listenOnlineDatabase() {
    if (!db) return;

    db.collection("listings").onSnapshot(snapshot => {
        onlineProperties = [];
        snapshot.forEach(doc => {
            onlineProperties.push({ id: doc.id, ...doc.data() });
        });

        renderHomePageList();
        showAll();

        const activePage = document.querySelector(".page-section.active-page");
        if (activePage && activePage.id === "adminPage") renderAdminDashboard();
        if (activePage && activePage.id === "myListingsPage") renderMyListings();
    });
}

/* TÌM KIẾM CÓ BỘ LỌC TIỆN ÍCH NÂNG CAO */
function searchProperty() {
    const locationInput = document.getElementById("locationInput").value.trim().toLowerCase();
    const type = document.getElementById("propertyType").value;
    const priceFrom = Number(document.getElementById("priceFrom").value) || 0;
    const priceTo = Number(document.getElementById("priceTo").value) || Infinity;

    const selectedAmenities = Array.from(document.querySelectorAll(".filterAmenity:checked")).map(cb => cb.value);

    const results = getApprovedProperties().filter(p => {
        const matchLocation = locationInput === "" || p.location.toLowerCase().includes(locationInput);
        const matchType = type === "all" || p.type === type;
        const matchPrice = p.price >= priceFrom && p.price <= priceTo;
        
        const matchAmenities = selectedAmenities.every(a => (p.amenities || []).includes(a));

        return matchLocation && matchType && matchPrice && matchAmenities;
    });

    renderMarkers(results);
    renderHomePageList(results);

    if (results.length === 0) {
        alert("Không tìm thấy tin đăng phù hợp với điều kiện tìm kiếm.");
    } else if (map && results[0]) {
        map.setView([results[0].lat, results[0].lng], 12);
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
                <p class="location">📍 ${escapeHTML(item.location)}</p>
                <div style="display:flex; justify-content:space-between; margin-top:10px;">
                    <p class="price">${formatPrice(item.price)}</p>
                    <span style="font-size:12px; color:#64748b;">👁 ${item.views || 0} lượt xem</span>
                </div>
            </div>
        </div>
    `).join("");
}

/* CHUYỂN TRANG VÀ SÁNG NÚT MENU TƯƠNG ỨNG */
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

/* ĐĂNG NHẬP & ADMIN */
function initRegister() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const phone = document.getElementById("phone").value.trim();

        if (db) {
            const userDoc = await db.collection("users").doc(email).get();
            if (userDoc.exists) return alert("Email này đã được đăng ký.");

            await db.collection("users").doc(email).set({
                fullName, email, phone, password, role: "USER", status: "ACTIVE", createdAt: new Date().toISOString()
            });
        }

        alert("Đăng ký thành công!");
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

        // ADMIN MẶC ĐỊNH (nguyenvanthang@gmail.com / 15082006)
        if (email === "nguyenvanthang@gmail.com" && password === "15082006") {
            const adminUser = { id: "admin_9999", fullName: "Nguyễn Văn Thắng (Admin)", email: "nguyenvanthang@gmail.com", role: "ADMIN" };
            localStorage.setItem("rentmapCurrentUser", JSON.stringify(adminUser));
            updateHeaderAuth();
            alert("🔑 Đăng nhập ADMIN thành công!");
            return showPage("admin");
        }

        if (db) {
            const userDoc = await db.collection("users").doc(email).get();
            if (!userDoc.exists || userDoc.data().password !== password) {
                return alert("Sai email hoặc mật khẩu!");
            }
            localStorage.setItem("rentmapCurrentUser", JSON.stringify(userDoc.data()));
        }

        updateHeaderAuth();
        showPage("home");
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
                <span>${isAdmin ? '🛡️' : '👤'}</span><span>${escapeHTML(user.fullName)}</span>
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

/* ĐĂNG TIN VÀ TẢI ẢNH */
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        uploadedBase64Image = e.target.result;
        document.getElementById("imagePreviewBox").innerHTML = `<img src="${uploadedBase64Image}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

function initPostMap() {
    setTimeout(() => {
        const mapEl = document.getElementById("postMap");
        if (!mapEl) return;

        if (!postMap) {
            postMap = L.map("postMap").setView([21.0285, 105.8542], 12);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
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
            description: document.getElementById("postDescription").value.trim(),
            lat: selectedPinLocation.lat,
            lng: selectedPinLocation.lng,
            imageUrl: uploadedBase64Image,
            amenities: selectedAmenities,
            status: "PENDING",
            isVip: false,
            isRented: false,
            views: 0,
            createdAt: new Date().toISOString()
        };

        if (db) await db.collection("listings").add(newListing);

        alert("📤 Đăng tin thành công! Tin đăng đang chờ Admin duyệt.");
        showPage("myListings");
    });
}

/* THANH TOÁN MÔ PHỎNG ĐẨY VIP */
function openPaymentModal(listingId) {
    selectedVipListingId = listingId;
    document.getElementById("paymentModal").classList.add("show");
}

function closePaymentModal() {
    document.getElementById("paymentModal").classList.remove("show");
}

function confirmVipPayment() {
    if (!selectedVipListingId) return;
    toggleVipListing(selectedVipListingId);
    closePaymentModal();
    alert("🎉 Đã nâng cấp tin đăng lên VIP thành công!");
    renderMyListings();
    renderHomePageList();
}

/* ADMIN DASHBOARD */
async function renderAdminDashboard() {
    const listings = onlineProperties;
    
    document.getElementById("adminTotalListings").textContent = listings.length;
    document.getElementById("adminPendingListings").textContent = listings.filter(l => l.status === "PENDING").length;
    document.getElementById("adminApprovedListings").textContent = listings.filter(l => l.status === "APPROVED").length;

    renderAdminListingsTab(listings);
    renderAdminUsersTab();
}

function switchAdminTab(tabName) {
    document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));

    if (tabName === "listings") {
        document.getElementById("tabListingsBtn").classList.add("active");
        document.getElementById("adminListingsTab").classList.add("active");
    } else if (tabName === "users") {
        document.getElementById("tabUsersBtn").classList.add("active");
        document.getElementById("adminUsersTab").classList.add("active");
    } else {
        const btnReports = document.getElementById("tabReportsBtn");
        const tabReports = document.getElementById("adminReportsTab");
        if (btnReports) btnReports.classList.add("active");
        if (tabReports) tabReports.classList.add("active");
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
        <div class="admin-card-item">
            <div>
                <h3>${escapeHTML(item.title)} ${item.isVip ? '⭐ VIP' : ''}</h3>
                <p>👤 Người đăng: <strong>${escapeHTML(item.ownerEmail)}</strong> | Trạng thái: <span class="status-badge ${item.status === 'APPROVED' ? 'status-approved' : 'status-pending'}">${item.status}</span></p>
            </div>
            <div style="display:flex; gap:8px;">
                ${item.status !== "APPROVED" ? `<button class="btn-approve" onclick="adminApproveListing('${item.id}')">✅ Duyệt</button>` : ''}
                ${item.status !== "REJECTED" ? `<button class="btn-reject" onclick="adminRejectListing('${item.id}')">❌ Từ chối</button>` : ''}
                <button class="btn-vip" onclick="toggleVipListing('${item.id}', ${!item.isVip})">${item.isVip ? '⭐ Bỏ VIP' : '⭐ Gán VIP'}</button>
            </div>
        </div>
    `).join("");
}

async function renderAdminUsersTab() {
    const container = document.getElementById("adminUsersContainer");
    if (!container || !db) return;

    const snapshot = await db.collection("users").get();
    const users = [];
    snapshot.forEach(doc => users.push(doc.data()));

    container.innerHTML = users.map(u => `
        <div class="admin-card-item">
            <div>
                <h3>👤 ${escapeHTML(u.fullName)}</h3>
                <p>📧 Email: <strong>${escapeHTML(u.email)}</strong> | 📞 SĐT: ${escapeHTML(u.phone || 'Chưa cập nhật')}</p>
            </div>
            <span class="status-badge status-approved">${u.status || 'ACTIVE'}</span>
        </div>
    `).join("");
}

async function adminApproveListing(id) {
    if (db) await db.collection("listings").doc(id).update({ status: "APPROVED" });
    alert("✅ Đã duyệt tin thành công!");
}

async function adminRejectListing(id) {
    if (db) await db.collection("listings").doc(id).update({ status: "REJECTED" });
    alert("❌ Đã từ chối tin đăng!");
}

async function toggleVipListing(id, isVip) {
    if (db) await db.collection("listings").doc(id).update({ isVip: isVip });
}

/* RENDER TIN CỦA TÔI */
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
        <div class="my-listing-card">
            <div>
                <h3>${escapeHTML(l.title)} ${l.isVip ? '⭐ (Đã lên VIP)' : ''}</h3>
                <div style="margin-top:6px;">
                    <span class="status-badge ${l.status === 'APPROVED' ? 'status-approved' : 'status-pending'}">Duyệt: ${l.status}</span>
                    <span class="status-badge ${l.isRented ? 'status-rented' : 'status-approved'}">${l.isRented ? '🔒 ĐÃ CHO THUÊ' : '🟢 CÒN TRỐNG'}</span>
                </div>
            </div>
            <div style="display:flex; gap:10px;">
                ${!l.isVip ? `<button class="btn-vip" style="padding:10px 14px;" onclick="openPaymentModal('${l.id}')">💎 Nâng VIP</button>` : ''}
                <button class="btn-search" style="padding:10px 18px; border-radius:10px;" onclick="toggleRentedStatus('${l.id}', ${!l.isRented})">
                    ${l.isRented ? '🔓 Đánh dấu Trống' : '🔒 Đánh dấu Đã Thuê'}
                </button>
            </div>
        </div>
    `).join("");
}

async function toggleRentedStatus(id, isRented) {
    if (db) await db.collection("listings").doc(id).update({ isRented: isRented });
}

/* RENDER HỒ SƠ CÁ NHÂN */
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

/* CHI TIẾT VÀ YÊU THÍCH */
function viewProperty(id) {
    currentDetailPropertyId = id;
    const property = getApprovedProperties().find(item => item.id === id);
    if (!property) return;

    property.views = (property.views || 0) + 1;
    document.getElementById("propertyDetailTitle").textContent = property.title;
    document.getElementById("propertyDetailLocation").textContent = "📍 " + property.location;
    document.getElementById("propertyDetailArea").textContent = property.area + "m²";
    document.getElementById("propertyDetailPrice").textContent = formatPrice(property.price);
    
    const viewsEl = document.getElementById("propertyDetailViews");
    if (viewsEl) viewsEl.textContent = property.views;

    const descEl = document.getElementById("propertyDetailDescText");
    if (descEl) descEl.textContent = property.description;

    const amenitiesEl = document.getElementById("propertyDetailAmenities");
    if (amenitiesEl) amenitiesEl.textContent = (property.amenities && property.amenities.length > 0) ? property.amenities.join(", ") : "Khép kín";

    const imgBox = document.getElementById("propertyDetailImgBox");
    if (imgBox) {
        if (property.imageUrl) {
            imgBox.style.backgroundImage = `url('${property.imageUrl}')`;
            imgBox.style.backgroundSize = 'cover';
            imgBox.style.backgroundPosition = 'center';
            const iconEl = document.getElementById("propertyDetailIcon");
            if (iconEl) iconEl.style.display = 'none';
        } else {
            imgBox.style.backgroundImage = 'none';
            const iconEl = document.getElementById("propertyDetailIcon");
            if (iconEl) iconEl.style.display = 'block';
        }
    }

    showPage("propertyDetail");
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
    const favoriteProperties = getApprovedProperties().filter(p => favoriteIds.includes(p.id));

    if (favoriteProperties.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#6b7280; padding:30px;'>Chưa có tin yêu thích nào.</p>";
        return;
    }

    container.innerHTML = favoriteProperties.map(p => `
        <div class="my-listing-card">
            <div>
                <h3>${escapeHTML(p.title)}</h3>
                <p style="font-size:13px; color:#64748b; margin-top:4px;">📍 ${escapeHTML(p.location)} - 📐 ${p.area}m²</p>
                <strong style="color:#dc2626; font-size:16px;">${formatPrice(p.price)}</strong>
            </div>
            <button class="btn-search" style="padding:10px 18px; border-radius:10px;" onclick="viewProperty('${p.id}')">Xem chi tiết</button>
        </div>
    `).join("");
}

/* UTILS */
function togglePassword(id) {
    const input = document.getElementById(id);
    if (input) input.type = input.type === "password" ? "text" : "password";
}

function toggleLoginPassword() {
    const pwd = document.getElementById("loginPassword");
    if (pwd) pwd.type = pwd.type === "password" ? "text" : "password";
}

function formatPrice(p) { return new Intl.NumberFormat("vi-VN").format(p) + "đ"; }
function escapeHTML(str) { const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }
function checkPostLogin() { 
    const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
    if (!user) {
        alert("Vui lòng đăng nhập trước khi đăng tin!");
        return showPage("login");
    }
    showPage("post"); 
}