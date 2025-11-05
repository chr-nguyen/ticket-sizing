import React from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBEIWt0qbvo13EEBogTWB2hnNI6qCbWb0",
  authDomain: "tshirt-sizing.firebaseapp.com",
  projectId: "tshirt-sizing",
  storageBucket: "tshirt-sizing.firebasestorage.app",
  messagingSenderId: "490373345352",
  appId: "1:490373345352:web:d29b7048bd397af78b287d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const memberRef = collection(db, "members");

/**
 * 1. Creates a new member to the organization.
 * 2. Uses addDoc() to get an automatic, unique member ID.
 * @param {string} memberName - The name of the room.
 * @returns {Promise<string>} The auto-generated unique ID of the new room.
 */
export const createNewMember = async (memberName:string) => {
  try {
    const memberData = {
      memberName,
      under: 0,
      over: 0,
      rank: 0
    };

    const docRef = await addDoc(memberRef, memberData);

    console.log("New member created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating new member: ", error);
    throw error;
  }
};

/**
 * 1. Fetches all members in organization.
 * @returns {members[]} all members and data.
 */
export const fetchAllMembers = async () => {
  try {
    const querySnapshot = await getDocs(memberRef);

    const members = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("Fetched members:", members);
    return members;

  } catch (error) {
    console.error("Error fetching collection: ", error);
  }
}
