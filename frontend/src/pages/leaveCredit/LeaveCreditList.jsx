import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";
import { employeesApi } from "../../api/employees.api";
import { leaveCreditApi } from "../../api/leaveCredit.api";
import { getApiErrorMessage } from "../../api/http";

function extractList(raw) {
  return Array.isArray(raw) ? raw : raw?.data || [];
}

function toEmployeeLabel(e) {
  const name = `${e.firstName || ""} ${e.lastName || ""}`.trim() || "(No name)";
  return `${name} (${e.email || "no-email"})`;
}

export default function LeaveCreditList() {
  const { state, dispatch } = useStore();

  const employees = state.employees || [];
  const leaveCredits = state.leaveCredits || [];

  const currentYear = new Date().getFullYear();

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    year: currentYear,
    vacationLeave: 15,
    sickLeave: 10,
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
     
    }
  }, [dispatch]);

  const fetchLeaveCredits = useCallback(
    async (overrideId) => {
      const id = overrideId ?? employeeFilter;

      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });

      try {
        if (id === "all") {
          dispatch({ type: ACTIONS.LEAVE_CREDITS_SET, payload: [] });
          return;
        }

        const res = await leaveCreditApi.getHistory(id, {
          params: { _t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });

        dispatch({
          type: ACTIONS.LEAVE_CREDITS_SET,
          payload: extractList(res.data),
        });
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
        dispatch({ type: ACTIONS.LEAVE_CREDITS_SET, payload: [] });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },
    [dispatch, employeeFilter]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchLeaveCredits();
  }, [fetchLeaveCredits]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    if (!form.employeeId) return "Select an employee.";
    const yearNum = Number(form.year);
    if (!yearNum || yearNum < 2000 || yearNum > 2100)
      return "Enter a valid year.";
    if (Number(form.vacationLeave) < 0) return "Vacation leave must be 0 or more.";
    if (Number(form.sickLeave) < 0) return "Sick leave must be 0 or more.";
    return "";
  }

  async function handleUpsert(e) {
    e.preventDefault();
    setFormError("");

    const msg = validateForm();
    if (msg) return setFormError(msg);

    setSaving(true);
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const payload = {
        employeeId: form.employeeId,
        year: Number(form.year),
        vacationLeave: Number(form.vacationLeave),
        sickLeave: Number(form.sickLeave),
      };

      const res = await leaveCreditApi.upsert(payload);

      // controller returns doc directly
      const saved = res.data;

      dispatch({ type: ACTIONS.LEAVE_CREDIT_UPSERT, payload: saved });

      // show history for this employee
      setEmployeeFilter(payload.employeeId);
      await fetchLeaveCredits(payload.employeeId);

      
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // Sort credits by year desc
  const sortedCredits = useMemo(() => {
    return [...leaveCredits].sort((a, b) => Number(b.year) - Number(a.year));
  }, [leaveCredits]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Leave Credits</h1>
        <p className="text-sm text-slate-600">
          Sets leave credits per employee per year.
        </p>
      </div>

      {/* Filter + Form */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              View Credits for Employee
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="all">Select employee to view credits</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {toEmployeeLabel(e)}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleUpsert} className="grid gap-2 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Employee *
              </label>
              <select
                value={form.employeeId}
                onChange={(e) => updateForm("employeeId", e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                <option value="">Select...</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {`${e.firstName || ""} ${e.lastName || ""}`.trim()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Year *
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => updateForm("year", e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Vacation
              </label>
              <input
                type="number"
                min="0"
                value={form.vacationLeave}
                onChange={(e) => updateForm("vacationLeave", e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Sick
              </label>
              <input
                type="number"
                min="0"
                value={form.sickLeave}
                onChange={(e) => updateForm("sickLeave", e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>

            <button
              disabled={saving}
              className="sm:col-span-4 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save / Update Credits"}
            </button>
          </form>
        </div>

        {formError ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {employeeFilter === "all" ? (
          <p className="text-sm text-slate-600">
            Select an employee.
          </p>
        ) : sortedCredits.length === 0 ? (
          <p className="text-sm text-slate-600">
            No leave credits found for this employee.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b p-3">Employee</th>
                  <th className="border-b p-3">Year</th>
                  <th className="border-b p-3">Vacation</th>
                  <th className="border-b p-3">Sick</th>
                  <th className="border-b p-3">Used Vacation</th>
                  <th className="border-b p-3">Used Sick</th>
                  <th className="border-b p-3">Updated</th>
                </tr>
              </thead>

              <tbody>
                {sortedCredits.map((c) => {
                  const emp = employeeMap.get(String(c.employeeId));
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : String(c.employeeId);

                  return (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="border-b p-3 font-medium text-slate-900">
                        {empName}
                      </td>
                      <td className="border-b p-3">{c.year}</td>
                      <td className="border-b p-3">{c.vacationLeave ?? 0}</td>
                      <td className="border-b p-3">{c.sickLeave ?? 0}</td>
                      <td className="border-b p-3">{c.usedVacationLeave ?? 0}</td>
                      <td className="border-b p-3">{c.usedSickLeave ?? 0}</td>
                      <td className="border-b p-3">
                        {c.updatedAt
                          ? new Date(c.updatedAt).toLocaleDateString()
                          : "-"}
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
