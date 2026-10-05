/* =====================================================
   RENTMAP - MAIN JAVASCRIPT
===================================================== */


/* =====================================================
   DỮ LIỆU BẤT ĐỘNG SẢN
===================================================== */

const properties = [

    {
        id: 1,
        type: "room",
        title: "Phòng trọ 25m² gần Đại học Quốc gia",
        location: "Cầu Giấy, Hà Nội",
        price: 3000000,
        area: 25,
        lat: 21.036,
        lng: 105.790
    },

    {
        id: 2,
        type: "room",
        title: "Phòng trọ đầy đủ nội thất",
        location: "Nam Từ Liêm, Hà Nội",
        price: 3500000,
        area: 30,
        lat: 21.006,
        lng: 105.765
    },

    {
        id: 3,
        type: "vinhome",
        title: "Căn hộ Vinhome Ocean Park",
        location: "Gia Lâm, Hà Nội",
        price: 8000000,
        area: 55,
        lat: 21.001,
        lng: 105.940
    }

];


/* =====================================================
   BIẾN MAP
===================================================== */

let map = null;

let markers = [];

let userMarker = null;


/* =====================================================
   SPLASH SCREEN
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const splash = document.getElementById("rentmapSplash");

    if (splash) {

        setTimeout(function () {

            splash.classList.add("hide");

            setTimeout(function () {

                splash.remove();

            }, 700);

        }, 1600);

    }


    initMap();

    initRegister();

    initLogin();

    updateHeaderAuth();

});


/* =====================================================
   KHỞI TẠO MAP
===================================================== */

