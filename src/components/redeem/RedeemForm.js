import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import styled from "styled-components";

import { useWeb3Context } from "web3-react";
import Select from "react-select";
// import { useJsApiLoader } from '@react-google-maps/api';

import { useAppContext } from "../../context";
import Button from "../shared/Button";
import Suggest from "./Suggest";
import { useTranslation } from "react-i18next";
import { ethers } from "ethers";
import { amountFormatter, USDToEth } from "../../utils";
// import axios from "axios";

// variables for the netlify names of each form field
const bot = "beep-boop";
const name = "name";
const line1 = "line1";
const line2 = "line2";
const city = "city";
const state = "state";
const zip = "zip";
const country = "country";
const email = "email";
const address = "address";
const timestamp = "timestamp";
const numberBurned = "number-burned";
const signature = "signature";
const telegram = "telegram";

// the order for fields that will be submitted
const nameOrder = [
  name,
  line1,
  line2,
  city,
  state,
  zip,
  country,
  email,
  telegram,
];

// default for each form field
const defaultState = {
  [bot]: "",
  [name]: "",
  [line1]: "",
  [line2]: "",
  [city]: "",
  [zip]: "",
  [state]: "",
  [country]: "",
  [email]: "",
  [telegram]: "",
};

/* // mapping from field to google maps return value
const addressMapping = [
  { [line1]: 'street_address' },
  { [city]: 'sublocality' },
  { [state]: 'administrative_area_level_1' },
  { [zip]: 'postal_code' },
  { [country]: 'country' }
]
 */
