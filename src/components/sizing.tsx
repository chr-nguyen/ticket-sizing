import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  //   fetchAllMembers, // REMOVED
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
} from "../firebase/firebase.ts"
import styled, { ThemeProvider } from "styled-components";

// --- THEMES ---
const darkTheme = {
  background: 'darkblue',
  text: 'magenta',
  border: 'magenta',
  cardBg: 'darkblue', // Or slightly lighter
  accent: 'magenta',
  white: 'white',
  buttonBg: 'darkblue',
  buttonText: 'magenta',
  buttonHoverBg: 'magenta',
  buttonHoverText: 'darkblue'
};

const lightTheme = {
  background: '#f0f2f5',
  text: '#6200ea', // Deep Purple
  border: '#6200ea',
  cardBg: 'white',
  accent: '#6200ea',
  white: '#333', // Text color replacement
  buttonBg: 'white',
  buttonText: '#6200ea',
  buttonHoverBg: '#6200ea',
  buttonHoverText: 'white'
};

// --- STYLED COMPONENTS (Refactored) ---
const LeaderboardContainer = styled.div`
  margin-top: 3rem;
  border: 1px solid ${props => props.theme.border};
  padding: 1rem;
  width: 100%;
  min-width: 300px;
  background-color: ${props => props.theme.cardBg};
  color: ${props => props.theme.text};
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
`;

const RankRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid ${props => props.theme.border};
  &:last-child {
    border-bottom: none;
  }
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  opacity: 0.7;
  cursor: pointer;
  margin-left: 1rem;
  font-size: 0.8rem; 
  text-decoration: underline;
  &:hover {
    opacity: 1;
    color: ${props => props.theme.accent};
  }
`;

interface memberProps {
  id: string,
  memberName: string,
  over: number,
  under: number,
  rank: number,
  theme?: 'light' | 'dark'
}

const Container = styled.div`
  margin: 6rem auto;
  width: 10rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Global body background fix or just container? 
     Ideally body should change, but let's stick to container or use a wrapper */
  /* We'll assume this container is the main app view */
`;

const AppWrapper = styled.div`
  min-height: 100vh;
  width: 100vw;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; // Better font
  transition: all 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
