import { useEffect, useRef } from 'react';

export function useInactivityTimeout(onInactive: () => void, timeoutMinutes = 120) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000; // Converte minutos para millisegundos

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onInactive();
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimeoutHandler = () => {
      resetTimeout();
    };

    // Configurar timeout inicial
    resetTimeout();

    // Adicionar listeners para atividade do usuário
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
    };
  }, [timeoutMs, onInactive]);
}
