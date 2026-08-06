// ===============================
// DỮ LIỆU
// ===============================

let students = JSON.parse(localStorage.getItem("students")) || [];
let studentAccounts = JSON.parse(localStorage.getItem("studentAccounts")) || [];
let currentStudent = null;

function updateHeaderUserInfo() {
    const headerUserInfo = document.getElementById("headerUserInfo");
    if (!headerUserInfo) return;

    if (currentStudent) {
        headerUserInfo.textContent = `${currentStudent.name} (${currentStudent.studentCode})`;
    } else {
        headerUserInfo.textContent = "Admin";
    }
}

function setCurrentStudent(account) {
    currentStudent = account;
    updateHeaderUserInfo();
}

// ===============================
// HIỂN THỊ
// ===============================

function renderStudents() {

    const table = document.getElementById("studentTable");

    table.innerHTML = "";

    students.forEach((sv, index) => {

        let status = Number(sv.diem) >= 5
            ? '<span class="success">Đạt</span>'
            : '<span class="fail">Không đạt</span>';

        table.innerHTML += `
        <tr>

            <td>${sv.masv}</td>

            <td>${sv.hoten}</td>

            <td>${sv.khoa}</td>

            <td>${sv.chuyennganh}</td>

            <td>${sv.lop}</td>

            <td>${sv.diem}</td>

            <td>${status}</td>

            <td>

                <button class="edit"
                onclick="editStudent(${index})">

                    ✏

                </button>

                <button class="delete"
                onclick="deleteStudent(${index})">

                    🗑

                </button>

            </td>

        </tr>
        `;

    });

    localStorage.setItem("students", JSON.stringify(students));

    updateDashboard();

}

// ===============================
// THÊM SINH VIÊN
// ===============================

function themSinhVien() {

    let masv = document.getElementById("masv").value.trim();

    let hoten = document.getElementById("hoten").value.trim();

    let khoa = document.getElementById("khoa").value;

    let chuyennganh = document.getElementById("cn").value;

    let lop = document.getElementById("lop").value.trim();

    let diem = document.getElementById("diem").value;

    if (
        masv == "" ||
        hoten == "" ||
        chuyennganh == "" ||
        lop == "" ||
        diem == ""
    ) {

        alert("Vui lòng nhập đầy đủ thông tin và chọn chuyên ngành, lớp.");

        return;

    }

    students.push({

        masv,

        hoten,

        khoa,

        chuyennganh,

        lop,

        diem

    });

    renderStudents();

    clearForm();

}

// ===============================
// XÓA
// ===============================

function deleteStudent(index) {

    if (confirm("Bạn có muốn xóa sinh viên này?")) {

        students.splice(index, 1);

        renderStudents();

    }

}

// ===============================
// SỬA
// ===============================

function editStudent(index) {

    let sv = students[index];

    document.getElementById("masv").value = sv.masv;

    document.getElementById("hoten").value = sv.hoten;

    document.getElementById("khoa").value = sv.khoa;

    document.getElementById("cn").value = sv.chuyennganh;

    document.getElementById("lop").value = sv.lop;

    document.getElementById("diem").value = sv.diem;

    students.splice(index, 1);

    renderStudents();

}

// ===============================
// XÓA FORM
// ===============================

function clearForm() {

    document.getElementById("masv").value = "";

    document.getElementById("hoten").value = "";

    document.getElementById("khoa").value = "Khoa Công nghệ thông tin";

    document.getElementById("cn").value = "";

    document.getElementById("lop").value = "";

    document.getElementById("diem").value = "";

}

function selectMenu(element, sectionId) {
    const items = document.querySelectorAll('.sidebar ul li');
    items.forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => section.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
}

function logoutUser() {
    document.body.classList.add('login-page-active');
}

function payTuition() {
    const masv = document.getElementById('paymentMasv').value.trim();
    const amount = document.getElementById('paymentAmount').value;

    if (!masv || !amount) {
        alert('Vui lòng nhập mã sinh viên và số tiền cần đóng.');
        return;
    }

    alert(`Thanh toán thành công ${amount} VNĐ cho sinh viên ${masv}.`);
    document.getElementById('paymentMasv').value = '';
    document.getElementById('paymentAmount').value = '';
}

function viewPaymentHistory() {
    alert('Chức năng lịch sử thanh toán sẽ được hoàn thiện sau.');
}

// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {

    let cards = document.querySelectorAll(".card h2");

    if(cards.length>=4){

        cards[0].innerHTML = students.length;

        let khoa = [...new Set(students.map(item => item.khoa))];

        cards[1].innerHTML = khoa.length;

        let lop = [...new Set(students.map(item => item.lop))];

        cards[2].innerHTML = lop.length;

        let dat = students.filter(item => Number(item.diem) >= 5).length;

        let tyle = students.length == 0
            ? 0
            : Math.round(dat / students.length * 100);

        cards[3].innerHTML = tyle + "%";

    }

}

// ===============================
// TÌM KIẾM
// ===============================

const search = document.querySelector(".user input");

if(search){

search.addEventListener("keyup", function () {

    const keyword = this.value.toLowerCase();

    const rows = document.querySelectorAll("#studentTable tr");

    rows.forEach(row => {

        if (row.innerText.toLowerCase().includes(keyword)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

});

}

// ===============================
// ĐĂNG NHẬP SINH VIÊN
// ===============================

function isValidCccd(cccd) {
    if (!/^[0-9]+$/.test(cccd)) {
        alert("Số CCCD chỉ được chứa chữ số. Vui lòng nhập lại.");
        return false;
    }
    if (cccd.length !== 12) {
        alert("Số CCCD phải đúng 12 chữ số.");
        return false;
    }
    return true;
}

function handleStudentLogin(event) {
    if (event) {
        event.preventDefault();
    }

    const cccd = document.getElementById("loginCccd").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (cccd === "") {
        alert("Vui lòng nhập số CCCD.");
        return;
    }

    if (!isValidCccd(cccd)) {
        return;
    }

    if (password === "") {
        alert("Vui lòng nhập mật khẩu.");
        return;
    }

    const account = studentAccounts.find(acc => acc.cccd === cccd);
    if (!account) {
        alert("Không tìm thấy tài khoản. Vui lòng đăng ký.");
        return;
    }

    if (account.password !== password) {
        alert("Mật khẩu không đúng. Vui lòng thử lại.");
        return;
    }

    setCurrentStudent(account);
    document.body.classList.remove("login-page-active");
    alert(`Xin chào ${account.name}, bạn đã đăng nhập thành công!`);
}

function showRegisterView(event) {
    if (event) {
        event.preventDefault();
    }
    document.getElementById("loginView").classList.add("hidden");
    document.getElementById("registerView").classList.remove("hidden");
}

function showLoginView(event) {
    if (event) {
        event.preventDefault();
    }
    document.getElementById("registerView").classList.add("hidden");
    document.getElementById("loginView").classList.remove("hidden");
}

function generateStudentCode() {
    const prefix = "DH";
    let maxIndex = 0;

    studentAccounts.forEach(acc => {
        if (acc.studentCode && acc.studentCode.startsWith(prefix)) {
            const num = parseInt(acc.studentCode.slice(prefix.length), 10);
            if (!isNaN(num) && num > maxIndex) {
                maxIndex = num;
            }
        }
    });

    return prefix + String(maxIndex + 1).padStart(4, "0");
}

function handleStudentRegister(event) {
    if (event) {
        event.preventDefault();
    }

    const name = document.getElementById("registerName").value.trim();
    const cccd = document.getElementById("registerCccd").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;

    if (name === "" || cccd === "" || password === "" || confirmPassword === "") {
        alert("Vui lòng nhập đầy đủ thông tin đăng ký.");
        return;
    }

    if (!isValidCccd(cccd)) {
        return;
    }

    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp.");
        return;
    }

    if (studentAccounts.some(acc => acc.cccd === cccd)) {
        alert("Lỗi: Số CCCD này đã tồn tại. Vui lòng kiểm tra lại.");
        return;
    }

    const studentCode = generateStudentCode();

    const account = {
        name,
        cccd,
        password,
        studentCode
    };

    studentAccounts.push(account);
    localStorage.setItem("studentAccounts", JSON.stringify(studentAccounts));

    setCurrentStudent(account);
    document.body.classList.remove("login-page-active");
    alert(`Đăng ký thành công. Mã sinh viên của bạn là: ${studentCode}`);
    document.getElementById("registerForm").reset();
}

// ===============================
// KHỞI ĐỘNG
// ===============================

renderStudents();