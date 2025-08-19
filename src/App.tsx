import React from 'react';
import CameraList from './CameraList.tsx';
import Login from './Login.tsx';
import { AuthProvider, useAuth } from './auth.tsx';

function MainApp() {
  const { user } = useAuth();
  return user ? <CameraList /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
