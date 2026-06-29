import { Database } from "bun:sqlite";
import bcrypt from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Category } from "@rentease/shared";
import {
  bookings,
  kycDocuments,
  listingAvailability,
  listingPhotos,
  listings,
  reviews,
  users,
} from "./src/schema";

type SeedUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "renter" | "lender" | "both";
  isVerified: boolean;
  isAdmin?: boolean;
};

type SeedListing = {
  id: string;
  ownerId: string;
  title: string;
  category: Category;
  description: string;
  condition: number;
  pricePerDay: number;
  depositAmount: number;
  location: string;
  photoUrls: string[];
};

type SeedCompletedBooking = {
  id: string;
  listingId: string;
  renterId: string;
  lenderId: string;
  startOffset: number;
  endOffset: number;
  rentalPrice: number;
  depositAmount: number;
};

type SeedReview = {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
};

const password = "password123";

const seedUsers: SeedUser[] = [
  {
    id: "seed-user-rendy",
    email: "rendy@rentease.local",
    name: "Rendy Saputra",
    phone: "081234567001",
    role: "renter",
    isVerified: false,
    isAdmin: true,
  },
  {
    id: "seed-user-siti",
    email: "siti@rentease.local",
    name: "Siti Rahma",
    phone: "081234567002",
    role: "lender",
    isVerified: true,
  },
  {
    id: "seed-user-andi",
    email: "andi@rentease.local",
    name: "Andi Pratama",
    phone: "081234567003",
    role: "both",
    isVerified: true,
  },
  {
    id: "seed-user-maya",
    email: "maya@rentease.local",
    name: "Maya Lestari",
    phone: "081234567004",
    role: "both",
    isVerified: true,
  },
  {
    id: "seed-user-bima",
    email: "bima@rentease.local",
    name: "Bima Nugraha",
    phone: "081234567005",
    role: "lender",
    isVerified: false,
  },
  {
    id: "seed-user-laras",
    email: "laras@rentease.local",
    name: "Laras Putri",
    phone: "081234567006",
    role: "both",
    isVerified: true,
  },
  {
    id: "seed-user-dimas",
    email: "dimas@rentease.local",
    name: "Dimas Wicaksono",
    phone: "081234567007",
    role: "both",
    isVerified: false,
  },
];

const imageUrls = {
  actionCam: [
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=900",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900",
  ],
  airPurifier: [
    "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900",
  ],
  baby: [
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=900",
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=900",
    "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=900",
  ],
  camera: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900",
    "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=900",
  ],
  camping: [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900",
    "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=900",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",
  ],
  drone: [
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=900",
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=900",
    "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=900",
  ],
  guitar: [
    "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=900",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900",
    "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=900",
  ],
  kitchenAid: [
    "https://media.karousell.com/media/photos/products/2026/6/5/kitchenaid_artisan_stand_mixer_1780685323_f83cc8ba_progressive.jpg",
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900",
  ],
  laptop: [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900",
    "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=900",
  ],
  microphone: [
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=900",
    "https://images.unsplash.com/photo-1520170350707-b2da59970118?w=900",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=900",
  ],
  projector: [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900",
    "https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=900",
    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=900",
  ],
  speaker: [
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=900",
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900",
    "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=900",
  ],
  stroller: [
    "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=900",
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=900",
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=900",
  ],
  tools: [
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=900",
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900",
    "https://images.unsplash.com/photo-1581166397057-235af2b3c6dd?w=900",
  ],
};

