// lib/postcodes.ts

export const getStateByPostcode = (postcode: string): string => {
  const pc = parseInt(postcode.substring(0, 2));

  if (pc >= 0 && pc <= 1) return "Perlis";
  if (pc >= 2 && pc <= 9) return "Kedah";
  if (pc >= 10 && pc <= 14) return "Pulau Pinang";
  if (pc >= 15 && pc <= 18) return "Kelantan";
  if (pc >= 20 && pc <= 24) return "Terengganu";
  if (pc >= 25 && pc <= 28) return "Pahang";
  if (pc >= 30 && pc <= 36) return "Perak";
  if (pc >= 40 && pc <= 48) return "Selangor";
  if (pc >= 50 && pc <= 60) return "Kuala Lumpur";
  if (pc === 62) return "Putrajaya";
  if (pc === 63) return "Selangor"; // Cyberjaya
  if (pc >= 68 && pc <= 68) return "Selangor";
  if (pc >= 70 && pc <= 73) return "Negeri Sembilan";
  if (pc >= 75 && pc <= 78) return "Melaka";
  if (pc >= 79 && pc <= 86) return "Johor";
  if (pc === 87) return "Labuan";
  if (pc >= 88 && pc <= 91) return "Sabah";
  if (pc >= 93 && pc <= 98) return "Sarawak";
  
  return "Other";
};

// Common Town Database
export const commonTowns: Record<string, string[]> = {
  "43000": ["Kajang", "Sungai Chua", "Bangi"],
  "47100": ["Puchong", "Puchong Utama", "Bandar Puteri"],
  "50480": ["Kuala Lumpur", "Mont Kiara", "Sri Hartamas"],
  "43200": ["Cheras", "Hulu Langat"],
  "80000": ["Johor Bahru"],
  "93000": ["Kuching"]
};