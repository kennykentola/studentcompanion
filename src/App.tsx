import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";

import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";

import Tasks from "@/pages/Tasks";
import Timetable from "@/pages/Timetable";
import Grades from "@/pages/Grades";
import Chat from "@/pages/Chat";
import Calculator from "@/pages/Calculator";
import Settings from "@/pages/Settings";
import DirectMessage from "@/pages/DirectMessage";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Disclaimer from "@/pages/Disclaimer";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chat/dm/:userId" element={<DirectMessage />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
