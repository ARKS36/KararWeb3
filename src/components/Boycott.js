import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { addBoycott } from '../services/boycottService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { provinces, getDistrictsForProvince } from '../utils/locationData';
import { resizeImage, createThumbnail } from '../utils/imageResizer';

function Boycott() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [location, setLocation] = useState('');
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Lists of categories
  const mainCategories = ['Markalar', 'Ünlüler'];
  
  // Subcategories based on main category
  const subCategoriesMap = {
    'Markalar': ['Medya', 'Akaryakıt', 'Yeme&İçme', 'Market', 'Mobilya', 'Giyim', 'Teknoloji', 'Diğer'],
    'Ünlüler': ['Sanatçılar', 'Oyuncular', 'Sosyal Medya', 'Sporcular', 'İş İnsanları', 'Diğer']
  };
  
  // Dynamic subcategories based on selected main category
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  
  // Update subcategories when main category changes
  useEffect(() => {
    if (mainCategory) {
      setAvailableSubCategories(subCategoriesMap[mainCategory] || []);
      setSubCategory(''); // Reset subcategory when main category changes
    } else {
      setAvailableSubCategories([]);
    }
  }, [mainCategory]);
  
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
  
  // Handle image selection
  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Check file size (max 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error('Görsel boyutu 2MB\'dan küçük olmalıdır');
        return;
      }
      
      setImage(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Boykot eklemek için giriş yapmalısınız.');
      return;
    }
    
    if (!title || !description || !mainCategory || !subCategory) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let imageURL = null;
      let thumbnailURL = null;
      
      // Upload image if selected
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
          const thumbnailRef = ref(storage, `boycott_images/thumbnails/${Date.now()}_thumb_${image.name}`);
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
                try {
                  thumbnailURL = await getDownloadURL(thumbnailUploadTask.snapshot.ref);
                  resolve();
                } catch (error) {
                  console.error("Thumbnail URL error:", error);
                  reject(error);
                }
              }
            );
          });
          
        } catch (resizeError) {
          console.error('Image resizing error:', resizeError);
          // Continue with original image if resizing fails
        }
        
        const storageRef = ref(storage, `boycott_images/${Date.now()}_${image.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageToUpload);
        
        // Monitor upload progress
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Görsel yükleme hatası:", error);
              reject(new Error(`Görsel yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`));
            },
            async () => {
              // Get download URL
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                imageURL = downloadURL;
                resolve();
              } catch (error) {
                console.error("URL alma hatası:", error);
                reject(new Error(`Görsel URL'si alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`));
              }
            }
          );
        });
      }
      
      // Prepare boycott data
      const boycottData = {
        title,
        description,
        mainCategory,
        subCategory,
        location,
        imageURL,
        thumbnailURL,
        createdAt: new Date(),
      };
      
      // Add boycott to Firestore
      const result = await addBoycott(boycottData, currentUser.uid);
      
      if (result.success) {
        toast.success('Boykotunuz başarıyla yayınlanmıştır! Ana sayfada görüntülenecektir.');
        
        // Clear form data
        setTitle('');
        setDescription('');
        setMainCategory('');
        setSubCategory('');
        setProvince('');
        setDistrict('');
        setLocation('');
        setImage(null);
        setImagePreview(null);
        
        // Navigate to boycotts page after a delay to show success message
        setTimeout(() => {
          navigate('/boykotlar');
        }, 2000);
      } else {
        toast.error(`Boykot eklenirken hata oluştu: ${result.error || 'Beklenmeyen bir hata oluştu.'}`);
      }
    } catch (error) {
      console.error('Boykot eklenirken hata oluştu:', error);
      toast.error(`Boykot eklenirken hata oluştu: ${error.message || 'Beklenmeyen bir hata oluştu.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Yeni Boykot Ekle</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Başlık <span className="text-red-500">*</span>
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="title"
            type="text"
            placeholder="Boykot başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Açıklama <span className="text-red-500">*</span>
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="description"
            placeholder="Boykot hakkında detaylı bilgi verin"
            rows="5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mainCategory">
              Ana Kategori <span className="text-red-500">*</span>
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="mainCategory"
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value)}
              required
            >
              <option value="">Ana kategori seçin</option>
              {mainCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subCategory">
              Alt Kategori <span className="text-red-500">*</span>
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="subCategory"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              required
              disabled={!mainCategory}
            >
              <option value="">Alt kategori seçin</option>
              {availableSubCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Location selection */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="province">
              Konum
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
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
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="district">
                İlçe
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!province}
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
        
        {/* Location display */}
        {location && (
          <div className="mb-4">
            <div className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700">{location}</span>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Görsel
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {!imagePreview && (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="image" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Dosya yükle</span>
                      <input
                        id="image"
                        name="image"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">veya buraya sürükle</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF max 2MB</p>
                </>
              )}
              
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none"
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isSubmitting && (
          <div className="mb-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                    Yükleniyor
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-indigo-600">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                ></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ekleniyor...' : 'Boykot Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Boycott; 