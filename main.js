/* =====================================================
   RENTMAP - MAIN JAVASCRIPT
===================================================== */

const defaultProperties = [
    {
        id: 1,
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
        description: "Phòng rộng rãi, khép kín, có điều hòa, bình nóng lạnh. Gần xe bus và trường ĐHQG."
    },
    {
        id: 2,
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
        description: "Full nội thất chỉ việc xách vali vào ở. Có thang máy, khóa vân tay an toàn."
    },
    {
        id: 3,
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
        description: "Căn hộ 2PN view đẹp, đầy đủ tiện ích Vinhome: bể bơi, công viên, siêu thị."
    }
];

let map = null;
let markers = [];
let userMarker = null;
let currentDetailPropertyId = null;

let postMap = null;
let postPinMarker = null;
let selectedPinLocation = null;

function getApprovedProperties() {
    const userListings = JSON.parse(localStorage.getItem("rentmapListings") || "[]");
    const approvedUserListings = userListings.filter(item => item.status === "APPROVED" && !item.isRented).map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        location: item.location || item.address,
        price: Number(item.price),
        area: Number(item.area),
        lat: item.lat || (21.0285 + (Math.random() - 0.02) * 0.04),
        lng: item.lng || (105.8542 + (Math.random() - 0.02) * 0.04),
        description: item.description || "Chưa có mô tả.",
        isVip: item.isVip || false,
        isRented: item.isRented || false,
        views: item.views || 0
    }));
    return [...defaultProperties, ...approvedUserListings];
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
                <button onclick="viewProperty(${property.id})" style="padding:6px 12px; border:0; border-radius:6px; background:#2563eb; color:white; cursor:pointer;">Xem chi tiết</button>
            </div>
        `);

        marker.addTo(map);
        markers.push(marker);
    });
}

function showAll() { renderMarkers(getApprovedProperties()); }
function showRoomMap() { renderMarkers(getApprovedProperties().filter(p => p.type === "room")); }
function showVinhomeMap() { renderMarkers(getApprovedProperties().filter(p => p.type === "vinhome")); }

/* HÀM TÌM KIẾM BỘ LỌC KHOẢNG GIÁ FROM - TO */
function searchProperty() {
    const locationInput = document.getElementById("locationInput").value.trim().toLowerCase();
    const type = document.getElementById("propertyType").value;
    const priceFrom = Number(document.getElementById("priceFrom").value) || 0;
    const priceTo = Number(document.getElementById("priceTo").value) || Infinity;

    const results = getApprovedProperties().filter(p => {
        const matchLocation = locationInput === "" || p.location.toLowerCase().includes(locationInput);
        const matchType = type === "all" || p.type === type;
        const matchPrice = p.price >= priceFrom && p.price <= priceTo;

        return matchLocation && matchType && matchPrice;
    });

    renderMarkers(results);
    renderHomePageList(results);

    if (results.length === 0) {
        alert("Không tìm thấy tin đăng phù hợp trong khoảng giá này.");
    } else if (map) {
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
        <div class="property-card ${item.isVip ? 'is-vip' : ''}" onclick="viewProperty(${item.id})">
            ${item.isVip ? '<span class="vip-badge">⭐ VIP</span>' : ''}
            <div class="property-image ${item.type === 'room' ? 'room-image' : 'vinhome-image'}">
                <span class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(this, ${item.id})">♡</span>
                <span class="image-icon">${item.type === 'room' ? '🏠' : '🏢'}</span>
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

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const phone = document.getElementById("phone").value.trim();

        let users = JSON.parse(localStorage.getItem("rentmapUsers") || "[]");
        if (users.some(u => u.email === email)) {
            return alert("Email này đã được đăng ký.");
        }

        users.push({ id: Date.now(), fullName, email, phone, password, role: "USER", status: "ACTIVE" });
        localStorage.setItem("rentmapUsers", JSON.stringify(users));
        alert("Đăng ký thành công!");
        showPage("login");
    });
}

function initLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        // ADMIN MẶC ĐỊNH (nguyenvanthang@gmail.com / 15082006)
        if (email === "nguyenvanthang@gmail.com" && password === "15082006") {
            const adminUser = { id: 9999, fullName: "Nguyễn Văn Thắng (Admin)", email: "nguyenvanthang@gmail.com", role: "ADMIN" };
            localStorage.setItem("rentmapCurrentUser", JSON.stringify(adminUser));
            updateHeaderAuth();
            alert("🔑 Đăng nhập ADMIN thành công!");
            return showPage("admin");
        }

        const users = JSON.parse(localStorage.getItem("rentmapUsers") || "[]");
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) return alert("Sai email hoặc mật khẩu!");

        localStorage.setItem("rentmapCurrentUser", JSON.stringify(user));
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

/* ĐĂNG TIN VÀ TỰ ĐỘNG HIỆN BẢN ĐỒ GHIM VỊ TRÍ (#postMap) */
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
    document.getElementById("postCoordinates").textContent = `📍 Vị trí: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    if (postPinMarker) postPinMarker.setLatLng([lat, lng]);
    else postPinMarker = L.marker([lat, lng]).addTo(postMap);
}

