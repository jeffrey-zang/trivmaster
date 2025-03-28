import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import socket from "../lib/socket";
import { ThemeProvider } from "../components/theme/provider";
import { ModeToggle } from "../components/theme/toggle";
import { Toaster, toast } from "sonner";
import { useTheme } from "../components/theme/provider";

import { useState } from "react";

const Join = () => {
  const [roomName, setRoomName] = useState("");
  const { theme } = useTheme();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!roomName) {
      toast.error("Room name is required");
      return;
    }

    socket.emit("join-room", { roomName });
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ModeToggle className="fixed top-4 right-4" />
      <Toaster theme={theme} richColors />
      <div className="grid place-items-center h-screen">
        <Card className="min-w-96">
          <CardHeader>
            <CardTitle className="text-2xl">Trivmaster</CardTitle>
            <CardDescription>TRIVIA</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-2 items-center"
              onSubmit={handleSubmit}
            >
              <Input
                type="text"
                placeholder="Room name"
                className="p-2 rounded-md bg-slate-100"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default Join;
