import { createContext, useContext, useState } from 'react';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <RoomContext.Provider value={{ selectedGroup, setSelectedGroup }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within RoomProvider');
  return ctx;
};
