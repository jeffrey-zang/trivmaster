import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Join from "./pages/Join";
import Room from "./pages/Room/index";
import { ModeToggle } from "./components/theme/toggle";
import { ThemeProvider } from "./components/theme/provider";
import ToasterComponent from "./components/toaster";

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ModeToggle className="fixed bottom-4 right-4 z-10" />
      <ToasterComponent />

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
