import { ethers } from "ethers";
// import axios from "axios";
import { WETH } from "@uniswap/sdk";

import {
  TOKEN_SYMBOLS,
  TOKEN_ADDRESSES,
  ERROR_CODES,
  calculateSlippageBounds,
  calculateAmount,
  calculateCrowdsaleAmount,
  calculateGasMargin,
  getNetworkId,
} from "../utils";

// denominated in seconds
const DEADLINE_FROM_NOW = 60 * 15;

export function validateBuyHelper(
  numberOfWINES,
  allowanceSelectedToken,
  balanceETH,
  balanceSelectedToken,
  reserveWINESETH,
  reserveWINESToken,
  reserveSelectedTokenETH,
  reserveSelectedTokenToken,
  selectedTokenSymbol
) {
  // validate passed amount
  let parsedValue;
  try {
    parsedValue = ethers.utils.parseUnits(numberOfWINES, 18);
  } catch (error) {
    error.code = ERROR_CODES.INVALID_AMOUNT;
    throw error;
  }

  let requiredValueInSelectedToken;
  try {
    requiredValueInSelectedToken = calculateAmount(
      selectedTokenSymbol,
      TOKEN_SYMBOLS.MTB,
      parsedValue,
      reserveWINESETH,
      reserveWINESToken,
      reserveSelectedTokenETH,
      reserveSelectedTokenToken
    );
  } catch (error) {
    error.code = ERROR_CODES.INVALID_TRADE;
    throw error;
  }

  // get max slippage amount
  const { maximum } = calculateSlippageBounds(requiredValueInSelectedToken);

  // the following are 'non-breaking' errors that will still return the data
  let errorAccumulator;
  // validate minimum ether balance
  if (balanceETH && balanceETH.lt(ethers.utils.parseEther(".01"))) {
    const error = Error();
    error.code = ERROR_CODES.INSUFFICIENT_ETH_GAS;
    if (!errorAccumulator) {
      errorAccumulator = error;
    }
  }

  // validate minimum selected token balance
  if (balanceSelectedToken && maximum && balanceSelectedToken.lt(maximum)) {
    const error = Error();
    error.code = ERROR_CODES.INSUFFICIENT_SELECTED_TOKEN_BALANCE;
    if (!errorAccumulator) {
      errorAccumulator = error;
    }
  }

  // validate allowance
  if (selectedTokenSymbol !== "ETH") {
    if (
      allowanceSelectedToken &&
      maximum &&
      allowanceSelectedToken.lt(maximum)
    ) {
      const error = Error();
      error.code = ERROR_CODES.INSUFFICIENT_ALLOWANCE;
      if (!errorAccumulator) {
        errorAccumulator = error;
      }
    }
  }

  return {
    inputValue: requiredValueInSelectedToken,
    maximumInputValue: maximum,
    outputValue: parsedValue,
    error: errorAccumulator,
  };
}

export async function buyHelper(
  address,
  maximumInputValue,
  outputValue,
  selectedTokenSymbol,
  library,
  routerContract,
  tokenAddress
) {
  const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW;

  const estimatedGasPrice = await library
    .getGasPrice()
    .then((gasPrice) =>
      gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100))
    );

  const estimatedGasLimit =
    await routercontract.estimateGas.swapETHForExactTokens(
      outputValue,
      [WETH[getNetworkId()].address, tokenAddress],
      address,
      deadline,
      {
        value: maximumInputValue,
      }
    );
  return routerContract.swapETHForExactTokens(
    outputValue,
    [WETH[getNetworkId()].address, tokenAddress],
    address,
    deadline,
    {
      value: maximumInputValue,
      gasLimit: calculateGasMargin(estimatedGasLimit),
      gasPrice: estimatedGasPrice,
    }
  );
}

export function validateCrowdsaleHelper(
  numberOfWINES,
  allowanceSelectedToken,
  balanceETH,
  balanceSelectedToken,
  crowdsaleExchangeRateETH,
  selectedTokenSymbol
) {
  // validate passed amount
  let parsedValue;
  try {
    parsedValue = ethers.utils.parseUnits(numberOfWINES, 18);
  } catch (error) {
    error.code = ERROR_CODES.INVALID_AMOUNT;
    throw error;
  }

  let requiredValueInSelectedToken;
  try {
    requiredValueInSelectedToken = calculateCrowdsaleAmount(
      parsedValue,
      crowdsaleExchangeRateETH
    );
  } catch (error) {
    error.code = ERROR_CODES.INVALID_TRADE;
    throw error;
  }

  // get max slippage amount
  const { maximum } = calculateSlippageBounds(requiredValueInSelectedToken);

  // the following are 'non-breaking' errors that will still return the data
  let errorAccumulator;
  // validate minimum ether balance
  if (balanceETH && balanceETH.lt(ethers.utils.parseEther(".01"))) {
    const error = Error();
    error.code = ERROR_CODES.INSUFFICIENT_ETH_GAS;
    if (!errorAccumulator) {
      errorAccumulator = error;
    }
  }

  // validate minimum selected token balance
  if (balanceSelectedToken && maximum && balanceSelectedToken.lt(maximum)) {
    const error = Error();
    error.code = ERROR_CODES.INSUFFICIENT_SELECTED_TOKEN_BALANCE;
    if (!errorAccumulator) {
      errorAccumulator = error;
    }
  }

  // validate allowance
  if (selectedTokenSymbol !== "ETH") {
    if (
      allowanceSelectedToken &&
      maximum &&
      allowanceSelectedToken.lt(maximum)
    ) {
      const error = Error();
      error.code = ERROR_CODES.INSUFFICIENT_ALLOWANCE;
      if (!errorAccumulator) {
        errorAccumulator = error;
      }
    }
  }

  return {
    inputValue: requiredValueInSelectedToken,
    maximumInputValue: requiredValueInSelectedToken,
    outputValue: parsedValue,
    error: errorAccumulator,
  };
}

