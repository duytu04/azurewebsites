import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import CustomersPage from "./pages/CustomersPage";
import LoginPage from "./pages/LoginPage";
import OrdersPage from "./pages/OrdersPage";
import ProductsPage from "./pages/ProductsPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orders" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/customers"
        element={(
          <ProtectedRoute roles={["Admin"]}>
            <CustomersPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/products"
        element={(
          <ProtectedRoute roles={["Admin"]}>
            <ProductsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/orders"
        element={(
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
}

export default App;
