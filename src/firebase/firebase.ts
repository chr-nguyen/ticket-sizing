import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const memberRef = collection(db, 'members');
const playerRef = collection(db, 'players');
const organizationRef = collection(db, 'organizations');
// We no longer use a static pokerRoomRef, it is dynamic based on orgId

// --- ORGANIZATION LOGIC ---

export const createOrganization = async (name: string, password: string) => {
  try {
    const docRef = await addDoc(organizationRef, {
      name,
      password
    });
    console.log('New organization created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating organization: ', error);
    throw error;
  }
}

export const checkOrganizationPassword = async (orgId: string, passwordAttempt: string) => {
  try {
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    if (orgDoc.exists()) {
      const data = orgDoc.data();
      return data.password === passwordAttempt;
    }
    return false;
  } catch (error) {
    console.error("Error verifying password", error);
    return false;
  }
}

export const fetchAllOrganizations = () => {
  const [orgs, setOrgs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(organizationRef, (snapshot) => {
      const newOrgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrgs(newOrgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { orgs, loading };
}


// --- MEMBER LOGIC ---

/**
 * 1. Creates a new member to the organization.
 * 2. Uses addDoc() to get an automatic, unique member ID.
 * @param {string} memberName - The name of the member.
 * @param {string} organizationId - The ID of the organization.
 * @returns {Promise<string>} The auto-generated unique ID of the new room.
 */
export const createNewMember = async (memberName: string, organizationId: string) => {
  try {
    const memberData = {
      memberName,
      organizationId,
      under: 0,
      over: 0,
      rank: 0,
      theme: 'dark',
    };

    const docRef = await addDoc(memberRef, memberData);

    console.log('New member created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating new member: ', error);
    throw error;
  }
};

/**
 * Updates the member's theme preference.
 */
export const updateMemberTheme = async ({
  memberId,
  theme,
}: {
  memberId: string;
  theme: 'light' | 'dark';
}) => {
  try {
    const memberDocRef = doc(db, 'members', memberId);
    await updateDoc(memberDocRef, {
      theme: theme,
    });
    console.log(`Member ${memberId} theme updated to ${theme}`);
  } catch (error) {
    console.error('Error updating member theme: ', error);
    throw error;
  }
};

/**
 * Custom React Hook to listen for real-time updates to the 'members' collection, filtered by Org ID.
 * @returns {{ members: DocumentData[], loading: boolean }}
 */
export const useAllMembers = (organizationId: string | null) => {
  const [members, setMembers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const q = query(memberRef, where("organizationId", "==", organizationId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMembers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMembers(newMembers);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching members:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [organizationId]);

  return { members, loading };
};

// --- PLAYER LOGIC ---

/**
 * Adds a new player to the 'players' collection.
 */
export const addPlayerToRoom = async ({
  player,
  id,
  organizationId
}: {
  player: string;
  id: string;
  organizationId: string;
}) => {
  try {
    // Check for existing players with this memberId in this organization to prevent duplicates
    const q = query(
      playerRef,
      where('memberId', '==', id),
      where('organizationId', '==', organizationId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const deletePromises = querySnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
      console.log(`Removed ${querySnapshot.size} duplicate player(s) for member ${id}`);
    }

    const addPlayerObj = {
      memberId: id,
      organizationId,
      playerName: player,
      card: '',
    };

    const docRef = await addDoc(playerRef, addPlayerObj);
    console.log('New player added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Failed to add player to the room.', error);
    throw error;
  }
};

export const fetchAllPlayers = (organizationId: string | null) => {
  const [data, setData] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = query(playerRef, where("organizationId", "==", organizationId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(newData);
      setLoading(false);
    });

    return unsubscribe;
  }, [organizationId]);

  return { data, loading };
};

export const updatePlayerCardByMemberId = async ({
  memberId,
  newCardValue,
}: {
  memberId: string;
  newCardValue: string;
}): Promise<void> => {
  try {
    // Note: memberId should be unique enough, but technically we could check orgId too if members span orgs (which they do now)
    // But memberId is unique global ID from createNewMember, so it is safe to query just by memberId.
    const q = query(playerRef, where('memberId', '==', memberId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No player found with memberId: ${memberId}`);
      return;
    }

    const playerDoc = querySnapshot.docs[0];
    const playerDocRef = doc(db, 'players', playerDoc.id);

    await updateDoc(playerDocRef, {
      card: newCardValue,
    });

    console.log(`Player with memberId ${memberId} card updated successfully!`);
  } catch (error) {
    console.error('Error updating player card:', error);
    throw error;
  }
};


// --- POKER ROOM STATE LOGIC ---

// Helper to get ref for specific org
const getPokerRoomRef = (organizationId: string) => doc(db, 'pokerState', organizationId);


export const getPokerShowCardsState = async (organizationId: string): Promise<
  boolean | undefined
> => {
  try {
    const docSnap = await getDoc(getPokerRoomRef(organizationId));

    if (docSnap.exists()) {
      const currentData = docSnap.data() as DocumentData;
      if (typeof currentData.showCards === 'boolean') {
        return currentData.showCards;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("Error getting poker showCards state:", error);
    throw error;
  }
};


export const togglePokerShowCards = async (organizationId: string): Promise<void> => {
  try {
    const roomRef = getPokerRoomRef(organizationId);
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const currentShowCardsState = currentData?.showCards ?? false;
      const newShowCardsState = !currentShowCardsState;

      await updateDoc(roomRef, {
        showCards: newShowCardsState,
      });

      console.log(`Poker showCards toggled to: ${newShowCardsState} for org ${organizationId}`);

      if (newShowCardsState === true) {
        // --- SCORING LOGIC ---
        // Fetch players ONLY for this organization
        const q = query(playerRef, where("organizationId", "==", organizationId));
        const playersSnapshot = await getDocs(q);
        const players = playersSnapshot.docs.map((doc) => doc.data());

        const validPlayers = players.filter((p) => p.card && p.card !== '');

        if (validPlayers.length > 0) {
          const cardValues: { [key: string]: number } = {
            XS: 1, S: 2, M: 3, L: 4, XL: 5, '?': 0,
          };

          // Filter out the '?' cards (value 0) from the scoring mechanism
          const numericValues = validPlayers
            .map((p) => cardValues[p.card] || 0)
            .filter((v) => v > 0);

          if (numericValues.length > 0) {
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const mean = sum / numericValues.length;

            const updatePromises: Promise<any>[] = [];

            for (const player of validPlayers) {
              const val = cardValues[player.card] || 0;
              // Ignore players with a '?' card or those with 0 value
              if (val > 0) {
                let score = Math.round(10 - Math.abs(val - mean) * 3);
                if (score < 1) score = 1;

                // Update Member Rank
                const memberRefStr = doc(db, 'members', player.memberId);
                const memberSnap = await getDoc(memberRefStr);
                if (memberSnap.exists()) {
                  const currentRank = memberSnap.data().rank || 0;
                  updatePromises.push(
                    updateDoc(memberRefStr, { rank: currentRank + score }),
                  );
                }
              }
            }
            await Promise.all(updatePromises);
          }
        }
      }

      if (newShowCardsState === false) {
        // Reset cards for THIS org only
        const q = query(playerRef, where("organizationId", "==", organizationId));
        const playersSnapshot = await getDocs(q);
        const updatePromises = playersSnapshot.docs.map((playerDoc) =>
          updateDoc(playerDoc.ref, { card: '' }),
        );
        await Promise.all(updatePromises);
        console.log('All player cards reset to empty for org.');
      }
    } else {
      // Create if doesn't exist
      await setDoc(roomRef, {
        showCards: true,
      });
    }
  } catch (error) {
    console.error("Error toggling poker state:", error);
    throw error;
  }
};


export const usePokerShowCardsState = (organizationId: string | null) => {
  const [showCards, setShowCards] = useState<boolean | undefined>(undefined);
  const [hostId, setHostId] = useState<string | null>(null);
  const [loadingCards, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      getPokerRoomRef(organizationId),
      (docSnap) => {
        if (docSnap.exists()) {
          const currentData = docSnap.data() as DocumentData;
          setShowCards(currentData.showCards === undefined ? undefined : currentData.showCards);
          setHostId(currentData.hostId || null);
        } else {
          setShowCards(undefined);
          setHostId(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to poker state:", error);
        setShowCards(undefined);
        setHostId(null);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [organizationId]);

  return { showCards, hostId, loadingCards };
};

export const setRoomHost = async (hostId: string | null, organizationId: string) => {
  try {
    const roomRef = getPokerRoomRef(organizationId);
    // Use setDoc with merge: true to effectively upsert without overwriting other fields like showCards
    // requires setDoc import which we added
    await setDoc(roomRef, { hostId }, { merge: true });
    console.log(`Room host updated to: ${hostId}`);

  } catch (error) {
    console.error('Error setting room host:', error);
    throw error;
  }
};

export const removeAllPlayers = async (organizationId: string) => {
  try {
    const q = query(playerRef, where("organizationId", "==", organizationId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log('All players removed for org.');

    // Also reset the host
    // We need to implement setRoomHost properly with orgId
    await setRoomHost(null, organizationId);
  } catch (error) {
    console.error('Error removing players: ', error);
    throw error;
  }
};

export const updateMemberName = async (memberId: string, newName: string) => {
  try {
    const memberDocRef = doc(db, 'members', memberId);
    await updateDoc(memberDocRef, {
      memberName: newName,
    });
    console.log(`Member ${memberId} name updated to ${newName}`);
  } catch (error) {
    console.error('Error updating member name: ', error);
    throw error;
  }
};

export const updatePlayerNameByMemberId = async (
  memberId: string,
  newName: string,
) => {
  try {
    const q = query(playerRef, where('memberId', '==', memberId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No player found with memberId: ${memberId}`);
      return;
    }

    const updatePromises = querySnapshot.docs.map((playerDoc) =>
      updateDoc(doc(db, 'players', playerDoc.id), { playerName: newName }),
    );

    await Promise.all(updatePromises);
    console.log(
      `Player(s) with memberId ${memberId} name updated to ${newName}`,
    );
  } catch (error) {
    console.error('Error updating player name: ', error);
    throw error;
  }
};

