import React, { useState } from 'react';
import CameraList from './CameraList.tsx';
import LoginLDAP from './LoginLDAP.tsx';

function App() {
  const [user, setUser] = useState<string | null>(null);

  if (!user) {
    return <LoginLDAP onLogin={setUser} />;
  }
  return <CameraList />;
}

export default App;
