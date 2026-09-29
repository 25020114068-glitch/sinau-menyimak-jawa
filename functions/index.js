const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

const db = getFirestore();

setGlobalOptions({
  maxInstances: 10,
});

exports.createStudentAccount = onCall(async (request) => {
  // Harus login
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Kamu harus login terlebih dahulu."
    );
  }

  // Cek apakah yang memanggil adalah guru
  const teacherDoc = await db
    .collection("users")
    .doc(request.auth.uid)
    .get();

  if (!teacherDoc.exists || teacherDoc.data().role !== "teacher") {
    throw new HttpsError(
      "permission-denied",
      "Hanya guru yang boleh membuat akun siswa."
    );
  }

  const { nama, id, kelas, password } = request.data;

  if (!nama || !id || !kelas || !password) {
    throw new HttpsError(
      "invalid-argument",
      "Nama, ID, kelas, dan password wajib diisi."
    );
  }

  // ID siswa menjadi email internal
  const email = `${id}@siswa.sinau-menyimak.web.app`;

  try {
    // Membuat akun Firebase Authentication
    const userRecord = await getAuth().createUser({
      email: email,
      password: password,
      displayName: nama,
    });

    // Menyimpan data siswa tanpa password
    await db.collection("users").doc(userRecord.uid).set({
      nama: nama,
      studentId: id,
      kelas: kelas,
      role: "student",
      progress: [],
    });

    return {
      success: true,
      uid: userRecord.uid,
      email: email,
    };

  } catch (error) {
    console.error("Gagal membuat akun siswa:", error);

    if (error.code === "auth/email-already-exists") {
      throw new HttpsError(
        "already-exists",
        "ID siswa tersebut sudah digunakan."
      );
    }

    throw new HttpsError(
      "internal",
      "Gagal membuat akun siswa."
    );
  }
});