export default function RedeemForm({
  USDExchangeRateETH,
  shippingCost,
  setShippingCost,
  setHasConfirmedAddress,
  setUserForm,
  numberBurned: actualNumberBurned,
}) {
  const { t } = useTranslation();
  const { library, account } = useWeb3Context();
  const [autoAddress, setAutoAddress] = useState([]);
  const [inputY, setInputY] = useState(0);
  const suggestEl = useRef();
  const [appState] = useAppContext();

  const [formState, setFormState] = useState(defaultState);
  const [shippingCostError, setShippingCostError] = useState(false);

  const countries = t("redeem.countries", { returnObjects: true });

  let provinces = [];
  if (countries[formState[country]]) {
    provinces = countries[formState[country]].province;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((state) => ({ ...state, [name]: value }));
  }

  async function getShippingCosts(country, state, amount) {
    try {
      const response = await fetch(
        `${appState.apiUrl}/redeem/shipping?country_id=${country}&province_id=${state}&amount=${amount}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch shipping costs");
      }

      const data = await response.json();
      let dollarCost = ethers.BigNumber.from(data.cost * 100);
      setShippingCostError(false);
      setShippingCost(dollarCost);
    } catch (e) {
      setShippingCostError(true);
      console.error("Error fetching shipping costs:", e);
    }
  }

  // async function getShippingCosts(country, state, amount) {
  //   try {
  //     let res = await axios.get(
  //       `${appState.apiUrl}/redeem/shipping?country_id=${country}&province_id=${state}&amount=${amount}`
  //     );

  //     if (res.data) {
  //       let dollarCost = ethers.BigNumber.from(res.data.cost * 100);
  //       setShippingCostError(false);
  //       setShippingCost(dollarCost);
  //     }
  //   } catch (e) {
  //     setShippingCostError(true);
  //   }
  // }

  /* function updateAutoFields(address) {
    let constructedStreetAddress = ''
    function getTypes(addressItem, addressVal, item) {
      addressItem.forEach(type => {
        if (Object.keys(item)[0] === line1) {
          if (type === 'street_number') {
            constructedStreetAddress += addressVal
          } else if (type === 'route') {
            constructedStreetAddress += ' ' + addressVal
          }
          setFormState(state => ({ ...state, [Object.keys(item)[0]]: constructedStreetAddress }))
        } else if (Object.keys(item)[0] === city) {
          if (type === 'sublocality' || type === 'locality') {
            setFormState(state => ({ ...state, [Object.keys(item)[0]]: addressVal }))
          }
        } else if (Object.keys(item)[0] === state) {
          if (type === 'administrative_area_level_1') {
            setFormState(state => ({ ...state, [Object.keys(item)[0]]: addressVal }))
          }
        } else if (Object.keys(item)[0] === country) {
          if (type === 'country') {
            setFormState(state => ({ ...state, [Object.keys(item)[0]]: addressVal }))
          }
        } else if (Object.keys(item)[0] === zip) {
          if (type === 'postal_code') {
            setFormState(state => ({ ...state, [Object.keys(item)[0]]: addressVal }))
          }
        }
      })
    }

    addressMapping.forEach(item => {
      address.forEach(addressItem => {
        getTypes(addressItem.types, addressItem.long_name, item)
      })
    })
  } */

  /*   const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: appState.mapsApiKey,
    libraries: ["places"]
  }) */

  // keep acount in sync
  useEffect(() => {
    // updateAutoFields(autoAddress['address_components'] ? autoAddress['address_components'] : [])
    handleChange({ target: { name: [address], value: account } });
  }, [account, autoAddress, setUserForm]);

  useLayoutEffect(() => {
    if (suggestEl.current) {
      setInputY(suggestEl.current.getBoundingClientRect().bottom);
    }
  }, [suggestEl]);

  const canSign =
    formState[name] &&
    formState[line1] &&
    formState[city] &&
    formState[state] &&
    formState[zip] &&
    formState[country] &&
    formState[email];

  const selectStyles = {
    container: (provided) => ({
      ...provided,
      width: "100%",
      margin: "6px 0",
    }),
    control: (provided) => ({
      ...provided,
      "background-color": "rgba(255, 255, 255, 0.05)",
      border: "none",
      "font-size": "16px",
      "box-shadow": "inset 0 0 0 1px rgba(213, 132, 27, 0.5)",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white",
      "font-size": "16px",
    }),
    menu: (provided) => ({
      ...provided,
      color: "#141414",
    }),
  };

  const countryOptions = Object.keys(countries).map((key) => {
    const name = countries[key].name;
    return {
      value: key,
      label: name,
    };
  });

  const stateOptions = Object.keys(provinces).map((key) => {
    const name = provinces[key];
    return {
      value: key,
      label: name,
    };
  });

  return (
    /*isLoaded ?*/ <FormFrame autocomplete="off">
      <input
        hidden
        type="text"
        name="beep-boop"
        value={formState[bot]}
        onChange={handleChange}
      />
      <input
        required
        type="text"
        name={name}
        value={formState[name]}
        onChange={handleChange}
        placeholder={t("redeem.name")}
        autoComplete="name"
      />
      <Compressed>
        {/* <Suggest
          required
          myRef={suggestEl}
          inputY={inputY}
          setAutoAddress={setAutoAddress}
          type="text"
          name={line1}
          value={formState[line1]}
          onChange={handleChange}
          placeholder={t('redeem.line1')}
          autoComplete="off"
        /> */}
        <input
          required
          type="text"
          name={line1}
          value={formState[line1]}
          onChange={handleChange}
          placeholder={t("redeem.line1")}
          autoComplete="off"
        />

        <input
          type="text"
          name={line2}
          value={formState[line2]}
          onChange={handleChange}
          placeholder={t("redeem.line2")}
          autoComplete="off"
        />
      </Compressed>
      <input
        required
        type="text"
        name={city}
        value={formState[city]}
        onChange={handleChange}
        placeholder={t("redeem.city")}
        autoComplete="address-level2"
      />

      <input
        required
        type="text"
        name={zip}
        value={formState[zip]}
        onChange={handleChange}
        placeholder={t("redeem.zip")}
        autoComplete="postal-code"
      />

      <Select
        placeholder={t("redeem.country")}
        styles={selectStyles}
        options={countryOptions}
        components={{
          IndicatorSeparator: () => null,
        }}
        onChange={(event) => {
          setFormState((state) => ({ ...state, country: event.value }));
        }}
      />

      <Select
        placeholder={t("redeem.state")}
        styles={selectStyles}
        options={stateOptions}
        components={{
          IndicatorSeparator: () => null,
        }}
        onChange={(event) => {
          setFormState((state) => ({ ...state, state: event.value }));
          getShippingCosts(formState[country], event.value, actualNumberBurned);
        }}
      />

      <input
        required
        type="email"
        name={email}
        value={formState[email]}
        onChange={handleChange}
        placeholder={t("redeem.email")}
        autoComplete="email"
      />

      <input
        type="text"
        name={telegram}
        value={formState[telegram]}
        onChange={handleChange}
        placeholder={t("redeem.telegram")}
        autoComplete="off"
      />

      {!shippingCostError && shippingCost ? (
        <div
          style={{ fontWeight: "normal", fontSize: "14px", padding: "16px 0" }}
        >
          {t("redeem.shipping-cost")}: ${amountFormatter(shippingCost, 2, 2)}{" "}
          USD (
          {amountFormatter(USDToEth(USDExchangeRateETH, shippingCost), 18, 5)}{" "}
          ETH)
        </div>
      ) : shippingCostError ? (
        <div
          style={{ fontWeight: "normal", fontSize: "14px", padding: "16px 0" }}
        >
          {t("redeem.shipping-cost-not-found")}
        </div>
      ) : (
        <></>
      )}

      <ButtonFrame
        className="button"
        disabled={!canSign || shippingCostError}
        text={t("redeem.next")}
        type={"submit"}
        onClick={(event) => {
          const signer = library.getSigner();
          const timestampToSign = Math.round(Date.now() / 1000);

          const formDataMessage = nameOrder
            .map((o) => `${t(`${o}`)}: ${formState[o]}`)
            .join("\n");
          const autoMessage = `${t("redeem.address")}: ${account}\n${t(
            "redeem.timestamp"
          )}: ${timestampToSign}\n${t(
            "redeem.numberBurned"
          )}: ${actualNumberBurned}`;

          signer
            .signMessage(`${formDataMessage}\n${autoMessage}`)
            .then((returnedSignature) => {
              formState.signature = returnedSignature;
              setUserForm(formState);
              setHasConfirmedAddress(true);
            });

          event.preventDefault();
        }}
      />
      <br />
    </FormFrame>
  ); /* : <></>*/
}

const FormFrame = styled.form`
  width: calc(100% - 32px);
  color: #fff;
  font-weight: 600;
  padding: 16px;
  /* margin-bottom: 0px; */
  font-size: 16px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  input {
    font-family: Futura, Helvetica, sans-serif;
    border: none;
    background-image: none;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    color: white;
    background-color: rgba(255, 255, 255, 0.05);
    padding: 12px 8px;
    margin: 6px 0;
    font-size: 16px;
    width: 100%;
    box-sizing: border-box;
    border-radius: 4px;
  }
  input:required {
    box-shadow: inset 0 0 0 1px rgba(213, 132, 27, 0.5);
  }
  input:valid {
    border: nne;
    box-shadow: none;
  }
  input::-webkit-input-placeholder {
    color: #8a8a8a;
  }
`;

const Compressed = styled.span`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
`;

const ButtonFrame = styled(Button)`
  height: 48px;
  padding: 16px;
  margin: 16px;
  width: calc(100% - 32px);
  border-color: #d5841b;
  background: #d5841b;
`;
