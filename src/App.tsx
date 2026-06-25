import React, { useState } from "react";
import Home from "./Home";
import LandingPage from "./LandingPage";

type User = {
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  exp: number;
  iat: number;
  token?: string;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  if (user) {
    return <Home user={user} onLogout={() => setUser(null)} />;
  }

  return <LandingPage onLogin={setUser} />;
};

export default App;
