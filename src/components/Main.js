import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { Info } from "@styled-icons/material";
import Checkout from "./checkout/Checkout";
import { useAppContext } from "../context";
import { TradeButtons } from "./shared/TradeButtons";
import { useWeb3Context } from "web3-react";
import { ethers } from "ethers";
import { useTranslation } from "react-i18next";
import { ChainId, Token } from "@uniswap/sdk";

import {
  TOKEN_SYMBOLS,
  TOKEN_ADDRESSES,
  TRADE_TYPES,
  getExchangeRate,
  getCrowdsaleContract,
  calculateGasMargin,
  amountFormatter,
  getProviderOrSigner,
} from "../utils";

import {
  validateBuyHelper,
  buyHelper,
  validateCrowdsaleHelper,
  crowdsaleHelper,
  validateSellHelper,
  sellHelper,
  notifyBuyer,
} from "../utils/checkout-utils";

import {
  useTokenContract,
  useExchangeContract,
  useCrowdsaleContract,
  useAddressBalance,
  useAddressAllowance,
  useExchangeReserves,
  useRouterAllowance,
  useTokenSupply,
  useTokenCap,
  usePairContract,
  useReserves,
  useRouterContract,
} from "../hooks";
import Farming from "./farming/Farming";
import { useEthers } from "../context/EthersContext";

