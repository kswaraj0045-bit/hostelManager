import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import Navbar from './components/common/Navbar.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import { useState } from 'react';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Groups from './pages/Groups.jsx';
import GroupDetail from './pages/GroupDetail.jsx';
import Expenses from './pages/Expenses.jsx';
import Chores from './pages/Chores.jsx';
import Mess from './pages/Mess.jsx';
import Bills from './pages/Bills.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import SettleUp from './pages/SettleUp.jsx';
import Activity from './pages/Activity.jsx';
import RoomSetup from './pages/RoomSetup.jsx';
import Profile from './pages/Profile.jsx';
import Calendar from './pages/Calendar.jsx';
import Analytics from './pages/Analytics.jsx';
import ShoppingList from './pages/ShoppingList.jsx';
import Balances from './pages/Balances.jsx';
import HistoryPage from './pages/History.jsx';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col md:ml-60 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/room-setup" element={<ProtectedRoute><RoomSetup /></ProtectedRoute>} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <Layout><Groups /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/:id"
                  element={
                    <ProtectedRoute>
                      <Layout><GroupDetail /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <ProtectedRoute>
                      <Layout><Expenses /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/balances"
                  element={
                    <ProtectedRoute>
                      <Layout><Balances /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <Layout><HistoryPage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chores"
                  element={
                    <ProtectedRoute>
                      <Layout><Chores /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mess"
                  element={
                    <ProtectedRoute>
                      <Layout><Mess /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bills"
                  element={
                    <ProtectedRoute>
                      <Layout><Bills /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai"
                  element={
                    <ProtectedRoute>
                      <Layout><AIAssistant /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-assistant"
                  element={
                    <ProtectedRoute>
                      <Layout><AIAssistant /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settle/:groupId"
                  element={
                    <ProtectedRoute>
                      <Layout><SettleUp /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activity"
                  element={
                    <ProtectedRoute>
                      <Layout><Activity /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout><Profile /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Layout><Calendar /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Layout><Analytics /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shopping"
                  element={
                    <ProtectedRoute>
                      <Layout><ShoppingList /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </NotificationProvider>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
