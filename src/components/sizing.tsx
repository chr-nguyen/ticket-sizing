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
  fetchAllOrganizations,
  createOrganization,
  checkOrganizationPassword
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
import { OrganizationView } from './OrganizationView';

interface memberProps {
  id: string;
  memberName: string;
  over: number;
  under: number;
  rank: number;
  theme?: 'light' | 'dark';
}

export const Sizing = () => {
  // --- ORGANIZATION STATE ---
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  const { orgs, loading: loadingOrgs } = fetchAllOrganizations();

  const handleCreateOrg = async (name: string, password: string) => {
    const newId = await createOrganization(name, password);
    setOrganizationId(newId);
    setOrganizationName(name);
  };

  const handleJoinOrg = async (orgId: string, passwordAttempt: string) => {
    const isValid = await checkOrganizationPassword(orgId, passwordAttempt);
    if (isValid) {
      setOrganizationId(orgId);
      // Find name for local state
      const org = orgs.find(o => o.id === orgId);
      if (org) setOrganizationName(org.name);
      return true;
    }
    return false;
  };


  // --- APP STATE (Scoped by Organization) ---
  const { members: allMembers } = useAllMembers(organizationId);
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
  const { showCards, hostId } = usePokerShowCardsState(organizationId);

  const addNew = async () => {
    if (!newUser || !newUser.trim() || !organizationId) return;

    console.log('Adding new member:', newUser);
    await createNewMember(newUser, organizationId);

    setNewUser('');
    // No need to manually fetch, hook updates automatically
  };

  const handleSelect = async (member: memberProps) => {
    if (!organizationId) return;

    setPlayer({ ...player, name: member.memberName, memberId: member.id });
    console.log(member);
    await addPlayerToRoom({
      id: member.id,
      player: member.memberName,
      organizationId
    });

    if (joinAsHost) {
      // Try to claim host
      if (!hostId) {
        await setRoomHost(member.id, organizationId);
        setIsHost(true);
      } else {
        console.warn('Host already taken!');
        // Technically UI should block this, but safety check.
        setIsHost(false);
      }
    }
    setMode('select');
  };

  const { data, loading: loadingPlayers } = fetchAllPlayers(organizationId);

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
      label: 'XS',
      value: 1
    },
    {
      label: 'S',
      value: 2,
    },
    {
      label: 'M',
      value: 3,
    },
    {
      label: 'L',
      value: 4,
    },
    {
      label: 'XL',
      value: 5,
    },
    {
      label: '?',
      value: 0
    }
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
    if (organizationId) togglePokerShowCards(organizationId);
  };

  const handleEndGame = () => {
    if (organizationId) {
      removeAllPlayers(organizationId);
      // setRoomHost(null, organizationId); // Handled inside removeAllPlayers now
      setIsHost(false);
      setMode('user');
    }
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
          {!organizationId ? (
            <OrganizationView
              organizations={orgs}
              handleJoin={handleJoinOrg}
              handleCreate={handleCreateOrg}
              loading={loadingOrgs}
              themeMode={themeMode}
            />
          ) : (
            <>
              {/* Optional: Header with Org Name? */}
              {mode === 'user' && (
                <LoginView
                  organizationName={organizationName}
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
            </>
          )}
        </Container>
      </AppWrapper>
    </ThemeProvider>
  );
};
