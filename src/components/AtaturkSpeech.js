import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const AtaturkSpeech = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/5 bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-pattern opacity-10"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-800 to-transparent opacity-70"></div>
              <div className="relative z-10">
                <div className="relative group">
                  <img 
                    src={process.env.PUBLIC_URL + "/ataturk.jpg"} 
                    alt="Mustafa Kemal Atatürk" 
                    className="w-56 h-56 md:w-64 md:h-64 object-cover object-top rounded-xl border-4 border-white/50 shadow-lg transition-all duration-500 group-hover:border-white/90 group-hover:shadow-xl"
                    style={{ objectPosition: '50% 30%' }}
                  />
                  <div className="absolute inset-0 rounded-xl border-4 border-white/50 shadow-lg pointer-events-none bg-gradient-to-t from-blue-900/60 to-transparent group-hover:border-white/90 group-hover:from-blue-900/30 transition-all duration-500"></div>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex space-x-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></span>
              </div>
            </div>
            
            <div className="md:w-3/5 p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 border-b border-blue-200 pb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {t.ataturkSpeechTitle}
              </h2>
              <div className="prose prose-blue max-w-none text-gray-600 overflow-auto max-h-64 md:max-h-80 scrollbar-thin scrollbar-thumb-blue-300 prose-p:my-2">
                <p className="mb-3 leading-relaxed">{t.ataturkSpeechContent}</p>
                
                <div className="mt-6 text-right">
                  <p className="inline-block font-medium text-blue-800 border-b-2 border-blue-300 pb-1">{t.ataturkSpeechSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
        }
      `}</style>
    </section>
  );
};

export default AtaturkSpeech; 