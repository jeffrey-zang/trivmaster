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
      <ModeToggle className="fixed top-4 right-4" />
      <Toaster theme={theme} richColors />

      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Navigate to="/join" />} />
          <Route path="/join" element={<Join />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
