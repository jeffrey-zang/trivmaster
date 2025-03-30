import { useState, KeyboardEvent } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Input
} from "@/components/ui";
import { Team, Member } from "@/backend/types";
import { getColorWithOpacity } from "@/lib/utils";

type DialogType = "addTeam" | "joinTeam" | null;

interface TeamProps {
  teams: Record<string, Team>;
  roomName: string | undefined;
  userName: string | undefined;
  socket: Socket;
  currentBuzzed: string | null;
  currentTeam: string | undefined;
}

const TeamComponent = ({
  teams,
  roomName,
  userName,
  socket,
  currentBuzzed,
  currentTeam
}: TeamProps) => {
  const [teamName, setTeamName] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const handleAddTeam = () => {
    if (teamName === "") {
      toast.error("Team name cannot be empty");
      return;
    } else if (teamName in teams) {
      toast.error("Team name already exists");
      return;
    }
    socket.emit("team:add", {
      roomName,
      teamName: teamName,
      userName
    });
    setTeamName("");
    setActiveDialog(null);
  };

  const handleJoinTeam = () => {
    socket.emit("team:join", {
      roomName,
      teamName: selectedTeam,
      userName
    });
    toast.success(`You have joined ${selectedTeam}`);
    setSelectedTeam("");
    setActiveDialog(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddTeam();
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleAddTeam();
    }
  };

  const renderDialogContent = () => {
    switch (activeDialog) {
      case "addTeam":
        return (
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>Add new team</DialogTitle>
              <DialogDescription>
                Create a new team in this room
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teamName" className="text-right">
                  Name
                </Label>
                <Input
                  id="teamName"
                  placeholder="Enter team name"
                  className="col-span-3"
                  value={teamName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTeamName(e.target.value)
                  }
                  onKeyDown={handleInputKeyDown}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Team</Button>
            </DialogFooter>
          </form>
        );
      case "joinTeam":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Join {selectedTeam}</DialogTitle>
              <DialogDescription>
                Are you sure you want to join {selectedTeam}? Your points will
                be reset.{" "}
                {selectedTeam === "Lobby" &&
                  "You also won't be able to buzz anymore."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setActiveDialog(null)}>
                No
              </Button>
              <Button
                type="submit"
                onClick={handleJoinTeam}
                disabled={!selectedTeam}
              >
                Yes
              </Button>
            </DialogFooter>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-8">
      <h2 className="font-semibold mt-4">Teams</h2>
      {Object.entries(teams).map(([teamName, team]: [string, Team]) => (
        <div
          key={`team-${teamName}`}
          className={`mt-2 border border-gray-200 dark:border-gray-700 p-2 rounded-lg hover:opacity-80 transition-opacity duration-150`}
          style={{
            backgroundColor: getColorWithOpacity(team.colour)
          }}
          onClick={() => {
            if (team.teamName === currentTeam) {
              return;
            }
            setActiveDialog("joinTeam");
            setSelectedTeam(team.teamName);
          }}
        >
          <h3 className="font-semibold text-sm mb-1 flex items-center justify-between">
            <span>{team.teamName}</span>
            {team.teamName !== "Lobby" && <span>{team.points}</span>}
          </h3>
          <div className="flex flex-col gap-0.5">
            {team.members.length === 0 && (
              <div className="text-xs text-muted-foreground">No one</div>
            )}
            {team.members.map((member: Member, j: number) => (
              <div
                key={`member-${j}`}
                className={`flex items-center justify-between text-sm ${
                  member.buzzed ? "bg-yellow-400" : ""
                } ${
                  currentBuzzed === member.userName
                    ? "animate-pulse bg-red-500"
                    : ""
                }`}
              >
                <span className="flex items-center text-xs">
                  {member.userName}
                  {member.userName === userName && (
                    <span className="text-xs inline-flex h-5 select-none items-center gap-2 rounded border bg-muted p-0.5 leading-none ml-1 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      you
                    </span>
                  )}
                  {(member.buzzed || currentBuzzed === member.userName) && (
                    <Zap className="ml-2 h-4 w-4" />
                  )}
                </span>
                <span>{member.points}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Button variant="secondary" onClick={() => setActiveDialog("addTeam")}>
          Add Team
        </Button>
      </div>

      <Dialog
        open={activeDialog !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setActiveDialog(null);
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.stopPropagation();
            }
          }}
        >
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamComponent;
