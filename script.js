/*====================================================
        KHAI BÁO DỮ LIỆU
====================================================*/

// Mã đăng ký hợp lệ
let validCodes = ["111"];

// Danh sách sản phẩm
let products = JSON.parse(localStorage.getItem("products")) || {

    "111": {
        name: "Coca Cola",
        price: 10000,
        quantity: 100
    },

    "222": {
        name: "Pepsi",
        price: 12000,
        quantity: 80
    },

    "333": {
        name: "Bánh mì",
        price: 5000,
        quantity: 150
    },

    "444": {
        name: "Sữa Vinamilk",
        price: 35000,
        quantity: 50
    }

};

// Giỏ hàng
let cart = [];

// Danh sách nhân viên
let staffs = JSON.parse(localStorage.getItem("staffs")) || [];

// Doanh thu
let revenue = Number(localStorage.getItem("revenue")) || 0;

// Hóa đơn
let invoices = JSON.parse(localStorage.getItem("invoices")) || [];


/*====================================================
            LOAD TRANG
====================================================*/

window.onload = function () {

    renderProducts();

    renderStaff();

    updateDashboard();

    let user = JSON.parse(localStorage.getItem("user"));

    if (user) {

        showLogin();

        loginName.value = user.name;

        loginId.value = user.id;

    }

}


/*====================================================
        CHUYỂN TRANG
====================================================*/

function showLogin() {

    registerPage.style.display = "none";

    loginPage.style.display = "block";

}

function showRegister() {

    registerPage.style.display = "block";

    loginPage.style.display = "none";

}

function showSection(id) {

    let sections = document.querySelectorAll(".section");

    sections.forEach(function (item) {

        item.style.display = "none";

    });

    document.getElementById(id).style.display = "block";

}


/*====================================================
        ĐĂNG KÝ
====================================================*/

function register() {

    let code = inviteCode.value.trim();

    let name = regName.value.trim();

    let phone =
        document.getElementById("regPhone")
            .value.trim();

    let password = document.getElementById("regPassword").value.trim();

    staffs = JSON.parse(localStorage.getItem("staffs")) || [];

    // Không được để trống
    if (phone == "") {

        alert("Vui lòng nhập số điện thoại!");

        return;
    }

    // Chỉ được nhập số
    if (!/^[0-9]+$/.test(phone)) {

        alert("Số điện thoại chỉ được nhập số!");

        return;
    }

    // Phải đủ đúng 10 số
    if (phone.length != 10) {

        alert("Số điện thoại phải có đúng 10 số!");

        return;
    }

    // Phải bắt đầu bằng số 0
    if (!phone.startsWith("0")) {

        alert("Số điện thoại phải bắt đầu bằng số 0!");

        return;
    }

    let existingStaff = staffs.find(function (item) {

        return item.phone === phone;

    });

    if (existingStaff) {

        alert("Số điện thoại này đã được đăng ký trước đó.\nMã nhân viên: " + existingStaff.id);

        document.getElementById("loginName").value = existingStaff.name;

        document.getElementById("loginId").value = existingStaff.id;

        showLogin();

        return;

    }

    if (password == "") {

        alert("Vui lòng nhập mật khẩu!");

        return;
    }

    let birth = regBirth.value;

    if (code == "" || name == "" || phone == "" || password == "" || birth == "") {

        alert("Vui lòng nhập đầy đủ thông tin.");

        return;

    }

    if (!validCodes.includes(code)) {

        alert("Mã đăng ký không hợp lệ.");

        return;

    }

    let id = "NV" + Math.floor(Math.random() * 9000 + 1000);

    let existingId = staffs.find(function (item) {

        return item.id === id;

    });

    while (existingId) {

        id = "NV" + Math.floor(Math.random() * 9000 + 1000);

        existingId = staffs.find(function (item) {

            return item.id === id;

        });

    }

    let staff = {

        id: id,

        name: name,

        phone: phone,

        password: password,

        birth: birth,

        hours: 0

    };

    staffs.push(staff);

    localStorage.setItem("staffs", JSON.stringify(staffs));

    localStorage.setItem("user", JSON.stringify({

        id: id,

        name: name

    }));

    alert("Đăng ký thành công\nMã nhân viên: " + id);

    renderStaff();

    showLogin();

}


/*====================================================
        ĐĂNG NHẬP
====================================================*/

function login() {

    let name = loginName.value.trim();

    let id = loginId.value.trim();

    let password = loginPassword.value.trim();

    let user = staffs.find(function (item) {

        return item.name === name && item.id === id;

    });

    if (user && user.password === password) {

        loginPage.style.display = "none";

        mainApp.style.display = "block";

        staff.innerHTML = "Nhân viên : " + user.name + " | " + user.id;

        startCamera();

        updateDashboard();

    }

    else {

        alert("Sai thông tin đăng nhập hoặc mật khẩu.");

    }

}


/*====================================================
        ĐĂNG XUẤT
====================================================*/

