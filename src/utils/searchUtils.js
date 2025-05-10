// Metni arama için hazırla
export const prepareTextForSearch = (text) => {
  if (!text) return [];
  
  // Metni küçük harfe çevir ve Türkçe karakterleri değiştir
  const normalized = text.toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  
  // Noktalama işaretlerini kaldır ve fazla boşlukları temizle
  const cleaned = normalized
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Kelimeleri ayır
  const words = cleaned.split(' ');
  
  // Tekrar eden kelimeleri kaldır
  const uniqueWords = [...new Set(words)];
  
  // En az 2 karakterli kelimeleri al
  return uniqueWords.filter(word => word.length >= 2);
};

// Boykot verilerinden arama anahtar kelimeleri oluştur
export const generateSearchKeywords = (boycottData) => {
  const searchFields = [
    boycottData.title,
    boycottData.description,
    boycottData.mainCategory,
    boycottData.subCategory
  ];
  
  // Tüm alanlardan anahtar kelimeleri topla
  const allKeywords = searchFields
    .filter(field => field) // null/undefined alanları filtrele
    .map(field => prepareTextForSearch(field))
    .flat();
  
  // Tekrar eden kelimeleri kaldır
  return [...new Set(allKeywords)];
}; 