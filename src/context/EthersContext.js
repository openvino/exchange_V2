import React, { createContext, useState, useContext, useEffect } from "react";
import { ethers } from "ethers";

const EthersContext = createContext(null);

export function EthersProvider({ children, providerUrl, networkId }) {
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const initializeProvider = async () => {
      try {
        const rpcProvider = new ethers.providers.JsonRpcProvider(providerUrl, {
          chainId: parseInt(networkId),
        });
        console.log("<<<<<<<<<<<<rpcProvider>>>>>>>>>>>>>>>>>", rpcProvider);

        setProvider(rpcProvider);
        console.log("Ethers provider initialized for network:", networkId);
      } catch (error) {
        console.error("Error initializing ethers provider:", error);
      }
    };

    if (providerUrl && networkId) {
      initializeProvider();
    }
  }, [providerUrl, networkId]);

  return (
    <EthersContext.Provider value={provider}>{children}</EthersContext.Provider>
  );
}

export function useEthers() {
  const context = useContext(EthersContext);
  if (context === undefined) {
    throw new Error("useEthers must be used within an EthersProvider");
  }
  return context;
}
