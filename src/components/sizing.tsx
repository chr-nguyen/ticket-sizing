import React, { useState, useEffect } from 'react';
import {
  createNewMember,
  addPlayerToRoom,
  fetchAllPlayers,
  getPokerShowCardsState,
  togglePokerShowCards,
  updatePlayerCardByMemberId,
  usePokerShowCardsState,
  removeAllPlayers,
  updateMemberName,
  updateMemberTheme,
  updatePlayerNameByMemberId,
  useAllMembers,
  setRoomHost,
} from '../firebase/firebase.ts';
import { ThemeProvider } from 'styled-components';
import {
  AppWrapper,
  Container,
  ThemeToggleBtn,
  lightTheme,
  darkTheme,
} from './styles';
import { LoginView } from './LoginView';
import { GameView } from './GameView';

interface memberProps {
  id: string;
  memberName: string;
  over: number;
  under: number;
  rank: number;
  theme?: 'light' | 'dark';
}

export const Sizing = () => {
  const { members: allMembers } = useAllMembers();
  const members = allMembers as memberProps[];

  const [newUser, setNewUser] = useState<string>();
  const [mode, setMode] = useState<string>('user');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [joinAsHost, setJoinAsHost] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [player, setPlayer] = useState({
    name: '',
    memberId: '',
    card: '',
  });

  // Destructure hostId from hook
  const { showCards, hostId } = usePokerShowCardsState();

  const addNew = async () => {
    if (!newUser || !newUser.trim()) return;

    console.log('Adding new member:', newUser);
    await createNewMember(newUser);

    setNewUser('');
    // No need to manually fetch, hook updates automatically
  };

  const handleSelect = async (member: memberProps) => {
    setPlayer({ ...player, name: member.memberName, memberId: member.id });
    console.log(member);
    await addPlayerToRoom({
      id: member.id,
      player: member.memberName,
    });

    if (joinAsHost) {
      // Try to claim host
      if (!hostId) {
        await setRoomHost(member.id);
        setIsHost(true);
      } else {
        console.warn('Host already taken!');
        // Technically UI should block this, but safety check.
        setIsHost(false);
      }
    }
    setMode('select');
  };

  const { data, loading: loadingPlayers } = fetchAllPlayers();

  // Effect to handle game end / removal from room
  useEffect(() => {
    if (!loadingPlayers && mode === 'select' && player.memberId) {
      const isStillInRoom = data.some(p => p.memberId === player.memberId);
      if (!isStillInRoom) {
        setMode('user');
        setPlayer({ name: "", memberId: "", card: "" });
        setIsHost(false);
        setJoinAsHost(false);
      }
    }
  }, [data, loadingPlayers, mode, player.memberId]);

  console.log('players', data, showCards);

  const sizes = [
    {
      label: 'S',
      value: 1,
    },
    {
      label: 'M',
      value: 2,
    },
    {
      label: 'L',
      value: 3,
    },
    {
      label: 'XL',
      value: 4,
    },
  ];

  const handlePick = (pick: string) => {
    const newPick = player.card === pick ? "" : pick;
    setPlayer({ ...player, card: newPick });
    updatePlayerCardByMemberId({
      memberId: player.memberId,
      newCardValue: newPick
    })
  }

  // Sync local player card state with Firestore data
  useEffect(() => {
    if (player.memberId && data.length > 0) {
      const myPlayerDoc = data.find(p => p.memberId === player.memberId);
      if (myPlayerDoc && myPlayerDoc.card !== player.card) {
        setPlayer(prev => ({ ...prev, card: myPlayerDoc.card }));
      }
    }
  }, [data, player.memberId, player.card]);

  const handleReveal = () => {
    togglePokerShowCards();
  };

  const handleEndGame = () => {
    removeAllPlayers();
    setRoomHost(null);
    setIsHost(false);
    setMode('user');
  };

  const startEditingName = () => {
    setEditNameValue(player.name);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditNameValue('');
  };

  const saveName = async () => {
    if (!editNameValue.trim()) return;

    try {
      await updateMemberName(player.memberId, editNameValue);
      await updatePlayerNameByMemberId(player.memberId, editNameValue);
      setPlayer({ ...player, name: editNameValue });
      setIsEditingName(false);
    } catch (e) {
      console.error('Failed to update name', e);
    }
  };

  // --- THEME LOGIC ---
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    // Persist if logged in
    if (player.memberId) {
      await updateMemberTheme({ memberId: player.memberId, theme: newTheme });
    }
  };

  // Load user theme preference when they select their user
  useEffect(() => {
    if (player.memberId) {
      const member = members.find((m) => m.id === player.memberId);
      if (member && member.theme) {
        setThemeMode(member.theme);
      }
    }
  }, [player.memberId, members]);

  return (
    <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
      <AppWrapper>
        <ThemeToggleBtn onClick={toggleTheme}>
          {themeMode === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </ThemeToggleBtn>
        <Container>
          {mode === 'user' && (
            <LoginView
              members={members}
              joinAsHost={joinAsHost}
              setJoinAsHost={setJoinAsHost}
              hostId={hostId}
              handleSelect={handleSelect}
              newUser={newUser}
              setNewUser={setNewUser}
              addNew={addNew}
              themeMode={themeMode}
            />
          )}
          {mode === 'select' && (
            <GameView
              player={player}
              isEditingName={isEditingName}
              editNameValue={editNameValue}
              setEditNameValue={setEditNameValue}
              saveName={saveName}
              cancelEditingName={cancelEditingName}
              startEditingName={startEditingName}
              isHost={isHost}
              showCards={!!showCards}
              handleReveal={handleReveal}
              handleEndGame={handleEndGame}
              data={data}
              sizes={sizes}
              handlePick={handlePick}
              members={members}
            />
          )}
        </Container>
      </AppWrapper>
    </ThemeProvider>
  );
};
