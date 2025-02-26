import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'

import Connect from './Connect'
import Works from './Works'
import BuyAndSell from './BuyAndSell'
import Redeem from './Redeem'
import Confirmed from './Confirmed'
import { useAppContext } from '../../context'
import { TRADE_TYPES } from '../../utils'

import Confetti from 'react-dom-confetti'

const config = {
  angle: 90,
  spread: 76,
  startVelocity: 51,
  elementCount: 154,
  dragFriction: 0.1,
  duration: 7000,
  stagger: 0,
  width: '10px',
  height: '10px',
  colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
}

export function useCount(initialValue, max, step = 1) {
  const [state, setState] = useAppContext()

  const selling = state.tradeType === TRADE_TYPES.SELL

  function increment() {
    setState(state => {
      const newCount = state.count + step
      if (!max || newCount <= max) {
        return { ...state, count: newCount }
      } else {
        return state
      }
    })
  }

  function decrement() {
    if ((state.count - step) >= (selling ? 1 : 1)) {
      setState(state => ({ ...state, count: state.count - step }))
    }
  }

  function setCount(val) {
    setState(state => ({ ...state, count: val }))
  }

  // ok to disable exhaustive-deps for `setState` b/c it's actually just a useState setter
  useEffect(() => {
    if (initialValue) {
      setState(state => ({ ...state, count: initialValue }))
    }
  }, [initialValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return [state.count, increment, decrement, setCount]
}

export default function Checkout({
  USDExchangeRateETH,
  tokenSupply,
  tokenCap,
  selectedTokenSymbol,
  setSelectedTokenSymbol,
  ready,
  unlock,
  validateBuy,
  buy,
  validateCrowdsale,
  crowdsale,
  validateSell,
  sell,
  transferShippingCosts,
  burn,
  balanceWINES,
  dollarPrice,
  reserveWINESToken,
  dollarize,
  currentTransactionHash,
  currentTransactionType,
  currentTransactionAmount,
  setCurrentTransaction,
  clearCurrentTransaction,
  setShowConnect,
  showConnect,
  showWorks,
  setShowWorks
}) {
  const { library } = useWeb3Context()
  const [state, setState] = useAppContext()

  const redeeming = state.tradeType === TRADE_TYPES.REDEEM

  const [lastTransactionHash, setLastTransactionHash] = useState('')
  const [lastTransactionType, setLastTransactionType] = useState('')
  const [lastTransactionAmount, setLastTransactionAmount] = useState('')

  const pending = !!currentTransactionHash
  useEffect(() => {
    if (currentTransactionHash) {
      library.waitForTransaction(currentTransactionHash).then(() => {
        setLastTransactionHash(currentTransactionHash)
        setLastTransactionType(currentTransactionType)
        setLastTransactionAmount(currentTransactionAmount)
        clearCurrentTransaction()
      })
    }
  }, [
    currentTransactionHash,
    library,
    lastTransactionHash,
    state.showConnect,
    state.visible,
    setShowWorks,
    setShowConnect,
    clearCurrentTransaction,
    lastTransactionHash,
    currentTransactionType,
    currentTransactionAmount
  ])

  function closeCheckout() {
    setShowConnect(false)
    if (state.visible) {
      setShowWorks(false)
      setLastTransactionHash('')
      setState(state => ({ ...state, visible: !state.visible }))
    }
  }

  function renderContent() {
    if (showConnect) {
      return <Connect setShowConnect={setShowConnect} closeCheckout={closeCheckout} />
    } else if (showWorks) {
      return <Works
        tokenSupply={tokenSupply}
        closeCheckout={closeCheckout} 
      />
    } else if (lastTransactionHash) {
      return (
        <Confirmed
          hash={lastTransactionHash}
          type={lastTransactionType}
          amount={lastTransactionAmount}
          closeCheckout={closeCheckout}
          clearLastTransaction={() => {
            setLastTransactionHash('')
            setLastTransactionType('')
            setLastTransactionAmount('')
          }}
        />
      )
    } else {
      if (!redeeming) {
        return (
          <BuyAndSell
            closeCheckout={closeCheckout}
            tokenSupply={tokenSupply}
            tokenCap={tokenCap}
            balanceWINES={balanceWINES}
            selectedTokenSymbol={selectedTokenSymbol}
            setSelectedTokenSymbol={setSelectedTokenSymbol}
            ready={ready}
            unlock={unlock}
            validateBuy={validateBuy}
            buy={buy}
            validateCrowdsale={validateCrowdsale}
            crowdsale={crowdsale}
            validateSell={validateSell}
            sell={sell}
            dollarize={dollarize}
            setCurrentTransaction={setCurrentTransaction}
            currentTransactionHash={currentTransactionHash}
            setShowConnect={setShowConnect}
            dollarPrice={dollarPrice}
            reserveWINESToken={reserveWINESToken}
            pending={pending}
          />
        )
      } else {
        return (
          <Redeem
            ready={ready}
            USDExchangeRateETH={USDExchangeRateETH}
            burn={burn}
            transferShippingCosts={transferShippingCosts}
            balanceWINES={balanceWINES}
            dollarize={dollarize}
            setCurrentTransaction={setCurrentTransaction}
            setShowConnect={setShowConnect}
            closeCheckout={closeCheckout}
            pending={pending}
          />
        )
      }
    }
  }

  return (
    <div>
      <CheckoutFrame isVisible={state.visible || showConnect}>
        {renderContent()}{' '}
        { !!lastTransactionHash && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Confetti active={!!lastTransactionHash} config={config} />
        </div> }
      </CheckoutFrame>
      <CheckoutBackground onClick={() => closeCheckout()} isVisible={state.visible || showConnect} />
    </div>
  )
}

const CheckoutFrame = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;

  color: #fff;
  background-color: #141414;
  max-width: 450px;
  visibility: ${props => !props.isVisible && 'hidden'};

  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100vh;
  overflow-y: scroll;

  z-index: 2;

  p {
    margin: 0px;
  }
`

const CheckoutBackground = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  opacity: ${props => (props.isVisible ? '.7' : '0')};
  width: 100vw;
  height: 100vh;
  z-index: ${props => (props.isVisible ? '1' : '-1')};
  pointer-events: ${props => (props.isVisible ? 'all' : 'none')};
  background-color: #000;
  transition: opacity 0.3s;
  pointer-events: ${props => (props.isVisible ? 'all' : 'none')};
`
