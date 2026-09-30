import { auth, db, firebaseConfigData } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ==================================================
// DATA MATERI
// ==================================================

const lessons = [
  {
    id: 1,
    title: "Menyimak Drama Jawa Modern",
    description:
      "Mangerteni drama Jawa modern lan bab-bab sing kudu digatekake nalika nyimak.",

    material: `
      <h3>Pengertian</h3>

      <p>
        Drama Jawa modern yaiku karya sastra awujud pagelaran
        kang nggunakake basa Jawa minangka sarana komunikasi para paraga.
        Crita diwujudake lumantar dialog, tumindak, lan interaksi antarparaga.
      </p>

      <h3>Tujuan Menyimak</h3>

      <p>
        Sawise nyimak drama, siswa diajab bisa mangerteni isi crita,
        ngenali paraga, lan nemokake informasi penting sajrone drama.
      </p>

      <h3>Sing Kudu Digatekake</h3>

      <ul>
        <li>Sapa wae paraga ing drama.</li>
        <li>Isi dialog antarparaga.</li>
        <li>Kedadeyan utawa konflik ing crita.</li>
        <li>Latar panggonan lan wektu.</li>
        <li>Pesen kang ana ing drama.</li>
      </ul>
    `
  },

  {
    id: 2,
    title: "",
    description: "",
    material: ""
  },

  {
    id: 3,
    title: "",
    description: "",
    material: ""
  },

  {
    id: 4,
    title: "",
    description: "",
    material: ""
  }
];


// ==================================================
// VARIABEL
// ==================================================

let currentLesson = null;

let progress = [];

let student = null;

let currentEditingMaterialId = null;


// ==================================================
// FUNGSI PINDAH HALAMAN
// ==================================================

function show(pageId) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  document.getElementById(pageId).classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
// ==================================================
// AMBIL MATERI 1 DARI FIREBASE
// ==================================================

async function loadLesson1FromFirebase() {

  try {

    const materialsSnapshot = await getDocs(
      collection(db, "materials")
    );

    if (materialsSnapshot.empty) {
      return;
    }

    // Ambil materi pertama
    const firstMaterial = materialsSnapshot.docs[0];
    const data = firstMaterial.data();

    // Masukkan data Firebase ke Materi 1
    lessons[0].title =
      data.title || lessons[0].title;

    lessons[0].description =
      data.description || lessons[0].description;

    lessons[0].material =
      data.content || lessons[0].material;  

      console.log("ISI FIREBASE:", data.content);
console.log("ISI MATERIAL:", lessons[0].material);

    console.log("Materi 1 dari Firebase:", data);

  } catch (error) {

    console.error(
      "Gagal mengambil Materi 1:",
      error
    );

  }
}
// ==================================================
// MENAMPILKAN MATERI
// ==================================================

function renderLessons() {

  const list = document.getElementById("lessonList");

  list.innerHTML = "";

  lessons.forEach(lesson => {

    const completed = progress.includes(lesson.id);

    // Untuk sementara hanya materi 1 yang dibuka
    const unlocked = lesson.id === 1;

    const div = document.createElement("div");

    div.className =
      `lesson ${unlocked ? "" : "locked"}`;

    let title = lesson.title;
    let description = lesson.description;

    if (!title) {
      title = `Materi ${lesson.id}`;
      description = "Materi durung diisi.";
    }

    div.innerHTML = `
      <div class="lesson-num">
        ${completed ? "✓" : lesson.id}
      </div>

      <div>
        <h3>${title}</h3>

        <p>
          ${
            completed
              ? "Wis rampung"
              : description
          }
        </p>
      </div>

      <button
        class="lesson-action"
        ${unlocked ? "" : "disabled"}
      >
        ${
          completed
            ? "Baleni"
            : unlocked
              ? "Mulai"
              : "🔒 Dikunci"
        }
      </button>
    `;

    if (unlocked) {

      div
        .querySelector(".lesson-action")
        .addEventListener("click", () => {

          openLesson(lesson.id);

        });

    }

    list.appendChild(div);

  });


  // ==================================================
  // PROGRESS
  // ==================================================

  const count = progress.length;

  document.getElementById("progressText").textContent =
    `${count} / 4 materi`;

  document.getElementById("progressFill").style.width =
    `${(count / 4) * 100}%`;
}

