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
  updatePlayerNameByMemberId,
  useAllMembers,
  setRoomHost,
} from "../firebase/firebase.ts"
import styled from "styled-components";

// --- STYLES ---
const LeaderboardContainer = styled.div`
  margin-top: 3rem;
  border: 1px solid magenta;
  padding: 1rem;
  width: 100%;
  max-width: 400px;
  background-color: darkblue;
  color: magenta;
`;

const RankRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid magenta;
  &:last-child {
    border-bottom: none;
  }
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  color: magenta;
  cursor: pointer;
  margin-left: 1rem;
  font-size: 1rem; 
  text-decoration: underline;
  &:hover {
    color: white;
  }
`;

interface memberProps {
  id: string,
  memberName: string,
  over: number,
  under: number,
  rank: number
}

const Container = styled.div`
  margin: 6rem auto;
  width: 10rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Players = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SelectPlayer = styled.button`
  border: 1px solid magenta;
  background-color: darkblue;
  padding: 1rem;
  color: magenta;
  margin: 0.5rem;
  width: 6rem;
  cursor: pointer;
  &: hover {
    background-color: magenta;
    color: darkblue;
  }
`;

const InputBox = styled.div`
  margin-top: 2rem;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  input {
    border: 1px solid magenta;
    color: white;
    background-color: darkblue;
    padding: 1rem;
  }
  button {
    margin-top: 1rem;
    border: 1px solid magenta;
    background-color: darkblue;
    padding: 1rem;
    color: magenta;
    cursor: pointer;
    &: hover {
      background-color: magenta;
      color: darkblue;
    }
  }
`;

const CardsTable = styled.div`
  display:flex;
  justify-content: space-between;
`;

const CardWrapper = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
  color: magenta;
`;

const Card = styled.div`
  height: 6rem;
  width: 4rem;
  border: 1px solid magenta;
  border-radius: 1rem;
  margin: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  background-color: ${props => props.picked ? "magenta" : "darkblue"};
  color: ${props => props.picked ? "darkblue" : "magenta"};
`;

const SizeSelection = styled.div`
  display:flex;
  justify-content: space-between;
  margin-top: 3rem;
`;

const SizeCard = styled.button`
  height: 4rem;
  width: 3rem;
  border: 1px solid magenta;
  border-radius: 0.5rem;
  margin: 1rem;
  transition: 0.25s;
  cursor: pointer;
  display:flex;
  justify-content: center;
  align-items: center;
  color: ${props => props.picked ? "darkblue" : "magenta"};
  background-color: ${props => props.picked ? "magenta" : "darkblue"};
  &:hover{
    background-color: magenta;
    color: darkblue;
  }
  margin-top: ${props => props.picked ? "-0.1rem" : "1rem"}
`;

const RevealCards = styled.button`
  margin-bottom: 1rem;
  border: 1px solid magenta;
  background-color: darkblue;
  padding: 1rem;
  color: magenta;
  cursor: pointer;
  &: hover {
    background-color: magenta;
    color: darkblue;
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

  return (
    <Container>
      {mode === 'user' && (
        <>
          <div style={{ color: 'magenta', marginBottom: '1rem' }}>
            <label style={{ opacity: hostId ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={joinAsHost}
                disabled={!!hostId} // Disable if hostId is truthy
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
  )
};