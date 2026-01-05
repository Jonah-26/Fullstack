import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeesApi } from "../../api/employees.api";
import { getApiErrorMessage } from "../../api/http";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function EmployeeList() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const [showDeactivated, setShowDeactivated] = useState(false);

  const [confirm, setConfirm] = useState({
    open: false,
    mode: null, // "soft" | "permanent"
    employee: null,
  });

  async function fetchEmployees() {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const res = await employeesApi.getAll({
        includeDeleted: showDeactivated ? "true" : "false",
      });

      const raw = res.data;

      
      const employees = Array.isArray(raw)
        ? raw
        : raw?.employees || raw?.data || raw?.results || raw?.items || [];

      dispatch({ type: ACTIONS.EMPLOYEES_SET, payload: employees });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
      dispatch({ type: ACTIONS.EMPLOYEES_SET, payload: [] });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }

  useEffect(() => {
    fetchEmployees();
   
  }, [showDeactivated]);

  const filteredEmployees = useMemo(() => {
    return state.employees.filter((e) => {
      const active = e.isDeleted !== true; 
      return showDeactivated ? !active : active;
    });
  }, [state.employees, showDeactivated]);

  function openConfirm(mode, employee) {
    setConfirm({ open: true, mode, employee });
  }

  function closeConfirm() {
    setConfirm({ open: false, mode: null, employee: null });
  }

  async function handleConfirm() {
    const emp = confirm.employee;
    if (!emp) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      if (confirm.mode === "soft") {
        const res = await employeesApi.softDelete(emp._id);

        // Backend returns: { message, employee }
        const updatedEmployee = res.data?.employee || res.data?.data || res.data;

        if (updatedEmployee && updatedEmployee._id) {
          dispatch({
            type: ACTIONS.EMPLOYEE_UPDATE,
            payload: updatedEmployee,
          });
        } else {
          await fetchEmployees();
        }
      }

      if (confirm.mode === "permanent") {
        await employeesApi.permanentDelete(emp._id);
        dispatch({ type: ACTIONS.EMPLOYEE_REMOVE, payload: emp._id });
      }
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: getApiErrorMessage(err) });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      closeConfirm();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-600">
            View, create, edit, deactivate (soft delete), or permanently delete.
            
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowDeactivated((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            {showDeactivated ? "Show Active" : "Show Deactivated"}
          </button>

          <button
            onClick={fetchEmployees}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            onClick={() => navigate("/employees/new")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95"
          >
            Add Employee
          </button>
        </div>
      </div>

      {state.loading && (
        <div className="rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-black/5">
          Loading...
        </div>
      )}

      {state.error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
          {state.error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {filteredEmployees.length === 0 ? (
          <p className="text-sm text-slate-600">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b p-3">Name</th>
                  <th className="border-b p-3">Email</th>
                  <th className="border-b p-3">Department</th>
                  <th className="border-b p-3">Position</th>
                  <th className="border-b p-3">Status</th>
                  <th className="border-b p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((emp) => {
                  const name =
                    emp.fullName ||
                    `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() ||
                    emp.name ||
                    "(No name)";

                  const active = emp.isDeleted !== true;

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50">
                      <td className="border-b p-3 font-medium text-slate-900">
                        {name}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {emp.email || "-"}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {emp.department || "-"}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {emp.position || "-"}
                      </td>

                      <td className="border-b p-3 text-slate-700">
                        {active ? "Active" : "Deactivated"}
                      </td>

                      <td className="border-b p-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => navigate(`/employees/${emp._id}/edit`)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          {active && (
                            <button
                              onClick={() => openConfirm("soft", emp)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800 hover:opacity-90"
                            >
                              Deactivate
                            </button>
                          )}

                          <button
                            onClick={() => openConfirm("permanent", emp)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 hover:opacity-90"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={
          confirm.mode === "permanent"
            ? "Permanent Delete"
            : "Deactivate Employee"
        }
        message={
          confirm.mode === "permanent"
            ? "This will permanently delete the employee. This cannot be undone."
            : "This will deactivate the employee (soft delete)."
        }
        confirmText={confirm.mode === "permanent" ? "Delete" : "Deactivate"}
        danger={confirm.mode === "permanent"}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
