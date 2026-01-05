import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmployeeForm from "./EmployeeForm";
import { employeesApi } from "../../api/employees.api";
import { getApiErrorMessage } from "../../api/http";
import { useStore } from "../../app/store/StoreProvider";
import { ACTIONS } from "../../app/store/actions";

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    async function load() {
      setError("");
      setLoading(true);

      try {
        const res = await employeesApi.getById(id);
        const emp = res.data?.employee || res.data?.data || res.data;
        setEmployee(emp);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleUpdate(payload) {
    setError("");
    setSaving(true);

    try {
      const res = await employeesApi.update(id, payload);
      const updated = res.data?.employee || res.data?.data || res.data;

      if (updated && updated._id) {
        dispatch({ type: ACTIONS.EMPLOYEE_UPDATE, payload: updated });
      }

      navigate("/employees", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-600">Loading...</div>;

  if (error && !employee)
    return (
      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );

  const initialValues = employee
    ? {
        firstName: employee.firstName ?? "",
        lastName: employee.lastName ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        department: employee.department ?? "",
        position: employee.position ?? "",
        dateHired: toDateInputValue(employee.dateHired),
        salary: employee.salary ?? "",
      }
    : {};

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Employee</h1>
        <p className="text-sm text-slate-600">Update employee details.</p>
      </div>

      <EmployeeForm
        initialValues={initialValues}
        submitLabel="Save Changes"
        loading={saving}
        serverError={error}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