function initPostProperty() {
    const form = document.getElementById("postPropertyForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
        if (!selectedPinLocation) return alert("Vui lòng click ghim vị trí trên bản đồ!");

        const newListing = {
            id: Date.now(),
            ownerEmail: user.email,
            type: document.getElementById("postType").value,
            title: document.getElementById("postTitle").value.trim(),
            price: Number(document.getElementById("postPrice").value),
            area: Number(document.getElementById("postArea").value),
            location: document.getElementById("postAddress").value.trim(),
            description: document.getElementById("postDescription").value.trim(),
            lat: selectedPinLocation.lat,
            lng: selectedPinLocation.lng,
            status: "PENDING",
            isVip: false,
            isRented: false,
            views: 0
        };

        const listings = JSON.parse(localStorage.getItem("rentmapListings") || "[]");
        listings.push(newListing);
        localStorage.setItem("rentmapListings", JSON.stringify(listings));
        alert("📤 Đăng tin thành công! Tin đang chờ Admin kiểm duyệt.");
        showPage("myListings");
    });
}

/* ADMIN DASHBOARD & BÁO CÁO VI PHẠM */
function renderAdminDashboard() {
    const listings = JSON.parse(localStorage.getItem("rentmapListings") || "[]");
    const users = JSON.parse(localStorage.getItem("rentmapUsers") || "[]");
    const reports = JSON.parse(localStorage.getItem("rentmapReports") || "[]");

    document.getElementById("adminTotalListings").textContent = listings.length;
    document.getElementById("adminPendingListings").textContent = listings.filter(l => l.status === "PENDING").length;
    document.getElementById("adminApprovedListings").textContent = listings.filter(l => l.status === "APPROVED").length;
    document.getElementById("adminTotalReports").textContent = reports.length;

    renderAdminListingsTab(listings);
    renderAdminUsersTab(users);
    renderAdminReportsTab(reports);
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
        document.getElementById("tabReportsBtn").classList.add("active");
        document.getElementById("adminReportsTab").classList.add("active");
    }
}

function renderAdminListingsTab(listings) {
    const container = document.getElementById("adminListingsContainer");
    if (!container) return;
    if (listings.length === 0) {
        container.innerHTML = "<p style='padding:20px; text-align:center;'>Chưa có tin đăng nào.</p>";
        return;
    }

    container.innerHTML = listings.map(item => `
        <div class="my-listing-item">
            <h3>${escapeHTML(item.title)} ${item.isVip ? '⭐ VIP' : ''}</h3>
            <p>👤 Người đăng: ${escapeHTML(item.ownerEmail)} | Trạng thái: <strong>${item.status}</strong></p>
            <div style="margin-top:8px;">
                ${item.status !== "APPROVED" ? `<button class="btn-approve" onclick="adminApproveListing(${item.id})">✅ Duyệt</button>` : ''}
                ${item.status !== "REJECTED" ? `<button class="btn-reject" onclick="adminRejectListing(${item.id})">❌ Từ chối</button>` : ''}
                <button class="btn-vip" onclick="toggleVipListing(${item.id})">${item.isVip ? '⭐ Bỏ VIP' : '⭐ Gán VIP'}</button>
            </div>
        </div>
    `).join("");
}

function renderAdminUsersTab(users) {
    const container = document.getElementById("adminUsersContainer");
    if (!container) return;
    container.innerHTML = users.map(u => `
        <div class="my-listing-item">
            <h3>👤 ${escapeHTML(u.fullName)} (${escapeHTML(u.email)})</h3>
            <p>📞 SĐT: ${escapeHTML(u.phone)} | Trạng thái: <strong>${u.status || 'ACTIVE'}</strong></p>
        </div>
    `).join("");
}

function adminApproveListing(id) {
    updateListingStatus(id, "APPROVED");
    alert("✅ Đã duyệt tin!");
    renderAdminDashboard();
}

function adminRejectListing(id) {
    updateListingStatus(id, "REJECTED");
    alert("❌ Đã từ chối tin!");
    renderAdminDashboard();
}

function toggleVipListing(id) {
    let listings = JSON.parse(localStorage.getItem("rentmapListings") || "[]");
    listings = listings.map(item => item.id === id ? { ...item, isVip: !item.isVip } : item);
    localStorage.setItem("rentmapListings", JSON.stringify(listings));
    renderAdminDashboard();
}

function updateListingStatus(id, status) {
    let listings = JSON.parse(localStorage.getItem("rentmapListings") || "[]");
    listings = listings.map(item => item.id === id ? { ...item, status } : item);
    localStorage.setItem("rentmapListings", JSON.stringify(listings));
}

