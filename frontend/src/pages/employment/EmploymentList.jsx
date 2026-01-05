import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employmentApi } from "../../api/employment.api";
import { employeesApi } from "../../api/employees.api";
import { getApiErrorMessage } from "../../api/http";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";

function extractList(raw) {
  return Array.isArray(raw) ? raw : raw?.data || raw?.items || raw?.results || [];
}

function toEmployeeLabel(e) {
  const name = `${e.firstName || ""} ${e.lastName || ""}`.trim() || "(No name)";
  return `${name} (${e.email || "no-email"})`;
}

function toISODateIfPresent(dateValue) {
  if (!dateValue) return undefined;
  return new Date(dateValue).toISOString();
}

export default function EmploymentList() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const employees = state.employees || [];
  const employments = state.employments || [];

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    department: "",
    position: "",
    employmentStatus: "Active",
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

  const fetchEmployments = useCallback(
    async (overrideId) => {
      const id = overrideId ?? employeeFilter;

      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });

      try {
        if (id === "all") {
          dispatch({ type: ACTIONS.EMPLOYMENTS_SET, payload: [] });
          return;
        }

        const res = await employmentApi.getHistory(id, {
          params: { _t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });

        dispatch({
          type: ACTIONS.EMPLOYMENTS_SET,
          payload: extractList(res.data),
        });
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
        dispatch({ type: ACTIONS.EMPLOYMENTS_SET, payload: [] });
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
    fetchEmployments();
  }, [fetchEmployments]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    if (!form.employeeId) return "Select an employee.";
    if (!form.department.trim()) return "Department is required.";
    if (!form.position.trim()) return "Position is required.";
    return "";
  }

  async function addEmployment(e) {
    e.preventDefault();
    setFormError("");

    const msg = validateForm();
    if (msg) return setFormError(msg);

    setSaving(true);
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const employee = employees.find((x) => String(x._id) === form.employeeId);

      const payload = {
        employeeId: form.employeeId,
        department: form.department.trim(),
        position: form.position.trim(),
        employmentStatus: form.employmentStatus,
        // still send to backend, but we removed it from UI
        dateHired: toISODateIfPresent(employee?.dateHired),
      };

      await employmentApi.add(payload);

      // after adding: show the history for that employee
      setEmployeeFilter(payload.employeeId);
      await fetchEmployments(payload.employeeId);

      // reset form
      setForm({
        employeeId: "",
        department: "",
        position: "",
        employmentStatus: "Active",
      });
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employment</h1>
          <p className="text-sm text-slate-600">
            View employment records per employee and add new employment entries.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchEmployments}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            onClick={() => navigate("/employees")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            View Employees
          </button>
        </div>
      </div>

      {/* Filter + Add (RESPONSIVE GRID FIX) */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <form
          onSubmit={addEmployment}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 lg:items-end"
        >
          {/* Filter */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Filter by Employee
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="all">Select an employee to view history</option>
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

          {/* Department */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              value={form.department}
              onChange={(e) => updateForm("department", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. HR"
            />
          </div>

          {/* Position */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Position <span className="text-red-500">*</span>
            </label>
            <input
              value={form.position}
              onChange={(e) => updateForm("position", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. Staff"
            />
          </div>

          {/* Status */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={form.employmentStatus}
              onChange={(e) => updateForm("employmentStatus", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          {/* Button */}
          <div className="md:col-span-2 lg:col-span-6">
            <button
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Employment"}
            </button>
          </div>
        </form>

        {formError ? (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {employeeFilter === "all" ? (
          <p className="text-sm text-slate-600">
            Select an employee to view employment history.
          </p>
        ) : employments.length === 0 ? (
          <p className="text-sm text-slate-600">No employment records found.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b p-3">Employee</th>
                  <th className="border-b p-3">Department</th>
                  <th className="border-b p-3">Position</th>
                  <th className="border-b p-3">Status</th>
                  <th className="border-b p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {employments.map((r) => {
                  const emp = employeeMap.get(String(r.employeeId));
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : "Unknown";

                  return (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="border-b p-3 font-medium text-slate-900">
                        {empName}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {r.department}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {r.position}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {r.employmentStatus}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString()
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