export default function Main(props) {
  // const { provider, signer, account } = useEthers();
  const { library, account } = useWeb3Context();
  const ethersProvider = useEthers();
  // console.log(provider, signer, account, "provider, signer, account");
  // console.log("prvder", prvder);

  console.log("Main props", props);

  const [state, setState] = useAppContext();
  console.log(
    "state!!!!!!!!!!!!!!!!!!!!!!!!!!1111!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
    state
  );

  const [showFarming, setShowFarming] = useState(false);

  // selected token
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState(
    TOKEN_SYMBOLS.ETH
  );

  const routerContract = useRouterContract();
  console.log("router", routerContract.address);

  const pairMTBwETH = usePairContract(state.tokenAddress);
  console.log("token", state.tokenAddress);
  console.log("pair", pairMTBwETH.address);

  // get exchange contracts
  const exchangeContractWINES = useExchangeContract(state.tokenAddress);
  const exchangeContractSelectedToken = useExchangeContract(state.tokenAddress);
  const exchangeContractDAI = useExchangeContract(TOKEN_ADDRESSES.DAI);

  // get token contracts
  const tokenContractWINES = useTokenContract(state.tokenAddress);
  const tokenContractSelectedToken = useTokenContract(state.tokenAddress);
  console.log(
    "tokenContractWINES",
    tokenContractWINES.address,
    "tokenContractSelectedToken",
    tokenContractSelectedToken,
    "/*/*/*/**/***/*/**/*/*/*/*/*/*/*/"
  );

  // crowdsale contract
  const crowdsaleContract = useCrowdsaleContract(state.crowdsaleAddress);
  console.log("crowdsaleContract", crowdsaleContract.address);

  // get balances
  // const balanceETH = useAddressBalance(account, TOKEN_ADDRESSES.ETH);
  const balanceETH = useAddressBalance(
    ethersProvider,
    // account,
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  );
  console.log("balanceETHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH", balanceETH);

  const balanceWINES = useAddressBalance(account, state.tokenAddress);
  const balanceSelectedToken = useAddressBalance(
    account,
    TOKEN_ADDRESSES[selectedTokenSymbol]
  );
  console.log(
    "balanceSelectedToken",
    balanceSelectedToken,
    "balanceWINES",
    balanceWINES,
    "balanceETH",
    balanceETH
  ); // ESto FALLA

  // tokenSupply
  const tokenSupply = useTokenSupply(tokenContractWINES);

  // token cap
  const tokenCap = useTokenCap(tokenContractWINES);

  // get allowances
  const allowanceWINES = useAddressAllowance(
    account,
    state.tokenAddress,
    routerContract && routerContract.address
  );
  const allowanceSelectedToken = useRouterAllowance(
    account,
    state.tokenAddress
  );

  const reserveWINESETH = useReserves(pairMTBwETH)["1"];
  const reserveWINESToken = useReserves(pairMTBwETH)["0"];

  console.log("reserveWINESETH", reserveWINESETH);
  console.log("reserveWINESToken", reserveWINESToken);
  const {
    reserveETH: reserveSelectedTokenETH,
    reserveToken: reserveSelectedTokenToken,
  } = useExchangeReserves(TOKEN_ADDRESSES[selectedTokenSymbol]);

  const reserveDAIETH = useAddressBalance(
    exchangeContractDAI && exchangeContractDAI.address,
    TOKEN_ADDRESSES.ETH
  );
  const reserveDAIToken = useAddressBalance(
    exchangeContractDAI && exchangeContractDAI.address,
    TOKEN_ADDRESSES.DAI
  );

  const [USDExchangeRateETH, setUSDExchangeRateETH] = useState();
  const [USDExchangeRateSelectedToken, setUSDExchangeRateSelectedToken] =
    useState();

  useEffect(() => {
    try {
      const exchangeRateDAI = getExchangeRate(reserveDAIETH, reserveDAIToken);

      if (selectedTokenSymbol === TOKEN_SYMBOLS.ETH) {
        setUSDExchangeRateETH(exchangeRateDAI);
      } else {
        const exchangeRateSelectedToken = getExchangeRate(
          reserveSelectedTokenETH,
          reserveSelectedTokenToken
        );
        if (exchangeRateDAI && exchangeRateSelectedToken) {
          setUSDExchangeRateSelectedToken(
            exchangeRateDAI
              .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)))
              .div(exchangeRateSelectedToken)
          );
        }
      }
    } catch {
      setUSDExchangeRateETH();
      setUSDExchangeRateSelectedToken();
    }
  }, [
    reserveDAIETH,
    reserveDAIToken,
    reserveSelectedTokenETH,
    reserveSelectedTokenToken,
    selectedTokenSymbol,
  ]);

  let [isCrowdsale, setCrowdsale] = useState();
  useEffect(() => {
    try {
      crowdsaleContract
        .isOpen()
        .then((open) => {
          setCrowdsale(open);
        })
        .catch((error) => {
          setCrowdsale(false);
        });
    } catch {
      setCrowdsale();
    }
  }, [crowdsaleContract]);

  const [crowdsaleExchangeRateETH, setCrowdsaleExchangeRateETH] = useState();
  const [crowdsaleExchangeRateUSD, setCrowdsaleExchangeRateUSD] = useState();
  useEffect(() => {
    try {
      crowdsaleContract
        .rate()
        .then((rate) => {
          const exchangeRateETH = rate.mul(
            ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18))
          );
          setCrowdsaleExchangeRateETH(exchangeRateETH);

          const exchangeRateUSD = USDExchangeRateETH.mul(
            ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18))
          ).div(exchangeRateETH);
          setCrowdsaleExchangeRateUSD(exchangeRateUSD);
        })
        .catch((error) => {
          setCrowdsaleExchangeRateETH();
          setCrowdsaleExchangeRateUSD();
        });
    } catch {
      setCrowdsaleExchangeRateETH();
      setCrowdsaleExchangeRateUSD();
    }
  }, [crowdsaleContract, USDExchangeRateETH]);

  const ready = !!(
    (isCrowdsale && tokenCap > tokenSupply + 6) ||
    (!isCrowdsale &&
      (account === null || allowanceWINES) &&
      (selectedTokenSymbol === "ETH" ||
        account === null ||
        allowanceSelectedToken) &&
      (account === null || balanceETH) &&
      (account === null || balanceWINES) &&
      (account === null || balanceSelectedToken) &&
      reserveWINESETH &&
      reserveWINESToken &&
      (selectedTokenSymbol === "ETH" || reserveSelectedTokenETH) &&
      (selectedTokenSymbol === "ETH" || reserveSelectedTokenToken) &&
      selectedTokenSymbol &&
      (USDExchangeRateETH || USDExchangeRateSelectedToken))
  );

  function _dollarize(amount, exchangeRate) {
    if (exchangeRate) {
      return amount
        .mul(exchangeRate)
        .div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)));
    }

    return ethers.BigNumber.from(0);
  }

  function dollarize(amount) {
    return _dollarize(
      amount,
      selectedTokenSymbol === TOKEN_SYMBOLS.ETH
        ? USDExchangeRateETH
        : USDExchangeRateSelectedToken
    );
  }

  const [dollarPrice, setDollarPrice] = useState();
  useEffect(() => {
    try {
      const WINESExchangeRateETH = getExchangeRate(
        reserveWINESToken,
        reserveWINESETH
      );
      setDollarPrice(
        WINESExchangeRateETH.mul(USDExchangeRateETH).div(
          ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18))
        )
      );
    } catch {
      setDollarPrice();
    }
  }, [USDExchangeRateETH, reserveWINESETH, reserveWINESToken]);

  async function unlock(buyingWINES = true) {
    const contract = buyingWINES
      ? tokenContractSelectedToken
      : tokenContractWINES;
    const spenderAddress = buyingWINES
      ? exchangeContractSelectedToken.address
      : routerContract.address;

    const estimatedGasLimit = await contract.estimateGas.approve(
      spenderAddress,
      ethers.constants.MaxUint256
    );
    const estimatedGasPrice = await library
      .getGasPrice()
      .then((gasPrice) =>
        gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100))
      );

    return contract.approve(spenderAddress, ethers.constants.MaxUint256, {
      gasLimit: calculateGasMargin(estimatedGasLimit),
      gasPrice: estimatedGasPrice,
    });
  }

  // buy functionality
  const validateBuy = useCallback(
    (numberOfWINES) => {
      return validateBuyHelper(
        numberOfWINES,
        allowanceSelectedToken,
        balanceETH,
        balanceSelectedToken,
        reserveWINESETH,
        reserveWINESToken,
        reserveSelectedTokenETH,
        reserveSelectedTokenToken,
        selectedTokenSymbol
      );
    },
    [
      allowanceSelectedToken,
      balanceETH,
      balanceSelectedToken,
      reserveWINESETH,
      reserveWINESToken,
      reserveSelectedTokenETH,
      reserveSelectedTokenToken,
      selectedTokenSymbol,
    ]
  );

  async function buy(maximumInputValue, outputValue) {
    if (state.emailValid) {
      let response = await buyHelper(
        account,
        maximumInputValue,
        outputValue,
        selectedTokenSymbol,
        library,
        routerContract,
        state.tokenAddress
      );

      await notifyBuyer(state.apiUrl, state.count, account, state.email);

      return response;
    } else {
      throw new Error("Invalid email");
    }
  }

  // crowdsale functionality
  const validateCrowdsale = useCallback(
    (numberOfWINES) => {
      return validateCrowdsaleHelper(
        numberOfWINES,
        allowanceSelectedToken,
        balanceETH,
        balanceSelectedToken,
        crowdsaleExchangeRateETH,
        selectedTokenSymbol
      );
    },
    [
      allowanceSelectedToken,
      balanceETH,
      balanceSelectedToken,
      crowdsaleExchangeRateETH,
      selectedTokenSymbol,
    ]
  );

  async function crowdsale(maximumInputValue, outputValue) {
    if (state.emailValid) {
      let response = await crowdsaleHelper(
        maximumInputValue,
        outputValue,
        selectedTokenSymbol,
        library,
        account,
        getCrowdsaleContract(state.crowdsaleAddress, library, account)
      );

      await notifyBuyer(state.apiUrl, state.count, account, state.email);

      return response;
    } else {
      throw new Error("Invalid email");
    }
  }

  // sell functionality
  const validateSell = useCallback(
    (numberOfWINES) => {
      return validateSellHelper(
        numberOfWINES,
        allowanceWINES,
        balanceETH,
        balanceWINES,
        reserveWINESETH,
        reserveWINESToken,
        reserveSelectedTokenETH,
        reserveSelectedTokenToken,
        selectedTokenSymbol
      );
    },
    [
      allowanceWINES,
      balanceETH,
      balanceWINES,
      reserveWINESETH,
      reserveWINESToken,
      reserveSelectedTokenETH,
      reserveSelectedTokenToken,
      selectedTokenSymbol,
    ]
  );

  async function sell(inputValue, minimumOutputValue) {
    return sellHelper(
      account,
      inputValue,
      minimumOutputValue,
      selectedTokenSymbol,
      library,
      routerContract,
      state.tokenAddress
    );
  }

  async function transferShippingCosts(amount) {
    let signer = getProviderOrSigner(library, account);

    return signer.sendTransaction({
      to: ethers.utils.getAddress(state.shippingAccount),
      // value: ethers.utils.parseEther("0.001")
      value: amount,
    });
  }

  async function burn(amount) {
    const parsedAmount = ethers.utils.parseUnits(amount, 18);

    const estimatedGasPrice = await library
      .getGasPrice()
      .then((gasPrice) =>
        gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100))
      );

    const estimatedGasLimit = await tokenContractWINES.estimate.burn(
      parsedAmount
    );

    return tokenContractWINES.burn(parsedAmount, {
      gasLimit: calculateGasMargin(estimatedGasLimit),
      gasPrice: estimatedGasPrice,
    });
  }

  function openFarm() {
    setShowFarming(true);
  }

  function handleRedeemClick() {
    setState((state) => ({
      ...state,
      visible: !state.visible,
      tradeType: TRADE_TYPES.REDEEM,
    }));
  }

  // --------------------------------------------------------------
  const [currentTransaction, _setCurrentTransaction] = useState({});
  const setCurrentTransaction = useCallback((hash, type, amount) => {
    _setCurrentTransaction({ hash, type, amount });
  }, []);
  const clearCurrentTransaction = useCallback(() => {
    _setCurrentTransaction({});
  }, []);

  const [showConnect, setShowConnect] = useState(false);
  const [showWorks, setShowWorks] = useState(false);

  const { t } = useTranslation();

  return (
    <Container>
      <CardWrapper>
        <div>
          <Farm onClick={openFarm}> {t("labels.farm")} </Farm>
          <Redeem onClick={handleRedeemClick}> {t("labels.redeem")} </Redeem>
        </div>
        <ImageContainer>
          <Image src={state.image} />
        </ImageContainer>
        <MarketData>
          <Title>
            {state.title} ({state.tokenName}){" "}
            <InfoIcon
              onClick={(e) => {
                e.preventDefault();
                setState((state) => ({ ...state, visible: !state.visible }));
                setShowWorks(true);
              }}
            ></InfoIcon>
          </Title>
          {isCrowdsale && (
            <CurrentPrice>
              {crowdsaleExchangeRateUSD
                ? `$${amountFormatter(crowdsaleExchangeRateUSD, 18, 2)} USD`
                : "$0.00"}
            </CurrentPrice>
          )}
          {!isCrowdsale && (
            <CurrentPrice>
              {dollarPrice
                ? `$${amountFormatter(dollarPrice, 18, 2)} USD`
                : "$0.00"}
            </CurrentPrice>
          )}
          <TokenIconContainer>
            <TokenIconText>{state.tokenYear.substring(2, 4)}</TokenIconText>
            <TokenIcon src={state.tokenIcon}></TokenIcon>
          </TokenIconContainer>
          <TradeButtons
            balanceWINES={balanceWINES}
            isCrowdsale={isCrowdsale}
          ></TradeButtons>
        </MarketData>
      </CardWrapper>

      <Checkout
        USDExchangeRateETH={USDExchangeRateETH}
        transferShippingCosts={transferShippingCosts}
        tokenSupply={tokenSupply}
        tokenCap={tokenCap}
        selectedTokenSymbol={selectedTokenSymbol}
        setSelectedTokenSymbol={setSelectedTokenSymbol}
        ready={ready}
        unlock={unlock}
        validateBuy={validateBuy}
        buy={buy}
        validateSell={validateSell}
        sell={sell}
        validateCrowdsale={validateCrowdsale}
        crowdsale={crowdsale}
        burn={burn}
        balanceWINES={balanceWINES}
        dollarPrice={dollarPrice}
        reserveWINESToken={reserveWINESToken}
        dollarize={dollarize}
        showConnect={showConnect}
        setShowConnect={setShowConnect}
        currentTransactionHash={currentTransaction.hash}
        currentTransactionType={currentTransaction.type}
        currentTransactionAmount={currentTransaction.amount}
        setCurrentTransaction={setCurrentTransaction}
        clearCurrentTransaction={clearCurrentTransaction}
        showWorks={showWorks}
        setShowWorks={setShowWorks}
      />
      {showFarming && (
        <Farming
          setShowFarming={setShowFarming}
          tokenAddress={state.tokenAddress}
        ></Farming>
      )}
    </Container>
  );
}

