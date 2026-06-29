# RentEase Business Model Notes

Dokumen ini menjaga konteks business plan tetap tersambung ke PRD dan implementasi repo. PRD tetap menjadi source of truth untuk perilaku produk, sementara dokumen ini menjelaskan alasan bisnis, go-to-market, operasional, dan asumsi monetisasi.

## 1. Positioning

RentEase adalah marketplace rental P2P multikategori untuk barang konsumen di Indonesia. Fokus awal berubah dari "mobile app + web" menjadi web-first agar MVP lebih realistis dibangun, diuji, dan dideploy, tanpa mengubah proposisi bisnis utama: akses barang tanpa harus membeli dan monetisasi aset menganggur.

Nilai utama:
- Trust: KYC, escrow-style payment, deposit, evidence photos, rating, dispute flow.
- Clarity: status booking, payment, deposit, dan return harus mudah dipahami.
- Efficiency: pencarian barang, booking calendar, dan dashboard dual-role dalam satu akun.
- Sustainability: mendukung access-based consumption dan mengurangi pembelian barang fase pendek.

## 2. Target Market

Segmen penyewa awal:
- Mahasiswa dan fresh graduate yang butuh barang sementara, seperti kamera, proyektor, atau alat presentasi.
- Orang tua muda yang membutuhkan perlengkapan bayi dalam periode pendek.
- Traveler, penggiat outdoor, dan kreator konten yang ingin mencoba barang tanpa membeli.
- Pekerja urban yang membutuhkan alat spesifik untuk proyek singkat.

Segmen pemilik awal:
- Individu dengan aset menganggur seperti kamera, drone, stroller, alat musik, peralatan outdoor, atau peralatan rumah tangga.
- Pelaku usaha mikro rental yang ingin channel digital lebih terstruktur.
- Komunitas kampus, hobi, dan lokal yang punya inventory atau demand rental berulang.

Wilayah awal:
- MVP produk: fokus Jabodetabek.
- Validasi bisnis awal: Jabodetabek dan Bandung jika supply/demand komunitas cukup.
- Ekspansi kota lain seperti Surabaya, Yogyakarta, dan Medan masuk fase setelah operational playbook stabil.

## 3. Revenue Model

Revenue stream utama:
- Komisi GMV: 5-10% dari biaya sewa yang berhasil selesai.
- Deposit handling: bukan revenue utama; deposit ditahan sebagai jaminan dan hanya dipakai untuk klaim sesuai flow.
- Featured listings: Phase 2, pemilik membayar agar listing lebih terlihat.
- Subscription lender: Phase 2, paket untuk pemilik dengan inventory banyak atau UMKM rental.
- Insurance add-on: Phase 2, proteksi tambahan saat checkout jika partner asuransi tersedia.
- Promo/referral: bukan revenue langsung, tetapi channel growth dan retention.

MVP monetization default:
- Simulasikan atau catat komisi platform pada transaksi selesai.
- Jangan menganggap deposit sebagai pendapatan.
- Insurance, subscription, dan featured listing didokumentasikan sebagai Phase 2 agar business plan tetap terlihat, tetapi tidak menghambat MVP.

## 4. Go-To-Market

Fase 1: Pra-peluncuran dan validasi
- Survei mahasiswa, profesional muda, orang tua muda, dan komunitas hobi untuk mencari kategori barang paling dicari, harga sewa wajar, dan kekhawatiran trust.
- Bangun brand identity: tone terpercaya tapi approachable, template konten, dan mockup flow rental.
- Mulai konten edukasi di Instagram/TikTok/X: "barang yang lebih hemat disewa", "cara aman sewa barang", dan "cara menghasilkan dari aset menganggur".
- Blog/SEO web: artikel kategori dan safety rental agar web-first strategy punya organic entry point.

