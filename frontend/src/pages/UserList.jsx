import { useEffect, useState } from "react";
import { getUsers, createUser, deactivateUser, activateUser, deleteUser } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/dateUtils";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  // confirmModal = { type: "deactivate"|"activate"|"delete", user: {...} }
  const { user } = useAuth();

  const fetchUsers = () => getUsers().then((r) => setUsers(r.data));
  useEffect(() => { fetchUsers(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUser(form);
      showSuccess(`✅ User ${form.name} created! Credentials sent to ${form.email}`);
      setForm({ name: "", email: "", password: "", role: "agent" });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, user: targetUser } = confirmModal;
    setConfirmModal(null);
    try {
      if (type === "deactivate") {
        await deactivateUser(targetUser.id);
        showSuccess(`${targetUser.name} deactivated successfully`);
      } else if (type === "activate") {
        await activateUser(targetUser.id);
        showSuccess(`${targetUser.name} activated successfully`);
      } else if (type === "delete") {
        await deleteUser(targetUser.id);
        showSuccess(`${targetUser.name} permanently deleted`);
      }
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.detail || "Action failed");
    }
  };

  const modalMessages = {
    deactivate: (u) => `Are you sure you want to deactivate "${u.name}"? They will lose access but their data will be preserved.`,
    activate: (u) => `Are you sure you want to activate "${u.name}"? They will regain access to the system.`,
    delete: (u) => `⚠️ Are you sure you want to PERMANENTLY DELETE "${u.name}"? This action cannot be undone.`,
  };

  const modalButtonColors = {
    deactivate: "bg-orange-500 hover:bg-orange-600",
    activate: "bg-green-600 hover:bg-green-700",
    delete: "bg-red-600 hover:bg-red-700",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👥 Users</h1>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {showForm ? "✕ Cancel" : "+ Create User"}
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 capitalize">
              {confirmModal.type === "delete" ? "⚠️ Permanent Delete" :
               confirmModal.type === "deactivate" ? "Deactivate User" : "Activate User"}
            </h3>
            <p className="text-gray-600 text-sm mb-5">
              {modalMessages[confirmModal.type]?.(confirmModal.user)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmAction}
                className={`flex-1 text-white py-2 rounded-lg text-sm font-medium ${modalButtonColors[confirmModal.type]}`}
              >
                Yes, {confirmModal.type.charAt(0).toUpperCase() + confirmModal.type.slice(1)}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                placeholder="Enter your name" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" placeholder="xyz@company.com" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" placeholder="Set initial password" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="agent">Agent</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="col-span-2">
              <button
                type="submit" disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "✉ Create User & Send Credentials Email"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
              {user?.role === "admin" && (
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b hover:bg-gray-50 transition ${!u.is_active ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.role === "admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "agent" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                {user?.role === "admin" && (
                  <td className="px-4 py-3">
                    {u.id === user.id || u.role === "admin" ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : u.is_active ? (
                      /* Active user: show Deactivate */
                      <button
                        onClick={() => setConfirmModal({ type: "deactivate", user: u })}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded text-xs font-medium transition"
                      >
                        Deactivate
                      </button>
                    ) : (
                      /* Inactive user: show Activate + Delete */
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmModal({ type: "activate", user: u })}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded text-xs font-medium transition"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => setConfirmModal({ type: "delete", user: u })}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-xs font-medium transition"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}