import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import ResetPassword from "@/pages/ResetPassword";

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
import Flashcards from "@/pages/Flashcards";
import Resources from "@/pages/Resources";
import StudyRooms from "@/pages/StudyRooms";
import CourseReviews from "@/pages/CourseReviews";
import Budget from "@/pages/Budget";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/study-rooms" element={<StudyRooms />} />
              <Route path="/reviews" element={<CourseReviews />} />
              <Route path="/budget" element={<Budget />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
