import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getUserActivity } from '../services/userService';
import { getUserProtests } from '../services/protestService';
import { getUserBoycotts } from '../services/boycottService';
import { initializeProfileDataIfNeeded } from '../utils/profileDataGenerator';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function ProfilePage() {
  const { currentUser, userDetails } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [myProtests, setMyProtests] = useState([]);
  const [myBoycotts, setMyBoycotts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('protests');
  const [stats, setStats] = useState({
    createdProtests: 0,
    createdBoycotts: 0,
    supportedProtests: 0,
    supportedBoycotts: 0
  });
  
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          
          // Initialize profile data with sample data if needed
          await initializeProfileDataIfNeeded();
          
          // Fetch detailed user profile
          const userProfile = await getUserProfile(currentUser.uid);
          setProfileData(userProfile);
          
          // Fetch user's protests
          const { protests } = await getUserProtests(currentUser.uid);
          setMyProtests(protests || []);
          
          // Fetch user's boycotts
          const { boycotts } = await getUserBoycotts(currentUser.uid);
          setMyBoycotts(boycotts || []);
          
          // Calculate stats
          setStats({
            createdProtests: protests?.length || 0,
            createdBoycotts: boycotts?.length || 0,
            supportedProtests: userProfile.supportedProtests?.length || 0,
            supportedBoycotts: userProfile.supportedBoycotts?.length || 0
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Separate effect for loading activities when the tab changes
  useEffect(() => {
    const fetchActivities = async () => {
      if (currentUser && activeTab === 'activity') {
        try {
          setActivityLoading(true);
          const result = await getUserActivity(currentUser.uid);
          if (result.success) {
            setActivities(result.activities);
          }
        } catch (error) {
          console.error("Error fetching user activities:", error);
        } finally {
          setActivityLoading(false);
        }
      }
    };
    
    fetchActivities();
  }, [currentUser, activeTab]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options);
  };

  // Activity icon based on type
  const getActivityIcon = (activityType) => {
    switch(activityType) {
      case 'protest_create':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'boycott_create':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'protest_support':
      case 'boycott_support':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        );
      case 'protest_oppose':
      case 'boycott_oppose':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
          </svg>
        );
      case 'protest_comment':
      case 'boycott_comment':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case 'profile_update':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColor = (activityType) => {
    if (activityType.includes('protest_create')) return 'bg-blue-100 text-blue-600';
    if (activityType.includes('boycott_create')) return 'bg-red-100 text-red-600';
    if (activityType.includes('_support')) return 'bg-green-100 text-green-600';
    if (activityType.includes('_oppose')) return 'bg-orange-100 text-orange-600';
    if (activityType.includes('_comment')) return 'bg-purple-100 text-purple-600';
    if (activityType === 'profile_update') return 'bg-yellow-100 text-yellow-600';
    return 'bg-gray-100 text-gray-600';
  };

  // Get activity text based on type and language
  const getActivityText = (activity) => {
    const activityType = activity.type;
    
    if (activityType === 'protest_create') {
      return `${t.created} ${activity.relatedTitle}`;
    } else if (activityType === 'boycott_create') {
      return `${t.created} ${activity.relatedTitle}`;
    } else if (activityType === 'protest_support' || activityType === 'boycott_support') {
      return `${t.supported} ${activity.relatedTitle}`;
    } else if (activityType === 'protest_oppose' || activityType === 'boycott_oppose') {
      return `${t.opposed} ${activity.relatedTitle}`;
    } else if (activityType === 'protest_comment' || activityType === 'boycott_comment') {
      return `${t.commented} ${activity.relatedTitle}`;
    } else if (activityType === 'profile_update') {
      return t.updatedProfile;
    }
    
    return activityType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-12 px-4 flex justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-gray-300 h-32 w-32 mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-blue-800 to-blue-600">
              <div className="absolute -bottom-10 left-6">
                <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden">
                  {profileData?.photoURL ? (
                    <img 
                      src={profileData.photoURL} 
                      alt={profileData.displayName || currentUser.email} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {(profileData?.displayName?.[0] || currentUser.email?.[0] || 'U').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-12 pb-6 px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileData?.displayName || currentUser.email}
                  </h1>
                  <p className="text-gray-500">{currentUser.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t.memberSince}: {formatDate(profileData?.createdAt || currentUser.metadata.creationTime)}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  {t.editProfile}
                </button>
              </div>
              
              {/* User Statistics */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{stats.createdProtests}</div>
                    <div className="text-sm text-gray-600">{t.createdProtests}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{stats.createdBoycotts}</div>
                    <div className="text-sm text-gray-600">{t.createdBoycotts}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{stats.supportedProtests}</div>
                    <div className="text-sm text-gray-600">{t.supportedProtests}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">{stats.supportedBoycotts}</div>
                    <div className="text-sm text-gray-600">{t.supportedBoycotts}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('protests')}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'protests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t.myProtests}
                </button>
                <button
                  onClick={() => setActiveTab('boycotts')}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'boycotts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t.myBoycotts}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t.activityHistory}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t.settings}
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            <div className="p-4 sm:p-6">
              {/* Tab content */}
              {activeTab === 'protests' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t.myProtests}</h3>
                  
                  {myProtests.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noProtestsCreated}</h3>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {myProtests.map((protest) => (
                        <div key={protest.id} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{protest.title}</h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">{formatDate(protest.createdAt)}</p>
                            </div>
                            <div className="flex">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                protest.isApproved 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {protest.isApproved ? t.approved : t.pending}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <Link
                              to={`/protest/${protest.id}`}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              {t.details}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'boycotts' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t.myBoycotts}</h3>
                  
                  {myBoycotts.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noBoycottsCreated}</h3>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {myBoycotts.map((boycott) => (
                        <div key={boycott.id} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{boycott.title}</h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">{formatDate(boycott.createdAt)}</p>
                            </div>
                            <div className="flex">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                boycott.isApproved 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {boycott.isApproved ? t.approved : t.pending}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <Link
                              to={`/boycott/${boycott.id}`}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              {t.details}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'activity' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{t.activityHistory}</h3>
                    <Link
                      to={`/activity`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      {t.seeAll}
                      <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                  
                  {activityLoading ? (
                    <div className="py-4 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noActivityFound}</h3>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 -mx-4">
                      {activities.map((activity) => (
                        <li key={activity.id} className="py-4 px-4 hover:bg-gray-50">
                          <div className="flex items-center space-x-4">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getActivityText(activity)}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {formatDate(activity.timestamp)}
                              </p>
                            </div>
                            {activity.relatedId && (
                              <div>
                                <Link
                                  to={`/${activity.type.includes('protest') ? 'protest' : 'boycott'}/${activity.relatedId}`}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                  {t.details}
                                </Link>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">{t.settings}</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-medium text-gray-900">{t.accountSettings}</h3>
                        <div className="mt-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500">{t.notificationSettings}</p>
                            <button type="button" className="text-sm text-blue-600 hover:text-blue-800">
                              {t.edit}
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500">{t.privacySettings}</p>
                            <button type="button" className="text-sm text-blue-600 hover:text-blue-800">
                              {t.edit}
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500">{t.securitySettings}</p>
                            <button type="button" className="text-sm text-blue-600 hover:text-blue-800">
                              {t.edit}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-medium text-gray-900">{t.emailNotifications}</h3>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="newProtests"
                                name="newProtests"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="newProtests" className="font-medium text-gray-700">{t.newProtests}</label>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="newBoycotts"
                                name="newBoycotts"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="newBoycotts" className="font-medium text-gray-700">{t.newBoycotts}</label>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="supportUpdates"
                                name="supportUpdates"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="supportUpdates" className="font-medium text-gray-700">{t.supportUpdates}</label>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="commentNotifications"
                                name="commentNotifications"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="commentNotifications" className="font-medium text-gray-700">{t.commentNotifications}</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default ProfilePage; 