import { Socket } from "socket.io";

export interface ISocket extends Socket {
  userName?: string;
  teamName?: string;
  roomName?: string;
}

export interface Room {
  roomName: string;
  questions: Question[];
  teams: Record<string, Team>;
  chat: Message[];
  createdBy: string;
  currentQuestion?: Question;
  currentBuzzed?: string;
  currentAnswered: boolean;
  config: RoomConfig;
  state: "waiting" | "reading" | "buzzing" | "answering";
}

export interface RoomConfig {
  readingSpeed: number; // 0-2, default 1
}

export interface Message {
  author?: string;
  team?: string;
  text: string;
  timestamp: number;
  tsx?: boolean;
}

export interface Team {
  teamName: string;
  members: Member[];
  points: number;
  colour: string;
}

export interface Member {
  userName: string;
  points: number;
  buzzed: boolean;
}

export type Question = {
  q: string;
  a: string;
  type?: string;
  value?: number;
};
