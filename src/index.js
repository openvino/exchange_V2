import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ThirdwebProvider } from "thirdweb/react";
import UniSwap from "./components/UniSwap";

// if (!customElements.get("uniswap-enchainte")) {
//   window.customElements.define("uniswap-enchainte");
// }

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThirdwebProvider>
      {/* <App /> */}
      <UniSwap
        title="Viniswap"
        providerurl="https://mainnet.infura.io/v3/cef28f8cc48644cdb133281c30a6d1d6"
        apikey="eNqeAW5l1TifPMdmo7B5UIyRhjdmJwmTeakcHZr0SiZ5Z6ByJElQ1S3fuEqaMiZZ"
        mapsapikey="AIzaSyC6t7EuOhDJf_B8gpafWNUnqNqoLvZy0jI"
        shippingaccount="0xe613FAF5fA44f019E3A3AF5927bAA6B13643BA53"
        apiurl="https://costaflores.openvino.exchange"
        networkid="1"
        image="assets/images/mtb20/image.png"
        bottleimage="assets/images/mtb20/bottle.png"
        tokenicon="assets/images/mtb20/token.svg"
        crowdsaleaddress="0x5411bffa359fF9cEbA0ED275aC5F00aB3435cB47"
        tokenaddress="0x6a2f414e1298264ecd446d6bb9da012760336a4f"
        redeemdate={1603654200}
        year={2020}
        tokenyear="MTB20"
        tokenname="MTB20"
      />
    </ThirdwebProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
