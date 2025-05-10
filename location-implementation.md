# Konum Özelliği Eklenmesi (Location Feature Implementation)

Bu özellik, Protesto ve Boykot işlevlerine konum bilgisi ekleyerek kullanıcıların içerikleri coğrafi olarak filtrelemelerini sağlar.

## Yapılan Değişiklikler

### 1. Konum Verisi
- Türkiye'nin 81 ilini içeren bir veri kümesi oluşturuldu.
- İstanbul, Ankara ve İzmir için ilçe bilgileri eklendi.
- Tüm bu verilere `locationData.js` dosyasında erişilebilir.

### 2. Kullanıcı Arayüzüne Konum Ekleme
- Boykot oluşturma formuna il ve ilçe seçimi için alanlar eklendi.
- Protesto oluşturma formuna il ve ilçe seçimi için alanlar eklendi. 
- Kullanıcının seçtiği il ve ilçe bilgisi otomatik olarak "İlçe, İl" formatında konum alanına kaydedilmektedir.
- Eğer seçilen ilin ilçeleri tanımlanmamışsa, yalnızca il adı konum olarak kaydedilir.

### 3. Konum Gösterimi
- Boykot kartlarında konum bilgisi gösterilmektedir (konum bilgisi varsa).
- Protesto kartlarında konum bilgisi gösterilmektedir (konum bilgisi varsa).
- Konum bilgisi konum simgesi ile birlikte gösterilmektedir.

### 4. Konum Filtreleme
- Boykotlar sayfasına konum filtreleme özelliği eklendi.
- Protestolar sayfasına konum filtreleme özelliği eklendi.
- Kullanıcılar tüm Türkiye illerini veya il bazında ilçeleri filtreleyebilir.
- Konum filtreleri, çubuk grafik şeklinde diğer filtrelerle birlikte gösterilir ve kolayca temizlenebilir.

### 5. Backend Değişiklikleri
- Firestore'da Boycotts ve Protests koleksiyonlarına location alanı eklendi.
- Boykot ve Protesto servisleri, location ile filtreleme destekleyecek şekilde güncellendi.
- Firestore kuralları, location alanının güncellenebilmesi için güncellendi.

## Dosya Değişiklikleri

1. **locationData.js** (Yeni Dosya)
   - Türkiye'nin 81 ilini içeren bir liste
   - İstanbul, Ankara ve İzmir ilçeleri
   - Konum filtresi için yardımcı işlevler

2. **Boycott.js**
   - Boykot oluşturma formuna il ve ilçe seçimi eklendi
   - Seçilen konum "district, province" formatında kaydedildi

3. **BoycottCard.js**
   - Konum bilgisini gösteren bir satır eklendi

4. **BoycottsPage.js**
   - Konum tabanlı filtre seçenekleri eklendi
   - Filtre arayüzü ve açılır menü eklendi

5. **CreateProtestPage.js**
   - Protesto oluşturma formuna il ve ilçe seçenekleri eklendi
   - Konum seçme mantığı eklendi

6. **ProtestsPage.js**
   - Konum filtresi eklendi
   - Filtre arayüzü ve açılır menü eklendi

7. **ProtestCard.js**
   - Konum bilgisini göstermek için alan eklendi

8. **boycottService.js**
   - searchBoycotts fonksiyonu, konum filtrelerini destekleyecek şekilde güncellendi
   - Backend veya client tarafında filtreleme yapılmasına olanak sağlandı

9. **protestService.js**
   - getProtests fonksiyonu, konum filtrelemeyi destekleyecek şekilde güncellendi
   - Client tarafında filtreleme mantığı eklendi

10. **firestore.rules**
    - Konum alanının Firestore belgelerinde güncellenebilmesi için izinler eklendi

## Gelecek Geliştirmeler

1. Coğrafi harita görünümü eklenebilir
2. Kullanıcının konumuna göre yerel içerikler öne çıkarılabilir
3. Konum tabanlı istatistikler eklenebilir
4. Konum bazlı bildirimler özelliği eklenebilir 