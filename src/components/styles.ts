import styled from 'styled-components';

// --- THEMES ---
export const darkTheme = {
    background: 'darkblue',
    text: 'magenta',
    border: 'magenta',
    cardBg: 'darkblue', // Or slightly lighter
    accent: 'magenta',
    white: 'white',
    buttonBg: 'darkblue',
    buttonText: 'magenta',
    buttonHoverBg: 'magenta',
    buttonHoverText: 'darkblue',
    red: 'red',
};

export const lightTheme = {
    background: '#f0f2f5',
    text: '#6200ea', // Deep Purple
    border: '#6200ea',
    cardBg: 'white',
    accent: '#6200ea',
    white: '#333', // Text color replacement
    buttonBg: 'white',
    buttonText: '#6200ea',
    buttonHoverBg: '#6200ea',
    buttonHoverText: 'white',
    red: 'red',
};

// --- STYLED COMPONENTS ---
export const LeaderboardContainer = styled.div`
  margin-top: 3rem;
  border: 1px solid ${(props) => props.theme.border};
  padding: 1rem;
  width: 100%;
  min-width: 300px;
  background-color: ${(props) => props.theme.cardBg};
  color: ${(props) => props.theme.text};
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

export const RankRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid ${(props) => props.theme.border};
  &:last-child {
    border-bottom: none;
  }
`;

export const EditButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => props.theme.text};
  opacity: 0.7;
  cursor: pointer;
  margin-left: 1rem;
  font-size: 0.8rem;
  text-decoration: underline;
  &:hover {
    opacity: 1;
    color: ${(props) => props.theme.accent};
  }
`;

export const Container = styled.div`
  margin: 6rem auto;
  width: 80%;
  margin: 2rem auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Global body background fix or just container? 
     Ideally body should change, but let's stick to container or use a wrapper */
  /* We'll assume this container is the main app view */
`;

export const AppWrapper = styled.div`
  min-height: 100vh;
  width: 100vw;
  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.text};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; // Better font
  transition: all 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
`;

export const Players = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const SelectPlayer = styled.button`
  border: 1px solid ${(props) => props.theme.border};
  background-color: ${(props) => props.theme.buttonBg};
  padding: 1rem;
  color: ${(props) => props.theme.buttonText};
  margin: 0.5rem;
  width: 8rem; // Slightly wider
  cursor: pointer;
  border-radius: 8px; // Rounded corners
  transition: all 0.2s;
  font-weight: bold;

  &:hover {
    background-color: ${(props) => props.theme.buttonHoverBg};
    color: ${(props) => props.theme.buttonHoverText};
    transform: translateY(-2px); // Lift effect
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const InputBox = styled.div`
  margin-top: 2rem;
  color: ${(props) => props.theme.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  input {
    border: 1px solid ${(props) => props.theme.border};
    color: ${(props) => props.theme.text};
    background-color: ${(props) => props.theme.cardBg};
    padding: 1rem;
    border-radius: 8px;
  }
  button {
    margin-top: 1rem;
    border: 1px solid ${(props) => props.theme.border};
    background-color: ${(props) => props.theme.buttonBg};
    padding: 1rem;
    color: ${(props) => props.theme.buttonText};
    cursor: pointer;
    border-radius: 8px;
    font-weight: bold;
    &:hover {
      background-color: ${(props) => props.theme.buttonHoverBg};
      color: ${(props) => props.theme.buttonHoverText};
    }
  }
`;

export const CardsTable = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 2rem;
`;

export const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${(props) => props.theme.text};
`;

export const Card = styled.div<{ $picked: string }>`
  height: 6rem;
  width: 4rem;
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 1rem;
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  background-color: ${(props) =>
        props.$picked ? props.theme.accent : props.theme.cardBg};
  color: ${(props) =>
        props.$picked ? props.theme.buttonHoverText : props.theme.text};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
`;

export const SizeSelection = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 3rem;
`;

export const SizeCard = styled.button<{ $picked: boolean }>`
  height: 4rem;
  width: 3rem;
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 0.5rem;
  transition: 0.25s;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;

  color: ${(props) =>
        props.$picked ? props.theme.buttonHoverText : props.theme.text};
  background-color: ${(props) =>
        props.$picked ? props.theme.accent : props.theme.buttonBg};

  &:hover {
    background-color: ${(props) => props.theme.accent};
    color: ${(props) => props.theme.buttonHoverText};
    transform: scale(1.1);
  }
  margin-top: ${(props) => (props.$picked ? '-0.5rem' : '0')}; // smoother lift
`;

export const RevealCards = styled.button`
  margin-bottom: 1rem;
  border: 1px solid ${(props) => props.theme.border};
  background-color: ${(props) => props.theme.buttonBg};
  padding: 1rem;
  color: ${(props) => props.theme.buttonText};
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  &:hover {
    background-color: ${(props) => props.theme.buttonHoverBg};
    color: ${(props) => props.theme.buttonHoverText};
  }
`;

export const EndGameBtn = styled.button`
  margin-bottom: 1rem;
  border: 1px solid ${(props) => props.theme.red};
  background-color: ${(props) => props.theme.buttonBg};
  padding: 1rem;
  color: ${(props) => props.theme.red};
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  &:hover {
    background-color: ${(props) => props.theme.red};
    color: ${(props) => props.theme.buttonHoverText};
  }
`;

export const ThemeToggleBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: 1px solid ${(props) => props.theme.border};
  color: ${(props) => props.theme.text};
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) => props.theme.buttonHoverBg};
    color: ${(props) => props.theme.buttonHoverText};
  }
`;

export const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 2rem;
  right: 2rem;
`;
