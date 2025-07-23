const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMs = today - birth;
    const ageInMonths = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30.44));
    return ageInMonths;
  };
  
  const calculateBMI = (weight, height) => {
    const heightInM = height / 100;
    return parseFloat((weight / (heightInM * heightInM)).toFixed(2));
  };
  
  const calculateCalorieNeeds = (ageInMonths, gender, weight) => {
    // Based on Indonesian RDA (Angka Kecukupan Gizi)
    if (ageInMonths < 6) {
      return Math.round(108 * weight); // kcal/kg for 0-6 months
    }
    if (ageInMonths < 12) {
      return Math.round(98 * weight); // kcal/kg for 6-12 months
    }
    if (ageInMonths < 24) {
      return 1125; // 1-2 years
    }
    if (ageInMonths < 36) {
      return 1250; // 2-3 years
    }
    if (ageInMonths < 60) {
      return gender === 'male' ? 1400 : 1300; // 3-5 years
    }
    if (ageInMonths < 120) {
      return gender === 'male' ? 1650 : 1550; // 5-10 years
    }
    return gender === 'male' ? 2000 : 1800; // 10+ years
  };
  
  const calculateProteinNeeds = (ageInMonths, weight) => {
    if (ageInMonths < 6) return Math.round(2.2 * weight);
    if (ageInMonths < 12) return Math.round(1.6 * weight);
    if (ageInMonths < 24) return 20;
    if (ageInMonths < 36) return 25;
    if (ageInMonths < 60) return 35;
    if (ageInMonths < 120) return 40;
    return 50;
  };
  
  const getNutritionStatus = (bmi, ageInMonths) => {
    // WHO BMI-for-age standards for children
    if (ageInMonths < 24) {
      if (bmi < 14) return 'severely_underweight';
      if (bmi < 16) return 'underweight';
      if (bmi < 19) return 'normal';
      if (bmi < 21) return 'overweight';
      return 'obese';
    } else {
      if (bmi < 15) return 'severely_underweight';
      if (bmi < 17) return 'underweight';
      if (bmi < 25) return 'normal';
      if (bmi < 30) return 'overweight';
      return 'obese';
    }
  };
  
  const getFoodRecommendations = (ageInMonths, calorieNeeds, proteinNeeds) => {
    const recommendations = [];
    
    if (ageInMonths < 6) {
      recommendations.push({
        category: 'ASI Eksklusif',
        items: [
          'ASI sesuai kebutuhan bayi (8-12 kali sehari)',
          'Tidak perlu makanan atau minuman tambahan'
        ]
      });
    } else if (ageInMonths < 12) {
      recommendations.push({
        category: 'MPASI + ASI',
        items: [
          'Bubur nasi halus dengan sayuran (bayam, wortel, labu)',
          'Pure buah (pisang, alpukat, pepaya)',
          'Protein lunak (telur rebus, ikan tanpa duri, ayam cincang)',
          'ASI tetap dilanjutkan',
          'Mulai dengan 2-3 sendok makan per kali makan'
        ]
      });
    } else if (ageInMonths < 24) {
      recommendations.push({
        category: 'Makanan Keluarga Lembut',
        items: [
          'Nasi tim + lauk protein (ikan, ayam, telur, tahu)',
          'Sayuran hijau cincang halus (bayam, kangkung, brokoli)',
          'Buah segar potong kecil (pisang, jeruk, pepaya)',
          'Susu formula atau ASI (500ml per hari)',
          'Camilan sehat: biskuit bayi, buah lunak'
        ]
      });
    } else {
      recommendations.push({
        category: 'Makanan Bergizi Seimbang',
        items: [
          `Karbohidrat: ${Math.round(calorieNeeds * 0.6 / 4)}g (nasi, roti, pasta, kentang)`,
          `Protein: ${proteinNeeds}g (ikan, ayam, telur, tempe, tahu, daging)`,
          `Lemak: ${Math.round(calorieNeeds * 0.25 / 9)}g (minyak, alpukat, kacang)`,
          'Sayuran: 3-4 porsi per hari (beragam warna)',
          'Buah: 2-3 porsi per hari (vitamin C tinggi)',
          'Susu: 2-3 gelas per hari (kalsium dan protein)',
          'Air putih: 6-8 gelas per hari'
        ]
      });
    }
    
    return recommendations;
  };
  
  const getGrowthPercentile = (measurement, ageInMonths, gender, type) => {
    // Simplified percentile calculation
    // In real implementation, you would use WHO growth charts
    const percentiles = {
      weight: {
        male: { 3: 50, 12: 75, 24: 85, 36: 95 },
        female: { 3: 45, 12: 70, 24: 80, 36: 90 }
      },
      height: {
        male: { 3: 60, 12: 74, 24: 86, 36: 95 },
        female: { 3: 59, 12: 72, 24: 84, 36: 93 }
      }
    };
    
    // This is a simplified calculation - real implementation needs proper WHO charts
    return Math.random() * 100; // Placeholder
  };
  
  module.exports = {
    calculateAge,
    calculateBMI,
    calculateCalorieNeeds,
    calculateProteinNeeds,
    getNutritionStatus,
    getFoodRecommendations,
    getGrowthPercentile
  };