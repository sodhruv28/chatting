import { createContext, useContext, useEffect, useState } from "react";
import socket from "../socket";

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const onIncoming = ({ from, offer, caller }) => {
      setIncomingCall({ from, offer, caller }); // ✅ store caller
    };

    const onEnded = () => {
      setIncomingCall(null); // ✅ clear call globally
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:ended", onEnded);
    };
  }, []);

  return (
    <CallContext.Provider value={{ incomingCall, setIncomingCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