function logout() {

    if (confirm("Bạn muốn đăng xuất ?")) {

        mainApp.style.display = "none";

        loginPage.style.display = "block";

        barcode.value = "";

        cart = [];

        renderBill();

    }

}
/*====================================================
            CAMERA
====================================================*/

function startCamera() {

    const codeReader = new ZXing.BrowserBarcodeReader();

    const video = document.getElementById("video");

    codeReader.getVideoInputDevices()

        .then(devices => {

            if (devices.length == 0) {

                alert("Không tìm thấy camera.");

                return;

            }

            codeReader.decodeFromVideoDevice(

                devices[0].deviceId,

                video,

                (result) => {

                    if (result) {

                        barcode.value = result.text;

                        scanProduct();

                    }

                }

            );

        })

        .catch(err => {

            console.log(err);

        });

}

/*====================================================
            QUÉT MÃ
====================================================*/

function scanProduct() {

    let code = barcode.value.trim();

    if (code == "") {

        alert("Nhập mã sản phẩm.");

        return;

    }

    if (products[code] == undefined) {

        alert("Không tìm thấy sản phẩm.");

        return;

    }

    if (products[code].quantity <= 0) {

        alert("Sản phẩm đã hết.");

        return;

    }

    let found = cart.find(item => item.code == code);

    if (found) {

        found.qty++;

    }

    else {

        cart.push({

            code: code,

            name: products[code].name,

            price: products[code].price,

            qty: 1

        });

    }

    products[code].quantity--;

    localStorage.setItem("products", JSON.stringify(products));

    renderProducts();

    renderBill();

    barcode.value = "";

}

/*====================================================
            TÌM KIẾM
====================================================*/

function searchProduct() {

    let keyword = search.value.toLowerCase();

    let result = document.getElementById("searchResult");

    result.innerHTML = "";

    if (keyword == "") {

        result.innerHTML = "Nhập tên sản phẩm.";

        return;

    }

    for (let code in products) {

        let p = products[code];

        if (

            p.name.toLowerCase().includes(keyword)

        ) {

            result.innerHTML += `

            <div class="result">

                <b>${p.name}</b><br>

                Mã : ${code}<br>

                Giá : ${p.price.toLocaleString()} VNĐ<br>

                Tồn kho : ${p.quantity}

            </div>

            <hr>

            `;

        }

    }

}

/*====================================================
            HÓA ĐƠN
====================================================*/

function renderBill() {

    let tbody = document.querySelector("#bill tbody");

    tbody.innerHTML = "";

    let total = 0;

    cart.forEach(function (item, index) {

        let money = item.price * item.qty;

        total += money;

        tbody.innerHTML += `

        <tr>

            <td>${item.name}</td>

            <td>${item.price.toLocaleString()}</td>

            <td>

                <button onclick="minusQty(${index})">-</button>

                ${item.qty}

                <button onclick="plusQty(${index})">+</button>

            </td>

            <td>${money.toLocaleString()}</td>

            <td>

                <button onclick="deleteItem(${index})">

                Xóa

                </button>

            </td>

        </tr>

        `;

    });

    total.innerHTML = "";

    document.getElementById("total").innerHTML =

        "Tổng tiền : <b>" +

        total.toLocaleString()

        + " VNĐ</b>";

}

/*====================================================
        TĂNG SỐ LƯỢNG
====================================================*/

function plusQty(index) {

    let code = cart[index].code;

    if (products[code].quantity <= 0) {

        alert("Hết hàng.");

        return;

    }

    cart[index].qty++;

    products[code].quantity--;

    localStorage.setItem("products", JSON.stringify(products));

    renderProducts();

    renderBill();

}

/*====================================================
        GIẢM SỐ LƯỢNG
====================================================*/

function minusQty(index) {

    cart[index].qty--;

    products[cart[index].code].quantity++;

    if (cart[index].qty <= 0) {

        cart.splice(index, 1);

    }

    localStorage.setItem("products", JSON.stringify(products));

    renderProducts();

    renderBill();

}

/*====================================================
        XÓA SẢN PHẨM
====================================================*/

function deleteItem(index) {

    let code = cart[index].code;

    products[code].quantity += cart[index].qty;

    cart.splice(index, 1);

    localStorage.setItem("products", JSON.stringify(products));

    renderProducts();

    renderBill();

}

function closeQrModal() {

    document.getElementById("qrModal").style.display = "none";

}

function showQrModal(total) {

    let qrBox = document.getElementById("qrCodeBox");

    qrBox.innerHTML = `

        <img src="QR.jpg" alt="QR thanh toán" style="width:220px;height:220px;object-fit:contain;border:1px solid #ddd;border-radius:12px;padding:8px;background:#fff;">

        <p style="margin-top:10px;font-weight:bold;">Tổng: ` + total.toLocaleString() + ` VNĐ</p>

    `;

    document.getElementById("qrModal").style.display = "flex";

}

