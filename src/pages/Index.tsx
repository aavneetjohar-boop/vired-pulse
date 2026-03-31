import { useState } from "react";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (email: string, isAdminUser: boolean) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    setIsAdmin(isAdminUser);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setIsAdmin(false);
  };

  return isLoggedIn ? (
    <DashboardPage userEmail={userEmail} isAdmin={isAdmin} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
