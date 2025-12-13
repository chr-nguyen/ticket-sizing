import React from 'react';
import { LeaderboardContainer, RankRow } from './styles';

interface memberProps {
  id: string;
  memberName: string;
  over: number;
  under: number;
  rank: number;
  theme?: 'light' | 'dark';
}

interface LeaderboardProps {
  members: memberProps[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ members }) => {
  return (
    <LeaderboardContainer>
      <h3>Top 5 Players 🏆</h3>
      {members
        .slice() // Copy array
        .sort((a, b) => b.rank - a.rank) // Sort desc
        .slice(0, 5) // Top 5
        .map((member, index) => (
          <RankRow key={member.id}>
            <span>
              #{index + 1} {member.memberName}
            </span>
            <span>{member.rank} pts</span>
          </RankRow>
        ))}
    </LeaderboardContainer>
  );
};
