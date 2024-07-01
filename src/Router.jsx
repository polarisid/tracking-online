import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BetaPage from "./pages/BetaPage";

const PagesRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage></HomePage>} />
        <Route path="/beta" element={<BetaPage />} />
      </Routes>
    </Router>
  );
};

export default PagesRouter;
