import React, { useState } from 'react';
import CameraList from './CameraList.tsx';

function App() {
  const [user, setUser] = useState<string | null>(null);

  return <CameraList />;
}

export default App;
