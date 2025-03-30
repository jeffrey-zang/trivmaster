import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command";

export type CommandItem = {
  name: string;
  shortcut?: string;
  icon: React.ReactNode;
  action?: () => void;
};

export type CommandSection = {
  heading: string;
  items: CommandItem[];
};

export const CommandComponent = ({
  isCommandOpen,
  setIsCommandOpen,
  commandSections = []
}: {
  isCommandOpen: boolean;
  setIsCommandOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  commandSections?: CommandSection[];
}) => {
  const handleSelect = (command: CommandItem) => {
    if (command.action) {
      command.action();
    }
    setIsCommandOpen(false);
  };

  return (
    <>
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />

        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commandSections.map((section, sectionIndex) => (
            <div key={`command-section-${sectionIndex}`}>
              {sectionIndex !== 0 && <CommandSeparator />}
              <CommandGroup heading={section.heading}>
                {section.items.map((command, commandIndex) => (
                  <CommandItem
                    key={`command-${sectionIndex}-${commandIndex}`}
                    className="flex items-center"
                    onSelect={() => handleSelect(command)}
                  >
                    {command.icon}
                    {command.name}
                    {command.shortcut && (
                      <CommandShortcut>{command.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};
