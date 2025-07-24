// seed.js - Script untuk mengisi data edukasi gizi
const mongoose = require('mongoose');
require('dotenv').config();

const nutritionEducationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  ageGroup: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const NutritionEducation = mongoose.model('NutritionEducation', nutritionEducationSchema);

const educationData = [
  {
    title: "Pentingnya ASI Eksklusif 6 Bulan Pertama",
    content: "ASI eksklusif adalah pemberian ASI saja tanpa tambahan makanan atau minuman lain pada bayi usia 0-6 bulan. ASI mengandung semua nutrisi yang dibutuhkan bayi dan antibodi untuk melindungi dari infeksi. Manfaat ASI eksklusif: meningkatkan kekebalan tubuh, mendukung perkembangan otak, mengurangi risiko alergi, dan memperkuat ikatan ibu-bayi.",
    category: "ASI dan Menyusui",
    ageGroup: "0-6m"
  },
  {
    title: "Mengenal MPASI: Makanan Pendamping ASI yang Tepat",
    content: "MPASI diberikan mulai usia 6 bulan karena ASI saja sudah tidak mencukupi kebutuhan nutrisi bayi. Prinsip MPASI: dimulai dari tekstur halus ke kasar, satu jenis makanan dulu, perhatikan reaksi alergi. Contoh MPASI 6 bulan: bubur nasi halus, pure pisang, pure alpukat. Tetap berikan ASI selama pemberian MPASI.",
    category: "MPASI",
    ageGroup: "6-12m"
  },
  {
    title: "Gizi Seimbang untuk Balita 1-5 Tahun",
    content: "Balita membutuhkan gizi seimbang untuk tumbuh kembang optimal. Komponen gizi seimbang: karbohidrat (nasi, roti), protein (ikan, ayam, telur, tahu), sayuran (bayam, wortel, brokoli), buah-buahan, dan susu. Porsi makan 3 kali sehari ditambah 2 kali snack sehat. Hindari makanan tinggi gula, garam, dan lemak jenuh.",
    category: "Gizi Seimbang",
    ageGroup: "1-2y"
  },
  {
    title: "Mengatasi Anak Susah Makan: Tips Praktis",
    content: "Anak susah makan adalah masalah umum orangtua. Tips mengatasi: ciptakan suasana makan menyenangkan, libatkan anak dalam memilih makanan, variasikan bentuk dan warna makanan, jangan memaksa makan, berikan contoh kebiasaan makan sehat, batasi camilan sebelum makan utama. Konsultasi dokter jika berat badan turun drastis.",
    category: "Tips Makan",
    ageGroup: "1-2y"
  },
  {
    title: "Protein Hewani vs Nabati untuk Anak",
    content: "Protein hewani (ikan, ayam, telur, susu) mengandung asam amino lengkap dan mudah diserap tubuh. Protein nabati (tempe, tahu, kacang-kacangan) lebih murah dan mengandung serat. Anak membutuhkan kedua jenis protein. Berikan protein hewani 2-3 porsi per hari dan protein nabati 1-2 porsi. Ikan laut baik untuk perkembangan otak karena omega-3.",
    category: "Protein",
    ageGroup: "2-5y"
  },
  {
    title: "Bahaya Stunting dan Cara Pencegahannya",
    content: "Stunting adalah kondisi gagal tumbuh pada anak karena kurang gizi kronis. Ciri stunting: tinggi badan pendek, berat badan kurang, perkembangan kognitif terhambat. Pencegahan stunting: ASI eksklusif 6 bulan, MPASI bergizi, imunisasi lengkap, sanitasi bersih, pemantauan tumbuh kembang rutin. 1000 hari pertama kehidupan sangat krusial.",
    category: "Pencegahan Stunting",
    ageGroup: "0-6m"
  },
  {
    title: "Kebutuhan Vitamin dan Mineral untuk Anak",
    content: "Vitamin dan mineral penting untuk tumbuh kembang anak. Vitamin A (wortel, bayam) untuk penglihatan, Vitamin C (jeruk, tomat) untuk daya tahan tubuh, Vitamin D (sinar matahari, ikan) untuk tulang, Zat besi (daging, bayam) untuk mencegah anemia, Kalsium (susu, ikan teri) untuk tulang dan gigi, Zinc (daging, kacang) untuk pertumbuhan.",
    category: "Vitamin Mineral",
    ageGroup: "2-5y"
  },
  {
    title: "Camilan Sehat untuk Anak Sekolah",
    content: "Anak sekolah membutuhkan camilan bergizi untuk energi dan konsentrasi belajar. Camilan sehat: buah potong, yogurt, roti gandum, biskuit oat, susu, kacang rebus. Hindari camilan tinggi gula, pewarna, pengawet. Buat bekal menarik dengan variasi warna dan bentuk. Ajarkan anak membaca label makanan kemasan.",
    category: "Camilan Sehat",
    ageGroup: "5-12y"
  },
  {
    title: "Hidrasi yang Tepat untuk Anak",
    content: "Air adalah kebutuhan vital anak. Kebutuhan air per hari: usia 1-3 tahun (1.3 liter), usia 4-8 tahun (1.7 liter), usia 9-13 tahun (2.4 liter laki-laki, 2.1 liter perempuan). Berikan air putih sebagai minuman utama. Batasi minuman manis, bersoda, berkafein. Buah dengan kadar air tinggi juga membantu hidrasi.",
    category: "Hidrasi",
    ageGroup: "1-2y"
  },
  {
    title: "Mengukur Status Gizi Anak dengan Benar",
    content: "Status gizi anak diukur dengan: Berat Badan menurut Umur (BB/U), Tinggi Badan menurut Umur (TB/U), dan Berat Badan menurut Tinggi Badan (BB/TB). Gunakan kurva pertumbuhan WHO untuk membandingkan. Ukur berat dan tinggi badan rutin setiap bulan. Catat dalam buku KIA atau aplikasi. Konsultasi tenaga kesehatan jika ada penyimpangan dari kurva normal.",
    category: "Pengukuran Gizi",
    ageGroup: "0-6m"
  }
];

// Script untuk menjalankan seeding
async function seedEducationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Hapus data lama
    await NutritionEducation.deleteMany({});
    
    // Insert data baru
    await NutritionEducation.insertMany(educationData);
    
    console.log('✅ Data edukasi gizi berhasil di-seed!');
    console.log(`📚 Total artikel: ${educationData.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Jalankan script jika file ini dieksekusi langsung
if (require.main === module) {
  seedEducationData();
}

module.exports = { educationData, seedEducationData };