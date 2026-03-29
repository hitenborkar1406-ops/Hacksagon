import { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(socket.connected);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const onConnect    = () => { setConnected(true);  setLastSync(new Date()); };
    const onDisconnect = () =>   setConnected(false);
    const onVitals     = () =>   setLastSync(new Date());

    socket.on('connect',     onConnect);
    socket.on('disconnect',  onDisconnect);
    socket.on('vitals_update', onVitals);
    socket.on('vitals:new',    onVitals);

    // Ensure connected
    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect',    onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('vitals_update', onVitals);
      socket.off('vitals:new',    onVitals);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, lastSync }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);
