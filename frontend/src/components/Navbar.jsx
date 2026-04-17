import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
      : "text-blue-100 hover:bg-blue-700 hover:text-white px-3 py-2 rounded text-sm font-medium transition";

  return (
    <nav className="bg-blue-900 shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg mr-4">🎫 Helpdesk</span>
          <Link to="/tickets" className={isActive("/tickets")}>My Tickets</Link>
          {user?.role === "admin" && (
            <Link to="/users" className={isActive("/users")}>Users</Link>
          )}
          <Link to="/analytics" className={isActive("/analytics")}>Analytics</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2 text-white hover:bg-blue-700 px-3 py-2 rounded transition">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}