function initMap() {

    const mapElement = document.getElementById("map");

    if (!mapElement || typeof L === "undefined") {
        return;
    }


    map = L.map("map").setView(
        [21.0285, 105.8542],
        11
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    showAll();

}


/* =====================================================
   HIỂN THỊ MARKER
===================================================== */

function renderMarkers(list) {

    if (!map) return;


    markers.forEach(function (marker) {

        map.removeLayer(marker);

    });

    markers = [];


    list.forEach(function (property) {

        const isRoom =
            property.type === "room";


        const marker = L.circleMarker(
            [
                property.lat,
                property.lng
            ],
            {
                radius: 10,

                color:
                    isRoom
                        ? "#2563eb"
                        : "#dc2626",

                fillColor:
                    isRoom
                        ? "#3b82f6"
                        : "#ef4444",

                fillOpacity: .9,

                weight: 3
            }
        );


        marker.bindPopup(`

            <div style="min-width:220px">

                <strong>
                    ${property.title}
                </strong>

                <br><br>

                📍 ${property.location}

                <br>

                📐 ${property.area}m²

                <br>

                <strong style="color:#dc2626">
                    ${formatPrice(property.price)}
                </strong>

                /tháng

                <br><br>

                <button
                    onclick="viewProperty(${property.id})"
                    style="
                        padding:8px 12px;
                        border:0;
                        border-radius:8px;
                        background:#2563eb;
                        color:white;
                        cursor:pointer;
                    "
                >
                    Xem chi tiết
                </button>

            </div>

        `);


        marker.addTo(map);

        markers.push(marker);

    });

}


/* =====================================================
   HIỂN THỊ TẤT CẢ
===================================================== */

function showAll() {

    setActiveFilter("filterAll");

    renderMarkers(properties);

}


/* =====================================================
   CHỈ HIỆN PHÒNG TRỌ
===================================================== */

function showRoomMap() {

    setActiveFilter("filterRoom");

    const rooms = properties.filter(function (property) {

        return property.type === "room";

    });

    renderMarkers(rooms);


    if (map && rooms.length > 0) {

        map.setView(
            [rooms[0].lat, rooms[0].lng],
            12
        );

    }

}


/* =====================================================
   CHỈ HIỆN VINHOME
===================================================== */

function showVinhomeMap() {

    setActiveFilter("filterVinhome");

    const vinhomes = properties.filter(function (property) {

        return property.type === "vinhome";

    });

    renderMarkers(vinhomes);


    if (map && vinhomes.length > 0) {

        map.setView(
            [vinhomes[0].lat, vinhomes[0].lng],
            12
        );

    }

}


/* =====================================================
   FILTER BUTTON
===================================================== */

function setActiveFilter(id) {

    const buttons = document.querySelectorAll(
        ".filter-btn"
    );


    buttons.forEach(function (button) {

        button.classList.remove("active");

    });


    const activeButton =
        document.getElementById(id);


    if (activeButton) {

        activeButton.classList.add("active");

    }

}


/* =====================================================
   TÌM KIẾM
===================================================== */

function searchProperty() {

    const locationInput =
        document
            .getElementById("locationInput")
            .value
            .trim()
            .toLowerCase();


    const type =
        document
            .getElementById("propertyType")
            .value;


    const price =
        document
            .getElementById("price")
            .value;


    let results =
        properties.filter(function (property) {

            let locationOK = true;

            let typeOK = true;

            let priceOK = true;


            /* Địa điểm */

            if (locationInput !== "") {

                locationOK =
                    property.location
                        .toLowerCase()
                        .includes(locationInput);

            }


            /* Loại */

            if (type !== "all") {

                typeOK =
                    property.type === type;

            }


            /* Giá */

            if (price === "under3") {

                priceOK =
                    property.price < 3000000;

            }

            else if (price === "3to5") {

                priceOK =
                    property.price >= 3000000 &&
                    property.price <= 5000000;

            }

            else if (price === "5to10") {

                priceOK =
                    property.price > 5000000 &&
                    property.price <= 10000000;

            }

            else if (price === "over10") {

                priceOK =
                    property.price > 10000000;

            }


            return (
                locationOK &&
                typeOK &&
                priceOK
            );

        });


    renderMarkers(results);


    const mapSection =
        document.getElementById("mapSection");


    if (mapSection) {

        mapSection.scrollIntoView({
            behavior: "smooth"
        });

    }


    if (results.length === 0) {

        alert(
            "Không tìm thấy tin đăng phù hợp."
        );

        return;

    }


    if (map && results.length > 0) {

        map.setView(
            [
                results[0].lat,
                results[0].lng
            ],
            12
        );

    }

}


/* =====================================================
   ĐỊNH VỊ NGƯỜI DÙNG
===================================================== */

function locateUser() {

    if (!navigator.geolocation) {

        alert(
            "Trình duyệt của bạn không hỗ trợ định vị."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            if (!map) return;


            map.setView(
                [lat, lng],
                15
            );


            if (userMarker) {

                map.removeLayer(
                    userMarker
                );

            }


            userMarker =
                L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(
                        "📍 Vị trí hiện tại của bạn"
                    )
                    .openPopup();

        },

        function () {

            alert(
                "Không thể lấy vị trí hiện tại. Bạn hãy cho phép trình duyệt sử dụng vị trí."
            );

        }

    );

}


/* =====================================================
   CHUYỂN TRANG
===================================================== */

function showPage(page) {

    const pages =
        document.querySelectorAll(
            ".page-section"
        );


    pages.forEach(function (item) {

        item.classList.remove(
            "active-page"
        );

    });


    if (page === "home") {

        document
            .getElementById("homePage")
            .classList.add("active-page");


        updateHeaderAuth();

    }


    else if (page === "register") {

        document
            .getElementById("registerPage")
            .classList.add("active-page");

    }


    else if (page === "login") {

        document
            .getElementById("loginPage")
            .classList.add("active-page");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =====================================================
   ĐĂNG KÝ
===================================================== */

function initRegister() {

    const form =
        document.getElementById(
            "registerForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const fullName =
                document
                    .getElementById("fullName")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("registerEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById("registerPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            const agreeTerms =
                document
                    .getElementById("agreeTerms")
                    .checked;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            message.className =
                "message";


            message.textContent = "";


            if (fullName.length < 2) {

                showRegisterError(
                    "Vui lòng nhập họ và tên."
                );

                return;

            }


            const phoneRegex =
                /^(0|\+84)[0-9]{9,10}$/;


            if (!phoneRegex.test(phone)) {

                showRegisterError(
                    "Số điện thoại không hợp lệ."
                );

                return;

            }


            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email)) {

                showRegisterError(
                    "Email không hợp lệ."
                );

                return;

            }


            if (password.length < 6) {

                showRegisterError(
                    "Mật khẩu phải có ít nhất 6 ký tự."
                );

                return;

            }


            if (password !== confirmPassword) {

                showRegisterError(
                    "Mật khẩu nhập lại không khớp."
                );

                return;

            }


            if (!agreeTerms) {

                showRegisterError(
                    "Bạn cần đồng ý với điều khoản sử dụng."
                );

                return;

            }


            let users =
                JSON.parse(
                    localStorage.getItem(
                        "rentmapUsers"
                    )
                ) || [];


            const emailExists =
                users.some(function (user) {

                    return user.email === email;

                });


            if (emailExists) {

                showRegisterError(
                    "Email này đã được đăng ký."
                );

                return;

            }


            const phoneExists =
                users.some(function (user) {

                    return user.phone === phone;

                });


            if (phoneExists) {

                showRegisterError(
                    "Số điện thoại này đã được đăng ký."
                );

                return;

            }


            const newUser = {

                id: Date.now(),

                fullName: fullName,

                phone: phone,

                email: email,

                password: password,

                role: "USER",

                status: "ACTIVE",

                createdAt:
                    new Date().toISOString()

            };


            users.push(newUser);


            localStorage.setItem(
                "rentmapUsers",
                JSON.stringify(users)
            );


            message.className =
                "message success";


            message.textContent =
                "Đăng ký thành công! Đang chuyển sang đăng nhập...";


            setTimeout(function () {

                showPage("login");


                const loginEmail =
                    document.getElementById(
                        "loginEmail"
                    );


                if (loginEmail) {

                    loginEmail.value =
                        email;

                }

            }, 1200);

        }
    );

}


/* =====================================================
   LỖI ĐĂNG KÝ
===================================================== */

function showRegisterError(text) {

    const message =
        document.getElementById(
            "registerMessage"
        );


    message.className =
        "message error";


    message.textContent =
        text;

}


/* =====================================================
   ĐĂNG NHẬP
===================================================== */

function initLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            const message =
                document.getElementById(
                    "loginMessage"
                );


            const users =
                JSON.parse(
                    localStorage.getItem(
                        "rentmapUsers"
                    )
                ) || [];


            const user =
                users.find(function (item) {

                    return (
                        item.email === email &&
                        item.password === password
                    );

                });


            if (!user) {

                message.className =
                    "message error";


                message.textContent =
                    "Email hoặc mật khẩu không chính xác.";

                return;

            }


            if (user.status === "LOCKED") {

                message.className =
                    "message error";


                message.textContent =
                    "Tài khoản của bạn đã bị khóa.";

                return;

            }


            localStorage.setItem(
                "rentmapCurrentUser",
                JSON.stringify(user)
            );


            message.className =
                "message success";


            message.textContent =
                "Đăng nhập thành công!";


            setTimeout(function () {

                showPage("home");

                updateHeaderAuth();

            }, 800);

        }
    );

}


