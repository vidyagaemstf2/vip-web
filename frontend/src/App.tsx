import VIPDashboard from "./components/VIPDashboard";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="container mx-auto p-4">
        <VIPDashboard />
      </div>
    </AuthProvider>
  );
}

export default App;
