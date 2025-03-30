import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ModeToggle, ThemeProvider } from "@/contexts/theme";
import { CommandProvider } from "@/contexts/command/provider";
import { ShortcutProvider } from "@/contexts/shortcut/provider";
import ToasterComponent from "@/components/toaster";

import Join from "@/pages/Join";
import Room from "@/pages/Room/index";

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <CommandProvider>
        <ShortcutProvider options={{ excludeWhenInputFocused: true }}>
          <ModeToggle className="fixed bottom-4 right-4 z-10" />
          <ToasterComponent />

          <BrowserRouter>
            <Routes>
              <Route path="*" element={<Navigate to="/join" />} />
              <Route path="/join" element={<Join />} />
              <Route path="/room/:roomName" element={<Room />} />
            </Routes>
          </BrowserRouter>
        </ShortcutProvider>
      </CommandProvider>
    </ThemeProvider>
  );
};

export default App;