/*====================================================
            THANH TOÁN
====================================================*/

function pay() {

    if (cart.length == 0) {

        alert("Chưa có sản phẩm.");

        return;

    }

    let total = 0;

    cart.forEach(function (item) {

        total += item.price * item.qty;

    });

    revenue += total;

    localStorage.setItem("revenue", revenue);

    invoices.push({

        date: new Date().toLocaleString(),

        total: total,

        items: cart

    });

    localStorage.setItem(

        "invoices",

        JSON.stringify(invoices)

    );

    showQrModal(total);

    cart = [];

    renderBill();

    updateDashboard();

}
/*====================================================
            QUẢN LÝ KHO HÀNG
====================================================*/

function addProduct() {

    let code = document.getElementById("newCode").value.trim();

    let name = document.getElementById("newName").value.trim();

    let price = Number(document.getElementById("newPrice").value);

    if (code == "" || name == "" || price <= 0) {

        alert("Vui lòng nhập đầy đủ thông tin!");

        return;

    }

    if (products[code]) {

        alert("Mã sản phẩm đã tồn tại!");

        return;

    }

    products[code] = {

        name: name,

        price: price,

        quantity: 100

    };

    localStorage.setItem(

        "products",

        JSON.stringify(products)

    );

    renderProducts();

    newCode.value = "";
    newName.value = "";
    newPrice.value = "";

    alert("Đã thêm sản phẩm!");

}

/*==========================================*/

function deleteProduct(code) {

    if (confirm("Bạn có chắc muốn xóa sản phẩm?")) {

        delete products[code];

        localStorage.setItem(

            "products",

            JSON.stringify(products)

        );

        renderProducts();

    }

}

/*==========================================*/

function editProduct(code) {

    let name = prompt(

        "Tên mới",

        products[code].name

    );

    let price = prompt(

        "Giá mới",

        products[code].price

    );

    let quantity = prompt(

        "Số lượng",

        products[code].quantity

    );

    if (name == null) return;

    products[code].name = name;

    products[code].price = Number(price);

    products[code].quantity = Number(quantity);

    localStorage.setItem(

        "products",

        JSON.stringify(products)

    );

    renderProducts();

}

/*==========================================*/

function renderProducts() {

    let table = document.getElementById("productTable");

    table.innerHTML = "";

    for (let code in products) {

        table.innerHTML += `

        <tr>

            <td>${code}</td>

            <td>${products[code].name}</td>

            <td>${products[code].price.toLocaleString()}</td>

            <td>${products[code].quantity}</td>

            <td>

                <button onclick="editProduct('${code}')">

                Sửa

                </button>

                <button onclick="deleteProduct('${code}')">

                Xóa

                </button>

            </td>

        </tr>

        `;

    }

}


/*====================================================
        QUẢN LÝ NHÂN VIÊN
====================================================*/

function renderStaff() {

    let table = document.getElementById("staffTable");

    table.innerHTML = "";

    staffs.forEach(function (item, index) {

        table.innerHTML += `

        <tr>

            <td>${item.name}</td>

            <td>${item.id}</td>

            <td>${item.phone}</td>

            <td>${item.birth}</td>

            <td>${item.hours} giờ</td>

            <td>

                <button onclick="editStaff(${index})">

                Sửa

                </button>

                <button onclick="deleteStaff(${index})">

                Xóa

                </button>

            </td>

        </tr>

        `;

    });

}

/*==========================================*/

function editStaff(index) {

    let name = prompt(

        "Tên nhân viên",

        staffs[index].name

    );

    let phone = prompt(

        "Số điện thoại",

        staffs[index].phone

    );

    if (name == null) return;

    staffs[index].name = name;

    staffs[index].phone = phone;

    localStorage.setItem(

        "staffs",

        JSON.stringify(staffs)

    );

    renderStaff();

}

/*==========================================*/

function deleteStaff(index) {

    if (confirm("Xóa nhân viên này?")) {

        staffs.splice(index, 1);

        localStorage.setItem(

            "staffs",

            JSON.stringify(staffs)

        );

        renderStaff();

    }

}


/*====================================================
            DASHBOARD
====================================================*/

function updateDashboard() {

    let productCount = 0;

    for (let code in products) {

        productCount++;

    }

    let staffCount = staffs.length;

    let billCount = invoices.length;

    if (document.getElementById("totalProduct"))

        totalProduct.innerHTML = productCount;

    if (document.getElementById("totalStaff"))

        totalStaff.innerHTML = staffCount;

    if (document.getElementById("totalRevenue"))

        totalRevenue.innerHTML =

            revenue.toLocaleString() + " VNĐ";

    if (document.getElementById("totalBill"))

        totalBill.innerHTML = billCount;

}


/*====================================================
            ĐỒNG HỒ
====================================================*/

setInterval(function () {

    if (document.getElementById("time")) {

        document.getElementById("time").innerHTML =

            new Date().toLocaleString();

    }

}, 1000);