const seedListings: SeedListing[] = [
  {
    id: "seed-listing-canon-eos-m50",
    ownerId: "seed-user-andi",
    title: "Kamera Canon EOS M50",
    category: "electronics",
    description:
      "Mirrorless Canon EOS M50 lengkap dengan lensa kit, baterai cadangan, charger, dan tas kamera. Cocok untuk dokumentasi acara, tugas kuliah, atau konten harian.",
    condition: 8,
    pricePerDay: 150_000,
    depositAmount: 500_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.camera,
  },
  {
    id: "seed-listing-dji-mini-3-pro",
    ownerId: "seed-user-andi",
    title: "DJI Mini 3 Pro (Drone)",
    category: "electronics",
    description:
      "Drone DJI Mini 3 Pro dengan remote controller, baterai, dan propeller cadangan. Wajib digunakan di area legal dan aman untuk terbang.",
    condition: 9,
    pricePerDay: 200_000,
    depositAmount: 1_000_000,
    location: "Jakarta Pusat",
    photoUrls: imageUrls.drone,
  },
  {
    id: "seed-listing-stroller-babyelle-trevi",
    ownerId: "seed-user-siti",
    title: "Stroller Babyelle Trevi",
    category: "baby-gear",
    description:
      "Stroller Babyelle Trevi yang ringan, mudah dilipat, dan nyaman untuk jalan-jalan keluarga. Sudah dibersihkan sebelum disewakan.",
    condition: 7,
    pricePerDay: 75_000,
    depositAmount: 300_000,
    location: "Tangerang Selatan",
    photoUrls: imageUrls.stroller,
  },
  {
    id: "seed-listing-tenda-coleman-4-orang",
    ownerId: "seed-user-andi",
    title: "Tenda Camping Coleman 4 Orang",
    category: "outdoor-camping",
    description:
      "Tenda Coleman kapasitas 4 orang, cocok untuk camping keluarga atau trip akhir pekan. Include pasak dan tas penyimpanan.",
    condition: 8,
    pricePerDay: 100_000,
    depositAmount: 400_000,
    location: "Depok",
    photoUrls: imageUrls.camping,
  },
  {
    id: "seed-listing-gitar-yamaha-f310",
    ownerId: "seed-user-andi",
    title: "Gitar Akustik Yamaha F310",
    category: "music",
    description:
      "Gitar akustik Yamaha F310 dengan suara jernih, cocok untuk latihan, rekaman sederhana, atau acara kecil.",
    condition: 8,
    pricePerDay: 50_000,
    depositAmount: 200_000,
    location: "Bekasi",
    photoUrls: imageUrls.guitar,
  },
  {
    id: "seed-listing-lensa-canon-50mm",
    ownerId: "seed-user-andi",
    title: "Lensa Canon 50mm f/1.8",
    category: "electronics",
    description:
      "Lensa Canon 50mm f/1.8 untuk portrait dan low-light. Kondisi optik bersih, include front cap dan rear cap.",
    condition: 9,
    pricePerDay: 80_000,
    depositAmount: 300_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.camera,
  },
  {
    id: "seed-listing-baby-bouncer-fisher-price",
    ownerId: "seed-user-siti",
    title: "Baby Bouncer Fisher-Price",
    category: "baby-gear",
    description:
      "Baby bouncer Fisher-Price untuk bayi, nyaman digunakan di rumah. Cover bisa dilepas dan dicuci.",
    condition: 7,
    pricePerDay: 60_000,
    depositAmount: 250_000,
    location: "Tangerang",
    photoUrls: imageUrls.baby,
  },
  {
    id: "seed-listing-matras-sleeping-bag-consina",
    ownerId: "seed-user-andi",
    title: "Matras Sleeping Bag Consina",
    category: "outdoor-camping",
    description:
      "Sleeping bag Consina dengan matras tipis untuk camping, hiking ringan, atau acara outdoor sekolah.",
    condition: 8,
    pricePerDay: 40_000,
    depositAmount: 150_000,
    location: "Bogor",
    photoUrls: imageUrls.camping,
  },
  {
    id: "seed-listing-proyektor-portable-xiaomi",
    ownerId: "seed-user-siti",
    title: "Proyektor Portable Xiaomi",
    category: "electronics",
    description:
      "Proyektor portable Xiaomi untuk presentasi, movie night, atau acara keluarga. Include kabel power dan HDMI.",
    condition: 8,
    pricePerDay: 120_000,
    depositAmount: 500_000,
    location: "Jakarta Barat",
    photoUrls: imageUrls.projector,
  },
  {
    id: "seed-listing-stand-mixer-kitchenaid",
    ownerId: "seed-user-siti",
    title: "Stand Mixer KitchenAid",
    category: "household",
    description:
      "Stand mixer KitchenAid untuk baking rumahan, cocok untuk adonan kue, roti, dan whipped cream. Include bowl dan beater.",
    condition: 9,
    pricePerDay: 90_000,
    depositAmount: 400_000,
    location: "Jakarta Utara",
    photoUrls: imageUrls.kitchenAid,
  },
  {
    id: "seed-listing-macbook-air-m1",
    ownerId: "seed-user-maya",
    title: "MacBook Air M1 13 inch",
    category: "electronics",
    description:
      "MacBook Air M1 untuk presentasi, editing ringan, kelas online, atau kerja harian. Include charger original dan sleeve.",
    condition: 8,
    pricePerDay: 180_000,
    depositAmount: 800_000,
    location: "Jakarta Timur",
    photoUrls: imageUrls.laptop,
  },
  {
    id: "seed-listing-gopro-hero-10",
    ownerId: "seed-user-bima",
    title: "GoPro Hero 10 Black",
    category: "electronics",
    description:
      "Action cam GoPro Hero 10 untuk liburan, olahraga, dan dokumentasi outdoor. Include baterai cadangan, mount, dan case.",
    condition: 8,
    pricePerDay: 110_000,
    depositAmount: 450_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.actionCam,
  },
  {
    id: "seed-listing-speaker-jbl-partybox",
    ownerId: "seed-user-dimas",
    title: "Speaker JBL PartyBox",
    category: "electronics",
    description:
      "Speaker portable untuk acara rumah, arisan, ulang tahun, atau gathering kecil. Suara kencang dan baterai masih awet.",
    condition: 8,
    pricePerDay: 125_000,
    depositAmount: 500_000,
    location: "Bekasi",
    photoUrls: imageUrls.speaker,
  },
  {
    id: "seed-listing-mic-wireless-shure",
    ownerId: "seed-user-maya",
    title: "Mic Wireless Shure",
    category: "electronics",
    description:
      "Mic wireless untuk MC, karaoke, seminar kecil, dan acara keluarga. Include receiver dan kabel output.",
    condition: 8,
    pricePerDay: 85_000,
    depositAmount: 300_000,
    location: "Tangerang",
    photoUrls: imageUrls.microphone,
  },
  {
    id: "seed-listing-ipad-air-keyboard",
    ownerId: "seed-user-andi",
    title: "iPad Air dengan Keyboard",
    category: "electronics",
    description:
      "iPad Air lengkap dengan keyboard case untuk catatan kuliah, presentasi, atau sketch ringan. Include charger.",
    condition: 9,
    pricePerDay: 140_000,
    depositAmount: 600_000,
    location: "Jakarta Pusat",
    photoUrls: imageUrls.laptop,
  },
  {
    id: "seed-listing-monitor-24-inch",
    ownerId: "seed-user-bima",
    title: "Monitor 24 Inch Full HD",
    category: "electronics",
    description:
      "Monitor 24 inch untuk kerja remote, event booth, atau setup sementara. Include kabel HDMI dan adaptor.",
    condition: 8,
    pricePerDay: 70_000,
    depositAmount: 300_000,
    location: "Depok",
    photoUrls: imageUrls.laptop,
  },
  {
    id: "seed-listing-car-seat-joie",
    ownerId: "seed-user-siti",
    title: "Car Seat Joie Stages",
    category: "baby-gear",
    description:
      "Car seat Joie Stages untuk perjalanan keluarga. Cover bersih dan siap dipakai setelah disanitasi.",
    condition: 8,
    pricePerDay: 70_000,
    depositAmount: 300_000,
    location: "Tangerang Selatan",
    photoUrls: imageUrls.baby,
  },
  {
    id: "seed-listing-baby-box-portable",
    ownerId: "seed-user-maya",
    title: "Baby Box Portable",
    category: "baby-gear",
    description:
      "Baby box portable untuk tamu keluarga atau kebutuhan menginap sementara. Mudah dilipat dan dibawa.",
    condition: 7,
    pricePerDay: 65_000,
    depositAmount: 250_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.baby,
  },
  {
    id: "seed-listing-breast-pump-spectra",
    ownerId: "seed-user-siti",
    title: "Breast Pump Spectra",
    category: "baby-gear",
    description:
      "Pompa ASI Spectra untuk kebutuhan sementara. Unit mesin bersih, part personal wajib bawa sendiri.",
    condition: 8,
    pricePerDay: 55_000,
    depositAmount: 250_000,
    location: "Jakarta Barat",
    photoUrls: imageUrls.baby,
  },
  {
    id: "seed-listing-high-chair-ikea",
    ownerId: "seed-user-maya",
    title: "High Chair IKEA",
    category: "baby-gear",
    description:
      "Kursi makan bayi IKEA, ringan dan mudah dibersihkan. Cocok untuk acara keluarga atau kebutuhan harian sementara.",
    condition: 8,
    pricePerDay: 35_000,
    depositAmount: 150_000,
    location: "Bekasi",
    photoUrls: imageUrls.baby,
  },
  {
    id: "seed-listing-baby-carrier-ergo",
    ownerId: "seed-user-siti",
    title: "Baby Carrier Ergobaby",
    category: "baby-gear",
    description:
      "Gendongan Ergobaby nyaman untuk jalan-jalan atau perjalanan keluarga. Sudah dicuci sebelum disewakan.",
    condition: 8,
    pricePerDay: 45_000,
    depositAmount: 180_000,
    location: "Depok",
    photoUrls: imageUrls.stroller,
  },
  {
    id: "seed-listing-kompor-portable-camping",
    ownerId: "seed-user-dimas",
    title: "Kompor Portable Camping",
    category: "outdoor-camping",
    description:
      "Kompor portable untuk camping dan piknik. Include tas kecil, tanpa gas kaleng.",
    condition: 8,
    pricePerDay: 30_000,
    depositAmount: 120_000,
    location: "Bogor",
    photoUrls: imageUrls.camping,
  },
  {
    id: "seed-listing-carrier-60l-consina",
    ownerId: "seed-user-bima",
    title: "Carrier 60L Consina",
    category: "outdoor-camping",
    description:
      "Tas carrier 60L untuk hiking dan camping. Banyak kompartemen, rain cover tersedia.",
    condition: 8,
    pricePerDay: 55_000,
    depositAmount: 200_000,
    location: "Jakarta Timur",
    photoUrls: imageUrls.camping,
  },
  {
    id: "seed-listing-camping-chair-set",
    ownerId: "seed-user-dimas",
    title: "Set Kursi Camping Lipat",
    category: "outdoor-camping",
    description:
      "Set dua kursi camping lipat untuk piknik, event outdoor, atau camping santai.",
    condition: 8,
    pricePerDay: 45_000,
    depositAmount: 150_000,
    location: "Tangerang",
    photoUrls: imageUrls.camping,
  },
  {
    id: "seed-listing-lampu-tenda-led",
    ownerId: "seed-user-bima",
    title: "Lampu Tenda LED Rechargeable",
    category: "outdoor-camping",
    description:
      "Lampu LED rechargeable untuk tenda, piknik malam, atau acara outdoor. Include kabel charger.",
    condition: 9,
    pricePerDay: 25_000,
    depositAmount: 100_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.camping,
  },
  {
    id: "seed-listing-keyboard-yamaha-psr",
    ownerId: "seed-user-maya",
    title: "Keyboard Yamaha PSR",
    category: "music",
    description:
      "Keyboard Yamaha untuk latihan, acara kecil, atau kebutuhan perform sementara. Include adaptor dan stand.",
    condition: 8,
    pricePerDay: 95_000,
    depositAmount: 350_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.guitar,
  },
  {
    id: "seed-listing-cajon-akustik",
    ownerId: "seed-user-dimas",
    title: "Cajon Akustik",
    category: "music",
    description:
      "Cajon akustik untuk latihan band, unplugged session, atau acara kampus.",
    condition: 8,
    pricePerDay: 40_000,
    depositAmount: 150_000,
    location: "Bekasi",
    photoUrls: imageUrls.guitar,
  },
  {
    id: "seed-listing-violin-student",
    ownerId: "seed-user-maya",
    title: "Biola Student 4/4",
    category: "music",
    description:
      "Biola 4/4 untuk latihan atau perform sederhana. Include bow, rosin, dan hardcase.",
    condition: 7,
    pricePerDay: 60_000,
    depositAmount: 250_000,
    location: "Jakarta Timur",
    photoUrls: imageUrls.guitar,
  },
  {
    id: "seed-listing-soundcard-focusrite",
    ownerId: "seed-user-bima",
    title: "Soundcard Focusrite Solo",
    category: "music",
    description:
      "Audio interface Focusrite Solo untuk rekaman vokal, gitar, atau podcast. Include kabel USB.",
    condition: 8,
    pricePerDay: 65_000,
    depositAmount: 250_000,
    location: "Depok",
    photoUrls: imageUrls.microphone,
  },
  {
    id: "seed-listing-vacuum-cleaner-dyson",
    ownerId: "seed-user-siti",
    title: "Vacuum Cleaner Dyson",
    category: "household",
    description:
      "Vacuum cleaner cordless untuk bersih-bersih rumah, apartemen, atau setelah acara kecil.",
    condition: 8,
    pricePerDay: 85_000,
    depositAmount: 350_000,
    location: "Jakarta Barat",
    photoUrls: imageUrls.airPurifier,
  },
  {
    id: "seed-listing-air-purifier-sharp",
    ownerId: "seed-user-maya",
    title: "Air Purifier Sharp",
    category: "household",
    description:
      "Air purifier untuk kamar bayi, ruang kerja, atau kebutuhan sementara saat kualitas udara menurun.",
    condition: 8,
    pricePerDay: 70_000,
    depositAmount: 300_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.airPurifier,
  },
  {
    id: "seed-listing-mesin-jahit-portable",
    ownerId: "seed-user-siti",
    title: "Mesin Jahit Portable",
    category: "household",
    description:
      "Mesin jahit portable untuk perbaikan pakaian, tugas desain, atau kebutuhan jahit ringan.",
    condition: 7,
    pricePerDay: 60_000,
    depositAmount: 250_000,
    location: "Tangerang Selatan",
    photoUrls: imageUrls.tools,
  },
  {
    id: "seed-listing-steam-iron-philips",
    ownerId: "seed-user-dimas",
    title: "Steam Iron Philips",
    category: "household",
    description:
      "Setrika uap untuk jas, dress, atau persiapan acara. Kondisi panas stabil dan tangki aman.",
    condition: 8,
    pricePerDay: 35_000,
    depositAmount: 120_000,
    location: "Bekasi",
    photoUrls: imageUrls.airPurifier,
  },
  {
    id: "seed-listing-meja-lipat-event",
    ownerId: "seed-user-bima",
    title: "Meja Lipat Event",
    category: "household",
    description:
      "Meja lipat untuk bazar, acara keluarga, booth kampus, atau kebutuhan kerja sementara.",
    condition: 8,
    pricePerDay: 45_000,
    depositAmount: 150_000,
    location: "Depok",
    photoUrls: imageUrls.tools,
  },
  {
    id: "seed-listing-bor-listrik-bosch",
    ownerId: "seed-user-dimas",
    title: "Bor Listrik Bosch",
    category: "other",
    description:
      "Bor listrik Bosch untuk pemasangan rak, dekorasi rumah, atau kebutuhan DIY ringan. Include beberapa mata bor.",
    condition: 8,
    pricePerDay: 45_000,
    depositAmount: 180_000,
    location: "Jakarta Timur",
    photoUrls: imageUrls.tools,
  },
  {
    id: "seed-listing-ladder-3-meter",
    ownerId: "seed-user-bima",
    title: "Tangga Lipat 3 Meter",
    category: "other",
    description:
      "Tangga lipat aluminium 3 meter untuk dekorasi, bersih-bersih, atau perbaikan rumah.",
    condition: 8,
    pricePerDay: 40_000,
    depositAmount: 150_000,
    location: "Tangerang",
    photoUrls: imageUrls.tools,
  },
  {
    id: "seed-listing-ring-light-tripod",
    ownerId: "seed-user-laras",
    title: "Ring Light dan Tripod",
    category: "other",
    description:
      "Ring light lengkap tripod untuk live streaming, makeup, konten video, atau foto produk kecil.",
    condition: 9,
    pricePerDay: 35_000,
    depositAmount: 120_000,
    location: "Jakarta Selatan",
    photoUrls: imageUrls.actionCam,
  },
  {
    id: "seed-listing-rak-display-bazar",
    ownerId: "seed-user-maya",
    title: "Rak Display Bazar",
    category: "other",
    description:
      "Rak display lipat untuk booth bazar, jualan kampus, atau display produk rumahan.",
    condition: 8,
    pricePerDay: 55_000,
    depositAmount: 200_000,
    location: "Jakarta Barat",
    photoUrls: imageUrls.tools,
  },
  {
    id: "seed-listing-koper-28-inch",
    ownerId: "seed-user-laras",
    title: "Koper 28 Inch",
    category: "other",
    description:
      "Koper ukuran besar untuk perjalanan keluarga atau pindahan sementara. Roda masih halus dan resleting aman.",
    condition: 8,
    pricePerDay: 50_000,
    depositAmount: 200_000,
    location: "Bekasi",
    photoUrls: imageUrls.camping,
  },
];

