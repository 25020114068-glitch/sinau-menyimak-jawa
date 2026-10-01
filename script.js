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

let currentEditingEditButton = null;

let currentEditingVideoButton = null;


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

   const materialRef = doc(
  db,
  "materials",
  "MuBW6LqTMRuTUraGuEtd"
);

const materialSnapshot = await getDoc(materialRef);

if (!materialSnapshot.exists()) {
  return;
}

const data = materialSnapshot.data();

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

  if (!materialList) return;

  const materialIds = {
    1: "MuBW6LqTMRuTUraGuEtd",
    2: "QXquAe93GYRxanmUAiiJ",
    3: "vIIhHsM7W05EktJyLEDT",
    4: "WwbP11SpZDGRg3UvQSMc"
  };

  try {

    let daftarMateri = [];

    for (let i = 1; i <= 4; i++) {

      const materialRef =
        doc(db, "materials", materialIds[i]);

      const materialSnapshot =
        await getDoc(materialRef);

      if (materialSnapshot.exists()) {

        daftarMateri.push({
          id: materialIds[i],
          nomor: i,
          data: materialSnapshot.data()
        });

      } else {

        daftarMateri.push({
          id: materialIds[i],
          nomor: i,
          data: {
            title: "",
            description: ""
          }
        });

      }
    }

    materialList.innerHTML =
      daftarMateri.map(material => {

        const data = material.data;

        return `
          <div class="student-row">

            <div>
              <strong>
                Materi ${material.nomor}: ${data.title || "-"}
              </strong>

              <p>
                ${data.description || "-"}
              </p>
            </div>

            <button
              class="btn secondary edit-material-btn"
              data-id="${material.id}"
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

function renderTeacherMaterialChoices() {

  const container =
    document.getElementById("teacherMaterialChoices");

  if (!container) return;

  container.innerHTML = "";
document
  .getElementById("teacherMaterialEditor")
  .classList.add("hidden");

  const materialIds = {
  1: "MuBW6LqTMRuTUraGuEtd",
  2: "QXquAe93GYRxanmUAiiJ",
  3: "vIIhHsM7W05EktJyLEDT",
  4: "WwbP11SpZDGRg3UvQSMc"
};

  for (let i = 1; i <= 4; i++) {

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "btn secondary";
    button.style.marginRight = "10px";
    button.style.marginBottom = "10px";

    button.textContent = `Materi ${i}`;

    button.addEventListener("click", async () => {

      const materialId =
        materialIds[i];

      try {

        const materialRef =
          doc(db, "materials", materialId);

        const materialSnapshot =
          await getDoc(materialRef);

        // Kalau Materi 2–4 belum ada, buat dokumen kosong
        if (!materialSnapshot.exists()) {

          await setDoc(
            materialRef,
            {
              materialNumber: i,
              title: "",
              description: "",
              content: "",
              enableMaterial: true,
              enableVideo: true,
              enableBlast: true
            }
          );

          console.log(
            `Dokumen Materi ${i} berhasil dibuat.`
          );

        }

        // Simpan materi yang sedang dipilih
        currentEditingMaterialId =
          materialId;

        // Ambil data terbaru
        const latestSnapshot =
          await getDoc(materialRef);

        const data =
          latestSnapshot.data() || {};

        console.log(
          "Materi yang dipilih:",
          i,
          data
        );

        // ==========================
        // DATA MATERI
        // ==========================

        document.getElementById("editMaterialTitle").value =
          data.title || "";

        document.getElementById("editMaterialDescription").value =
          data.description || "";

        document.getElementById("editMaterialContent").value =
          data.content || "";

        document.getElementById("editMaterialStageTitle").value =
          data.materialStageTitle || "📖 Materi Pembelajaran";

        document.getElementById("editMaterialNote").value =
          data.materialNote ||
          "Wacanen materi kanthi teliti sadurunge nerusake menyang video simakan.";

        document.getElementById("editMaterialButtonText").value =
          data.materialButtonText ||
          "Sabanjure: Video Simakan →";

        // ==========================
        // VIDEO
        // ==========================

        document.getElementById("videoUrl").value =
          data.videoUrl || "";

        document.getElementById("editVideoTitle").value =
          data.videoTitle || "🎬 Video Simakan";

        document.getElementById("editVideoDescription").value =
          data.videoDescription ||
          "Simak video kanthi premati.";

        document.getElementById("editVideoCheckText").value =
          data.videoCheckText ||
          "Aku wis nyimak video kanthi premati.";

        document.getElementById("editVideoButtonText").value =
          data.videoButtonText ||
          "Sabanjure: Blast Room →";

        // ==========================
        // BLAST ROOM
        // ==========================

        document.getElementById("blastUrl").value =
          data.blastUrl || "";

        // ==========================
        // ALUR
        // ==========================

        document.getElementById("enableMaterial").checked =
          data.enableMaterial !== false;

        document.getElementById("enableVideo").checked =
          data.enableVideo !== false;

        document.getElementById("enableBlast").checked =
          data.enableBlast !== false;

// ==========================
// TAMPILKAN EDITOR
// ==========================

document
  .getElementById("teacherMaterialEditor")
  .classList.remove("hidden");

document
  .getElementById("teacherMaterialSelector")
  .classList.add("hidden");

// Sembunyikan daftar materi lama
const materialList =
  document.getElementById("materialList");

if (materialList) {

  materialList.classList.add("hidden");

  const materialCard =
    materialList.closest(".content-card");

  if (materialCard) {
    materialCard.classList.add("hidden");
  }
}

const backButton =
  document.getElementById("backToMaterialSelector");

if (backButton) {
  backButton.classList.remove("hidden");
}

      } catch (error) {

        console.error(
          `Gagal membuka Materi ${i}:`,
          error
        );

        alert(
          `Materi ${i} gagal dibuka.`
        );

      }

    });

    container.appendChild(button);
  }
}

document
  .getElementById("backToMaterialSelector")
  .addEventListener("click", () => {

    document
      .getElementById("teacherMaterialEditor")
      .classList.add("hidden");

    document
      .getElementById("teacherMaterialSelector")
      .classList.remove("hidden");

  });

function markdownToHtml(text) {

  return text
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}
async function openLesson(id) {

  currentLesson =
    lessons.find(lesson => lesson.id === id);

  if (!currentLesson) return;

  // Ambil materi terbaru langsung dari Firebase
  try {

   const materialIds = {
  1: "MuBW6LqTMRuTUraGuEtd",
  2: "QXquAe93GYRxanmUAiiJ",
  3: "vIIhHsM7W05EktJyLEDT",
  4: "WwbP11SpZDGRg3UvQSMc"
};

const materialRef = doc(
  db,
  "materials",
  materialIds[id]
);

const materialSnapshot =
  await getDoc(materialRef);

if (materialSnapshot.exists()) {

  const data =
    materialSnapshot.data();

      currentLesson.title =
        data.title || currentLesson.title;

      currentLesson.description =
        data.description || currentLesson.description;

      currentLesson.material =
        data.content || currentLesson.material;

        currentLesson.videoUrl =
  data.videoUrl || "";
  currentLesson.enableMaterial =
  data.enableMaterial !== false;

currentLesson.enableVideo =
  data.enableVideo !== false;

currentLesson.enableBlast =
  data.enableBlast !== false;
  currentLesson.videoTitle =
  data.videoTitle || "🎬 Video Simakan";

currentLesson.videoDescription =
  data.videoDescription ||
  "Simak video kanthi premati. Ing versi sabanjure, video bisa diganti nganggo video pembelajaranmu dhewe.";

currentLesson.videoCheckText =
  data.videoCheckText ||
  "Aku wis nyimak video kanthi premati.";

currentLesson.videoButtonText =
  data.videoButtonText ||
  "Sabanjure: Blast Room →";

currentLesson.materialStageTitle =
  data.materialStageTitle || "📖 Materi Pembelajaran";

currentLesson.materialNote =
  data.materialNote || "Wacanen materi kanthi teliti sadurunge nerusake menyang video simakan.";

currentLesson.materialButtonText =
  data.materialButtonText || "Sabanjure: Video Simakan →";

  console.log("VIDEO DARI FIREBASE:", data.videoUrl);

    }

  } catch (error) {

    console.error(
      "Gagal mengambil isi materi:",
      error
    );

  }

  document.getElementById("lessonNumber").textContent =
    `Materi ${currentLesson.id}`;

  document.getElementById("lessonTitle").textContent =
    currentLesson.title;

  document.getElementById("lessonDescription").textContent =
    currentLesson.description;

  document.getElementById("materialText").innerHTML =
    markdownToHtml(currentLesson.material);

document.getElementById("materialTitleDisplay").textContent =
  currentLesson.materialStageTitle;

document.getElementById("materialNote").textContent =
  currentLesson.materialNote;

document.getElementById("materialButtonText").textContent =
  currentLesson.materialButtonText;
document.getElementById("videoTitleDisplay").textContent =
  currentLesson.videoTitle;

document.getElementById("videoDescriptionDisplay").textContent =
  currentLesson.videoDescription;

document.getElementById("videoCheckText").textContent =
  currentLesson.videoCheckText;

document.getElementById("videoButtonText").textContent =
  currentLesson.videoButtonText;
  document
  .getElementById("materialStep")
  .classList.add("hidden");

document
  .getElementById("videoStep")
  .classList.add("hidden");

document
  .getElementById("quizStep")
  .classList.add("hidden");

document.getElementById("watchedCheck").checked = false;
document.getElementById("toQuizBtn").disabled = true;


// TENTUKAN TAHAP PERTAMA

if (currentLesson.enableMaterial) {

  document
    .getElementById("materialStep")
    .classList.remove("hidden");

  setSteps(getStepNumber("material"));

} else if (currentLesson.enableVideo) {

  document
    .getElementById("videoStep")
    .classList.remove("hidden");

  renderVideo();

  setSteps(getStepNumber("video"));

} else if (currentLesson.enableBlast) {

  document
    .getElementById("quizStep")
    .classList.remove("hidden");

  setSteps(getStepNumber("blast"));

}

  show("lessonPage");
}

// ==================================================
// STEP MATERI / VIDEO / BLAST ROOM
// ==================================================
function getStepNumber(type) {

  const activeSteps = [];

  if (currentLesson.enableMaterial) {
    activeSteps.push("material");
  }

  if (currentLesson.enableVideo) {
    activeSteps.push("video");
  }

  if (currentLesson.enableBlast) {
    activeSteps.push("blast");
  }

  return activeSteps.indexOf(type) + 1;
}
function setSteps(active) {

  const activeSteps = [];

  if (currentLesson.enableMaterial) {
    activeSteps.push("material");
  }

  if (currentLesson.enableVideo) {
    activeSteps.push("video");
  }

  if (currentLesson.enableBlast) {
    activeSteps.push("blast");
  }

  const steps =
    document.querySelectorAll(".stepper .step");

  const lines =
    document.querySelectorAll(".stepper .line");


  // ATUR STEP

  activeSteps.forEach((type, index) => {

    const number = index + 1;

    const step = steps[index];

    if (!step) return;

    step.classList.remove("hidden");

    step.querySelector("span").textContent =
      number;

    const label =
      step.querySelector(".step-label");

    if (label) {

      if (type === "material") {
        label.textContent = "Materi";
      }

      if (type === "video") {
        label.textContent = "Simakan";
      }

      if (type === "blast") {
        label.textContent = "Blast Room";
      }

    }

    step.classList.toggle(
      "active",
      number === active
    );

    step.classList.toggle(
      "done",
      number < active
    );

  });


  // SEMBUNYIKAN STEP YANG TIDAK AKTIF

  for (
    let i = activeSteps.length;
    i < steps.length;
    i++
  ) {

    steps[i].classList.add("hidden");

  }


  // ATUR GARIS

  lines.forEach((line, index) => {

    if (index < activeSteps.length - 1) {

      line.classList.remove("hidden");

    } else {

      line.classList.add("hidden");

    }

  });

}
function renderVideo() {

  const videoContainer =
    document.getElementById("videoContainer");

  if (
    currentLesson &&
    currentLesson.videoUrl
  ) {

    let videoId = "";

    try {

      const url =
        new URL(currentLesson.videoUrl);

      if (url.hostname.includes("youtu.be")) {

        videoId =
          url.pathname.substring(1);

      } else {

        videoId =
          url.searchParams.get("v");

      }

    } catch (error) {

      console.error(
        "Link YouTube tidak valid:",
        error
      );

    }

    console.log("VIDEO ID:", videoId);

    if (videoId) {

      videoContainer.innerHTML = `
        <iframe
          width="100%"
          height="400"
          src="https://www.youtube.com/embed/${videoId}"
          title="Video Pembelajaran"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      `;

    } else {

      videoContainer.innerHTML =
        "<p>Link video YouTube ora valid.</p>";

    }

  } else {

    videoContainer.innerHTML =
      "<p>Video pembelajaran durung dipasang.</p>";

  }

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
  renderTeacherMaterialChoices();

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
// MATERI → TAHAP BERIKUTNYA
// ==================================================

document
  .getElementById("toVideoBtn")
  .addEventListener("click", function() {

    document
      .getElementById("materialStep")
      .classList.add("hidden");


    // Kalau Video aktif → buka Video

if (currentLesson.enableVideo) {

  document
    .getElementById("videoStep")
    .classList.remove("hidden");

  renderVideo();

  setSteps(getStepNumber("video"));

  return;
}

    // Kalau Video mati tapi Blast aktif → langsung Blast

    if (currentLesson.enableBlast) {

      document
        .getElementById("quizStep")
        .classList.remove("hidden");

      setSteps(getStepNumber("blast"));

      return;
    }


    // Kalau Video dan Blast mati → selesai

    renderLessons();

    show("homePage");

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
// VIDEO → TAHAP BERIKUTNYA
// ==================================================

document
  .getElementById("toQuizBtn")
  .addEventListener("click", function() {

    document
      .getElementById("videoStep")
      .classList.add("hidden");


    // Kalau Blast aktif → buka Blast Room

    if (currentLesson.enableBlast) {

      document
        .getElementById("quizStep")
        .classList.remove("hidden");

     setSteps(getStepNumber("blast"));

      return;
    }


    // Kalau Blast mati → langsung selesai

    renderLessons();

    show("homePage");

  });


// ==================================================
// BUKA BLAST ROOM
// ==================================================
document
  .getElementById("blastBtn")
  .addEventListener("click", async function() {

    try {

      const materialIds = {
        1: "MuBW6LqTMRuTUraGuEtd",
        2: "QXquAe93GYRxanmUAiiJ",
        3: "vIIhHsM7W05EktJyLEDT",
        4: "WwbP11SpZDGRg3UvQSMc"
      };

      const materialRef = doc(
        db,
        "materials",
        materialIds[currentLesson.id]
      );

      const materialSnapshot =
        await getDoc(materialRef);

      if (!materialSnapshot.exists()) {
        alert("Blast Room durung dipasang.");
        return;
      }

      const data =
        materialSnapshot.data();

      const blastUrl =
        data.blastUrl || "";

      if (!blastUrl) {
        alert("Blast Room durung dipasang.");
        return;
      }

      window.location.href = blastUrl;

    } catch (error) {

      console.error(
        "Gagal membuka Blast Room:",
        error
      );

      alert(
        "Blast Room gagal dibuka."
      );

    }

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

// EDIT MATERI

document.addEventListener("click", async function(event) {

  if (event.target.classList.contains("edit-material-btn")) {

    const materialId =
      event.target.dataset.id;

    currentEditingEditButton =
      event.target;

    currentEditingMaterialId =
      materialId;

    document
  .getElementById("materialListCard")
  .classList.add("hidden");

    event.target.classList.add("hidden");

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

document.getElementById("editMaterialStageTitle").value =
  data.materialStageTitle || "📖 Materi Pembelajaran";

document.getElementById("editMaterialNote").value =
  data.materialNote || "Wacanen materi kanthi teliti sadurunge nerusake menyang video simakan.";

document.getElementById("editMaterialButtonText").value =
  data.materialButtonText || "Sabanjure: Video Simakan →";

      document
        .getElementById("editMaterialForm")
        .classList.remove("hidden");

    } catch (error) {

      console.error("Gagal membuka materi:", error);

      alert("Materi gagal dibuka.");

    }

  }

});
document
  .getElementById("editMaterialBtn")
  .addEventListener("click", function() {

    document
      .getElementById("editMaterialForm")
      .classList.remove("hidden");

    document
      .getElementById("editMaterialBtn")
      .classList.add("hidden");

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
      const stageTitle =
  document.getElementById("editMaterialStageTitle").value.trim();

const note =
  document.getElementById("editMaterialNote").value.trim();

const buttonText =
  document.getElementById("editMaterialButtonText").value.trim();

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
    content: content,
    materialStageTitle: stageTitle,
    materialNote: note,
    materialButtonText: buttonText
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

// EDIT MATERI - BATAL

document
  .getElementById("cancelEditMaterialBtn")
  .addEventListener("click", function() {

    document
      .getElementById("editMaterialForm")
      .classList.add("hidden");

    document
      .getElementById("editMaterialBtn")
      .classList.remove("hidden");

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
// SIMPAN VIDEO YOUTUBE

document
  .getElementById("videoForm")
  .addEventListener("submit", async function(event) {

    event.preventDefault();

    const videoUrl =
      document.getElementById("videoUrl").value.trim();

const videoTitle =
  document.getElementById("editVideoTitle").value.trim();

const videoDescription =
  document.getElementById("editVideoDescription").value.trim();

const videoCheckText =
  document.getElementById("editVideoCheckText").value.trim();

const videoButtonText =
  document.getElementById("editVideoButtonText").value.trim();

    if (!videoUrl) {
      alert("Link video kudu diisi.");
      return;
    }

    try {

  const materialId = currentEditingMaterialId;

if (!materialId) {
  alert("Materi durung dipilih.");
  return;
}

      await setDoc(
  doc(db, "materials", materialId),
  {
    videoUrl: videoUrl,
    videoTitle: videoTitle,
    videoDescription: videoDescription,
    videoCheckText: videoCheckText,
    videoButtonText: videoButtonText
  },
  {
    merge: true
  }
);

      alert("Video berhasil disimpan!");

    } catch (error) {

      console.error(
        "Gagal menyimpan video:",
        error
      );

      alert("Video gagal disimpan.");

    }

  });
  // VIDEO - BATAL

document
  .getElementById("cancelVideoBtn")
  .addEventListener("click", function() {

    document
      .getElementById("videoMaterialForm")
      .classList.add("hidden");

    if (currentEditingVideoButton) {
      currentEditingVideoButton.classList.remove("hidden");
    }

  });

// EDIT VIDEO

document
  .getElementById("editVideoBtn")
  .addEventListener("click", function() {

    currentEditingVideoButton =
      document.getElementById("editVideoBtn");

    currentEditingVideoButton.classList.add("hidden");

    document
      .getElementById("videoMaterialForm")
      .classList.remove("hidden");

  });
  // SIMPAN ALUR MATERI

document
  .getElementById("saveMaterialFlowBtn")
  .addEventListener("click", async function() {

    const enableMaterial =
      document.getElementById("enableMaterial").checked;

    const enableVideo =
      document.getElementById("enableVideo").checked;

    const enableBlast =
      document.getElementById("enableBlast").checked;

    try {

     const materialId = currentEditingMaterialId;

if (!materialId) {
  alert("Materi durung dipilih.");
  return;
}

      await setDoc(
        doc(db, "materials", materialId),
        {
          enableMaterial: enableMaterial,
          enableVideo: enableVideo,
          enableBlast: enableBlast
        },
        {
          merge: true
        }
      );

      alert("Alur materi berhasil disimpan!");

    } catch (error) {

      console.error(
        "Gagal menyimpan alur:",
        error
      );

      alert("Alur materi gagal disimpan.");

    }
  });
  // SIMPAN BLAST ROOM

document
  .getElementById("blastForm")
  .addEventListener("submit", async function(event) {

    event.preventDefault();

    const blastUrl =
      document.getElementById("blastUrl").value.trim();

    if (!blastUrl) {
      alert("Link Blast Room kudu diisi.");
      return;
    }

    try {

      const materialId = currentEditingMaterialId;

if (!materialId) {
  alert("Materi durung dipilih.");
  return;
}

      await setDoc(
        doc(db, "materials", materialId),
        {
          blastUrl: blastUrl
        },
        {
          merge: true
        }
      );

      alert("Blast Room berhasil disimpan!");

    } catch (error) {

      console.error(
        "Gagal menyimpan Blast Room:",
        error
      );

      alert("Blast Room gagal disimpan.");

    }

  });