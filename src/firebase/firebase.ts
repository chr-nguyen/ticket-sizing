import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  // serverTimestamp, // Not used in this snippet
  onSnapshot, // We will use this!
  query,
  where,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

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
const playerRef = collection(db, "players");
const pokerRoomRef = doc(db, 'room', 'poker'); // Reference to the specific document

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

    const members: DocumentData[] = []; // Explicitly type members array
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });

    console.log("Fetched members:", members);
    return members;

  } catch (error) {
    console.error("Error fetching collection: ", error);
    return []; // Return empty array on error
  }
}

/**
 * Adds a new player to the 'players' array of a specific room document.
 * The new player's 'cardSelect' is initialized as an empty string ("").
 * @param {string} roomId - The ID of the room to update.
 * @param {string} playerName - The name of the player to add.
 */
export const addPlayerToRoom = async ({player, id}:{player:string, id:string}) => {
  const addPlayer = {
      memberId: id,
      playerName: player,
      card: ""
  };

  try {
    const docRef = await addDoc(playerRef, addPlayer);
    console.log("New member created with ID: ", docRef.id);
    return docRef.id;

  } catch (error) {
    console.error("Failed to add player to the room.", error);
    throw error; // Re-throw for consistent error handling
  }
};

export const fetchAllPlayers = () => {
  const [data, setData] = useState<DocumentData[]>([]); // Explicitly type useState
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const unsubscribe = onSnapshot(playerRef, (snapshot) => {
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(newData);
      setLoading(false);
    });

    return unsubscribe;
  }, []); // Depend on nothing if db and 'players' are constants

  return { data, loading };
};

export const updatePlayerCardByMemberId = async ({memberId,newCardValue}:{memberId: string, newCardValue: string}): Promise<void> => {
  try {
    const q = query(playerRef, where('memberId', '==', memberId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No player found with memberId: ${memberId}`);
      return;
    }

    const playerDoc = querySnapshot.docs[0];
    const playerDocRef = doc(db, 'players', playerDoc.id);

    await updateDoc(playerDocRef, {
      card: newCardValue
    });

    console.log(`Player with memberId ${memberId} card updated successfully!`);
  } catch (error) {
    console.error("Error updating player card:", error);
    throw error;
  }
}

// CORRECTED: Added 'async' keyword
export const getPokerShowCardsState = async (): Promise<boolean | undefined> => {
  try {
    const docSnap = await getDoc(pokerRoomRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data() as DocumentData;
      if (typeof currentData.showCards === 'boolean') {
        return currentData.showCards;
      } else {
        console.warn("'showCards' field found but is not a boolean. Returning undefined.");
        return undefined;
      }
    } else {
      console.log("Document 'room/poker' does not exist.");
      return undefined;
    }
  } catch (error) {
    console.error("Error getting 'room/poker/showCards' state:", error);
    throw error;
  }
}

// CORRECTED: Added 'async' keyword
export const togglePokerShowCards = async (): Promise<void> => {
  try {
    const docSnap = await getDoc(pokerRoomRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const currentShowCardsState = currentData?.showCards ?? false;

      const newShowCardsState = !currentShowCardsState;

      await updateDoc(pokerRoomRef, {
        showCards: newShowCardsState
      });

      console.log(`'room/poker/showCards' toggled to: ${newShowCardsState}`);
    } else {
      await updateDoc(pokerRoomRef, {
        showCards: true // Default to true if the document didn't exist
      });
      console.log(`'room/poker' document created and 'showCards' set to true.`);
    }
  } catch (error) {
    console.error("Error toggling 'room/poker/showCards':", error);
    throw error;
  }
}


// --- NEW REAL-TIME LISTENER FUNCTION ---

/**
 * Custom React Hook to listen for real-time updates to the 'showCards' state
 * in the 'room/poker' document.
 * @returns {{ showCards: boolean | undefined, loading: boolean }}
 */
export const usePokerShowCardsState = () => {
  const [showCards, setShowCards] = useState<boolean | undefined>(undefined);
  const [loadingCards, setLoading] = useState(true);

  useEffect(() => {
    // Set up the real-time listener
    const unsubscribe = onSnapshot(pokerRoomRef, (docSnap) => {
      if (docSnap.exists()) {
        const currentData = docSnap.data() as DocumentData;
        if (typeof currentData.showCards === 'boolean') {
          setShowCards(currentData.showCards);
        } else {
          // Field might be missing or not a boolean, handle as undefined or a default
          console.warn("'showCards' field found but is not a boolean or missing. Setting to undefined.");
          setShowCards(undefined);
        }
      } else {
        // Document itself does not exist
        console.log("Document 'room/poker' does not exist.");
        setShowCards(undefined);
      }
      setLoading(false); // Data (or lack thereof) has been loaded
    }, (error) => {
      console.error("Error listening to 'room/poker' document:", error);
      setShowCards(undefined); // Reset or set to error state
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return { showCards, loadingCards };
};

// --- Example of how to use the new hook in a React component ---
/*
// Inside a React component (e.g., in App.tsx or a PokerRoom component)
function PokerTable() {
  const { showCards, loading } = usePokerShowCardsState();

  if (loading) {
    return <p>Loading poker room state...</p>;
  }

  return (
    <div>
      <h1>Poker Room</h1>
      {showCards !== undefined ? (
        <p>Cards are currently: {showCards ? "Visible" : "Hidden"}</p>
      ) : (
        <p>Poker room state not available or 'showCards' is not a boolean.</p>
      )}

      <button onClick={togglePokerShowCards}>
        Toggle Show Cards
      </button>

      // ... other components or game logic
    </div>
  );
}
*/
