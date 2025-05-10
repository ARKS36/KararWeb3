import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const BagisPage = () => {
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('once');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Process donation logic would go here
    alert(`Bağış talebiniz alındı. ${amount} TL tutarındaki bağışınız için teşekkür ederiz!`);
    // Reset form
    setAmount('');
    setDonationType('once');
    setName('');
    setEmail('');
    setMessage('');
    setIsAnonymous(false);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Bağış Yap</h1>
            <p className="mt-2 text-xl text-gray-600 max-w-3xl mx-auto">
              Bağışlarınız ile Karar Web3 platformunun gelişimine katkıda bulunun ve toplumsal değişime destek olun
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Neden Bağış Yapmalıyım?</h2>
                <p className="text-gray-600 mb-6">
                  Karar Web3, tamamen bağımsız ve kar amacı gütmeyen bir platformdur. 
                  Platformumuz, toplumsal sorunların çözümüne katkıda bulunmak isteyen 
                  vatandaşların destekleriyle ayakta durmaktadır.
                </p>
                
                <h3 className="text-lg font-medium text-gray-800 mb-2">Bağışlarınız Nereye Gidiyor?</h3>
                <ul className="space-y-3 text-gray-600 mb-6">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Platform altyapısının ve sunucuların sürdürülmesi</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Yeni özellikler ve iyileştirmeler geliştirmek</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Güvenlik ve veri koruma önlemlerinin artırılması</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Toplumsal farkındalık çalışmaları ve etkinlikler</span>
                  </li>
                </ul>
                
                <h3 className="text-lg font-medium text-gray-800 mb-2">Bağış Yapmanın Avantajları</h3>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-800 font-semibold">✓</span>
                      </div>
                      <span>Özel profil rozeti ve destekçi statüsü</span>
                    </li>
                    <li className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-800 font-semibold">✓</span>
                      </div>
                      <span>Yeni özelliklerden öncelikli haberdar olma</span>
                    </li>
                    <li className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-800 font-semibold">✓</span>
                      </div>
                      <span>Toplumsal değişime doğrudan katkıda bulunma</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-700 rounded-xl shadow-md p-6 text-white">
                <h2 className="text-xl font-semibold mb-3">Banka Hesap Bilgilerimiz</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-blue-200 text-sm">Banka:</p>
                    <p className="font-medium">Türkiye Cumhuriyeti Ziraat Bankası</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Hesap Sahibi:</p>
                    <p className="font-medium">Karar Web3 Derneği</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">IBAN:</p>
                    <p className="font-medium">TR00 0000 0000 0000 0000 0000 00</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Açıklama:</p>
                    <p className="font-medium">Karar Web3 Bağış</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Bağış Formu</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Bağış Türü
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="once"
                          name="donationType"
                          value="once"
                          checked={donationType === 'once'}
                          onChange={() => setDonationType('once')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="once" className="ml-2 text-gray-700">
                          Tek Seferlik
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="monthly"
                          name="donationType"
                          value="monthly"
                          checked={donationType === 'monthly'}
                          onChange={() => setDonationType('monthly')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="monthly" className="ml-2 text-gray-700">
                          Aylık Bağış
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="yearly"
                          name="donationType"
                          value="yearly"
                          checked={donationType === 'yearly'}
                          onChange={() => setDonationType('yearly')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="yearly" className="ml-2 text-gray-700">
                          Yıllık Bağış
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
                      Bağış Miktarı (TL)
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <div className="relative flex items-stretch flex-grow focus-within:z-10">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₺</span>
                        </div>
                        <input
                          type="number"
                          name="amount"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 py-3 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          aria-describedby="price-currency"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm" id="price-currency">
                            TL
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full p-3 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ad Soyad"
                        required={!isAnonymous}
                        disabled={isAnonymous}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                        E-posta
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full p-3 sm:text-sm border-gray-300 rounded-md"
                        placeholder="ornek@mail.com"
                        required={!isAnonymous}
                        disabled={isAnonymous}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">
                      Mesajınız (İsteğe Bağlı)
                    </label>
                    <textarea
                      name="message"
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows="3"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full p-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Mesajınızı buraya yazabilirsiniz."
                    ></textarea>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center">
                      <input
                        id="anonymous"
                        name="anonymous"
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={() => setIsAnonymous(!isAnonymous)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                        Anonim olarak bağış yapmak istiyorum
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-300"
                    >
                      Bağış Yap
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="mt-8 bg-gray-100 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Son Destekçilerimiz</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3">
                        <span className="font-bold">MY</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Mehmet Yılmaz</p>
                        <p className="text-sm text-gray-600">2 saat önce</p>
                      </div>
                    </div>
                    <div className="font-semibold text-blue-600">₺250</div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center text-white mr-3">
                        <span className="font-bold">A</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Anonim Bağışçı</p>
                        <p className="text-sm text-gray-600">1 gün önce</p>
                      </div>
                    </div>
                    <div className="font-semibold text-blue-600">₺100</div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3">
                        <span className="font-bold">AK</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Ayşe Kaya</p>
                        <p className="text-sm text-gray-600">3 gün önce</p>
                      </div>
                    </div>
                    <div className="font-semibold text-blue-600">₺500</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Sıkça Sorulan Sorular</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Bağışlarım vergiden düşebilir miyim?</h3>
                <p className="text-gray-600">
                  Evet, Karar Web3 Derneği resmi bir sivil toplum kuruluşu olarak vergi muafiyetine sahiptir. 
                  Bağışlarınızın dekontunu saklayarak vergi beyanında kullanabilirsiniz.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Minimum bağış miktarı var mı?</h3>
                <p className="text-gray-600">
                  Hayır, istediğiniz miktarda bağış yapabilirsiniz. Her bağış, miktarı ne olursa olsun, 
                  platformumuzun gelişimine katkıda bulunmaktadır.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Aylık bağışımı nasıl iptal edebilirim?</h3>
                <p className="text-gray-600">
                  Profil sayfanızdan "Aboneliklerim" bölümüne giderek düzenli bağışlarınızı istediğiniz zaman 
                  durdurabilir veya iptal edebilirsiniz.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Bağış yaparken hangi ödeme yöntemlerini kullanabilirim?</h3>
                <p className="text-gray-600">
                  Kredi kartı, banka havalesi, EFT ve online ödeme sistemleri (örn. PayPal) aracılığıyla 
                  bağış yapabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BagisPage; 