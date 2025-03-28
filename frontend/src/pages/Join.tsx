import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Join = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!roomName) {
      toast.error("Room name is required");
      return;
    }
    navigate(`/room/${roomName}`);
  };

  return (
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
  );
};

export default Join;
