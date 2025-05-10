import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Örnek boycott verileri
const sampleBoycotts = [
  {
    title: "Coca-Cola Boykotu",
    description: "Coca-Cola şirketinin tartışmalı politikaları nedeniyle başlatılan boykot kampanyası.",
    mainCategory: "Markalar",
    subCategory: "Yeme&İçme",
    imageURL: "https://example.com/coca-cola.jpg",
    status: "approved",
    isApproved: true,
    createdAt: serverTimestamp(),
    supportCount: 120,
    oppositionCount: 25,
    creatorUserId: "user123",
    isFeatured: true
  },
  {
    title: "Shell Boykotu",
    description: "Shell'in çevreye verdiği zararlar nedeniyle düzenlenen boykot kampanyası.",
    mainCategory: "Markalar",
    subCategory: "Akaryakıt",
    imageURL: "https://example.com/shell.jpg",
    status: "approved",
    isApproved: true,
    createdAt: serverTimestamp(),
    supportCount: 85,
    oppositionCount: 12,
    creatorUserId: "user456",
    isFeatured: false
  },
  {
    title: "Ünlü Oyuncu X Boykotu",
    description: "X oyuncusunun tartışmalı açıklamaları nedeniyle başlatılan boykot.",
    mainCategory: "Ünlüler",
    subCategory: "Oyuncular",
    imageURL: "https://example.com/actor-x.jpg",
    status: "approved",
    isApproved: true,
    createdAt: serverTimestamp(),
    supportCount: 230,
    oppositionCount: 120,
    creatorUserId: "user789",
    isFeatured: true
  },
  {
    title: "Y Market Zinciri Boykotu",
    description: "Y market zincirinin çalışanlarına karşı uyguladığı politikalar nedeniyle düzenlenen boykot.",
    mainCategory: "Markalar",
    subCategory: "Market",
    imageURL: "https://example.com/market-y.jpg",
    status: "approved",
    isApproved: true,
    createdAt: serverTimestamp(),
    supportCount: 67,
    oppositionCount: 15,
    creatorUserId: "user101",
    isFeatured: false
  },
  {
    title: "Z Sporcusu Boykotu",
    description: "Z sporcusunun tartışmalı sosyal medya paylaşımları nedeniyle başlatılan boykot kampanyası.",
    mainCategory: "Ünlüler",
    subCategory: "Sporcular",
    imageURL: "https://example.com/athlete-z.jpg",
    status: "approved",
    isApproved: true,
    createdAt: serverTimestamp(),
    supportCount: 185,
    oppositionCount: 95,
    creatorUserId: "user202",
    isFeatured: false
  }
];

// Verileri Firestore'a ekleyen fonksiyon
export const seedBoycotts = async () => {
  try {
    const boycottsCollection = collection(db, 'boycotts');
    
    for (const boycott of sampleBoycotts) {
      const docRef = await addDoc(boycottsCollection, boycott);
      console.log(`Boycott eklendi. ID: ${docRef.id}`);
    }
    
    console.log("Tüm örnek boycott verileri başarıyla eklendi!");
    return true;
  } catch (error) {
    console.error("Boycott verileri eklenirken hata oluştu:", error);
    return false;
  }
};

// Node.js ortamında çalıştırılırsa, doğrudan çalıştır
if (typeof window === 'undefined') {
  seedBoycotts()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export default seedBoycotts; 