const seedCompletedBookings: SeedCompletedBooking[] = [
  {
    id: "seed-booking-review-canon-1",
    listingId: "seed-listing-canon-eos-m50",
    renterId: "seed-user-rendy",
    lenderId: "seed-user-andi",
    startOffset: -24,
    endOffset: -22,
    rentalPrice: 300_000,
    depositAmount: 500_000,
  },
  {
    id: "seed-booking-review-drone-1",
    listingId: "seed-listing-dji-mini-3-pro",
    renterId: "seed-user-rendy",
    lenderId: "seed-user-andi",
    startOffset: -18,
    endOffset: -17,
    rentalPrice: 200_000,
    depositAmount: 1_000_000,
  },
  {
    id: "seed-booking-review-stroller-1",
    listingId: "seed-listing-stroller-babyelle-trevi",
    renterId: "seed-user-rendy",
    lenderId: "seed-user-siti",
    startOffset: -16,
    endOffset: -14,
    rentalPrice: 150_000,
    depositAmount: 300_000,
  },
  {
    id: "seed-booking-review-projector-1",
    listingId: "seed-listing-proyektor-portable-xiaomi",
    renterId: "seed-user-andi",
    lenderId: "seed-user-siti",
    startOffset: -10,
    endOffset: -9,
    rentalPrice: 120_000,
    depositAmount: 500_000,
  },
  {
    id: "seed-booking-review-macbook-1",
    listingId: "seed-listing-macbook-air-m1",
    renterId: "seed-user-rendy",
    lenderId: "seed-user-maya",
    startOffset: -30,
    endOffset: -28,
    rentalPrice: 360_000,
    depositAmount: 800_000,
  },
  {
    id: "seed-booking-review-gopro-1",
    listingId: "seed-listing-gopro-hero-10",
    renterId: "seed-user-laras",
    lenderId: "seed-user-bima",
    startOffset: -26,
    endOffset: -25,
    rentalPrice: 110_000,
    depositAmount: 450_000,
  },
  {
    id: "seed-booking-review-speaker-1",
    listingId: "seed-listing-speaker-jbl-partybox",
    renterId: "seed-user-maya",
    lenderId: "seed-user-dimas",
    startOffset: -22,
    endOffset: -21,
    rentalPrice: 125_000,
    depositAmount: 500_000,
  },
  {
    id: "seed-booking-review-car-seat-1",
    listingId: "seed-listing-car-seat-joie",
    renterId: "seed-user-laras",
    lenderId: "seed-user-siti",
    startOffset: -20,
    endOffset: -19,
    rentalPrice: 70_000,
    depositAmount: 300_000,
  },
  {
    id: "seed-booking-review-carrier-1",
    listingId: "seed-listing-carrier-60l-consina",
    renterId: "seed-user-rendy",
    lenderId: "seed-user-bima",
    startOffset: -19,
    endOffset: -17,
    rentalPrice: 165_000,
    depositAmount: 200_000,
  },
  {
    id: "seed-booking-review-keyboard-1",
    listingId: "seed-listing-keyboard-yamaha-psr",
    renterId: "seed-user-dimas",
    lenderId: "seed-user-maya",
    startOffset: -15,
    endOffset: -14,
    rentalPrice: 95_000,
    depositAmount: 350_000,
  },
  {
    id: "seed-booking-review-vacuum-1",
    listingId: "seed-listing-vacuum-cleaner-dyson",
    renterId: "seed-user-andi",
    lenderId: "seed-user-siti",
    startOffset: -13,
    endOffset: -12,
    rentalPrice: 85_000,
    depositAmount: 350_000,
  },
  {
    id: "seed-booking-review-bor-1",
    listingId: "seed-listing-bor-listrik-bosch",
    renterId: "seed-user-laras",
    lenderId: "seed-user-dimas",
    startOffset: -12,
    endOffset: -11,
    rentalPrice: 45_000,
    depositAmount: 180_000,
  },
  {
    id: "seed-booking-review-ring-light-1",
    listingId: "seed-listing-ring-light-tripod",
    renterId: "seed-user-rendy",
    lenderId: "seed-user-laras",
    startOffset: -9,
    endOffset: -8,
    rentalPrice: 35_000,
    depositAmount: 120_000,
  },
  {
    id: "seed-booking-review-koper-1",
    listingId: "seed-listing-koper-28-inch",
    renterId: "seed-user-bima",
    lenderId: "seed-user-laras",
    startOffset: -7,
    endOffset: -6,
    rentalPrice: 50_000,
    depositAmount: 200_000,
  },
];

