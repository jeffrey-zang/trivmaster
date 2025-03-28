import { Socket } from "socket.io";

export interface ISocket extends Socket {
  userName?: string;
  roomName?: string;
  currentTeam?: 1 | 2;
}

export interface Room {
  roomName: string;
  questions: Question[];
  teams: Team[];
  chat: string[];
  createdBy: string;
  currentQuestion?: Question;
  currentBuzzed?: string;
  currentAnswered: boolean;
  // config: RoomConfig;
}

export interface Team {
  teamName: string;
  members: Member[];
  points: number;
}

export interface Member {
  userName?: string;
  points: number;
  buzzed: boolean;
}

export type Question = {
  question: string;
  answer: string;
  points: number;
};
