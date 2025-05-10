import React from 'react';
import Boycott from '../components/Boycott';
import Navbar from '../components/Navbar';

function CreateBoycottPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Yeni Boykot Ekle</h1>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <Boycott />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateBoycottPage; 