const seedReviews: SeedReview[] = [
  {
    id: "seed-review-andi-canon-1",
    bookingId: "seed-booking-review-canon-1",
    reviewerId: "seed-user-rendy",
    revieweeId: "seed-user-andi",
    rating: 5,
    comment: "Kamera bersih dan pemilik responsif saat serah terima.",
  },
  {
    id: "seed-review-andi-drone-1",
    bookingId: "seed-booking-review-drone-1",
    reviewerId: "seed-user-rendy",
    revieweeId: "seed-user-andi",
    rating: 4,
    comment: "Drone sesuai deskripsi, instruksi pemakaian jelas.",
  },
  {
    id: "seed-review-siti-stroller-1",
    bookingId: "seed-booking-review-stroller-1",
    reviewerId: "seed-user-rendy",
    revieweeId: "seed-user-siti",
    rating: 5,
    comment: "Stroller bersih dan nyaman dipakai.",
  },
  {
    id: "seed-review-siti-projector-1",
    bookingId: "seed-booking-review-projector-1",
    reviewerId: "seed-user-andi",
    revieweeId: "seed-user-siti",
    rating: 4,
    comment: "Proyektor berfungsi baik untuk acara keluarga.",
  },
  {
    id: "seed-review-maya-macbook-1",
    bookingId: "seed-booking-review-macbook-1",
    reviewerId: "seed-user-rendy",
    revieweeId: "seed-user-maya",
    rating: 5,
    comment: "Laptop mulus, charger lengkap, dan pickup tepat waktu.",
  },
  {
    id: "seed-review-bima-gopro-1",
    bookingId: "seed-booking-review-gopro-1",
    reviewerId: "seed-user-laras",
    revieweeId: "seed-user-bima",
    rating: 4,
    comment: "GoPro aman dipakai liburan, baterai cadangan membantu.",
  },
  {
    id: "seed-review-dimas-speaker-1",
    bookingId: "seed-booking-review-speaker-1",
    reviewerId: "seed-user-maya",
    revieweeId: "seed-user-dimas",
    rating: 5,
    comment: "Speaker kencang dan kondisi sesuai foto.",
  },
  {
    id: "seed-review-siti-car-seat-1",
    bookingId: "seed-booking-review-car-seat-1",
    reviewerId: "seed-user-laras",
    revieweeId: "seed-user-siti",
    rating: 5,
    comment: "Car seat bersih, pemilik menjelaskan pemasangan dengan sabar.",
  },
  {
    id: "seed-review-bima-carrier-1",
    bookingId: "seed-booking-review-carrier-1",
    reviewerId: "seed-user-rendy",
    revieweeId: "seed-user-bima",
    rating: 4,
    comment: "Carrier nyaman untuk trip dua hari, rain cover tersedia.",
  },
  {
    id: "seed-review-maya-keyboard-1",
    bookingId: "seed-booking-review-keyboard-1",
    reviewerId: "seed-user-dimas",
    revieweeId: "seed-user-maya",
    rating: 5,
    comment: "Keyboard bersih, adaptor lengkap, suara normal.",
  },
  {
    id: "seed-review-siti-vacuum-1",
    bookingId: "seed-booking-review-vacuum-1",
    reviewerId: "seed-user-andi",
    revieweeId: "seed-user-siti",
    rating: 4,
    comment: "Vacuum kuat dan mudah dipakai, serah terima cepat.",
  },
  {
    id: "seed-review-dimas-bor-1",
    bookingId: "seed-booking-review-bor-1",
    reviewerId: "seed-user-laras",
    revieweeId: "seed-user-dimas",
    rating: 5,
    comment: "Bor lengkap dengan mata bor, sangat membantu pasang rak.",
  },
  {
    id: "seed-review-laras-ring-light-1",
    bookingId: "seed-booking-review-ring-light-1",
    reviewerId: "seed-user-rendy",
    revieweeId: "seed-user-laras",
    rating: 5,
    comment: "Ring light terang, tripod stabil, cocok buat foto produk.",
  },
  {
    id: "seed-review-laras-koper-1",
    bookingId: "seed-booking-review-koper-1",
    reviewerId: "seed-user-bima",
    revieweeId: "seed-user-laras",
    rating: 4,
    comment: "Koper lega dan roda masih lancar.",
  },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function findLocalDatabasePath() {
  if (process.env.LOCAL_DB_PATH) {
    return process.env.LOCAL_DB_PATH;
  }

  const root = process.cwd().replace(/packages[\\/]db$/, "");
  const candidates = [
    ".wrangler/state/v3/d1",
    "apps/api/.wrangler/state/v3/d1",
    "apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject",
  ];

  for (const candidate of candidates) {
    const matches = findSqliteFiles(join(root, candidate));

    if (matches[0]) {
      return matches[0];
    }
  }

  const fallback = join(root, "local.db");

  if (existsSync(fallback)) {
    return fallback;
  }

  throw new Error(
    "Local SQLite database not found. Run the D1 local migration first or set LOCAL_DB_PATH.",
  );
}

function findSqliteFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findSqliteFiles(path));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".sqlite") && entry.name !== "metadata.sqlite") {
      files.push(path);
    }
  }

  return files.sort();
}

