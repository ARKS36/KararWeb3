import React, { useState, useEffect } from 'react';

function AnonymityPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Popupın görülüp görülmediğini localStorage'dan kontrol et
    const hasSeenPopup = localStorage.getItem('hasSeenAnonymityPopup');
    
    // Kullanıcı siteye girdikten 1.5 saniye sonra popup'ı göster
    const timer = setTimeout(() => {
      // Eğer kullanıcı daha önce popupı görmemişse, göster
      if (!hasSeenPopup) {
        setIsOpen(true);
        setIsAnimating(true);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    // Popupı kapat ve localStorage'a kaydet
    setIsAnimating(false);
    
    // Kapanış animasyonu için küçük bir gecikme
    setTimeout(() => {
      setIsOpen(false);
      localStorage.setItem('hasSeenAnonymityPopup', 'true');
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Arka plan overlay */}
        <div 
          className={`fixed inset-0 bg-gray-500 transition-opacity ${isAnimating ? 'bg-opacity-75 duration-300 ease-out' : 'bg-opacity-0 duration-200 ease-in'}`}
          aria-hidden="true" 
          onClick={closePopup}
        ></div>

        {/* Ekran okuyucular için bu element */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div 
          className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 ${
            isAnimating 
              ? 'opacity-100 translate-y-0 sm:scale-100 duration-300 ease-out' 
              : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 duration-200 ease-in'
          }`}
        >
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Gizlilik ve Anonimlik Bilgisi
              </h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-3">
                  KararWeb3 platformunda kullanıcı gizliliği ve anonimlikle ilgili önemli bilgiler:
                </p>
                
                <div className="text-left space-y-3 text-sm text-gray-500 border-t border-b border-gray-200 py-3">
                  <p className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Platformda yaptığınız tüm eylemler (oy verme, boykot önerme, protesto ekleme) <strong>tamamen anonimdir</strong>.</span>
                  </p>
                  
                  <p className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Kullanıcı hesaplarınız ve desteklediğiniz/karşı çıktığınız protestolar ve boykotlar arasında kamuya açık bir bağlantı bulunmamaktadır.</span>
                  </p>
                  
                  <p className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Eklediğiniz içeriklerin onay sürecinde yalnızca yöneticiler tarafından incelenmektedir ve bu bilgiler üçüncü taraflarla paylaşılmamaktadır.</span>
                  </p>
                  
                  <p className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <span>Verileriniz, güvenli ve şifreleme korumalı sunucularda saklanmaktadır.</span>
                  </p>
                </div>
                
                <p className="mt-3 text-sm text-gray-600">
                  KararWeb3 olarak kullanıcı gizliliğinize önem veriyoruz. Platformumuzda güvenle hareket edebilirsiniz.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
              onClick={closePopup}
            >
              Anladım
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={closePopup}
            >
              Tekrar Gösterme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnonymityPopup; 