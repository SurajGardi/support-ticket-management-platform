import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import TicketList from "./pages/TicketList";
import TicketDetail from "./pages/TicketDetail";
import CreateTicket from "./pages/CreateTicket";
import UserList from "./pages/UserList";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute><Navigate to="/tickets" replace /></ProtectedRoute>
          } />
          <Route path="/tickets" element={
            <ProtectedRoute><Layout><TicketList /></Layout></ProtectedRoute>
          } />
          <Route path="/tickets/create" element={
            <ProtectedRoute><Layout><CreateTicket /></Layout></ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute><Layout><TicketDetail /></Layout></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={["admin"]}><Layout><UserList /></Layout></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}