`;

const Players = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SelectPlayer = styled.button`
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.buttonBg};
  padding: 1rem;
  color: ${props => props.theme.buttonText};
  margin: 0.5rem;
  width: 8rem; // Slightly wider
  cursor: pointer;
  border-radius: 8px; // Rounded corners
  transition: all 0.2s;
  font-weight: bold;
  
  &:hover {
    background-color: ${props => props.theme.buttonHoverBg};
    color: ${props => props.theme.buttonHoverText};
    transform: translateY(-2px); // Lift effect
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
`;

const InputBox = styled.div`
  margin-top: 2rem;
  color: ${props => props.theme.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  input {
    border: 1px solid ${props => props.theme.border};
    color: ${props => props.theme.text};
    background-color: ${props => props.theme.cardBg};
    padding: 1rem;
    border-radius: 8px;
  }
  button {
    margin-top: 1rem;
    border: 1px solid ${props => props.theme.border};
    background-color: ${props => props.theme.buttonBg};
    padding: 1rem;
    color: ${props => props.theme.buttonText};
    cursor: pointer;
    border-radius: 8px;
    font-weight: bold;
    &:hover {
      background-color: ${props => props.theme.buttonHoverBg};
      color: ${props => props.theme.buttonHoverText};
    }
  }
`;

const CardsTable = styled.div`
  display:flex;
  justify-content: center; // Center cards
  gap: 2rem; // Space between
  flex-wrap: wrap; 
  margin-top: 2rem;
`;

const CardWrapper = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
  color: ${props => props.theme.text};
`;

const Card = styled.div`
  height: 6rem;
  width: 4rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 1rem;
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  background-color: ${props => props.picked ? props.theme.accent : props.theme.cardBg};
  color: ${props => props.picked ? props.theme.buttonHoverText : props.theme.text};
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s;
`;

const SizeSelection = styled.div`
  display:flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 3rem;
`;

const SizeCard = styled.button`
  height: 4rem;
  width: 3rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 0.5rem;
  transition: 0.25s;
  cursor: pointer;
  display:flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  
  color: ${props => props.picked ? props.theme.buttonHoverText : props.theme.text};
  background-color: ${props => props.picked ? props.theme.accent : props.theme.buttonBg};
  
  &:hover{
    background-color: ${props => props.theme.accent};
    color: ${props => props.theme.buttonHoverText};
    transform: scale(1.1);
  }
  margin-top: ${props => props.picked ? "-0.5rem" : "0"}; // smoother lift
`;

const RevealCards = styled.button`
  margin-bottom: 1rem;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.buttonBg};
  padding: 1rem;
  color: ${props => props.theme.buttonText};
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  &:hover {
    background-color: ${props => props.theme.buttonHoverBg};
    color: ${props => props.theme.buttonHoverText};
  }
`;

const ThemeToggleBtn = styled.button`
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: 1px solid ${props => props.theme.border};
    color: ${props => props.theme.text};
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    &:hover {
        background-color: ${props => props.theme.buttonHoverBg};
        color: ${props => props.theme.buttonHoverText};
    }
`;

export const Sizing = () => {
  // const [members, setMembers] = useState<memberProps[]>([]) // REMOVED - Using Hook
  const { members: allMembers, loading: loadingMembers } = useAllMembers();
  const members = allMembers as memberProps[];

  const [newUser, setNewUser] = useState<string>();
  const [mode, setMode] = useState<string>('user');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [joinAsHost, setJoinAsHost] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editNameValue, setEditNameValue] = useState<string>("");
  const [player, setPlayer] = useState({
    name: "",
    memberId: "",
    card: "",
  })

  // Destructure hostId from hook
  const { showCards, hostId, loadingCards } = usePokerShowCardsState();

  const handleChange = (input) => {
    setNewUser(input);
  }

  const addNew = async () => {
    if (!newUser || !newUser.trim()) return;

    console.log("Adding new member:", newUser);
    await createNewMember(newUser);

    setNewUser('');
    // No need to manually fetch, hook updates automatically
  }

  // REMOVED useEffect for loading members manually


  const handleSelect = async (member) => {
    setPlayer({ ...player, name: member.memberName, memberId: member.id })
    console.log(member);
    await addPlayerToRoom({
      id: member.id,
      player: member.memberName
    })

    if (joinAsHost) {
      // Try to claim host
      if (!hostId) {
        await setRoomHost(member.id);
        setIsHost(true);
      } else {
        console.warn("Host already taken!");
        // Technically UI should block this, but safety check.
        setIsHost(false);
      }
    }
    setMode("select")
  }

  const { data, loading } = fetchAllPlayers();

  console.log("players", data, showCards)

  const sizes = [
    {
      label: "S",
      value: 1
    },
    {
      label: "M",
      value: 2
    },
    {
      label: "L",
      value: 3
    },
    {
      label: "XL",
      value: 4
    },
  ]

  const handlePick = (pick: string) => {
    setPlayer({ ...player, card: pick });
    updatePlayerCardByMemberId({
      memberId: player.memberId,
      newCardValue: pick
    })
  }

  const handleReveal = () => {
    togglePokerShowCards();
  }

  const handleHostJoin = () => {
    setPlayer({ name: "Host", memberId: "host", card: "" });
    setMode("host");
  }

  const handleEndGame = () => {
    removeAllPlayers();
  }

  const startEditingName = () => {
    setEditNameValue(player.name);
    setIsEditingName(true);
  }

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditNameValue("");
  }

  const saveName = async () => {
    if (!editNameValue.trim()) return;

    try {
      await updateMemberName(player.memberId, editNameValue);
      await updatePlayerNameByMemberId(player.memberId, editNameValue);
      setPlayer({ ...player, name: editNameValue });
      setIsEditingName(false);
    } catch (e) {
      console.error("Failed to update name", e);
    }
  }

  // --- THEME LOGIC ---
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    // Persist if logged in
    if (player.memberId) {
      await updateMemberTheme(player.memberId, newTheme);
    }
  }

  // Load user theme preference when they select their user
  useEffect(() => {
    if (player.memberId) {
      const member = members.find(m => m.id === player.memberId);
      if (member && member.theme) {
        setThemeMode(member.theme);
      }
    }
  }, [player.memberId, members]);

  return (
    <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
      <AppWrapper>
        <ThemeToggleBtn onClick={toggleTheme}>
          {themeMode === 'light' ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </ThemeToggleBtn>
        <Container>
          {mode === 'user' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ opacity: hostId ? 0.5 : 1, color: themeMode === 'light' ? '#333' : 'magenta' }}>
                  <input
                    type="checkbox"
                    checked={joinAsHost}
                    disabled={!!hostId}
                    onChange={(e) => setJoinAsHost(e.target.checked)}
                  />
                  {hostId ? " Host Already Active" : " Join as Host?"}
                </label>
              </div>
              <Players>
                {members.map((member) => (
                  <SelectPlayer
                    key={member.id}
                    onClick={() => handleSelect(member)}
                  >
                    {member.memberName}
                  </SelectPlayer>
                ))}
              </Players>
              <InputBox>
                <input
                  type="text"
                  placeholder="Type here..."
                  value={newUser}
                  onChange={(event) => setNewUser(event.target.value)}
                />
                <button
                  onClick={addNew}
                >
                  add new member
                </button>
              </InputBox>
            </>
          )}
          {mode === 'select' && (
            <>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                  <input
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                  />
                  <button onClick={saveName} style={{ marginRight: '0.5rem' }}>Save</button>
                  <button onClick={cancelEditingName}>Cancel</button>
                </div>
              ) : (
                <h1>
                  {`Hello, ${player.name}`}
                  <EditButton onClick={startEditingName}>Edit Name</EditButton>
                </h1>
              )}
              {isHost && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <RevealCards onClick={() => handleReveal()} style={{ marginBottom: 0 }}>
                    {showCards ? "reset" : "Show Cards"}
                  </RevealCards>
                  <RevealCards onClick={() => handleEndGame()} style={{ borderColor: 'red', color: 'red', marginBottom: 0 }}>
                    End Game
                  </RevealCards>
                </div>
              )}
              <CardsTable>
                {
                  data.map(player => (
                    <CardWrapper
                      key={player.id}
                    >
                      {player.playerName}
                      <Card
                        picked={player.card}
                      >
                        {showCards ? player.card : "?"}
                      </Card>
                    </CardWrapper>
                  ))
                }
              </CardsTable>
              {/* Always show SizeSelection in 'select' mode now */}
              <SizeSelection>
                {
                  sizes.map(size => (
                    <SizeCard
                      onClick={() => handlePick(size.label)}
                      picked={size.label === player.card}
                    >
                      {size.label}
                    </SizeCard>
                  ))
                }
              </SizeSelection>
              <LeaderboardContainer>
                <h3>Top 5 Players 🏆</h3>
                {members
                  .slice() // Copy array
                  .sort((a, b) => b.rank - a.rank) // Sort desc
                  .slice(0, 5) // Top 5
                  .map((member, index) => (
                    <RankRow key={member.id}>
                      <span>#{index + 1} {member.memberName}</span>
                      <span>{member.rank} pts</span>
                    </RankRow>
                  ))
                }
              </LeaderboardContainer>

            </>
          )}

        </Container>
      </AppWrapper>
    </ThemeProvider>
  )
};