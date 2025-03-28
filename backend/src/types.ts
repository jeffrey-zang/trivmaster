import { Socket } from "socket.io";

export interface ISocket extends Socket {
  username?: string;
  roomName: string;
  currentTeam?: 1 | 2;
}

export interface Room {
  name: string;
  questions: Question[];
  teams: Team[];
  currentQuestion?: Question;
  currentBuzzed?: string;
  currentAnswered: boolean;
  // config: RoomConfig;
}

export interface Team {
  name: string;
  members: Member[];
  points: number;
}

export interface Member {
  username?: string;
  points: number;
  buzzed: boolean;
}

export type Question = {
  question: string;
  answer: string;
  points: number;
};
