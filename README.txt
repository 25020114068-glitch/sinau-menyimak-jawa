# SINau Menyimak Basa Jawa — Prototype

Prototype awal web pembelajaran Bahasa Jawa kelas XI Fase F.

## Isi prototype
- Login nama + kelas
- Beranda siswa
- Progres pembelajaran
- 4 materi contoh
- Alur berurutan: Materi → Video Simakan → Quizizz
- Materi berikutnya terkunci sampai materi sebelumnya selesai
- Progres tersimpan di browser dengan localStorage

## Cara menjalankan
1. Buka folder ini di VS Code.
2. Buka `index.html` di browser.
3. Lebih nyaman jika memakai extension VS Code "Live Server", lalu klik kanan `index.html` → "Open with Live Server".

## Catatan
Login pada prototype ini BELUM merupakan autentikasi sungguhan. Data hanya disimpan di browser.
Tahap berikutnya dapat diganti dengan Firebase Authentication + Firestore agar siswa benar-benar memiliki akun dan progres tersimpan secara online.

Link Quizizz juga masih berupa tombol contoh.
