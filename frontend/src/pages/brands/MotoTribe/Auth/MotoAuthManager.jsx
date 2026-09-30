import { useEffect } from "react";
import { startMotoTribeTokenRefresh } from "./authSession";

function MotoAuthManager() {
  useEffect(() => {
    const stopTokenRefresh =
      startMotoTribeTokenRefresh();

    return () => {
      stopTokenRefresh();
    };
  }, []);

  return null;
}

export default MotoAuthManager;