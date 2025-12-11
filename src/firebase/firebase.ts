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
  deleteDoc,
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
export const createNewMember = async (memberName: string) => {
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
/**
 * Custom React Hook to listen for real-time updates to the 'members' collection.
 * @returns {{ members: DocumentData[], loading: boolean }}
 */
export const useAllMembers = () => {
  const [members, setMembers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(memberRef, (snapshot) => {
      const newMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(newMembers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { members, loading };
}

/**
 * Adds a new player to the 'players' array of a specific room document.
 * The new player's 'cardSelect' is initialized as an empty string ("").
 * @param {string} roomId - The ID of the room to update.
 * @param {string} playerName - The name of the player to add.
 */
export const addPlayerToRoom = async ({ player, id }: { player: string, id: string }) => {
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

export const updatePlayerCardByMemberId = async ({ memberId, newCardValue }: { memberId: string, newCardValue: string }): Promise<void> => {
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

      if (newShowCardsState === true) {
        // --- SCORING LOGIC ---
        const playersSnapshot = await getDocs(playerRef);
        const players = playersSnapshot.docs.map(doc => doc.data());

        const validPlayers = players.filter(p => p.card && p.card !== "");

        if (validPlayers.length > 0) {
          const cardValues: { [key: string]: number } = { "S": 1, "M": 2, "L": 3, "XL": 4 };
          const numericValues = validPlayers.map(p => cardValues[p.card] || 0).filter(v => v > 0);

          if (numericValues.length > 0) {
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const mean = sum / numericValues.length;

            console.log(`Calculating scores. Mean: ${mean}`);

            const updatePromises: Promise<any>[] = [];

            for (const player of validPlayers) {
              const val = cardValues[player.card] || 0;
              if (val > 0) {
                // Score formula: 10 - (|Val - Mean| * 3)
                // Max difference is 3 (1 vs 4) -> 10 - 9 = 1 point.
                // Perfect match -> 10 points.
                let score = Math.round(10 - (Math.abs(val - mean) * 3));
                if (score < 1) score = 1; // Minimum 1 point for participating? Or just raw math.

                console.log(`Player ${player.playerName} (Card: ${player.card}, Val: ${val}) gets ${score} points.`);

                // Update Member Rank
                // We need to find the member doc by memberId
                const memberRefStr = doc(db, "members", player.memberId);
                // We use increment from firestore to be safe with concurrent updates if needed, 
                // though here it's batch processed by host. 
                // But we need to import 'increment'. 
                // For now, let's read-modify-write or assume simple update.
                // Ideally: updateDoc(memberRefStr, { rank: increment(score) });
                // Let's rely on reading the doc first to be safe or just standard update if increment isn't imported.
                // I will add 'increment' to imports in a separate step or assume I can fetch-update.
                // Let's try fetch-update for simplicity without changing imports blindly yet (or I can add it now).
                // Actually, standard firebase has `increment`. I'll assume i need to add it to imports.
                // I will just do a direct read-write here.
                const memberSnap = await getDoc(memberRefStr);
                if (memberSnap.exists()) {
                  const currentRank = memberSnap.data().rank || 0;
                  updatePromises.push(updateDoc(memberRefStr, { rank: currentRank + score }));
                }
              }
            }
            await Promise.all(updatePromises);
            console.log("Scores updated.");
          }
        }
      }

      if (newShowCardsState === false) {
        const playersSnapshot = await getDocs(playerRef);
        const updatePromises = playersSnapshot.docs.map(playerDoc =>
          updateDoc(playerDoc.ref, { card: "" })
        );
        await Promise.all(updatePromises);
        console.log("All player cards reset to empty.");
      }

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
 * @returns {{ showCards: boolean | undefined, hostId: string | null, loading: boolean }}
 */
export const usePokerShowCardsState = () => {
  const [showCards, setShowCards] = useState<boolean | undefined>(undefined);
  const [hostId, setHostId] = useState<string | null>(null);
  const [loadingCards, setLoading] = useState(true);

  useEffect(() => {
    // Set up the real-time listener
    const unsubscribe = onSnapshot(pokerRoomRef, (docSnap) => {
      if (docSnap.exists()) {
        const currentData = docSnap.data() as DocumentData;

        // Show Cards
        if (typeof currentData.showCards === 'boolean') {
          setShowCards(currentData.showCards);
        } else {
          setShowCards(undefined);
        }

        // Host ID
        if (currentData.hostId) {
          setHostId(currentData.hostId);
        } else {
          setHostId(null);
        }

      } else {
        setShowCards(undefined);
        setHostId(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to 'room/poker' document:", error);
      setShowCards(undefined);
      setHostId(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { showCards, hostId, loadingCards };
};

export const setRoomHost = async (hostId: string | null) => {
  try {
    await updateDoc(pokerRoomRef, {
      hostId: hostId
    });
    console.log(`Room host updated to: ${hostId}`);
  } catch (error) {
    console.error("Error setting room host:", error);
    throw error;
  }
}

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
//     </div>
//   );
// }
// */

export const removeAllPlayers = async () => {
  try {
    const querySnapshot = await getDocs(playerRef);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log("All players removed.");

    // Also reset the host
    await setRoomHost(null);

  } catch (error) {
    console.error("Error removing players: ", error);
    throw error;
  }
};

export const updateMemberName = async (memberId: string, newName: string) => {
  try {
    const memberDocRef = doc(db, "members", memberId);
    await updateDoc(memberDocRef, {
      memberName: newName
    });
    console.log(`Member ${memberId} name updated to ${newName}`);
  } catch (error) {
    console.error("Error updating member name: ", error);
    throw error;
  }
};

export const updatePlayerNameByMemberId = async (memberId: string, newName: string) => {
  try {
    const q = query(playerRef, where('memberId', '==', memberId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No player found with memberId: ${memberId}`);
      return;
    }

    const updatePromises = querySnapshot.docs.map(playerDoc =>
      updateDoc(doc(db, 'players', playerDoc.id), { playerName: newName })
    );

    await Promise.all(updatePromises);
    console.log(`Player(s) with memberId ${memberId} name updated to ${newName}`);

  } catch (error) {
    console.error("Error updating player name: ", error);
    throw error;
  }
};
