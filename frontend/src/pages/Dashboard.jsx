import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard.api";
import { getApiErrorMessage } from "../api/http";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchSummary() {
    setLoading(true);
    setErr("");

    try {
      const res = await dashboardApi.summary({
        params: { _t: Date.now() },
        headers: { "Cache-Control": "no-cache" },
      });
      setData(res.data);
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  const employees = data?.employees || {};
  const leaveRequests = data?.leaveRequests || {};
  const leaveCredits = data?.leaveCredits || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            HR system overview (Admin)
          </p>
        </div>

        <button
          onClick={fetchSummary}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          Loading dashboard...
        </div>
      ) : err ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          {err}
        </div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Employees"
              value={employees.total ?? 0}
              subtitle="All records"
            />
            <StatCard
              title="Active Employees"
              value={employees.active ?? 0}
              subtitle="Not deleted"
            />
            <StatCard
              title="Deactivated Employees"
              value={employees.deactivated ?? 0}
              subtitle="Soft deleted"
            />
            <StatCard
              title="Leave Credits Records"
              value={leaveCredits.records ?? 0}
              subtitle="Employee-year credit entries"
            />
          </div>

          {/* Leave Requests */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-slate-900">
              Leave Requests
            </h2>
            <p className="text-sm text-slate-600">
              Status breakdown
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <StatCard
                title="Pending"
                value={leaveRequests.pending ?? 0}
              />
              <StatCard
                title="Approved"
                value={leaveRequests.approved ?? 0}
              />
              <StatCard
                title="Rejected"
                value={leaveRequests.rejected ?? 0}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
