import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";
import { employeesApi } from "../../api/employees.api";
import { leaveRequestApi } from "../../api/leaveRequest.api";
import { getApiErrorMessage } from "../../api/http";

function extractList(raw) {
  return Array.isArray(raw) ? raw : raw?.data || raw?.items || raw?.results || [];
}

function calculateDaysInclusive(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function toEmployeeLabel(e) {
  const name = `${e.firstName || ""} ${e.lastName || ""}`.trim() || "(No name)";
  return `${name} (${e.email || "no-email"})`;
}

export default function LeaveRequestList() {
  const { state, dispatch } = useStore();

  const employees = state.employees || [];
  const requests = state.leaveRequests || [];

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    leaveType: "Vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((e) => map.set(String(e._id), e));
    return map;
  }, [employees]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeesApi.getAll({ includeDeleted: "false" });
      dispatch({ type: ACTIONS.EMPLOYEES_SET, payload: extractList(res.data) });
    } catch {
      // ignore
    }
  }, [dispatch]);

  const fetchRequests = useCallback(
    async (overrideId) => {
      const id = overrideId ?? employeeFilter;

      dispatch({ type: ACTIONS.SET_ERROR, payload: null });

      try {
        if (id === "all") {
          dispatch({ type: ACTIONS.LEAVE_REQUESTS_SET, payload: [] });
          return;
        }

        const res = await leaveRequestApi.getHistory(id, {
          params: { _t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });

        dispatch({
          type: ACTIONS.LEAVE_REQUESTS_SET,
          payload: extractList(res.data),
        });
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
        dispatch({ type: ACTIONS.LEAVE_REQUESTS_SET, payload: [] });
      }
    },
    [dispatch, employeeFilter]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    if (!form.employeeId) return "Employee is required.";
    if (!form.startDate || !form.endDate) return "Start and end dates are required.";
    if (new Date(form.endDate) < new Date(form.startDate))
      return "End date cannot be before start date.";
    return "";
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");

    const msg = validateForm();
    if (msg) return setFormError(msg);

    setSaving(true);
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const payload = {
        employeeId: form.employeeId,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      };

      const res = await leaveRequestApi.add(payload);
      dispatch({ type: ACTIONS.LEAVE_REQUEST_ADD, payload: res.data });

      // After adding: show requests for that employee
      setEmployeeFilter(payload.employeeId);
      await fetchRequests(payload.employeeId);

      setForm({
        employeeId: "",
        leaveType: "Vacation",
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(request, status) {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const res = await leaveRequestApi.updateStatus(request._id, status);
      dispatch({ type: ACTIONS.LEAVE_REQUEST_UPDATE, payload: res.data });

      // Optional refresh for perfect sync (especially if backend updates credits)
      // await fetchRequests(employeeFilter);
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Leave Requests (Admin)
          </h1>
          <p className="text-sm text-slate-600">
            File leave requests and approve/reject pending requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {/* Filter + Add (RESPONSIVE GRID FIX) */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <form
          onSubmit={handleAdd}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 lg:items-end"
        >
          {/* Filter */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              View Requests (Select Employee)
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="all">Select employee to view requests</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {toEmployeeLabel(e)}
                </option>
              ))}
            </select>
          </div>

          {/* Employee */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={form.employeeId}
              onChange={(e) => updateForm("employeeId", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="">Select...</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {`${e.firstName || ""} ${e.lastName || ""}`.trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select
              value={form.leaveType}
              onChange={(e) => updateForm("leaveType", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="Vacation">Vacation</option>
              <option value="Sick">Sick</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateForm("startDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* End Date */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateForm("endDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Reason */}
          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-slate-700">Reason</label>
            <input
              value={form.reason}
              onChange={(e) => updateForm("reason", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="Optional reason"
            />
          </div>

          {/* Button */}
          <div className="lg:col-span-1">
            <button
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving..." : "File Leave"}
            </button>
          </div>
        </form>

        {formError ? (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {employeeFilter === "all" ? (
          <p className="text-sm text-slate-600">
            Select an employee to view leave requests.
          </p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-600">No leave requests found.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="border-b p-3">Employee</th>
                  <th className="border-b p-3">Type</th>
                  <th className="border-b p-3">Dates</th>
                  <th className="border-b p-3">Days</th>
                  <th className="border-b p-3">Status</th>
                  <th className="border-b p-3">Reason</th>
                  <th className="border-b p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((r) => {
                  const emp = employeeMap.get(String(r.employeeId));
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : String(r.employeeId);

                  const days = calculateDaysInclusive(r.startDate, r.endDate);

                  return (
                    <tr key={r._id} className="hover:bg-slate-50 align-top">
                      <td className="border-b p-3 font-medium text-slate-900">
                        {empName}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {r.leaveType}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        <div>
                          {new Date(r.startDate).toLocaleDateString()} –{" "}
                          {new Date(r.endDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="border-b p-3 text-slate-700">{days}</td>

                      <td className="border-b p-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-800">
                          {r.status}
                        </span>
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {r.reason || "-"}
                      </td>

                      <td className="border-b p-3">
                        {r.status === "Pending" ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateStatus(r, "Approved");
                              }}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs text-white hover:opacity-90"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateStatus(r, "Rejected");
                              }}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
