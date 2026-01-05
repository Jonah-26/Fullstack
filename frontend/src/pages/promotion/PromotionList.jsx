import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { promotionApi } from "../../api/promotion.api";
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

export default function PromotionList() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    oldPosition: "",
    newPosition: "",
    promotionDate: "",
  });

  const employeeMap = useMemo(() => {
    const map = new Map();
    state.employees.forEach((e) => map.set(String(e._id), e));
    return map;
  }, [state.employees]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeesApi.getAll({ includeDeleted: "false" });
      dispatch({ type: ACTIONS.EMPLOYEES_SET, payload: extractList(res.data) });
    } catch {
      // don't block page if employees fetch fails
    }
  }, [dispatch]);

  const fetchPromotions = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      // your backend has GET /api/promotion/:id only
      if (employeeFilter === "all") {
        dispatch({ type: ACTIONS.PROMOTIONS_SET, payload: [] });
        return;
      }

      const res = await promotionApi.getHistory(employeeFilter);
      dispatch({ type: ACTIONS.PROMOTIONS_SET, payload: extractList(res.data) });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
      dispatch({ type: ACTIONS.PROMOTIONS_SET, payload: [] });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [dispatch, employeeFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    if (!form.employeeId) return "Select an employee.";
    if (!form.oldPosition.trim()) return "Old Position is required.";
    if (!form.newPosition.trim()) return "New Position is required.";
    return "";
  }

  async function addPromotion(e) {
    e.preventDefault();
    setFormError("");

    const errMsg = validateForm();
    if (errMsg) return setFormError(errMsg);

    setSaving(true);
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const payload = {
        employeeId: form.employeeId,
        oldPosition: form.oldPosition.trim(),
        newPosition: form.newPosition.trim(),
        promotionDate: form.promotionDate
          ? new Date(form.promotionDate).toISOString()
          : undefined,
      };

      const res = await promotionApi.add(payload);
      const created = res.data;

      // reset form
      setForm({
        employeeId: "",
        oldPosition: "",
        newPosition: "",
        promotionDate: "",
      });

      // refresh list behavior
      if (employeeFilter === "all") {
        setEmployeeFilter(payload.employeeId);
      } else {
        // if backend returns created record, we can insert optimistically
        if (created && (created._id || created.id)) {
          dispatch({ type: ACTIONS.PROMOTION_ADD, payload: created });
        } else {
          await fetchPromotions();
        }
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
          <h1 className="text-2xl font-semibold text-slate-900">Promotion</h1>
          <p className="text-sm text-slate-600">
            View promotion history and add new promotion records.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchPromotions}
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
          onSubmit={addPromotion}
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
                  {`${e.firstName || ""} ${e.lastName || ""}`.trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Old Position */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Old Position <span className="text-red-500">*</span>
            </label>
            <input
              value={form.oldPosition}
              onChange={(e) => updateForm("oldPosition", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. Staff"
            />
          </div>

          {/* New Position */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              New Position <span className="text-red-500">*</span>
            </label>
            <input
              value={form.newPosition}
              onChange={(e) => updateForm("newPosition", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="e.g. Team Lead"
            />
          </div>

          {/* Promotion Date */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Promotion Date
            </label>
            <input
              type="date"
              value={form.promotionDate}
              onChange={(e) => updateForm("promotionDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Button */}
          <div className="md:col-span-2 lg:col-span-6">
            <button
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Promotion"}
            </button>
          </div>
        </form>

        {formError ? (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
      </div>

      {/* Loading / error */}
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
            Select an employee to view promotion history.
          </p>
        ) : state.promotions.length === 0 ? (
          <p className="text-sm text-slate-600">
            No promotion records found for this employee.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b p-3">Employee</th>
                  <th className="border-b p-3">Old Position</th>
                  <th className="border-b p-3">New Position</th>
                  <th className="border-b p-3">Promotion Date</th>
                  <th className="border-b p-3">Created</th>
                </tr>
              </thead>

              <tbody>
                {state.promotions.map((p) => {
                  const empId = String(p.employeeId || p.employee?._id || "");
                  const emp = employeeMap.get(empId);
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : empId || "Unknown";

                  return (
                    <tr key={p._id || p.id} className="hover:bg-slate-50">
                      <td className="border-b p-3 font-medium text-slate-900">
                        {empName}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {p.oldPosition || "-"}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {p.newPosition || "-"}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {p.promotionDate
                          ? new Date(p.promotionDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="border-b p-3 text-slate-700">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString()
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
