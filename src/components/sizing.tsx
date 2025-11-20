import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  fetchAllMembers,
  createNewMember,
  addPlayerToRoom,
  fetchAllPlayers,
  getPokerShowCardsState,
  togglePokerShowCards,
  updatePlayerCardByMemberId,
  usePokerShowCardsState,
} from "../firebase/firebase.ts"
import styled from "styled-components";

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
  color: ${props => props.picked?"darkblue":"magenta"};
  background-color: ${props => props.picked?"magenta":"darkblue"};
  &:hover{
    background-color: magenta;
    color: darkblue;
  }
  margin-top: ${props => props.picked?"-0.1rem":"1rem"}
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
  const [members, setMembers] = useState<memberProps[]>([])
  const [newUser, setNewUser] = useState<string>();
  const [mode, setMode] = useState<string>('user');
  const [player, setPlayer] = useState({
    name: "",
    memberId: "",
    card: "",
  })

  const { showCards, loadingCards } = usePokerShowCardsState();

  const handleChange = (input) => {
    setNewUser(input);
  }

  const addNew = async () => {
    if (!newUser.trim()) return;
    
    console.log("Adding new member:", newUser);
    await createNewMember(newUser); 
    
    setNewUser('');

    const updatedMembers = await fetchAllMembers();
    setMembers(updatedMembers as memberProps[]);
  }

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const initMembers = await fetchAllMembers();
        setMembers(initMembers as memberProps[]);
        console.log(initMembers)
      } catch (error) {
        console.error("Failed to load members:", error);
      }
    };

    loadMembers();
  }, []);

  const handleSelect = (member) => {
    setPlayer({...player,name:member.memberName, memberId: member.id})
    console.log(member);
    addPlayerToRoom({
      id: member.id,
      player: member.memberName
    })
    setMode("select")
  }

  const {data, loading} = fetchAllPlayers();

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

  const handlePick = (pick:string) => {
    setPlayer({...player,card: pick});
    updatePlayerCardByMemberId({
      memberId: player.memberId,
      newCardValue: pick
    })
  }

  const handleReveal = () => {
    togglePokerShowCards();
  }

  return (
    <Container>
    {mode === 'user' && (
      <>
        <Players> 
          {members.map((member) => (
            <SelectPlayer
              key={member.id}
              onClick={()=>handleSelect(member)}
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
        <h1>
          {`Hello, ${player.name}`}
        </h1>
        <RevealCards
          onClick={()=>handleReveal()}
        >
          {showCards ? "reset" : "Show Cards"}
        </RevealCards>
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
        <SizeSelection>
          {
            sizes.map(size => (
              <SizeCard
                onClick={()=>handlePick(size.label)}
                picked={size.label === player.card}
              >
                {size.label}
              </SizeCard>
            ))
          }
        </SizeSelection>
      </>
    )}

    </Container>
  )
};