import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProtest } from '../services/protestService';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Navbar from '../components/Navbar';
import { provinces, getDistrictsForProvince } from '../utils/locationData';
import { toast } from 'react-toastify';
import { resizeImage, createThumbnail } from '../utils/imageResizer';

function CreateProtestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [location, setLocation] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Update district options when province changes
  useEffect(() => {
    if (province) {
      const districts = getDistrictsForProvince(province);
      setAvailableDistricts(districts);
      setDistrict(''); // Reset district when province changes
      
      // If the province has no districts, set the location to just the province
      if (districts.length === 0) {
        setLocation(province);
      } else {
        setLocation(''); // Reset location if province has districts
      }
    } else {
      setAvailableDistricts([]);
      setLocation('');
    }
  }, [province]);
  
  // Update location when district changes
  useEffect(() => {
    if (district && province) {
      setLocation(`${district}, ${province}`);
    } else if (province && availableDistricts.length === 0) {
      setLocation(province);
    }
  }, [district, province, availableDistricts]);

  // When image is selected
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const selectedImage = e.target.files[0];
      
      // Check file size (max 2MB)
      if (selectedImage.size > 2 * 1024 * 1024) {
        setError('Görsel boyutu 2MB\'dan küçük olmalıdır');
        return;
      }
      
      setImage(selectedImage);
      
      // Image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  // When form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Protesto eklemek için giriş yapmalısınız.');
      return;
    }
    
    if (!title || !description) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      let imageUrl = '';
      let thumbnailUrl = '';
      
      // Image upload process (if image is selected)
      if (image) {
        // Resize image before upload
        let imageToUpload = image;
        try {
          const resizedImageBlob = await resizeImage(image, {
            maxWidth: 1200,
            maxHeight: 800,
            format: 'jpeg',
            quality: 0.8
          });
          
          // Convert Blob to File to maintain filename for storage reference
          imageToUpload = new File([resizedImageBlob], image.name, {
            type: 'image/jpeg',
            lastModified: new Date().getTime()
          });
          
          // Also create a thumbnail for card view
          const thumbnailBlob = await createThumbnail(image, {
            width: 300,
            height: 200,
            format: 'jpeg',
            quality: 0.7
          });
          
          // Upload thumbnail first
          const thumbnailRef = ref(storage, `protests/thumbnails/${Date.now()}_thumb_${image.name}`);
          const thumbnailFile = new File([thumbnailBlob], `thumb_${image.name}`, {
            type: 'image/jpeg',
            lastModified: new Date().getTime()
          });
          
          const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, thumbnailFile);
          
          // Upload thumbnail
          await new Promise((resolve, reject) => {
            thumbnailUploadTask.on(
              'state_changed',
              () => {
                // Don't update progress for thumbnail
              },
              (error) => {
                console.error('Thumbnail upload error:', error);
                reject(error);
              },
              async () => {
                thumbnailUrl = await getDownloadURL(thumbnailUploadTask.snapshot.ref);
                resolve();
              }
            );
          });
          
        } catch (resizeError) {
          console.error('Image resizing error:', resizeError);
          // Continue with original image if resizing fails
        }
        
        const storageRef = ref(storage, `protests/${Date.now()}_${image.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageToUpload);
        
        // Monitor upload status
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress(progress);
            },
            (error) => {
              setError('Görsel yüklenirken bir hata oluştu: ' + error.message);
              reject(error);
            },
            async () => {
              // Get image URL when upload is complete
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }
      
      // Prepare protest data based on the protests collection structure specified in requirements
      // Using English field names for Firebase compatibility
      const protestData = {
        title,
        description,
        imageUrl,
        thumbnailUrl,
        location,
        creatorUserId: currentUser.uid,
        isApproved: true,  // Making protests appear immediately
        createdAt: new Date(),
      };
      
      // Add protest document to Firestore
      const result = await createProtest(protestData);
      
      if (result.success) {
        toast.success('Protestonuz başarıyla yayınlanmıştır! Ana sayfada görüntülenecektir.');
        navigate('/');
      } else {
        setError('Protesto eklenirken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Protesto eklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <main className="py-10">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 bg-white shadow sm:rounded-lg sm:px-10">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Yeni Protesto Ekle</h2>
              <p className="mt-2 text-sm text-gray-600">
                Protesto etmek istediğiniz şirket veya konu hakkında bilgi verin.
              </p>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Protesto Başlığı *
                </label>
                <div className="mt-1">
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Protesto başlığını girin"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Protesto Açıklaması *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Bu konuyu neden protesto etmeliyiz açıklayın..."
                  />
                </div>
              </div>
              
              {/* Location selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Konum
                </label>
                <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <select
                      id="province"
                      name="province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Konum seçin</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {availableDistricts.length > 0 && (
                    <div>
                      <select
                        id="district"
                        name="district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        disabled={!province}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">İlçe seçin</option>
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                {location && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {location}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Görsel
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div>
                        <img 
                          src={imagePreview} 
                          alt="Önizleme" 
                          className="mx-auto h-64 w-auto mb-4 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setImagePreview('');
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Görseli Kaldır
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span>Dosya yükle</span>
                            <input 
                              id="file-upload" 
                              name="file-upload" 
                              type="file" 
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">veya sürükle ve bırak</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF, max 2MB</p>
                      </>
                    )}
                  </div>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-indigo-200">
                        <div style={{ width: `${uploadProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                      </div>
                      <p className="text-xs text-right text-gray-500">{`${uploadProgress}%`}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'İşleniyor...' : 'Protesto Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateProtestPage; 