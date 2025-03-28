import { Socket } from "socket.io";

export interface ISocket extends Socket {
  userName?: string;
  teamName?: string;
  roomName?: string;
}

export interface Room {
  roomName: string;
  questions: Question[];
  teams: Team[];
  chat: Message[];
  createdBy: string;
  currentQuestion?: Question;
  currentBuzzed?: string;
  currentAnswered: boolean;
  // config: RoomConfig;
}

export interface Message {
  author?: string;
  team?: string;
  text: string;
  timestamp: number;
}

export interface Team {
  teamName: string;
  members: Member[];
  points: number;
}

export interface Member {
  userName: string;
  points: number;
  buzzed: boolean;
}

export type Question = {
  question: string;
  answer: string;
  category?: string;
  value?: number;
};
