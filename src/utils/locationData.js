// Turkey provinces and districts data for location filtering

// List of all 81 provinces in Turkey
export const provinces = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 
  'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 
  'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

// Districts of Istanbul
export const istanbulDistricts = [
  'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 
  'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 
  'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 
  'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 
  'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 
  'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'
];

// Districts of Ankara
export const ankaraDistricts = [
  'Akyurt', 'Altındağ', 'Ayaş', 'Balâ', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 
  'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kalecik', 'Kahramankazan', 
  'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 
  'Şereflikoçhisar', 'Yenimahalle'
];

// Districts of Izmir
export const izmirDistricts = [
  'Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 
  'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 
  'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 
  'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'
];

// Helper function to get districts based on selected province
export const getDistrictsForProvince = (province) => {
  switch (province) {
    case 'İstanbul':
      return istanbulDistricts;
    case 'Ankara':
      return ankaraDistricts;
    case 'İzmir':
      return izmirDistricts;
    default:
      return [];
  }
};

// All locations flattened (for search and filtering)
export const getAllLocations = () => {
  const allLocations = [...provinces];
  
  // Add major city districts with province prefix
  [
    { province: 'İstanbul', districts: istanbulDistricts },
    { province: 'Ankara', districts: ankaraDistricts },
    { province: 'İzmir', districts: izmirDistricts }
  ].forEach(({ province, districts }) => {
    districts.forEach(district => {
      allLocations.push(`${district}, ${province}`);
    });
  });
  
  return allLocations;
}; 