import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import UsersPage from "./app/UsersPage";
import CandidateTestPage from "./pages/CandidateTestPage";
import AdminLogViewer from "./pages/AdminLogViewer";
import SecureTestDemo from "./pages/SecureTestDemo";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />

      {/* Navigation */}
      <nav className="app-nav">
        <Link to="/" className="nav-link">CRUD App</Link>
        <Link to="/test" className="nav-link">Candidate Test</Link>
        <Link to="/admin/logs?admin=1" className="nav-link">Admin Logs</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<UsersPage />} />
        <Route path="/test" element={<CandidateTestPage />} />
        <Route path="/admin/logs" element={<AdminLogViewer />} />
        <Route path="/demo" element={<SecureTestDemo />} />
        {/* Legacy route for backward compatibility */}
        <Route path="/secure-test" element={<SecureTestDemo />} />
      </Routes>
    </BrowserRouter>
  );
}
