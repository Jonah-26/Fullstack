import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeForm from "./EmployeeForm";
import { employeesApi } from "../../api/employees.api";
import { getApiErrorMessage } from "../../api/http";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const { dispatch } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(payload) {
    setError("");
    setLoading(true);

    try {
      const res = await employeesApi.create(payload);
      const created = res.data?.employee || res.data?.data || res.data;

      if (created && created._id) {
        dispatch({ type: ACTIONS.EMPLOYEE_ADD, payload: created });
      }

      navigate("/employees", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Add Employee</h1>
        <p className="text-sm text-slate-600">Create a new employee record.</p>
      </div>

      <EmployeeForm
        submitLabel="Create"
        loading={loading}
        serverError={error}
        onSubmit={handleCreate}
      />
    </div>
  );
}
