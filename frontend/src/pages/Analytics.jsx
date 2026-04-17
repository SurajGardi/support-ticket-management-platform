import { useEffect, useState } from "react";
import { getTickets } from "../api/ticketApi";
import { getUsers } from "../api/userApi";

const SUPERSET_URL = "http://localhost:8088";
const DASHBOARD_ID = "5";

export default function Analytics() {
  const [tab, setTab] = useState("superset");
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTickets({ page_size: 100 }), getUsers()])
      .then(([t, u]) => { setTickets(t.data); setUsers(u.data); })
      .finally(() => setLoading(false));
  }, []);

  const total = tickets.length;
  const sOpen = tickets.filter(t => t.status === "open").length;
  const sIP = tickets.filter(t => t.status === "in_progress").length;
  const sRes = tickets.filter(t => t.status === "resolved").length;
  const sClosed = tickets.filter(t => t.status === "closed").length;
  const pH = tickets.filter(t => t.priority === "high").length;
  const pM = tickets.filter(t => t.priority === "medium").length;
  const pL = tickets.filter(t => t.priority === "low").length;

  const agents = users.filter(u => u.role === "agent");
  const agentData = agents
    .map(a => ({ name: a.name, first: a.name.charAt(0), count: tickets.filter(t => t.assigned_to === a.id).length }))
    .sort((a, b) => b.count - a.count);

  const resolved = tickets.filter(t => t.resolved_at && t.created_at);
  const avgH = resolved.length > 0
    ? (resolved.reduce((s, t) => s + (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000, 0) / resolved.length).toFixed(1)
    : 0;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split("T")[0];
  });
  const dayData = last7.map(day => ({
    label: day.slice(5),
    count: tickets.filter(t => {
      if (!t.created_at) return false;
      const s = t.created_at.endsWith("Z") ? t.created_at : t.created_at + "Z";
      return new Date(s).toISOString().split("T")[0] === day;
    }).length
  }));
  const maxDay = Math.max(...dayData.map(d => d.count), 1);
  const maxAgent = Math.max(...agentData.map(a => a.count), 1);

  const pct = (n) => total ? (n / total * 100) + "%" : "0%";
  const iframeSrc = SUPERSET_URL + "/superset/dashboard/" + DASHBOARD_ID + "/?standalone=true";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("superset")} className={tab === "superset" ? "px-4 py-2 rounded-lg text-sm font-medium bg-blue-700 text-white" : "px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600"}>Apache Superset</button>
          <button onClick={() => setTab("builtin")} className={tab === "builtin" ? "px-4 py-2 rounded-lg text-sm font-medium bg-blue-700 text-white" : "px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600"}>Built-in Charts</button>
        </div>
      </div>

      {tab === "superset" && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-blue-900 px-5 py-3 flex justify-between items-center">
            <span className="text-white font-semibold text-sm">Apache Superset</span>
            <div className="flex gap-3">
              <a href={SUPERSET_URL + "/login"} target="_blank" rel="noreferrer" className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg font-medium">Login to Superset first</a>
              <a href={SUPERSET_URL + "/superset/dashboard/" + DASHBOARD_ID + "/"} target="_blank" rel="noreferrer" className="text-xs bg-white text-blue-700 px-3 py-1.5 rounded-lg font-medium">Open Full Screen</a>
            </div>
          </div>
          <div className="bg-blue-50 border-b border-blue-100 px-5 py-2">
            <p className="text-xs text-blue-700">Login to Superset first then refresh this page to view dashboard.</p>
          </div>
          <iframe src={iframeSrc} title="Analytics" width="100%" style={{ height: "85vh", border: "none" }} />
        </div>
      )}

      {tab === "builtin" && loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {tab === "builtin" && !loading && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500"><p className="text-sm text-gray-500">Total Tickets</p><p className="text-3xl font-bold text-gray-800 mt-1">{total}</p></div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500"><p className="text-sm text-gray-500">Resolved</p><p className="text-3xl font-bold text-green-600 mt-1">{sRes}</p></div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500"><p className="text-sm text-gray-500">In Progress</p><p className="text-3xl font-bold text-yellow-600 mt-1">{sIP}</p></div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500"><p className="text-sm text-gray-500">Avg Resolution</p><p className="text-3xl font-bold text-purple-600 mt-1">{avgH}h</p></div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-gray-700 mb-4">Tickets by Status</h2>
              <div className="space-y-3">
                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Open</span><span className="font-semibold">{sOpen}</span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-blue-500 h-3 rounded-full" style={{ width: pct(sOpen) }} /></div></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">In Progress</span><span className="font-semibold">{sIP}</span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-yellow-500 h-3 rounded-full" style={{ width: pct(sIP) }} /></div></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Resolved</span><span className="font-semibold">{sRes}</span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-green-500 h-3 rounded-full" style={{ width: pct(sRes) }} /></div></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Closed</span><span className="font-semibold">{sClosed}</span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-gray-400 h-3 rounded-full" style={{ width: pct(sClosed) }} /></div></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-gray-700 mb-4">Tickets by Priority</h2>
              <div className="space-y-3">
                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">High</span><span className="font-semibold">{pH}</span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-red-500 h-3 rounded-full" style={{ width: pct(pH) }} /></div></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Medium</span><span className="font-semibold">{pM}</span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-yellow-500 h-3 rounded-full" style={{ width: pct(pM) }} /></div></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Low</span><span className="font-semibold">{pL}</span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-green-500 h-3 rounded-full" style={{ width: pct(pL) }} /></div></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-gray-700 mb-4">Tickets Created (Last 7 Days)</h2>
              <div className="flex items-end gap-2 h-40">
                {dayData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{d.count}</span>
                    <div className="w-full rounded-t" style={{ height: (d.count / maxDay * 100) + "%", minHeight: d.count > 0 ? "8px" : "2px", backgroundColor: d.count > 0 ? "#3b82f6" : "#e5e7eb" }} />
                    <span className="text-xs text-gray-400">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-gray-700 mb-4">Tickets per Agent</h2>
              {agentData.length === 0 && <p className="text-gray-400 text-sm italic">No agents found.</p>}
              {agentData.length > 0 && (
                <div className="space-y-3">
                  {agentData.map((a, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">{a.first}</span>
                          {a.name}
                        </span>
                        <span className="font-semibold">{a.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="bg-purple-500 h-3 rounded-full" style={{ width: (a.count / maxAgent * 100) + "%", minWidth: a.count > 0 ? "8px" : "0" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
