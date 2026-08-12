import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

const PagesRouter = ({ activeTab, onTabChange, onUploadPending }) => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage activeTab={activeTab} onTabChange={onTabChange} onUploadPending={onUploadPending} />} />
      </Routes>
    </Router>
  );
};

export default PagesRouter;
