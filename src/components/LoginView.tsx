import React from 'react';
import { Players, SelectPlayer, InputBox } from './styles';
import { Leaderboard } from './Leaderboard';

interface memberProps {
    id: string;
    memberName: string;
    over: number;
    under: number;
    rank: number;
    theme?: 'light' | 'dark';
}

interface LoginViewProps {
    organizationName: string;
    members: memberProps[];
    joinAsHost: boolean;
    setJoinAsHost: (value: boolean) => void;
    hostId: string | null;
    handleSelect: (member: memberProps) => void;
    newUser: string | undefined;
    setNewUser: (value: string) => void;
    addNew: () => void;
    themeMode: 'light' | 'dark';
}

export const LoginView: React.FC<LoginViewProps> = ({
    organizationName,
    members,
    joinAsHost,
    setJoinAsHost,
    hostId,
    handleSelect,
    newUser,
    setNewUser,
    addNew,
    themeMode,
}) => {
    return (
        <>
            <h1>{organizationName}</h1>
            <div style={{ marginBottom: '1rem' }}>
                <label
                    style={{
                        opacity: hostId ? 0.5 : 1,
                        color: themeMode === 'light' ? '#333' : 'magenta',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={joinAsHost}
                        disabled={!!hostId}
                        onChange={(e) => setJoinAsHost(e.target.checked)}
                    />
                    {hostId
                        ? ` ${members.find(m => m.id === hostId)?.memberName || 'Unknown'} is already hosting`
                        : ' Join as Host?'}
                </label>
            </div>
            <Players>
                {members.map((member) => (
                    <SelectPlayer key={member.id} onClick={() => handleSelect(member)}>
                        {member.memberName}
                    </SelectPlayer>
                ))}
            </Players>
            <InputBox>
                <input
                    type="text"
                    placeholder="Type here..."
                    value={newUser || ''}
                    onChange={(event) => setNewUser(event.target.value)}
                />
                <button
                    onClick={addNew}
                    style={{
                        width: '8rem',
                        height: '4rem',
                    }}
                >add new member</button>
            </InputBox>
            <Leaderboard members={members} />
        </>
    );
};
