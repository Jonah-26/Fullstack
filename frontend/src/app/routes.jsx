import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import ProtectedRoute from "../components/common/ProtectedRoute";
import EmployeeList from "../pages/employees/EmployeeList";
import EmployeeCreate from "../pages/employees/EmployeeCreate";
import EmployeeEdit from "../pages/employees/EmployeeEdit";
import SalaryList from "../pages/salary/SalaryList";
import PromotionList from "../pages/promotion/PromotionList";
import CredentialList from "../pages/credential/CredentialList";
import EmploymentList from "../pages/employment/EmploymentList";
import LeaveCreditList from "../pages/leaveCredit/LeaveCreditList";
import LeaveRequestList from "../pages/leaveRequest/LeaveRequestList";







export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <Dashboard /> }, { path: "employees", element: <EmployeeList /> }, 
        { path: "employees/new", element: <EmployeeCreate /> },
        { path: "employees/:id/edit", element: <EmployeeEdit /> },
        { path: "salary", element: <SalaryList /> },
        { path: "promotion", element: <PromotionList /> },
        { path: "credential", element: <CredentialList /> },
        { path: "employment", element: <EmploymentList /> },
        { path: "leave-credit", element: <LeaveCreditList /> },
        { path: "leave-request", element: <LeaveRequestList /> },





    ],
  },
]);