export async function crowdsaleHelper(
  maximumInputValue,
  outputValue,
  selectedTokenSymbol,
  library,
  account,
  crowdsaleContract
) {
  let estimatedGasPrice = null;

  estimatedGasPrice = await library
    .getGasPrice()
    .then((gasPrice) =>
      gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100))
    );

  if (selectedTokenSymbol === TOKEN_SYMBOLS.ETH) {
    const estimatedGasLimit = await crowdsalecontract.estimateGas
      .buyTokens(account, {
        value: maximumInputValue,
      })
      .catch(console.log);

    return crowdsaleContract.buyTokens(account, {
      value: maximumInputValue,
      gasLimit: calculateGasMargin(estimatedGasLimit),
      gasPrice: estimatedGasPrice,
    });
  }
}

export async function notifyBuyer(url, amount, account, email) {
  const body = {
    public_key: account,
    email: email,
    amount: amount,
  };

  try {
    const response = await fetch(`${url}/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to notify buyer");
    }

    return await response.json();
  } catch (error) {
    console.error("Error notifying buyer:", error);
    throw error;
  }
}

// export async function notifyBuyer(url, amount, account, email) {
//   const body = {
//     public_key: account,
//     email: email,
//     amount: amount,
//   };

//   return await axios.post(`${url}/sales`, body);
//}

export function validateSellHelper(
  numberOfWINES,
  allowanceWINES,
  balanceETH,
  balanceWINES,
  reserveWINESETH,
  reserveWINESToken,
  reserveSelectedTokenETH,
  reserveSelectedTokenToken,
  selectedTokenSymbol
) {
  // validate passed amount
  let parsedValue;
  try {
    parsedValue = ethers.utils.parseUnits(numberOfWINES, 18);
  } catch (error) {
    error.code = ERROR_CODES.INVALID_AMOUNT;
    throw error;
  }

  // how much ETH or tokens the sale will result in
  let requiredValueInSelectedToken;
  try {
    requiredValueInSelectedToken = calculateAmount(
      TOKEN_SYMBOLS.MTB,
      selectedTokenSymbol,
      parsedValue,
      reserveWINESETH,
      reserveWINESToken,
      reserveSelectedTokenETH,
      reserveSelectedTokenToken
    );
  } catch (error) {
    error.code = ERROR_CODES.INVALID_EXCHANGE;
    throw error;
  }

  // slippage-ized
  const { minimum } = calculateSlippageBounds(requiredValueInSelectedToken);

  // the following are 'non-breaking' errors that will still return the data
  let errorAccumulator;
  // validate minimum ether balance
  if (balanceETH.lt(ethers.utils.parseEther(".01"))) {
    const error = Error();
    error.code = ERROR_CODES.INSUFFICIENT_ETH_GAS;
    if (!errorAccumulator) {
      errorAccumulator = error;
    }
  }

  // validate minimum wine balance
  if (balanceWINES.lt(parsedValue)) {
    const error = Error();
    error.code = ERROR_CODES.INSUFFICIENT_SELECTED_TOKEN_BALANCE;
    if (!errorAccumulator) {
      errorAccumulator = error;
    }
  }

  // validate allowance
  if (allowanceWINES.lt(parsedValue)) {
    const error = Error();
    error.code = ERROR_CODES.INSUFFICIENT_ALLOWANCE;
    if (!errorAccumulator) {
      errorAccumulator = error;
    }
  }

  return {
    inputValue: parsedValue,
    outputValue: requiredValueInSelectedToken,
    minimumOutputValue: minimum,
    error: errorAccumulator,
  };
}

export async function sellHelper(
  address,
  inputValue,
  minimumOutputValue,
  selectedTokenSymbol,
  library,
  routerContract,
  tokenAddress
) {
  const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW;

  const estimatedGasPrice = await library
    .getGasPrice()
    .then((gasPrice) =>
      gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100))
    );

  const estimatedGasLimit =
    await routercontract.estimateGas.swapExactTokensForETH(
      inputValue,
      minimumOutputValue,
      [tokenAddress, WETH[getNetworkId()].address],
      address,
      deadline
    );
  return routerContract.swapExactTokensForETH(
    inputValue,
    minimumOutputValue,
    [tokenAddress, WETH[getNetworkId()].address],
    address,
    deadline,
    {
      gasLimit: calculateGasMargin(estimatedGasLimit),
      gasPrice: estimatedGasPrice,
    }
  );
}
