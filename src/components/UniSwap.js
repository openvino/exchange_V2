import React, { useEffect } from "react";
import Web3Provider, { Connectors } from "web3-react";
import {
  createCustomElement,
  DOMModel,
  byAttrVal,
} from "@adobe/react-webcomponent";
import Web3ReactManager from "../components/manager";
import WalletConnectApi from "@walletconnect/web3-subprovider";
import AppProvider from "../context";
// import Main from "./Main";

import "../i18n";
import { EthersProvider } from "../context/EthersContext";
import { ThirdwebProvider } from "thirdweb/react";
import App from "../App";

class UniSwapModel extends DOMModel {
  @byAttrVal() title;
  @byAttrVal() apiurl;
  @byAttrVal() providerurl;
  @byAttrVal() networkid;
  @byAttrVal() crowdsaleaddress;
  @byAttrVal() tokenaddress;
  @byAttrVal() redeemdate;
  @byAttrVal() tokenyear;
  @byAttrVal() tokenname;
  @byAttrVal() image;
  @byAttrVal() tokenicon;
  @byAttrVal() mapsapikey;
  @byAttrVal() shippingaccount;
}

function UniSwap({
  networkid,
  providerurl,
  apiurl,
  title,
  tokenaddress,
  crowdsaleaddress,
  redeemdate,
  tokenyear,
  tokenname,
  image,
  tokenicon,
  mapsapikey,
  shippingaccount,
}) {
  console.log(
    "**********************",
    "networkid",
    networkid,
    "providerurl",
    providerurl,
    "apiurl",
    apiurl,
    "title",
    title,
    "tokenaddress",
    tokenaddress,
    "crowdsaleaddress",
    crowdsaleaddress,
    "redeemdate",
    redeemdate,
    "tokenyear",
    tokenyear,
    "tokenname",
    tokenname,
    "image",
    image,
    "tokenicon",
    tokenicon,
    "mapsapikey",
    mapsapikey,
    "shippingaccount",
    shippingaccount
  );

  const { NetworkOnlyConnector, InjectedConnector, WalletConnectConnector } =
    Connectors;
  const Network = new NetworkOnlyConnector({
    providerURL: providerurl,
  });
  const Injected = new InjectedConnector({
    supportedNetworks: [parseInt(networkid)],
  });
  const WalletConnect = new WalletConnectConnector({
    api: WalletConnectApi,
    bridge: "https://bridge.walletconnect.org",
    supportedNetworkURLs: {
      [parseInt(networkid)]: providerurl,
    },
    defaultNetwork: parseInt(networkid),
  });
  const connectors = { Network, Injected, WalletConnect };

  const redeemDate = new Date(redeemdate);

  useEffect(() => {
    localStorage.setItem("uniswap.network", networkid);
    localStorage.setItem("uniswap.token", tokenaddress);
  }, [networkid, tokenaddress]);

  if (
    !providerurl ||
    !networkid ||
    !tokenname ||
    !tokenaddress ||
    !redeemdate ||
    isNaN(redeemDate) ||
    !tokenyear ||
    !tokenicon ||
    !apiurl ||
    !mapsapikey ||
    !shippingaccount
  ) {
    return <div>HOLA</div>;
  }

  return (
    <Web3Provider connectors={connectors} libraryName={"ethers.js"}>
      <EthersProvider providerUrl={providerurl} networkId={networkid}>
        <ThirdwebProvider>
          <Web3ReactManager>
            <AppProvider
              title={title}
              networkId={networkid}
              tokenAddress={tokenaddress}
              crowdsaleAddress={crowdsaleaddress}
              redeemDate={redeemDate}
              tokenYear={tokenyear}
              tokenName={tokenname}
              image={image}
              tokenIcon={tokenicon}
              apiUrl={apiurl}
              mapsApiKey={mapsapikey}
              shippingAccount={shippingaccount}
            >
              {/* <Main></Main> */}
              <App />
            </AppProvider>
          </Web3ReactManager>
        </ThirdwebProvider>
      </EthersProvider>
    </Web3Provider>
  );
}

export default UniSwap;
// export default createCustomElement(UniSwap, UniSwapModel, "container");