/* =====================================================
   HIỂN THỊ TÀI KHOẢN TRÊN HEADER
===================================================== */

function updateHeaderAuth() {

    const header =
        document.getElementById(
            "headerAuthActions"
        );


    if (!header) return;


    const user =
        JSON.parse(
            localStorage.getItem(
                "rentmapCurrentUser"
            )
        );


    if (!user) {

        header.innerHTML = `

            <button
                class="notification-btn"
                title="Thông báo"
            >
                🔔
            </button>

            <a
                href="#"
                class="login-btn"
                onclick="
                    showPage('login');
                    return false;
                "
            >
                Đăng nhập
            </a>

            <a
                href="#"
                class="register-btn"
                onclick="
                    showPage('register');
                    return false;
                "
            >
                Đăng ký
            </a>

        `;

        return;

    }


    header.innerHTML = `

        <button
            class="notification-btn"
            title="Thông báo"
        >
            🔔
        </button>


        <div class="account-menu">

            <button
                class="account-button"
                onclick="toggleAccountMenu()"
            >

                👤
                ${escapeHTML(user.fullName)}

                <span>⌄</span>

            </button>


            <div
                id="accountDropdown"
                class="account-dropdown"
            >

                <a href="#"
                   onclick="
                       showProfile();
                       return false;
                   ">
                    👤 Hồ sơ cá nhân
                </a>

                <a href="#">
                    📋 Tin của tôi
                </a>

                <a href="#"
                   onclick="
                       checkPostLogin();
                       return false;
                   ">
                    ➕ Đăng tin cho thuê
                </a>

                <a href="#"
                   onclick="
                       showFavorites();
                       return false;
                   ">
                    ❤️ Tin yêu thích
                </a>

                <a href="#">
                    📅 Lịch đặt thuê
                </a>

                <a href="#">
                    💬 Tin nhắn
                </a>

                <a href="#">
                    ⚙️ Cài đặt
                </a>

                <hr>

                <button
                    onclick="logoutUser()"
                >
                    🚪 Đăng xuất
                </button>

            </div>

        </div>

    `;

}


/* =====================================================
   ACCOUNT DROPDOWN
===================================================== */

function toggleAccountMenu() {

    const dropdown =
        document.getElementById(
            "accountDropdown"
        );


    if (!dropdown) return;


    dropdown.classList.toggle("show");

}


