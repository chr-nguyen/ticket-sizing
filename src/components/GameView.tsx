import React from 'react';
import {
    EditButton,
    RevealCards,
    CardsTable,
    CardWrapper,
    Card,
    SizeSelection,
    SizeCard,
    EndGameBtn,
    InputBox,
    ProfileContainer,
} from './styles';

interface memberProps {
    id: string;
    memberName: string;
    over: number;
    under: number;
    rank: number;
    theme?: 'light' | 'dark';
}

interface Player {
    name: string;
    memberId: string;
    card: string;
}

interface GameViewProps {
    player: Player;
    isEditingName: boolean;
    editNameValue: string;
    setEditNameValue: (value: string) => void;
    saveName: () => void;
    cancelEditingName: () => void;
    startEditingName: () => void;
    isHost: boolean;
    showCards: boolean;
    handleReveal: () => void;
    handleEndGame: () => void;
    data: any[]; // Ideally type this appropriately if type definition is available
    sizes: { label: string; value: number }[];
    handlePick: (label: string) => void;
    members: memberProps[];
}

export const GameView: React.FC<GameViewProps> = ({
    player,
    isEditingName,
    editNameValue,
    setEditNameValue,
    saveName,
    cancelEditingName,
    startEditingName,
    isHost,
    showCards,
    handleReveal,
    handleEndGame,
    data,
    sizes,
    handlePick,
    members,
}) => {
    return (
        <>
            <ProfileContainer>
                {isEditingName ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '2rem',
                        }}
                    >
                        <InputBox>
                            <input
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                            />
                            <button onClick={saveName} style={{ marginRight: '0.5rem' }}>
                                Save
                            </button>
                            <button onClick={cancelEditingName}>Cancel</button>
                        </InputBox>
                    </div>
                ) : (
                    <>
                        <h1>
                            {`${player.name}`}
                        </h1>
                        <EditButton onClick={startEditingName}>Edit Name</EditButton>
                    </>
                )}
            </ProfileContainer>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <RevealCards onClick={() => handleReveal()} style={{ marginBottom: 0 }}>
                    {showCards ? 'reset' : 'Show Cards'}
                </RevealCards>
                {isHost && (
                    <EndGameBtn onClick={() => handleEndGame()}>End Game</EndGameBtn>
                )}
            </div>
            <CardsTable>
                {data.map((p) => (
                    <CardWrapper key={p.id}>
                        {p.playerName}
                        <Card $picked={p.card}>{showCards ? p.card : '?'}</Card>
                    </CardWrapper>
                ))}
            </CardsTable>
            {/* Always show SizeSelection in 'select' mode now */}
            <SizeSelection>
                {sizes.map((size) => (
                    <SizeCard
                        key={size.label}
                        onClick={() => handlePick(size.label)}
                        $picked={size.label === player.card}
                    >
                        {size.label}
                    </SizeCard>
                ))}
            </SizeSelection>
            {/* <Leaderboard members={members} /> */}
        </>
    );
};
