import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(language === 'tr' ? 'Lütfen tüm alanları doldurunuz' : 'Please fill in all fields');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/');
      } else {
        // Localize Firebase errors
        if (result.error.includes('user-not-found')) {
          setError(language === 'tr' ? 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı' : 'No user found with this email address');
        } else if (result.error.includes('wrong-password')) {
          setError(language === 'tr' ? 'Hatalı şifre girdiniz' : 'Incorrect password');
        } else if (result.error.includes('invalid-email')) {
          setError(language === 'tr' ? 'Geçersiz e-posta adresi' : 'Invalid email address');
        } else if (result.error.includes('too-many-requests')) {
          setError(language === 'tr' ? 'Çok fazla hatalı giriş denemesi yaptınız. Lütfen daha sonra tekrar deneyiniz' : 'Too many failed login attempts. Please try again later');
        } else {
          setError(language === 'tr' ? `Giriş yapılırken bir hata oluştu: ${result.error}` : `An error occurred during login: ${result.error}`);
        }
      }
    } catch (error) {
      setError(language === 'tr' ? 'Giriş yapılırken hata oluştu: ' + error.message : 'Error during login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      
      const result = await loginWithGoogle();
      
      if (result.success) {
        navigate('/');
      } else {
        setError(language === 'tr' ? 'Google ile giriş yapılırken bir hata oluştu: ' + result.error : 'Error signing in with Google: ' + result.error);
      }
    } catch (error) {
      setError(language === 'tr' ? 'Google ile giriş yapılırken bir hata oluştu: ' + error.message : 'Error signing in with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {language === 'tr' ? 'Karar Web3\'e Giriş Yap' : 'Log in to Karar Web3'}
            </h2>
            <p className="mt-2 text-gray-600">
              {language === 'tr' 
                ? 'Protestolar ve boykotlar için güvenli platforma hoş geldiniz'
                : 'Welcome to the secure platform for protests and boycotts'}
            </p>
          </div>
          
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {language === 'tr' ? 'E-posta Adresi' : 'Email Address'}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {language === 'tr' ? 'Şifre' : 'Password'}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    {language === 'tr' ? 'Beni hatırla' : 'Remember me'}
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    {language === 'tr' ? 'Şifremi unuttum' : 'Forgot password'}
                  </a>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (language === 'tr' ? 'Giriş yapılıyor...' : 'Signing in...') 
                    : (language === 'tr' ? 'Giriş Yap' : 'Sign In')}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {language === 'tr' ? 'veya şununla devam et' : 'or continue with'}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  {language === 'tr' ? 'Google ile Devam Et' : 'Continue with Google'}
                </button>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {language === 'tr' 
                  ? 'Hesabınız yok mu? '
                  : 'Don\'t have an account? '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  {language === 'tr' ? 'Yeni Hesap Oluştur' : 'Create New Account'}
                </Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              {language === 'tr'
                ? 'Giriş yaparak, '
                : 'By logging in, you agree to our '}
              <a href="#" className="text-blue-600 hover:underline">
                {language === 'tr' ? 'Kullanım Koşulları' : 'Terms of Use'}
              </a>
              {language === 'tr' ? ' ve ' : ' and '}
              <a href="#" className="text-blue-600 hover:underline">
                {language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
              </a>
              {language === 'tr' ? '\'nı kabul etmiş olursunuz.' : '.'}
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default LoginPage; 