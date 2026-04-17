import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getTicket, updateStatus, addComment,
  getComments, getActivity, assignTicket
} from "../api/ticketApi";
import { getAgentWorkload } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { formatDateTime } from "../utils/dateUtils";

const VALID_TRANSITIONS = {
  open: ["in_progress"],
  in_progress: ["resolved", "open"],
  resolved: ["closed", "in_progress"],
  closed: [],
};

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [agentWorkload, setAgentWorkload] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const fetchAll = async () => {
    try {
      const [t, c, a] = await Promise.all([
        getTicket(id),
        getComments(id),
        getActivity(id),
      ]);
      setTicket(t.data);
      setSelectedStatus(VALID_TRANSITIONS[t.data.status]?.[0] || "");
      setComments(c.data);
      setActivity(a.data);
    } catch {
      showError("Failed to load ticket details.");
    }
  };

  useEffect(() => {
    fetchAll();
    if (user?.role === "admin") {
      getAgentWorkload().then((r) => setAgentWorkload(r.data));
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    setStatusLoading(true);
    try {
      await updateStatus(id, selectedStatus);
      await fetchAll();
      // Refresh workload after status change
      if (user?.role === "admin") {
        getAgentWorkload().then((r) => setAgentWorkload(r.data));
      }
      showSuccess("Status updated successfully!");
    } catch (err) {
      showError(err.response?.data?.detail || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      await addComment(id, newComment);
      setNewComment("");
      const r = await getComments(id);
      setComments(r.data);
    } catch {
      showError("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgent) return;
    setAssignLoading(true);
    try {
      await assignTicket(id, selectedAgent);
      await fetchAll();
      getAgentWorkload().then((r) => setAgentWorkload(r.data));
      setSelectedAgent("");
      showSuccess("Ticket assigned successfully!");
    } catch (err) {
      showError(err.response?.data?.detail || "Failed to assign ticket");
    } finally {
      setAssignLoading(false);
    }
  };

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const availableStatuses = VALID_TRANSITIONS[ticket.status] || [];
  const canUpdateStatus = user?.role === "admin" || user?.role === "agent";
  const isTicketLocked = ["resolved", "closed"].includes(ticket.status);

  // Workload badge color
  const getWorkloadColor = (count) => {
    if (count === 0) return "bg-green-100 text-green-700";
    if (count <= 2) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getWorkloadLabel = (count) => {
    if (count === 0) return "Free";
    if (count <= 2) return "Moderate";
    return "Busy";
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/tickets" className="hover:text-blue-600">← My Tickets</Link>
        <span>/</span>
        <span className="text-gray-800 font-mono font-medium">{ticket.id}</span>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Main Content */}
        <div className="col-span-2 space-y-4">

          {/* Ticket Info */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 font-semibold text-base">
              {ticket.title}
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4 pb-3 border-b">
                <span>
                  <strong className="text-gray-700">Ticket ID:</strong>{" "}
                  <span className="font-mono text-blue-700">{ticket.id}</span>
                </span>
                <span>
                  <strong className="text-gray-700">Created:</strong>{" "}
                  {formatDateTime(ticket.created_at)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {ticket.description}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Attachments:</p>
                <p className="text-sm text-gray-400 italic">No attachments.</p>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 font-semibold">
              💬 Comments & Updates
            </div>
            <div className="p-5">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-sm italic mb-4">No comments yet.</p>
              ) : (
                <div className="space-y-4 mb-5">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            {c.user_name}
                            {c.user_role && c.user_role !== "viewer" && (
                              <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                                c.user_role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {c.user_role === "admin" ? "Admin" : "Agent"}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(c.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Add Comment
                </label>
                <textarea
                  rows={3}
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <button
                  onClick={handleComment}
                  disabled={commentLoading || !newComment.trim()}
                  className="mt-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {commentLoading ? "Posting..." : "✈ Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">

          {/* Ticket Information */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 font-semibold">
              ℹ️ Ticket Information
            </div>
            <div className="p-5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Priority</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Created By</span>
                  <span className="font-medium">{ticket.creator_name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Assigned To</span>
                  <span className="font-medium">
                    {ticket.assignee_name || (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Created</span>
                  <span className="text-xs font-medium">
                    {formatDateTime(ticket.created_at)}
                  </span>
                </div>
                {ticket.resolved_at && (
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-500">Resolved At</span>
                    <span className="text-xs font-medium text-green-600">
                      {formatDateTime(ticket.resolved_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Update */}
              {canUpdateStatus && availableStatuses.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Update Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {availableStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={statusLoading}
                    className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
                  >
                    {statusLoading ? "Updating..." : "Update Status"}
                  </button>
                </div>
              )}

              {/* Assign Agent - Admin only with workload */}
              {user?.role === "admin" && (
                <div className="mt-4 pt-4 border-t">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Assign Agent
                  </label>

                  {isTicketLocked ? (
                    <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 italic">
                      Cannot assign — ticket is {ticket.status}
                    </div>
                  ) : (
                    <>
                      {/* Agent Workload Cards */}
                      <div className="space-y-2 mb-3">
                        {agentWorkload.map((agent) => (
                          <div
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                              selectedAgent === agent.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {agent.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {agent.name}
                                  {ticket.assigned_to === agent.id && (
                                    <span className="ml-1 text-xs text-blue-600">(current)</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {agent.open} open · {agent.in_progress} in progress
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getWorkloadColor(agent.total_active)}`}>
                                {getWorkloadLabel(agent.total_active)}
                              </span>
                              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                {agent.total_active} active
                              </span>
                            </div>
                          </div>
                        ))}

                        {agentWorkload.length === 0 && (
                          <p className="text-sm text-gray-400 italic">No active agents available.</p>
                        )}
                      </div>

                      <button
                        onClick={handleAssign}
                        disabled={!selectedAgent || assignLoading}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        {assignLoading ? "Assigning..." : selectedAgent
                          ? `Assign to ${agentWorkload.find(a => a.id === selectedAgent)?.name}`
                          : "Select an Agent Above"
                        }
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-900 text-white px-5 py-3 font-semibold">
              🕒 Activity Log
            </div>
            <div className="p-5">
              {activity.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((a) => (
                    <div key={a.id} className="text-sm border-b pb-3 last:border-0">
                      <p className="font-semibold text-gray-800">{a.user_name}</p>
                      <p className="text-gray-600">{a.action}</p>
                      {a.detail && (
                        <p className="text-gray-500 italic text-xs mt-0.5">{a.detail}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(a.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}