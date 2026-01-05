import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { salaryApi } from "../../api/salary.api";
import { employeesApi } from "../../api/employees.api";
import { getApiErrorMessage } from "../../api/http";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";

function extractList(raw) {
  return Array.isArray(raw)
    ? raw
    : raw?.data || raw?.items || raw?.results || raw?.salaries || [];
}

function toEmployeeLabel(e) {
  const first = e.firstName || "";
  const last = e.lastName || "";
  const name = `${first} ${last}`.trim() || "(No name)";
  return `${name} (${e.email || "no-email"})`;
}

export default function SalaryList() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    salaryAmount: "",
    effectiveDate: "",
  });

  const employeeMap = useMemo(() => {
    const map = new Map();
    state.employees.forEach((e) => map.set(String(e._id), e));
    return map;
  }, [state.employees]);

  const fetchEmployeesForDropdown = useCallback(async () => {
    try {
      const res = await employeesApi.getAll({ includeDeleted: "false" });
      dispatch({
        type: ACTIONS.EMPLOYEES_SET,
        payload: extractList(res.data),
      });
    } catch {
      // don't block salary module if employees fail
    }
  }, [dispatch]);

  const fetchSalaries = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      // If "all", we don't have an endpoint in your backend yet
      if (employeeFilter === "all") {
        dispatch({ type: ACTIONS.SALARIES_SET, payload: [] });
        return;
      }

      const res = await salaryApi.getHistory(employeeFilter);
      dispatch({
        type: ACTIONS.SALARIES_SET,
        payload: extractList(res.data),
      });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
      dispatch({ type: ACTIONS.SALARIES_SET, payload: [] });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [dispatch, employeeFilter]);

  useEffect(() => {
    fetchEmployeesForDropdown();
  }, [fetchEmployeesForDropdown]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    if (!form.employeeId) return "Select an employee.";
    if (!form.salaryAmount) return "Enter salary amount.";

    const salaryNum = Number(form.salaryAmount);
    if (Number.isNaN(salaryNum)) return "Salary must be a number.";

    return "";
  }

  async function addSalary(e) {
    e.preventDefault();
    setFormError("");

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const salaryNum = Number(form.salaryAmount);

    setSaving(true);
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const payload = {
        employeeId: form.employeeId,
        salaryAmount: salaryNum,
        effectiveDate: form.effectiveDate || undefined,
      };

      await salaryApi.add(payload);

      // reset form
      setForm({ employeeId: "", salaryAmount: "", effectiveDate: "" });

      // refresh: show salary list for the employee that was added
      if (employeeFilter !== "all") {
        await fetchSalaries();
      } else {
        setEmployeeFilter(payload.employeeId);
      }
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
          <h1 className="text-2xl font-semibold text-slate-900">Salary</h1>
          <p className="text-sm text-slate-600">
            List salary records and add new salary entries.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchSalaries}
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
          onSubmit={addSalary}
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
              <option value="all">All</option>
              {state.employees.map((e) => (
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
              {state.employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {(e.firstName || "") + " " + (e.lastName || "")}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Amount */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Salary Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.salaryAmount}
              onChange={(e) => updateForm("salaryAmount", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. 50000"
            />
          </div>

          {/* Effective Date */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Effective Date
            </label>
            <input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => updateForm("effectiveDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Button */}
          <div className="md:col-span-2 lg:col-span-1">
            <button
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Salary"}
            </button>
          </div>
        </form>

        {formError ? (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
      </div>

      {/* Loading/Error */}
      {state.loading ? (
        <div className="rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-black/5">
          Loading...
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
          {state.error}
        </div>
      ) : null}

      {/* List */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {employeeFilter === "all" ? (
          <p className="text-sm text-slate-600">
            Select an employee to view salary history.
          </p>
        ) : state.salaries.length === 0 ? (
          <p className="text-sm text-slate-600">
            No salary records found for this employee.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b p-3">Employee</th>
                  <th className="border-b p-3">Salary Amount</th>
                  <th className="border-b p-3">Effective Date</th>
                  <th className="border-b p-3">Created</th>
                </tr>
              </thead>

              <tbody>
                {state.salaries.map((s) => {
                  const empId = String(s.employeeId || s.employee?._id || "");
                  const emp = employeeMap.get(empId);
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : empId || "Unknown";

                  return (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="border-b p-3 font-medium text-slate-900">
                        {empName}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {typeof s.salaryAmount === "number"
                          ? s.salaryAmount.toLocaleString()
                          : s.salaryAmount}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {s.effectiveDate
                          ? new Date(s.effectiveDate).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString()
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