// ==================================================
// MENAMPILKAN DAFTAR SISWA
// ==================================================

async function loadStudents() {
  const studentList = document.getElementById("studentList");

  try {
    // Siswa baru
    const usersSnapshot = await getDocs(
      collection(db, "users")
    );

    // Siswa lama
    const studentsSnapshot = await getDocs(
      collection(db, "students")
    );

    const students = [];

    // Ambil siswa dari users
    usersSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();

      if (data.role === "student") {
        students.push({
          id: docSnapshot.id,
          ...data
        });
      }
    });

    // Ambil siswa dari students lama
    studentsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();

      students.push({
        id: docSnapshot.id,
        ...data
      });
    });

    if (students.length === 0) {
      studentList.innerHTML =
        "<p>Durung ana data siswa.</p>";
      return;
    }

    studentList.innerHTML = students.map((siswa) => {
      const progressCount = Array.isArray(siswa.progress)
        ? siswa.progress.length
        : 0;

      return `
        <div class="student-row">
          <div>
            <strong>${siswa.nama || "-"}</strong>
            <p>
              ID: ${siswa.studentId || siswa.id || "-"}
              · Kelas: ${siswa.kelas || "-"}
            </p>
          </div>

          <div>
            <strong>${progressCount}/4</strong>
            <p>Progres</p>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Gagal mengambil data siswa:", error);

    studentList.innerHTML =
      "<p>Gagal mengambil data siswa.</p>";
  }
}

// ==================================================
// MEMBUKA MATERI
// ==================================================
// ==================================================
// MENAMPILKAN DAFTAR MATERI GURU
// ==================================================

async function loadMaterials() {

  const materialList =
    document.getElementById("materialList");

  try {

    const materialsSnapshot =
      await getDocs(
        collection(db, "materials")
      );

    if (materialsSnapshot.empty) {

      materialList.innerHTML =
        "<p>Durung ana materi.</p>";

      return;
    }

    let nomor = 1;

    materialList.innerHTML =
      materialsSnapshot.docs.map(docSnapshot => {

        const data = docSnapshot.data();

        return `
  <div class="student-row">

    <div>
      <strong>
        Materi ${nomor++}: ${data.title || "-"}
      </strong>

      <p>
        ${data.description || "-"}
      </p>
    </div>

    <button
      class="btn secondary edit-material-btn"
      data-id="${docSnapshot.id}"
    >
      Edit
    </button>

  </div>
`;

      }).join("");

  } catch (error) {

    console.error(
      "Gagal mengambil materi:",
      error
    );

    materialList.innerHTML =
      "<p>Gagal mengambil data materi.</p>";
  }
}
function markdownToHtml(text) {

  return text
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}
function openLesson(id) {

  currentLesson =
    lessons.find(lesson => lesson.id === id);

  if (!currentLesson) return;


  document.getElementById("lessonNumber").textContent =
    `Materi ${currentLesson.id}`;

  document.getElementById("lessonTitle").textContent =
    currentLesson.title;

  document.getElementById("lessonDescription").textContent =
    currentLesson.description;

  document.getElementById("materialText").innerHTML =
  markdownToHtml(currentLesson.material);


  document
    .getElementById("materialStep")
    .classList.remove("hidden");

  document
    .getElementById("videoStep")
    .classList.add("hidden");

  document
    .getElementById("quizStep")
    .classList.add("hidden");


  document.getElementById("watchedCheck").checked = false;

  document.getElementById("toQuizBtn").disabled = true;


  setSteps(1);

  show("lessonPage");
}


// ==================================================
// STEP MATERI / VIDEO / QUIZ
// ==================================================

function setSteps(active) {

  [1, 2, 3].forEach(number => {

    const step =
      document.getElementById(`step${number}`);

    step.classList.toggle(
      "active",
      number === active
    );

    step.classList.toggle(
      "done",
      number < active
    );

  });

}


// ==================================================
// LOGIN FIREBASE
// ==================================================
// ==================================================
// LOGIN FIREBASE
// ==================================================

document
  .getElementById("loginForm")
  .addEventListener("submit", async function(event) {

    event.preventDefault();

    const id =
      document
        .getElementById("nama")
        .value
        .trim();

    const password =
      document
        .getElementById("kelas")
        .value;

    if (!id || !password) {

      alert("ID lan password kudu diisi.");

      return;
    }

    try {

      /*
       * Sementara:
       * - Jika yang dimasukkan adalah email → langsung digunakan.
       * - Jika yang dimasukkan ID siswa → dibuat menjadi email internal.
       */

      let email = id;

      if (!id.includes("@")) {

        email =
          `${id}@siswa.sinau-menyimak.web.app`;

      }

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("Login berhasil:", email);

    }

    catch (error) {

      console.error("Firebase Login Error:", error);

      alert(
        "ID/email utawa password salah."
      );

    }

  });
// ==================================================
// CEK AKUN FIREBASE
// ==================================================

onAuthStateChanged(auth, async user => {

  if (!user) {

    student = null;

    show("loginPage");

    return;
  }


  try {

    const userDoc =
      await getDoc(
        doc(db, "users", user.uid)
      );


    if (!userDoc.exists()) {

      alert(
        "Data akun durung didaftarkan dening guru."
      );

      await signOut(auth);

      return;
    }


    student = userDoc.data();


    // ==================================================
    // CEK ROLE
    // ==================================================

   if (student.role === "teacher") {

  document.getElementById("teacherName").textContent =
    student.nama || "Guru";

  await loadStudents();
  await loadMaterials();

  show("teacherPage");

  return;

}
// ==================================================
// SISWA
// ==================================================

document.getElementById("welcomeName").textContent =
  student.nama || "Siswa";

document.getElementById("welcomeClass").textContent =
  student.kelas || "";

progress = student.progress || [];

await loadLesson1FromFirebase();

renderLessons();

show("homePage");
  }

  catch (error) {

    console.error(error);

    alert(
      "Ana masalah nalika njupuk data akun."
    );

  }

});


// ==================================================
// MATERI → VIDEO
// ==================================================

document
  .getElementById("toVideoBtn")
  .addEventListener("click", function() {

    document
      .getElementById("materialStep")
      .classList.add("hidden");

    document
      .getElementById("videoStep")
      .classList.remove("hidden");

    setSteps(2);

  });


// ==================================================
// CHECK VIDEO
// ==================================================

document
  .getElementById("watchedCheck")
  .addEventListener("change", function(event) {

    document.getElementById("toQuizBtn").disabled =
      !event.target.checked;

  });


// ==================================================
// VIDEO → QUIZIZZ
// ==================================================

document
  .getElementById("toQuizBtn")
  .addEventListener("click", function() {

    document
      .getElementById("videoStep")
      .classList.add("hidden");

    document
      .getElementById("quizStep")
      .classList.remove("hidden");

    setSteps(3);

  });


// ==================================================
// TOMBOL QUIZIZZ
// ==================================================

document
  .getElementById("quizizzBtn")
  .addEventListener("click", function() {

    alert(
      "Link Quizizz durung dipasang."
    );

  });


// ==================================================
// SELESAI MATERI
// ==================================================

document
  .getElementById("finishBtn")
  .addEventListener("click", async function() {

    if (!student || !auth.currentUser) return;


    if (!progress.includes(currentLesson.id)) {

      progress.push(currentLesson.id);


      try {

        await setDoc(
          doc(
            db,
            "users",
            auth.currentUser.uid
          ),

          {
            progress: progress
          },

          {
            merge: true
          }
        );

      }

      catch (error) {

        console.error(error);

        alert(
          "Progress gagal disimpan."
        );

        return;
      }

    }


    renderLessons();

    show("homePage");

  });


// ==================================================
// KEMBALI KE BERANDA
// ==================================================

document
  .getElementById("backBtn")
  .addEventListener("click", function() {

    renderLessons();

    show("homePage");

  });


// ==================================================
// LOGOUT
// ==================================================

async function logout() {

  try {

    await signOut(auth);

    student = null;
    progress = [];

    show("loginPage");

  }

  catch (error) {

    console.error(error);

  }

}
document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("logoutBtn2").addEventListener("click", logout);

document.getElementById("teacherLogoutBtn").addEventListener("click", logout);


// TAMBAH SISWA - BUKA FORM
document.getElementById("addStudentBtn").addEventListener("click", function() {
  document.getElementById("addStudentForm").classList.remove("hidden");
});

// TAMBAH SISWA - TUTUP FORM
document.getElementById("cancelStudentBtn").addEventListener("click", function() {
  document.getElementById("addStudentForm").classList.add("hidden");
});

// TAMBAH MATERI - BUKA FORM

document.getElementById("addMaterialBtn").addEventListener("click", function() {

  document.getElementById("addMaterialForm").classList.remove("hidden");

});

// EDIT MATERI

document.addEventListener("click", async function(event) {

  if (event.target.classList.contains("edit-material-btn")) {

    const materialId =
      event.target.dataset.id;

      currentEditingMaterialId = materialId;
    try {

      const materialDoc =
        await getDoc(doc(db, "materials", materialId));

      if (!materialDoc.exists()) {
        alert("Materi ora ditemokake.");
        return;
      }

      const data = materialDoc.data();

      document.getElementById("editMaterialTitle").value =
        data.title || "";

      document.getElementById("editMaterialDescription").value =
        data.description || "";

      document.getElementById("editMaterialContent").value =
        data.content || "";

      document
        .getElementById("editMaterialForm")
        .classList.remove("hidden");

    } catch (error) {

      console.error("Gagal membuka materi:", error);

      alert("Materi gagal dibuka.");

    }

  }

});
// SIMPAN PERUBAHAN MATERI

document
  .getElementById("editMaterialFormElement")
  .addEventListener("submit", async function(event) {

    event.preventDefault();

    const title =
      document.getElementById("editMaterialTitle").value.trim();

    const description =
      document.getElementById("editMaterialDescription").value.trim();

    const content =
      document.getElementById("editMaterialContent").value.trim();

    if (!title || !description || !content) {
      alert("Kabeh data materi kudu diisi.");
      return;
    }

    try {

      await setDoc(
        doc(db, "materials", currentEditingMaterialId),
        {
          title: title,
          description: description,
          content: content
        },
        { merge: true }
      );

      alert("Materi berhasil diperbarui!");

      document
        .getElementById("editMaterialForm")
        .classList.add("hidden");

      await loadMaterials();

    } catch (error) {

      console.error(
        "Gagal memperbarui materi:",
        error
      );

      alert("Materi gagal diperbarui.");

    }

});

// TAMBAH MATERI - BATAL

document.getElementById("cancelMaterialBtn").addEventListener("click", function() {

  document.getElementById("addMaterialForm").classList.add("hidden");

});
// SIMPAN MATERI

document.getElementById("materialForm").addEventListener("submit", async function(event) {

  event.preventDefault();

  const title = document.getElementById("materialTitle").value.trim();
  const description = document.getElementById("materialDescription").value.trim();
  const content = document.getElementById("materialContent").value.trim();

  if (!title || !description) {
    alert("Judul lan deskripsi kudu diisi.");
    return;
  }

  try {

    await setDoc(doc(collection(db, "materials")), {
    title: title,
    description: description,
   content: content,
    createdAt: new Date().toISOString()
    });

    alert("Materi berhasil disimpan!");

    document.getElementById("materialForm").reset();
    document.getElementById("addMaterialForm").classList.add("hidden");

    loadMaterials();

  } catch (error) {

    console.error("Gagal menyimpan materi:", error);
    alert("Materi gagal disimpan.");

  }

});
document.getElementById("studentForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const nama = document.getElementById("studentName").value.trim();
  const id = document.getElementById("studentId").value.trim();
  const kelas = document.getElementById("studentClass").value.trim();
  const password = document.getElementById("studentPassword").value;

  if (!nama || !id || !kelas || !password) {
    alert("Kabeh data siswa kudu diisi.");
    return;
  }

  try {
    const email = `${id}@siswa.sinau-menyimak.web.app`;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfigData.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      throw new Error(
        data.error?.message || "Gagal membuat akun siswa."
      );
    }

    await setDoc(doc(db, "users", data.localId), {
      nama: nama,
      studentId: id,
      kelas: kelas,
      role: "student",
      progress: []
    });

    alert("Akun siswa berhasil dibuat!");

    await loadStudents();

    document.getElementById("studentForm").reset();
    document.getElementById("addStudentForm").classList.add("hidden");

  } catch (error) {
    console.error("Gagal membuat akun siswa:", error);

    if (error.message === "EMAIL_EXISTS") {
      alert("ID siswa tersebut sudah digunakan.");
    } else {
      alert(error.message || "Gagal membuat akun siswa.");
    }
  }
});