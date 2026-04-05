import { toEthiopian } from 'ethiopian-date';

export const getEthiopianDateString = (gregorianDateStr: string): string => {
  if (!gregorianDateStr) return '';
  try {
    const date = new Date(gregorianDateStr);
    if (isNaN(date.getTime())) return '';
    
    const [year, month, day] = toEthiopian(date.getFullYear(), date.getMonth() + 1, date.getDate());
    
    // Ethiopian months (1-13)
    const ethiopianMonths = [
      'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yakatit', 
      'Magabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehasse', 'Pagume'
    ];
    
    return `${ethiopianMonths[month - 1]} ${day}, ${year} E.C.`;
  } catch (error) {
    console.error('Error converting to Ethiopian date:', error);
    return '';
  }
};
