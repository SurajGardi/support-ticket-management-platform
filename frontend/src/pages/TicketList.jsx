import { useEffect, useState, useRef } from "react";
import { getTickets } from "../api/ticketApi";
import { getUsers } from "../api/userApi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { formatDateTime } from "../utils/dateUtils";

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorSuggestions, setCreatorSuggestions] = useState([]);
  const [agentSearch, setAgentSearch] = useState("");
  const [agentSuggestions, setAgentSuggestions] = useState([]);
  const [filters, setFilters] = useState({
    status: "", priority: "", assigned_to: "",
    created_by: "", date_from: "", date_to: "", page: 1,
  });
  const { user } = useAuth();
  const creatorRef = useRef(null);
  const agentRef = useRef(null);

  useEffect(() => {
    getUsers().then((r) => {
      setUsers(r.data);
      setAgents(r.data.filter((u) => u.role === "agent"));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    getTickets(params)
      .then((res) => setTickets(res.data))
      .finally(() => setLoading(false));
  }, [filters]);

  // Creator search suggestions
  useEffect(() => {
    if (creatorSearch.trim().length < 1) {
      setCreatorSuggestions([]);
      return;
    }
    const matches = users.filter((u) =>
      u.name.toLowerCase().includes(creatorSearch.toLowerCase())
    );
    setCreatorSuggestions(matches);
  }, [creatorSearch, users]);

  // Agent search suggestions
  useEffect(() => {
    if (agentSearch.trim().length < 1) {
      setAgentSuggestions([]);
      return;
    }
    const matches = agents.filter((a) =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase())
    );
    setAgentSuggestions(matches);
  }, [agentSearch, agents]);

  const clearFilters = () => {
    setFilters({
      status: "", priority: "", assigned_to: "",
      created_by: "", date_from: "", date_to: "", page: 1,
    });
    setCreatorSearch("");
    setAgentSearch("");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🎫 My Tickets</h1>
        <Link
          to="/tickets/create"
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Create New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Status</label>
            <select
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              value={filters.status}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Priority</label>
            <select
              onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
              value={filters.priority}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Created By search - admin and agent */}
          {(user?.role === "admin" || user?.role === "agent") && (
            <div className="flex flex-col gap-1 relative" ref={creatorRef}>
              <label className="text-xs text-gray-500 font-medium">Created By</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={creatorSearch}
                onChange={(e) => {
                  setCreatorSearch(e.target.value);
                  if (!e.target.value) {
                    setFilters({ ...filters, created_by: "", page: 1 });
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
              />
              {creatorSuggestions.length > 0 && (
                <div className="absolute top-16 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-44">
                  {creatorSuggestions.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setFilters({ ...filters, created_by: u.id, page: 1 });
                        setCreatorSearch(u.name);
                        setCreatorSuggestions([]);
                      }}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                    >
                      {u.name}
                      <span className="text-xs text-gray-400 ml-1 capitalize">
                        ({u.role})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assigned Agent search - admin and viewer */}
          {(user?.role === "admin" || user?.role === "viewer") && (
            <div className="flex flex-col gap-1 relative" ref={agentRef}>
              <label className="text-xs text-gray-500 font-medium">Assigned Agent</label>
              <input
                type="text"
                placeholder="Search agent..."
                value={agentSearch}
                onChange={(e) => {
                  setAgentSearch(e.target.value);
                  if (!e.target.value) {
                    setFilters({ ...filters, assigned_to: "", page: 1 });
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
              />
              {agentSuggestions.length > 0 && (
                <div className="absolute top-16 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-44">
                  {agentSuggestions.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setFilters({ ...filters, assigned_to: a.id, page: 1 });
                        setAgentSearch(a.name);
                        setAgentSuggestions([]);
                      }}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                    >
                      {a.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Clear */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">&nbsp;</label>
            <button
              onClick={clearFilters}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 text-gray-600"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p className="text-lg mb-2">No tickets found.</p>
            <Link to="/tickets/create" className="text-blue-600 hover:underline text-sm">
              Create your first ticket →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Ticket ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Created By</th>
                  {user?.role === "admin" && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned Agent</th>
                  )}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Created</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 whitespace-nowrap">{t.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{t.title}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{t.creator_name}</td>
                    {user?.role === "admin" && (
                      <td className="px-4 py-3 text-gray-600">
                        {t.assignee_name || (
                          <span className="text-gray-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(t.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
          disabled={filters.page === 1}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"
        >← Prev</button>
        <span className="px-4 py-2 text-sm text-gray-600">Page {filters.page}</span>
        <button
          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          disabled={tickets.length < 10}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"
        >Next →</button>
      </div>
    </div>
  );
}