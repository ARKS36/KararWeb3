import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Submit a new report
export const submitReport = async (reportData) => {
  try {
    // Add default fields if not provided
    const fullReportData = {
      ...reportData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'reports'), fullReportData);
    return { success: true, reportId: docRef.id };
  } catch (error) {
    console.error("Error submitting report:", error);
    return { success: false, error: error.message };
  }
};

// Get all reports (admin function)
export const getAllReports = async () => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const reports = [];
    
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, reports };
  } catch (error) {
    console.error("Error getting reports:", error);
    return { success: false, error: error.message };
  }
};

// Get reports by status (admin function)
export const getReportsByStatus = async (status) => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef, 
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reports = [];
    
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, reports };
  } catch (error) {
    console.error("Error getting reports by status:", error);
    return { success: false, error: error.message };
  }
};

// Get reports for a specific protest (admin function)
export const getReportsForProtest = async (protestId) => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef, 
      where('protestId', '==', protestId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reports = [];
    
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, reports };
  } catch (error) {
    console.error("Error getting reports for protest:", error);
    return { success: false, error: error.message };
  }
};

// Update report status (admin function)
export const updateReportStatus = async (reportId, newStatus, adminNotes = '') => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    
    await updateDoc(reportRef, {
      status: newStatus,
      adminNotes: adminNotes,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating report status:", error);
    return { success: false, error: error.message };
  }
};

// Delete a report (admin function)
export const deleteReport = async (reportId) => {
  try {
    await deleteDoc(doc(db, 'reports', reportId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting report:", error);
    return { success: false, error: error.message };
  }
};

// Get reports submitted by a specific user
export const getUserReports = async (userId) => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reports = [];
    
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, reports };
  } catch (error) {
    console.error("Error getting user reports:", error);
    return { success: false, error: error.message };
  }
}; 