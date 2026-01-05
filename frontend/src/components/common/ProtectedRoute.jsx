import { Navigate } from "react-router-dom";
import { useStore } from "../../app/store/StoreProvider.jsx";

export default function ProtectedRoute({ children }) {
  const { state } = useStore();
  const token = state.auth?.token;

  if (!token) return <Navigate to="/login" replace />;
  return children;
}