Fase 2: Komunitas dan supply seeding
- Partnership kampus, komunitas fotografi, outdoor, parenting, dan co-working space.
- Program ambassador kampus dengan kode referral unik.
- Rekrut pemilik barang awal secara manual agar listing supply cukup sebelum paid acquisition.

Fase 3: Launch dan growth
- Referral renter/lender untuk transaksi pertama.
- Promo kategori prioritas, misal kamera, stroller, outdoor, dan proyektor.
- Featured listing dan subscription baru diuji setelah ada inventory dan demand organik.

## 5. Operational Model

Core operational rules:
- KYC manual review untuk MVP kecuali provider verifikasi dipilih.
- WhatsApp deeplink hanya dibuka setelah booking diterima dan payment success agar negosiasi awal tetap di platform.
- Deposit ditahan sampai return selesai atau klaim/dispute selesai.
- Foto kondisi barang wajib di empat titik: sebelum serah terima oleh pemilik, saat diterima penyewa, sebelum dikembalikan penyewa, setelah diterima kembali pemilik.
- Availability blocking wajib mendukung single date dan range tanggal agar pemilik bisa mengelola pemakaian pribadi, maintenance, atau liburan.
- Perpanjangan sewa butuh approval pemilik dan pembayaran tambahan sebelum aktif.
- Keterlambatan tanpa approval dihitung sebagai potensi klaim deposit dan masuk flow klaim/dispute.

Admin minimum untuk MVP:
- Review KYC.
- Monitor booking/payment/deposit status.
- Review dispute dan deposit claim.
- Menindak laporan listing atau user bermasalah.

## 6. Financial Assumptions

Asumsi dari business plan:
- Modal awal: Rp 250.000.000.
- Target BEP: bulan 14-16.
- Pendapatan tahun 1: sekitar Rp 300 juta.
- Proyeksi tahun 3: sekitar Rp 12 miliar revenue dengan laba bersih Rp 9,54 miliar.
- Target SOM 3 tahun: Rp 80-240 miliar GMV/pasar realistis.

Catatan untuk repo:
- Angka finansial ini adalah asumsi business plan, bukan hardcoded product logic.
- PRD dan implementasi hanya perlu mendukung data yang bisa mengukur GMV, komisi, repeat transaction, active lenders, conversion booking, dan dispute rate.
- Dashboard admin/reporting sebaiknya menyimpan basis data untuk validasi asumsi ini sejak MVP.

## 7. Risk And Mitigation

Risiko trust:
- Barang rusak, tidak kembali, atau kondisi diperdebatkan.
- Mitigasi: KYC, deposit, evidence photos, status jelas, klaim parsial, dispute admin.

Risiko off-platform:
- Pengguna berpindah ke WhatsApp sebelum transaksi tercatat.
- Mitigasi: WA hanya unlock setelah booking accepted dan payment success.

Risiko supply kosong:
- Tidak cukup listing berkualitas saat launch.
- Mitigasi: supply seeding manual lewat komunitas dan ambassador.

Risiko payment/escrow:
- Escrow produksi membutuhkan kesiapan legal/rekening bisnis.
- Mitigasi: gunakan simulasi pembayaran platform untuk demo kuliah/MVP lokal. Midtrans sandbox baru dipakai jika tim ingin menguji integrasi gateway sungguhan sebelum production compliance siap.

Risiko operasional:
- Admin overload untuk KYC dan dispute.
- Mitigasi: admin tool minimum, status enum konsisten, evidence wajib, dan template keputusan dispute.

## 8. Phase Alignment

MVP:
- Auth, KYC, listing, search/filter, booking calendar, payment, deposit hold, condition evidence, dashboard dual-role, rating/review, basic dispute, admin review minimum.

Phase 1.5:
- Rental extension, late fee calculation, stronger notification/reminder, trust indicators richer than rating.

Phase 2:
- Insurance add-on, featured listing, subscription lender, promo/referral, mobile app native, automated KYC provider, advanced trust score.
