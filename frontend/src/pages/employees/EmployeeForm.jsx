import { useMemo, useState } from "react";

const DEPARTMENTS = [
  "Quality Control",
  "Marketing",
  "HR",
  "Finance",
  "IT",
  "Operations",
];

export default function EmployeeForm({
  initialValues,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  serverError = "",
}) {
  const defaults = useMemo(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      dateHired: "",
      salary: "",
      ...initialValues,
    }),
    [initialValues]
  );

  const [values, setValues] = useState(defaults);
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!values.firstName.trim()) next.firstName = "First name is required.";
    if (!values.lastName.trim()) next.lastName = "Last name is required.";
    if (!values.email.trim()) next.email = "Email is required.";

    // very basic email check
    if (values.email && !values.email.includes("@"))
      next.email = "Please enter a valid email.";

    // salary numeric
    if (values.salary !== "" && Number.isNaN(Number(values.salary)))
      next.salary = "Salary must be a number.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function normalizePayload(v) {
    return {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      department: v.department.trim(),
      position: v.position.trim(),
      dateHired: v.dateHired ? new Date(v.dateHired).toISOString() : null,
      salary: v.salary === "" ? null : Number(v.salary),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = normalizePayload(values);
    await onSubmit(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-4"
    >
      {serverError ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="First Name *"
          value={values.firstName}
          onChange={(v) => setField("firstName", v)}
          error={errors.firstName}
        />
        <Field
          label="Last Name *"
          value={values.lastName}
          onChange={(v) => setField("lastName", v)}
          error={errors.lastName}
        />
      </div>

      <Field
        label="Email *"
        type="email"
        value={values.email}
        onChange={(v) => setField("email", v)}
        error={errors.email}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Phone"
          value={values.phone}
          onChange={(v) => setField("phone", v)}
          error={errors.phone}
        />
        <Field
          label="Position"
          value={values.position}
          onChange={(v) => setField("position", v)}
          error={errors.position}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Department"
          value={values.department}
          onChange={(v) => setField("department", v)}
          options={DEPARTMENTS}
        />
        <Field
          label="Date Hired"
          type="date"
          value={values.dateHired}
          onChange={(v) => setField("dateHired", v)}
        />
      </div>

      <Field
        label="Salary"
        type="number"
        value={values.salary}
        onChange={(v) => setField("salary", v)}
        error={errors.salary}
      />

      <div className="flex justify-end gap-2">
        <button
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", error = "" }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20 ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/20"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
