import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BetaPage from "./pages/BetaPage";

const PagesRouter = ({ activeTab, onTabChange }) => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage activeTab={activeTab} onTabChange={onTabChange} />} />
        <Route path="/beta" element={<BetaPage />} />
      </Routes>
    </Router>
  );
};

export default PagesRouter;
