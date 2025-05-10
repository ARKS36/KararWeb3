import React, { useState } from 'react';
import { seedBoycotts } from '../utils/seedBoycotts';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { migrateOpposeVotes } from '../services/migration';

function AdminTools() {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  
  // Admin değilse bileşeni gösterme
  if (!isAdmin) {
    return null;
  }
  
  const handleSeedBoycotts = async () => {
    if (window.confirm('Örnek boycott verilerini Firestore\'a eklemek istediğinizden emin misiniz?')) {
      try {
        setIsLoading(true);
        await seedBoycotts();
        toast.success('Örnek boycott verileri başarıyla eklendi!');
      } catch (error) {
        console.error('Veri ekleme hatası:', error);
        toast.error('Veri eklenirken bir hata oluştu!');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleMigrateVotes = async () => {
    if (window.confirm('Tüm "oppose" tipindeki oyları "opposition" tipine dönüştürmek istediğinizden emin misiniz?')) {
      try {
        setIsMigrating(true);
        const result = await migrateOpposeVotes();
        
        if (result.success) {
          toast.success(`Oylar başarıyla dönüştürüldü! (${result.migrated} başarılı, ${result.failed} başarısız)`);
        } else {
          toast.error(`Oylar dönüştürülürken bir hata oluştu: ${result.error}`);
        }
      } catch (error) {
        console.error('Oy dönüştürme hatası:', error);
        toast.error(`Oy dönüştürme işlemi sırasında bir hata oluştu: ${error.message}`);
      } finally {
        setIsMigrating(false);
      }
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Araçları</h2>
      
      <div className="space-y-3">
        <div>
          <button
            onClick={handleSeedBoycotts}
            disabled={isLoading || isMigrating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 mr-3"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Veriler ekleniyor...
              </>
            ) : (
              'Örnek Boycott Verilerini Ekle'
            )}
          </button>
          
          <button
            onClick={handleMigrateVotes}
            disabled={isLoading || isMigrating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isMigrating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Oylar dönüştürülüyor...
              </>
            ) : (
              'Oy Tiplerini Migrate Et (oppose -> opposition)'
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500">
          Not: Bu işlemler Firestore veritabanına geri alınamaz değişiklikler yapacaktır. Dikkatli kullanınız.
        </p>
      </div>
    </div>
  );
}

export default AdminTools; 