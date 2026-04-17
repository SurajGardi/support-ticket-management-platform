import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTickets } from "../api/ticketApi";
import { getUsers } from "../api/userApi";
import { getMe } from "../api/authApi";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/dateUtils";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [fullUser, setFullUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0,
  });
  const [userSummary, setUserSummary] = useState({
    viewers: { active: 0, inactive: 0 },
    agents: { active: 0, inactive: 0 },
    admins: { active: 0, inactive: 0 },
    total: 0,
  });

  useEffect(() => {
    // Fetch fresh user data to fix the refresh issue
    getMe().then((res) => {
      setFullUser(res.data);
      setUser(res.data);
    });

    getTickets({ page_size: 100 }).then((res) => {
      const tickets = res.data;
      setStats({
        total: tickets.length,
        open: tickets.filter((t) => t.status === "open").length,
        in_progress: tickets.filter((t) => t.status === "in_progress").length,
        resolved: tickets.filter((t) => t.status === "resolved").length,
        closed: tickets.filter((t) => t.status === "closed").length,
      });
    });

    // Admin: fetch user summary
    if (user?.role === "admin") {
      getUsers().then((res) => {
        const users = res.data;
        setUserSummary({
          viewers: {
            active: users.filter((u) => u.role === "viewer" && u.is_active).length,
            inactive: users.filter((u) => u.role === "viewer" && !u.is_active).length,
          },
          agents: {
            active: users.filter((u) => u.role === "agent" && u.is_active).length,
            inactive: users.filter((u) => u.role === "agent" && !u.is_active).length,
          },
          admins: {
            active: users.filter((u) => u.role === "admin" && u.is_active).length,
            inactive: users.filter((u) => u.role === "admin" && !u.is_active).length,
          },
          total: users.length,
        });
      });
    }
  }, []);

  const displayUser = fullUser || user;

  const roleColor = {
    admin: "bg-purple-100 text-purple-700",
    agent: "bg-blue-100 text-blue-700",
    viewer: "bg-gray-100 text-gray-600",
  };

  const roleLabel = {
    admin: "Admin",
    agent: "Agent",
    viewer: "Employee",
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👤 My Profile</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Profile Info */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 font-semibold flex items-center gap-2">
              👤 Profile Information
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={displayUser?.name || ""}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  value={displayUser?.email || ""}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email address cannot be changed. Contact admin if you need to update it.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={displayUser?.email || ""}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value="Not Assigned"
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Admin User Summary */}
          {displayUser?.role === "admin" && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-blue-900 text-white px-5 py-3 font-semibold flex items-center gap-2">
                👥 User Summary
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  {/* Viewers */}
                  <div className="border rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-700 mb-1">
                      {userSummary.viewers.active + userSummary.viewers.inactive}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      Viewers
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between px-2">
                        <span className="text-green-600 font-medium">● Active</span>
                        <span className="font-bold">{userSummary.viewers.active}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-red-500 font-medium">● Inactive</span>
                        <span className="font-bold">{userSummary.viewers.inactive}</span>
                      </div>
                    </div>
                  </div>

                  {/* Agents */}
                  <div className="border rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {userSummary.agents.active + userSummary.agents.inactive}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      Agents
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between px-2">
                        <span className="text-green-600 font-medium">● Active</span>
                        <span className="font-bold">{userSummary.agents.active}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-red-500 font-medium">● Inactive</span>
                        <span className="font-bold">{userSummary.agents.inactive}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admins */}
                  <div className="border rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {userSummary.admins.active + userSummary.admins.inactive}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      Admins
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between px-2">
                        <span className="text-green-600 font-medium">● Active</span>
                        <span className="font-bold">{userSummary.admins.active}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-red-500 font-medium">● Inactive</span>
                        <span className="font-bold">{userSummary.admins.inactive}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">
                    Total Users in System
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {userSummary.total}
                  </span>
                </div>

                <div className="mt-3">
                  <Link
                    to="/users"
                    className="w-full block text-center bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition"
                  >
                    👥 Manage Users
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Account Summary */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 font-semibold flex items-center gap-2">
              ℹ️ Account Summary
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold text-gray-600">Role:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColor[displayUser?.role]}`}>
                  {roleLabel[displayUser?.role] || displayUser?.role}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold text-gray-600">Account Status:</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">Member Since:</span>
                <span className="text-gray-600 text-xs">
                  {formatDate(displayUser?.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Statistics */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 font-semibold flex items-center gap-2">
              📊 My Ticket Statistics
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600 font-semibold">Total Tickets:</span>
                <span className="font-bold text-gray-800 text-base">{stats.total}</span>
              </div>
              {[
                { label: "Open", key: "open", color: "bg-blue-500" },
                { label: "In Progress", key: "in_progress", color: "bg-yellow-500" },
                { label: "Resolved", key: "resolved", color: "bg-green-500" },
                { label: "Closed", key: "closed", color: "bg-gray-500" },
              ].map((s) => (
                <div key={s.key} className="flex justify-between items-center">
                  <span className="text-gray-600">{s.label}:</span>
                  <span className={`px-2 py-0.5 rounded text-white text-xs font-bold min-w-[28px] text-center ${s.color}`}>
                    {stats[s.key]}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <Link
                  to="/tickets"
                  className="w-full block text-center bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition"
                >
                  🎫 View All My Tickets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}