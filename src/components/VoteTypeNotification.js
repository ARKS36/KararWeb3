import React, { useState, useEffect } from 'react';

function VoteTypeNotification() {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Check if the user has already dismissed this notification
    const notificationDismissed = localStorage.getItem('voteTypeNotificationDismissed');
    
    if (!notificationDismissed) {
      // Show the notification after a short delay
      setVisible(true);
    }
  }, []);
  
  const handleDismiss = () => {
    // Hide the notification
    setVisible(false);
    
    // Store in localStorage that this notification has been dismissed
    localStorage.setItem('voteTypeNotificationDismissed', 'true');
  };
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-lg p-4 border-l-4 border-blue-500 animate-fade-in">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">Sistem Güncellemesi</h3>
          <div className="mt-1 text-sm text-gray-600">
            <p>
              "Karşı Çıkıyorum" oy türü artık "Karşıyım" olarak değiştirilmiştir. 
              Önceki oylarınız otomatik olarak güncellendi.
            </p>
          </div>
          <div className="mt-2">
            <button
              onClick={handleDismiss}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Anladım
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={handleDismiss}
              className="inline-flex p-1.5 text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Kapat</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoteTypeNotification; 