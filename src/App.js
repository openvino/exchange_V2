import logo from "./logo.svg";
import "./App.css";

import { ConnectButton } from "thirdweb/react";
import { client } from "./config/thirdwebClient";
function App() {
  return (
    <div className="App">
      <ConnectButton
        client={client}
        // chain={defineChain(optimism)}
        connectButton={{
          label: "Connect wallet",
        }}
      />
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
