import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  fetchAllMembers,
  createNewMember
} from "../firebase/firebase.ts"

interface memberProps {
  id: string,
  memberName: string,
  over: number,
  under: number,
  rank: number
}

export const Sizing = () => {
  const [members, setMembers] = useState<memberProps[]>([])
  const [newUser, setNewUser] = useState<string>();

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
      } catch (error) {
        console.error("Failed to load members:", error);
      }
    };

    loadMembers();
  }, []);

  return (
    <>
      <ul> 
        {members.map((member) => (
          <li key={member.id}> 
            {member.memberName}
          </li>
        ))}
      </ul>
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
    </>
  )
};