const Container = styled.div`
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;

  margin: 64px;

  @media only screen and (max-width: 480px) {
    margin: 32px;
  }
`;

const CardWrapper = styled.div`
  max-width: 750px;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  color: #f1ede2;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  cursor: default;
  padding: 32px 32px 16px 32px;
  z-index: 1;
  transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);
  box-sizing: border-box;

  @media only screen and (max-width: 480px) {
    /* For mobile phones: */
    // flex-direction: column;
  }
`;

const Farm = styled.div`
  position: absolute;
  top: 16px;
  right: 86px;
  font-weight: 300;
  cursor: pointer;

  :hover {
    text-decoration: underline;
  }
`;

const Redeem = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  font-weight: 300;
  cursor: pointer;

  :hover {
    text-decoration: underline;
  }
`;

const Title = styled.p`
  font-weight: 500;
  font-size: 24px;
  line-height: 126.7%;
  margin: 0;

  @media only screen and (max-width: 480px) {
    /* For mobile phones: */
    font-size: 22px;
  }
`;

const CurrentPrice = styled.p`
  font-size: 18px;
  margin: 0px;
  margin-bottom: 0.5rem;
  font-feature-settings: "tnum" on, "onum" on;

  @media only screen and (max-width: 480px) {
    /* For mobile phones: */
    margin-top: 8px;
    font-size: 14px;
  }
`;

const MarketData = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

const ImageContainer = styled.div`
  width: 43%;

  @media only screen and (max-width: 320px) {
    display: none;
  }
`;

const Image = styled.img`
  max-width: 66%;
  height: auto;
  max-height: 90vh;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: -50px;
`;

const InfoIcon = styled(Info)`
  color: white;
  height: 25px;
  width: 25px;
  cursor: pointer;
  padding: 0 8px;
  padding-bottom: 4px;
  box-sizing: content-box;
`;
const TokenIconContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 8px 0;
`;

const TokenIconText = styled.div`
  font-size: 79.5px;
  font-weight: 500;
  line-height: 0.9;
  padding-right: 8px;

  @media only screen and (max-width: 600px) {
    font-size: 60px;
  }
`;

const TokenIcon = styled.img`
  width: 42px;
  height: 42px;

  @media only screen and (max-width: 600px) {
    width: 36px;
    height: 36px;
  }
`;