document.addEventListener(
    "click",
    function (event) {

        const account =
            document.querySelector(
                ".account-menu"
            );


        const dropdown =
            document.getElementById(
                "accountDropdown"
            );


        if (
            account &&
            dropdown &&
            !account.contains(event.target)
        ) {

            dropdown.classList.remove(
                "show"
            );

        }

    }
);


/* =====================================================
   ĐĂNG XUẤT
===================================================== */

function logoutUser() {

    localStorage.removeItem(
        "rentmapCurrentUser"
    );


    updateHeaderAuth();


    showPage("home");


    alert(
        "Bạn đã đăng xuất khỏi RentMap."
    );

}


/* =====================================================
   KIỂM TRA ĐĂNG TIN
===================================================== */

function checkPostLogin() {

    const user =
        JSON.parse(
            localStorage.getItem(
                "rentmapCurrentUser"
            )
        );


    if (!user) {

        alert(
            "Bạn cần đăng nhập để đăng tin."
        );


        showPage("login");

        return;

    }


    alert(
        "Chức năng Đăng tin sẽ được phát triển ở bước tiếp theo."
    );

}


/* =====================================================
   MẬT KHẨU
===================================================== */

function togglePassword(
    inputId,
    button
) {

    const input =
        document.getElementById(
            inputId
        );


    if (!input) return;


    if (input.type === "password") {

        input.type = "text";

        button.textContent = "🙈";

    }

    else {

        input.type = "password";

        button.textContent = "👁";

    }

}


/* =====================================================
   MẬT KHẨU LOGIN
===================================================== */

function toggleLoginPassword() {

    const password =
        document.getElementById(
            "loginPassword"
        );


    if (!password) return;


    if (password.type === "password") {

        password.type = "text";

    }

    else {

        password.type = "password";

    }

}


/* =====================================================
   YÊU THÍCH
===================================================== */

function toggleFavorite(element) {

    const user =
        JSON.parse(
            localStorage.getItem(
                "rentmapCurrentUser"
            )
        );


    if (!user) {

        alert(
            "Bạn cần đăng nhập để lưu tin yêu thích."
        );

        showPage("login");

        return;

    }


    element.classList.toggle(
        "liked"
    );


    if (
        element.classList.contains(
            "liked"
        )
    ) {

        element.textContent = "♥";

    }

    else {

        element.textContent = "♡";

    }

}


/* =====================================================
   HỒ SƠ
===================================================== */

function showProfile() {

    const user =
        JSON.parse(
            localStorage.getItem(
                "rentmapCurrentUser"
            )
        );


    if (!user) {

        showPage("login");

        return;

    }


    alert(

        "HỒ SƠ CÁ NHÂN\n\n" +

        "Họ tên: " +
        user.fullName +
        "\n" +

        "Email: " +
        user.email +
        "\n" +

        "SĐT: " +
        user.phone

    );

}


/* =====================================================
   YÊU THÍCH
===================================================== */

function showFavorites() {

    const user =
        JSON.parse(
            localStorage.getItem(
                "rentmapCurrentUser"
            )
        );


    if (!user) {

        alert(
            "Bạn cần đăng nhập để xem tin yêu thích."
        );

        showPage("login");

        return;

    }


    alert(
        "Danh sách tin yêu thích của bạn sẽ hiển thị tại đây."
    );

}


/* =====================================================
   CHI TIẾT BẤT ĐỘNG SẢN
===================================================== */

function viewProperty(id) {

    const property =
        properties.find(function (item) {

            return item.id === id;

        });


    if (!property) return;


    alert(

        "CHI TIẾT TIN ĐĂNG\n\n" +

        "Tên: " +
        property.title +
        "\n\n" +

        "Địa điểm: " +
        property.location +
        "\n\n" +

        "Diện tích: " +
        property.area +
        "m²\n\n" +

        "Giá thuê: " +
        formatPrice(property.price) +
        "/tháng\n\n" +

        "Loại: " +
        (
            property.type === "room"
                ? "Phòng trọ"
                : "Vinhome"
        )

    );

}


/* =====================================================
   FORMAT GIÁ
===================================================== */

function formatPrice(price) {

    return new Intl.NumberFormat(
        "vi-VN"
    ).format(price) + "đ";

}


/* =====================================================
   CUỘN ĐẾN SECTION
===================================================== */

function scrollToSection(id) {

    showPage("home");


    setTimeout(function () {

        const section =
            document.getElementById(id);


        if (section) {

            section.scrollIntoView({
                behavior: "smooth"
            });

        }

    }, 100);

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent = text;


    return div.innerHTML;

}