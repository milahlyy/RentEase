# RentEase Demo Flow

Dokumen ini dipakai untuk demo tugas kuliah. Fokus demo adalah trust flow: tanya pemilik, ajukan pemesanan, pemilik menerima, pembayaran simulasi, deposit ditahan, bukti kondisi, dan deposit dikembalikan.

## Akun Demo

Gunakan dua browser berbeda, atau satu browser normal dan satu incognito.

| Peran | Email | Password |
| --- | --- | --- |
| Penyewa | `rendy@rentease.local` | `password123` |
| Pemilik | `siti@rentease.local` | `password123` |

Barang utama yang disarankan: **Stand Mixer KitchenAid** milik Siti.

## Script Presentasi

1. Login sebagai Rendy.
2. Buka Beranda atau Jelajahi, cari `KitchenAid`, lalu buka detail barang.
3. Klik `Tanya pemilik` untuk menunjukkan chat internal sebelum pembayaran.
4. Pindah ke akun Siti, buka `Pesan`, lalu balas chat.
5. Kembali ke Rendy, klik `Ajukan pemesanan`, pilih tanggal dan metode serah terima.
6. Pindah ke Siti, buka `Aktivitas > Permintaan Sewa`, lalu klik `Terima`.
7. Kembali ke Rendy, buka `Aktivitas > Pesanan`, lalu klik `Bayar sekarang (Simulasi Demo)`.
8. Tunjukkan hasil setelah simulasi:
   - status menjadi `Dikonfirmasi`;
   - pembayaran sewa tercatat;
   - deposit ditahan platform;
   - kontak pemilik terbuka.
9. Jika waktu cukup, lanjutkan lifecycle:
   - Siti upload foto sebelum serah terima lalu tandai barang siap;
   - Rendy upload foto saat menerima barang lalu konfirmasi diterima;
   - Rendy upload foto sebelum pengembalian lalu ajukan pengembalian;
   - Siti upload foto setelah barang kembali lalu konfirmasi barang baik;
   - deposit berubah menjadi `Dikembalikan`.

## Narasi Pembayaran

Untuk demo ini, RentEase memakai **Simulasi Pembayaran Platform**. Tidak ada uang sungguhan yang diproses.

Jangan pakai COD sebagai flow utama karena COD membuat platform tidak bisa menahan deposit secara jelas. Jangan pakai e-wallet palsu karena menambah konsep baru yang tidak diperlukan untuk MVP. Narasi yang benar:

- penyewa membayar sewa dan deposit lewat platform secara simulasi;
- deposit berstatus `Ditahan platform`;
- WhatsApp pemilik baru terbuka setelah pembayaran simulasi berhasil;
- deposit dikembalikan setelah barang kembali sesuai kondisi.

## Checklist Sebelum Demo

- Jalankan migration dan seed lokal terbaru.
- Pastikan API dan web berjalan.
- Pastikan Rendy dan Siti bisa login.
- Pastikan listing `Stand Mixer KitchenAid` muncul di Jelajahi.
- Siapkan dua browser agar perpindahan akun terlihat natural.
- Siapkan 2-4 gambar dummy kecil untuk upload bukti kondisi jika ingin mendemokan lifecycle penuh.
