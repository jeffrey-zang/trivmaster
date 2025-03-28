import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Join from "./pages/Join";
// import Room from "./pages/Room";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/join" />} />
        <Route path="/join" element={<Join />} />
        {/* <Route path="/room/:roomId" element={<Room />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