function renderAdminReportsTab(reports) {
    const container = document.getElementById("adminReportsContainer");
    if (!container) return;
    if (reports.length === 0) {
        container.innerHTML = "<p style='padding:20px; text-align:center;'>Không có báo cáo vi phạm nào.</p>";
        return;
    }
    container.innerHTML = reports.map(r => `
        <div class="my-listing-item">
            <h3>🚩 Báo cáo tin ID: ${r.propertyId}</h3>
            <p>Lý do: <strong>${escapeHTML(r.reason)}</strong></p>
            <p>Thời gian: ${new Date(r.createdAt).toLocaleString()}</p>
        </div>
    `).join("");
}

function reportCurrentProperty() {
    if (!currentDetailPropertyId) return;
    const reason = prompt("Nhập lý do báo cáo tin vi phạm (VD: Tin lừa đảo, ảnh giả...):");
    if (!reason) return;

    const reports = JSON.parse(localStorage.getItem("rentmapReports") || "[]");
    reports.push({ propertyId: currentDetailPropertyId, reason, createdAt: new Date().toISOString() });
    localStorage.setItem("rentmapReports", JSON.stringify(reports));
    alert("🚩 Báo cáo của bạn đã được gửi tới Admin xử lý!");
}

/* TIN CỦA TÔI */
function renderMyListings() {
    const container = document.getElementById("myListingsContainer");
    if (!container) return;
    const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
    if (!user) return;

    const listings = JSON.parse(localStorage.getItem("rentmapListings") || "[]").filter(l => l.ownerEmail === user.email);
    if (listings.length === 0) {
        container.innerHTML = "<p style='padding:20px; text-align:center;'>Bạn chưa đăng tin cho thuê nào.</p>";
        return;
    }

    container.innerHTML = listings.map(l => `
        <div class="my-listing-item">
            <h3>${escapeHTML(l.title)}</h3>
            <p>Trạng thái: <strong>${l.status}</strong> | Đã cho thuê: <strong>${l.isRented ? 'ĐÃ CHO THUÊ' : 'CÒN TRỐNG'}</strong></p>
            <button class="btn-search" style="margin-top:8px;" onclick="toggleRentedStatus(${l.id})">
                ${l.isRented ? '🔓 Đánh dấu Còn Trống' : '🔒 Đánh dấu Đã Cho Thuê'}
            </button>
        </div>
    `).join("");
}

function toggleRentedStatus(id) {
    let listings = JSON.parse(localStorage.getItem("rentmapListings") || "[]");
    listings = listings.map(item => item.id === id ? { ...item, isRented: !item.isRented } : item);
    localStorage.setItem("rentmapListings", JSON.stringify(listings));
    renderMyListings();
    renderHomePageList();
}

/* CHI TIẾT VÀ ĐẶT LỊCH XEM PHÒNG */
function viewProperty(id) {
    currentDetailPropertyId = id;
    const property = getApprovedProperties().find(item => item.id === id);
    if (!property) return;

    property.views = (property.views || 0) + 1;
    document.getElementById("propertyDetailTitle").textContent = property.title;
    document.getElementById("propertyDetailLocation").textContent = "📍 " + property.location;
    document.getElementById("propertyDetailArea").textContent = property.area + "m²";
    document.getElementById("propertyDetailPrice").textContent = formatPrice(property.price);
    document.getElementById("propertyDetailViews").textContent = property.views;
    document.getElementById("propertyDetailDescText").textContent = property.description;

    showPage("propertyDetail");
}

function handleBooking(e) {
    e.preventDefault();
    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    alert(`📅 Đặt lịch thành công vào lúc ${time} ngày ${date}! Chủ nhà sẽ liên hệ xác nhận.`);
}

/* YÊU THÍCH */
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
        <div class="my-listing-item">
            <h3>${escapeHTML(p.title)}</h3>
            <p>📍 ${escapeHTML(p.location)}</p>
            <p>💰 ${formatPrice(p.price)} - 📐 ${p.area}m²</p>
            <button class="btn-search" style="padding:6px 12px; margin-top:10px;" onclick="viewProperty(${p.id})">Xem chi tiết</button>
        </div>
    `).join("");
}

/* UTILS */
function showProfile() {
    const user = JSON.parse(localStorage.getItem("rentmapCurrentUser"));
    if (!user) return showPage("login");
    document.getElementById("profileName").textContent = user.fullName || "---";
    document.getElementById("profilePhone").textContent = user.phone || "---";
    document.getElementById("profileEmail").textContent = user.email || "---";
    document.getElementById("profileRole").textContent = user.role === "ADMIN" ? "Quản Trị Viên (Admin)" : "Người dùng";
    showPage("profile");
}

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
function checkPostLogin() { showPage("post"); }