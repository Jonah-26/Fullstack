import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { credentialApi } from "../../api/credential.api";
import { employeesApi } from "../../api/employees.api";
import { getApiErrorMessage } from "../../api/http";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";

function toEmployeeLabel(e) {
  const name = `${e.firstName || ""} ${e.lastName || ""}`.trim() || "(No name)";
  return `${name} (${e.email || "no-email"})`;
}

function toISODateIfPresent(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function CredentialList() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const employees = state.employees || [];
  const credentials = state.credentials || [];

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    credentialName: "",
    issuedBy: "",
    issuedDate: "",
    expiryDate: "",
  });

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((e) => map.set(String(e._id), e));
    return map;
  }, [employees]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeesApi.getAll({ includeDeleted: "false" });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      dispatch({ type: ACTIONS.EMPLOYEES_SET, payload: list });
    } catch {
      // ignore
    }
  }, [dispatch]);

  // ✅ IMPORTANT: allow overrideId to avoid stale state after setEmployeeFilter
  const fetchCredentials = useCallback(
    async (overrideId) => {
      const id = overrideId ?? employeeFilter;

      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });

      try {
        if (id === "all") {
          dispatch({ type: ACTIONS.CREDENTIAL_SET, payload: [] });
          return;
        }

        const res = await credentialApi.getHistory(id, {
          params: { _t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });

        // backend returns plain array ✅
        const list = Array.isArray(res.data) ? res.data : [];
        dispatch({ type: ACTIONS.CREDENTIAL_SET, payload: list });
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
        dispatch({ type: ACTIONS.CREDENTIAL_SET, payload: [] });
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
    fetchCredentials();
  }, [fetchCredentials]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    if (!form.employeeId) return "Select an employee.";
    if (!form.credentialName.trim()) return "Credential name is required.";
    if (!form.issuedBy.trim()) return "Issued By is required.";
    return "";
  }

  async function addCredential(e) {
    e.preventDefault();
    setFormError("");

    const msg = validateForm();
    if (msg) return setFormError(msg);

    setSaving(true);
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      // ✅ FORCE employeeId to string (prevents [object Object])
      const empId = String(form.employeeId);

      const payload = {
        employeeId: empId,
        credentialName: form.credentialName.trim(),
        issuedBy: form.issuedBy.trim(),
        issuedDate: toISODateIfPresent(form.issuedDate),
        expiryDate: toISODateIfPresent(form.expiryDate),
      };

      await credentialApi.add(payload);

      // show history for that employee after add
      setEmployeeFilter(empId);

      // ✅ fetch using override to avoid stale "all" filter wipe
      await fetchCredentials(empId);

      // reset form
      setForm({
        employeeId: "",
        credentialName: "",
        issuedBy: "",
        issuedDate: "",
        expiryDate: "",
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
          <h1 className="text-2xl font-semibold text-slate-900">Credentials</h1>
          <p className="text-sm text-slate-600">
            View credentials per employee and add new credential records.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchCredentials()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            View Employees
          </button>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <form
          onSubmit={addCredential}
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
              <option value="all">Select employee to view credentials</option>
              {employees.map((e) => (
                <option key={e._id} value={String(e._id)}>
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
                <option key={e._id} value={String(e._id)}>
                  {`${e.firstName || ""} ${e.lastName || ""}`.trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Credential */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Credential <span className="text-red-500">*</span>
            </label>
            <input
              value={form.credentialName}
              onChange={(e) => updateForm("credentialName", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. First Aid"
            />
          </div>

          {/* Issued By */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Issued By <span className="text-red-500">*</span>
            </label>
            <input
              value={form.issuedBy}
              onChange={(e) => updateForm("issuedBy", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. Red Cross"
            />
          </div>

          {/* Issued Date */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Issued Date
            </label>
            <input
              type="date"
              value={form.issuedDate}
              onChange={(e) => updateForm("issuedDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Expiry Date */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Expiry Date
            </label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => updateForm("expiryDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Button */}
          <div className="md:col-span-2 lg:col-span-6">
            <button
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Credential"}
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
            Select an employee to view credential history.
          </p>
        ) : credentials.length === 0 ? (
          <p className="text-sm text-slate-600">
            No credential records found for this employee.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1060px] text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b p-3">Employee</th>
                  <th className="border-b p-3">Credential</th>
                  <th className="border-b p-3">Issued By</th>
                  <th className="border-b p-3">Issued Date</th>
                  <th className="border-b p-3">Expiry Date</th>
                  <th className="border-b p-3">Created</th>
                </tr>
              </thead>

              <tbody>
                {credentials.map((c) => {
                  const empId = String(c.employeeId || c.employee?._id || "");
                  const emp = employeeMap.get(empId);
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : empId || "Unknown";

                  return (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="border-b p-3 font-medium text-slate-900">
                        {empName}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {c.credentialName}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {c.issuedBy}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {c.issuedDate
                          ? new Date(c.issuedDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {c.expiryDate
                          ? new Date(c.expiryDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
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
