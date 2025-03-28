import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Join from "./pages/Join";
import Room from "./pages/Room";
import { ThemeProvider, useTheme } from "./components/theme/provider";
import { Toaster } from "sonner";
import { ModeToggle } from "./components/theme/toggle";

const App = () => {
  const { theme } = useTheme();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ModeToggle className="fixed bottom-4 left-4 z-10" />
      <Toaster theme={theme} richColors />

      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Navigate to="/join" />} />
          <Route path="/join" element={<Join />} />
          <Route path="/room/:roomName" element={<Room />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
