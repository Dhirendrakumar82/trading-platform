import { Navigate, Outlet, useLocation } from "react-router-dom";
import { TradingProvider } from "../context/TradingContext.jsx";

export default function ProtectedRoute() {
  const location = useLocation();
  const user = localStorage.getItem("tradex_user");
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // The provider lives here so prices/trades survive navigation between pages.
  return <TradingProvider><Outlet /></TradingProvider>;
}
