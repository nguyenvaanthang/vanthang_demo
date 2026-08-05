// ===============================
// DỮ LIỆU
// ===============================

let students = JSON.parse(localStorage.getItem("students")) || [];

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

function handleStudentLogin(event) {
    if (event) {
        event.preventDefault();
    }

    const masv = document.getElementById("loginMasv").value.trim();
    const password = document.getElementById("loginPassword").value;
    const defaultPassword = "123456";

    if (masv === "") {
        alert("Vui lòng nhập mã sinh viên.");
        return;
    }

    if (password !== defaultPassword) {
        alert("Mật khẩu không đúng. Vui lòng thử lại.");
        return;
    }

    document.body.classList.remove("login-page-active");
    alert(`Xin chào ${masv}, bạn đã đăng nhập thành công!`);
}

// ===============================
// KHỞI ĐỘNG
// ===============================

renderStudents();