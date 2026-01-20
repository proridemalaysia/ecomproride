export const calculateShipping = (postcode: string, items: any[]) => {
  const isEastMalaysia = postcode.startsWith('87') || postcode.startsWith('9') || postcode.startsWith('88');
  const isLocalKajang = postcode.startsWith('43');

  let totalChargeableWeight = 0;

  items.forEach(item => {
    // Force convert to Number and default to 0 to prevent NaN
    const qty = Number(item.qty) || 1;
    const w = Number(item.weight_kg) || 0;
    const L = Number(item.length_cm) || 0;
    const W = Number(item.width_cm) || 0;
    const H = Number(item.height_cm) || 0;

    const actualWeight = w * qty;
    const volumetricWeight = ((L * W * H) / 6000) * qty;
    
    // Pick the higher value
    totalChargeableWeight += Math.max(actualWeight, volumetricWeight);
  });

  // If total weight is still 0 after calculation, default to 1kg for pricing
  const finalWeight = totalChargeableWeight > 0 ? Math.ceil(totalChargeableWeight) : 1;

  const couriers = [
    { 
      name: 'J&T Express', 
      baseWest: isLocalKajang ? 7.00 : 8.50, 
      baseEast: 19.00, 
      perKgWest: 1.50, 
      perKgEast: 12.00,
      time: '2-3 Days'
    },
    { 
      name: 'PosLaju', 
      baseWest: 9.00, 
      baseEast: 16.00, 
      perKgWest: 2.00, 
      perKgEast: 10.50,
      time: '2-4 Days'
    },
    { 
      name: 'NinjaVan', 
      baseWest: 7.50, 
      baseEast: 21.00, 
      perKgWest: 2.20, 
      perKgEast: 14.00,
      time: '3-5 Days'
    }
  ];

  return {
    weightInfo: totalChargeableWeight.toFixed(2),
    options: couriers.map(c => {
      const base = isEastMalaysia ? c.baseEast : c.baseWest;
      const addOn = isEastMalaysia ? c.perKgEast : c.perKgWest;
      const cost = base + (Math.max(0, finalWeight - 1) * addOn);
      return { ...c, totalCost: cost };
    }).sort((a, b) => a.totalCost - b.totalCost)
  };
};