export const calculateShipping = (postcode: string, items: any[]) => {
  const isEastMalaysia = postcode.startsWith('87') || postcode.startsWith('9') || postcode.startsWith('88');
  const isLocalKajang = postcode.startsWith('43');

  let totalChargeableWeight = 0;
  items.forEach(item => {
    const actual = Number(item.weight_kg) * item.qty;
    const volumetric = ((Number(item.length_cm) * Number(item.width_cm) * Number(item.height_cm)) / 6000) * item.qty;
    totalChargeableWeight += Math.max(actual, volumetric);
  });

  const weight = Math.ceil(totalChargeableWeight);

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
      const cost = base + (Math.max(0, weight - 1) * addOn);
      return { ...c, totalCost: cost };
    }).sort((a, b) => a.totalCost - b.totalCost)
  };
};