import { useEffect, useState, useCallback, useMemo } from "react";
import { useWeb3Context } from "web3-react";

import {
  isAddress,
  getTokenContract,
  getExchangeContract,
  getTokenExchangeAddressFromFactory,
  getEtherBalance,
  getTokenBalance,
  getTokenAllowance,
  TOKEN_ADDRESSES,
  ROUTER_ADDRESS,
  getCrowdsaleContract,
  getPairContract,
  getNetworkId,
  getRouterContract,
} from "../utils";
import { pack, keccak256 } from "@ethersproject/solidity";
import { getCreate2Address } from "@ethersproject/address";
import { utils } from "ethers";
import { WETH, INIT_CODE_HASH, FACTORY_ADDRESS } from "@uniswap/sdk";

export function useCrowdsaleContract(
  crowdsaleAddress,
  withSignerIfPossible = true
) {
  const { library, account } = useWeb3Context();

  return useMemo(() => {
    try {
      return getCrowdsaleContract(
        crowdsaleAddress,
        library,
        withSignerIfPossible ? account : undefined
      );
    } catch {
      return null;
    }
  }, [account, library, crowdsaleAddress, withSignerIfPossible]);
}

export function useTokenContract(tokenAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context();

  return useMemo(() => {
    try {
      return getTokenContract(
        tokenAddress,
        library,
        withSignerIfPossible ? account : undefined
      );
    } catch {
      return null;
    }
  }, [account, library, tokenAddress, withSignerIfPossible]);
}

export function useRouterContract(withSignerIfPossible = true) {
  const { library, account } = useWeb3Context();

  return useMemo(() => {
    try {
      return getRouterContract(
        library,
        withSignerIfPossible ? account : undefined
      );
    } catch (e) {
      return null;
    }
  }, [account, library, withSignerIfPossible]);
}

export function useExchangeContract(tokenAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context();

  const [exchangeAddress, setExchangeAddress] = useState();
  useEffect(() => {
    if (isAddress(tokenAddress)) {
      let stale = false;
      getTokenExchangeAddressFromFactory(tokenAddress, library).then(
        (exchangeAddress) => {
          if (!stale) {
            setExchangeAddress(exchangeAddress);
          }
        }
      );
      return () => {
        stale = true;
        setExchangeAddress();
      };
    }
  }, [library, tokenAddress]);

  return useMemo(() => {
    try {
      return getExchangeContract(
        exchangeAddress,
        library,
        withSignerIfPossible ? account : undefined
      );
    } catch (e) {
      return null;
    }
  }, [exchangeAddress, library, withSignerIfPossible, account]);
}

export function usePairContract(tokenAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context();

  return useMemo(() => {
    try {
      const token1 = WETH[getNetworkId()].address;
      const token0 = tokenAddress;

      const pair = getCreate2Address(
        FACTORY_ADDRESS,
        keccak256(["bytes"], [pack(["address", "address"], [token0, token1])]),
        INIT_CODE_HASH
      );
      return getPairContract(
        pair,
        library,
        withSignerIfPossible ? account : undefined
      );
    } catch {
      return null;
    }
  }, [account, library, tokenAddress, withSignerIfPossible]);
}

export function useReserves(pairContract) {
  const [reserves, setReserves] = useState();

  const updateReserves = useCallback(() => {
    if (!!pairContract) {
      pairContract
        .getReserves()
        .then((value) => {
          setReserves(value);
        })
        .catch((error) => {
          setReserves(null);
        });
      return () => {
        setReserves();
      };
    }
  }, [pairContract]);

  useEffect(() => {
    return updateReserves();
  }, [updateReserves]);

  if (reserves) {
    return reserves;
  } else {
    return {
      0: null,
      1: null,
    };
  }
}

export function useAddressBalance(address, tokenAddress) {
  const { library } = useWeb3Context();

  const [balance, setBalance] = useState();

  const updateBalance = useCallback(() => {
    if (
      isAddress(address) &&
      (tokenAddress === "ETH" || isAddress(tokenAddress))
    ) {
      let stale = false;

      (tokenAddress === "ETH"
        ? getEtherBalance(address, library)
        : getTokenBalance(tokenAddress, address, library)
      )
        .then((value) => {
          if (!stale) {
            setBalance(value);
          }
        })
        .catch((error) => {
          if (!stale) {
            setBalance(null);
          }
        });
      return () => {
        stale = true;
        setBalance();
      };
    }
  }, [address, library, tokenAddress]);

  useEffect(() => {
    return updateBalance();
  }, [updateBalance]);

  // useBlockEffect(updateBalance)

  return balance;
}

export function useTokenSupply(contract) {
  const [tokenSupply, setTokenSupply] = useState();

  const updateTokenSupply = useCallback(() => {
    if (!!contract) {
      let stale = false;

      contract
        .totalSupply()
        .then((value) => {
          if (!stale) {
            setTokenSupply(value);
          }
        })
        .catch(() => {
          if (!stale) {
            setTokenSupply(null);
          }
        });
      return () => {
        stale = true;
        setTokenSupply();
      };
    }
  }, [contract]);

  useEffect(() => {
    return updateTokenSupply();
  }, [updateTokenSupply]);

  // useBlockEffect(updateTokenSupply)

  return tokenSupply && Math.round(Number(utils.formatEther(tokenSupply)));
}

export function useTokenCap(contract) {
  const [tokenCap, setTokenCap] = useState();

  const updateTokenCap = useCallback(() => {
    if (!!contract) {
      let stale = false;

      contract
        .cap()
        .then((value) => {
          if (!stale) {
            setTokenCap(value);
          }
        })
        .catch(() => {
          if (!stale) {
            setTokenCap(null);
          }
        });
      return () => {
        stale = true;
        setTokenCap();
      };
    }
  }, [contract]);

  useEffect(() => {
    return updateTokenCap();
  }, [updateTokenCap]);

  // useBlockEffect(updateTokenCap)

  return tokenCap && Math.round(Number(utils.formatEther(tokenCap)));
}

export function useExchangeReserves(tokenAddress) {
  const exchangeContract = useExchangeContract(tokenAddress);

  const reserveETH = useAddressBalance(
    exchangeContract && exchangeContract.address,
    TOKEN_ADDRESSES.ETH
  );
  const reserveToken = useAddressBalance(
    exchangeContract && exchangeContract.address,
    tokenAddress
  );

  return { reserveETH, reserveToken };
}

export function useAddressAllowance(address, tokenAddress, spenderAddress) {
  const { library } = useWeb3Context();

  const [allowance, setAllowance] = useState();

  const updateAllowance = useCallback(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      isAddress(spenderAddress)
    ) {
      let stale = false;

      getTokenAllowance(address, tokenAddress, spenderAddress, library)
        .then((allowance) => {
          if (!stale) {
            setAllowance(allowance);
          }
        })
        .catch(() => {
          if (!stale) {
            setAllowance(null);
          }
        });

      return () => {
        stale = true;
        setAllowance();
      };
    }
  }, [address, library, spenderAddress, tokenAddress]);

  useEffect(() => {
    return updateAllowance();
  }, [updateAllowance]);

  // useBlockEffect(updateAllowance)

  return allowance;
}

export function useExchangeAllowance(address, tokenAddress) {
  const exchangeContract = useExchangeContract(tokenAddress);

  return useAddressAllowance(
    address,
    tokenAddress,
    exchangeContract && exchangeContract.address
  );
}

export function useRouterAllowance(address, tokenAddress) {
  const routerContract = useRouterContract();

  return useAddressAllowance(
    address,
    tokenAddress,
    routerContract && routerContract.address
  );
}
