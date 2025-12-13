import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    background: string;
    text: string;
    border: string;
    cardBg: string; // Or slightly lighter
    accent: string;
    white: string;
    buttonBg: string;
    buttonText: string;
    buttonHoverBg: string;
    buttonHoverText: string;
    red: string;
  }
}