function buildAvailabilityBlocks(now: Date) {
  const canonDates = [1, 2, 3].map((day) => ({
    id: `seed-availability-canon-${day}`,
    listingId: "seed-listing-canon-eos-m50",
    startDate: toDateOnly(addDays(now, day)),
    endDate: toDateOnly(addDays(now, day)),
    reason: "Dipakai pribadi",
  }));

  const droneDates = [
    {
      id: "seed-availability-drone-maintenance",
      listingId: "seed-listing-dji-mini-3-pro",
      startDate: toDateOnly(addDays(now, 7)),
      endDate: toDateOnly(addDays(now, 13)),
      reason: "Maintenance",
    },
  ];

  return [...canonDates, ...droneDates];
}

const dbPath = findLocalDatabasePath();
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);
const now = new Date();
const nowIso = now.toISOString();

console.log(`Using local database: ${dbPath}`);

try {
  db.transaction((tx) => {
    console.log("Seeding users...");

    const existingUsers = tx
      .select({ email: users.email })
      .from(users)
      .where(
        inArray(
          users.email,
          seedUsers.map((user) => user.email),
        ),
      )
      .all();
    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const passwordHash = bcrypt.hashSync(password, 10);
    const usersToInsert = seedUsers
      .filter((user) => !existingEmails.has(user.email))
      .map((user) => ({
        id: user.id,
        email: user.email,
        passwordHash,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: null,
        isAdmin: user.isAdmin ?? false,
        isVerified: user.isVerified,
        createdAt: nowIso,
      }));

    if (usersToInsert.length > 0) {
      tx.insert(users).values(usersToInsert).run();
    }

    for (const user of seedUsers) {
      tx.update(users)
        .set({
          avatarUrl: null,
          isAdmin: user.isAdmin ?? false,
          isVerified: user.isVerified,
          name: user.name,
          phone: user.phone,
          role: user.role,
        })
        .where(eq(users.id, user.id))
        .run();
    }

    console.log(`Seeded users: ${usersToInsert.length} inserted, ${existingEmails.size} skipped.`);
    console.log("Seeding KYC documents...");

    const verifiedUsers = seedUsers.filter((user) => user.isVerified);
    const kycToInsert = verifiedUsers.filter((user) => {
      const existing = tx
        .select({ id: kycDocuments.id })
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, user.id))
        .get();
      return !existing;
    });

    if (kycToInsert.length > 0) {
      tx.insert(kycDocuments)
        .values(
          kycToInsert.map((user) => ({
            id: `seed-kyc-${user.id}`,
            userId: user.id,
            ktpUrl: `https://example.com/seed/${user.id}/ktp.jpg`,
            selfieUrl: `https://example.com/seed/${user.id}/selfie.jpg`,
            status: "verified" as const,
            reviewedAt: nowIso,
          })),
        )
        .run();
    }

    console.log(`Seeded KYC documents: ${kycToInsert.length} inserted.`);
    console.log("Seeding listings...");

    const existingListings = tx
      .select({ id: listings.id })
      .from(listings)
      .where(
        inArray(
          listings.id,
          seedListings.map((listing) => listing.id),
        ),
      )
      .all();
    const existingListingIds = new Set(existingListings.map((listing) => listing.id));
    const listingsToInsert = seedListings
      .filter((listing) => !existingListingIds.has(listing.id))
      .map((listing) => ({
        id: listing.id,
        ownerId: listing.ownerId,
        title: listing.title,
        category: listing.category,
        description: listing.description,
        condition: listing.condition,
        pricePerDay: listing.pricePerDay,
        depositAmount: listing.depositAmount,
        location: listing.location,
        status: "active" as const,
        createdAt: nowIso,
      }));

    if (listingsToInsert.length > 0) {
      tx.insert(listings).values(listingsToInsert).run();
    }

    for (const listing of seedListings) {
      tx.update(listings)
        .set({
          category: listing.category,
          condition: listing.condition,
          depositAmount: listing.depositAmount,
          description: listing.description,
          location: listing.location,
          ownerId: listing.ownerId,
          pricePerDay: listing.pricePerDay,
          status: "active" as const,
          title: listing.title,
        })
        .where(eq(listings.id, listing.id))
        .run();
    }

    console.log(
      `Seeded listings: ${listingsToInsert.length} inserted, ${existingListingIds.size} skipped.`,
    );
    console.log("Seeding listing photos...");

    tx.delete(listingPhotos)
      .where(
        inArray(
          listingPhotos.listingId,
          seedListings.map((listing) => listing.id),
        ),
      )
      .run();

    const photosToInsert = seedListings.flatMap((listing) =>
      listing.photoUrls.map((photoUrl, index) => ({
        id: `seed-photo-${listing.id}-${index + 1}`,
        listingId: listing.id,
        url: photoUrl,
        order: index + 1,
        isPrimary: index === 0,
      })),
    );

    if (photosToInsert.length > 0) {
      tx.insert(listingPhotos)
        .values(photosToInsert)
        .run();
    }

    console.log(`Seeded listing photos: ${photosToInsert.length} refreshed.`);
    console.log("Seeding availability blocks...");

    const availabilityBlocks = buildAvailabilityBlocks(now);
    const availabilityToInsert = availabilityBlocks.filter((block) => {
      const existing = tx
        .select({ id: listingAvailability.id })
        .from(listingAvailability)
        .where(
          and(
            eq(listingAvailability.listingId, block.listingId),
            eq(listingAvailability.startDate, block.startDate),
            eq(listingAvailability.endDate, block.endDate),
          ),
        )
        .get();
      return !existing;
    });

    if (availabilityToInsert.length > 0) {
      tx.insert(listingAvailability).values(availabilityToInsert).run();
    }

    console.log(`Seeded availability blocks: ${availabilityToInsert.length} inserted.`);

    console.log("Seeding completed bookings for reviews...");

    const bookingsToInsert = seedCompletedBookings.filter((booking) => {
      const existing = tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.id, booking.id))
        .get();
      return !existing;
    });

    if (bookingsToInsert.length > 0) {
      tx.insert(bookings)
        .values(
          bookingsToInsert.map((booking) => ({
            id: booking.id,
            listingId: booking.listingId,
            renterId: booking.renterId,
            lenderId: booking.lenderId,
            startDate: toDateOnly(addDays(now, booking.startOffset)),
            endDate: toDateOnly(addDays(now, booking.endOffset)),
            rentalPrice: booking.rentalPrice,
            depositAmount: booking.depositAmount,
            deliveryFee: 0,
            lateFee: 0,
            deliveryMethod: "pickup" as const,
            status: "completed" as const,
            whatsappUnlockedAt: toDateOnly(addDays(now, booking.startOffset)),
            createdAt: toDateOnly(addDays(now, booking.startOffset - 3)),
          })),
        )
        .run();
    }

    console.log(`Seeded completed bookings: ${bookingsToInsert.length} inserted.`);
    console.log("Seeding reviews...");

    const reviewsToInsert = seedReviews.filter((review) => {
      const existing = tx
        .select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.id, review.id))
        .get();
      return !existing;
    });

    if (reviewsToInsert.length > 0) {
      tx.insert(reviews)
        .values(
          reviewsToInsert.map((review) => ({
            id: review.id,
            bookingId: review.bookingId,
            reviewerId: review.reviewerId,
            revieweeId: review.revieweeId,
            rating: review.rating,
            comment: review.comment,
            createdAt: nowIso,
          })),
        )
        .run();
    }

    console.log(`Seeded reviews: ${reviewsToInsert.length} inserted.`);
  });

  console.log("Seed completed.");
} catch (error) {
  console.error("Seed failed. Transaction rolled back.");
  console.error(error);
  process.exit(1);
} finally {
  sqlite.close();
}
