import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'
import { Close } from '@styled-icons/material/Close';
import { useTranslation } from 'react-i18next';

import Button from '../shared/Button'
import Form from './Form'
import SelectToken from '../shared/SelectToken'
import IncrementToken from '../shared/IncrementToken'
import { useAppContext } from '../../context'
import { ERROR_CODES, amountFormatter, TRADE_TYPES } from '../../utils'

export function Account({ ready, balanceWINES, setShowConnect }) {
  const { account, setConnector } = useWeb3Context()
  const [state] = useAppContext()

  const { t } = useTranslation();

  function handleAccount() {
    setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
      setShowConnect(true)
    })
  }

  return (
    <Connect onClick={() => handleAccount()} balanceWINES={balanceWINES}>
      {account ? (
        balanceWINES > 0 ? (
          <WineCount>{balanceWINES && `${amountFormatter(balanceWINES, 18, 0)}`} {state.tokenName}</WineCount>
        ) : (
            <WineCount>{account.slice(0, 6)}...</WineCount>
          )
      ) : (
          <WineCount>{t('wallet.connect')}</WineCount>
        )}

      <Status balanceWINES={balanceWINES} ready={ready} account={account} />
    </Connect>
  )
}

export function useCount() {
  const [state, setState] = useAppContext()

  function increment() {
    setState(state => ({ ...state, count: state.count + 1 }))
  }

  function decrement() {
    if (state.count >= 1) {
      setState(state => ({ ...state, count: state.count - 1 }))
    }
  }

  function setCount(val) {
    let int = val.toInt()
    setState(state => ({ ...state, count: int }))
  }
  return [state.count, increment, decrement, setCount]
}

function getValidationErrorMessage(validationError) {
  if (!validationError) {
    return null
  } else {
    switch (validationError.code) {
      case ERROR_CODES.INVALID_AMOUNT: {
        return 'invalid-amount'
      }
      case ERROR_CODES.INVALID_TRADE: {
        return 'invalid-trade'
      }
      case ERROR_CODES.INSUFFICIENT_ALLOWANCE: {
        return 'no-allowance'
      }
      case ERROR_CODES.INSUFFICIENT_ETH_GAS: {
        return 'no-eth'
      }
      case ERROR_CODES.INSUFFICIENT_SELECTED_TOKEN_BALANCE: {
        return 'no-tokens'
      }
      default: {
        return 'unknown-error'
      }
    }
  }
}

export default function BuyAndSell({
  closeCheckout,
  tokenSupply,
  tokenCap,
  balanceWINES,
  selectedTokenSymbol,
  setSelectedTokenSymbol,
  ready,
  unlock,
  validateBuy,
  buy,
  validateSell,
  sell,
  validateCrowdsale,
  crowdsale,
  dollarPrice,
  pending,
  reserveWINESToken,
  dollarize,
  setCurrentTransaction,
  currentTransactionHash,
  setShowConnect
}) {
  const [state] = useAppContext()
  const { account, setConnector } = useWeb3Context()

  const { t } = useTranslation();

  const buying = state.tradeType === TRADE_TYPES.BUY
  const selling = state.tradeType === TRADE_TYPES.SELL
  const crowdsaling = state.tradeType === TRADE_TYPES.CROWDSALE

  const [buyValidationState, setBuyValidationState] = useState({}) // { maximumInputValue, inputValue, outputValue }
  const [sellValidationState, setSellValidationState] = useState({}) // { inputValue, outputValue, minimumOutputValue }
  const [crowdsaleValidationState, setCrowdsaleValidationState] = useState({}) // { inputValue, outputValue, minimumOutputValue }
  const [validationError, setValidationError] = useState()

  function link(hash) {
    switch(parseInt(state.networkId)) {
      case 3:
        return `https://ropsten.etherscan.io/tx/${hash}` 
      case 4:
        return `https://rinkeby.etherscan.io/tx/${hash}` 
      default:
        return `https://etherscan.io/tx/${hash}`
    }
  }

  function getText(account, errorMessage, ready, pending, hash) {
    if (account === null) {
      return t('wallet.connect')
    } else if (ready && !errorMessage) {
      if (buying) {
        if (pending && hash) {
          return t('wallet.waiting-confirmation')
        } else {
          return t('wallet.buy-wine')
        }
      } else if (selling) {
        if (pending && hash) {
          return t('wallet.waiting-confirmation')
        } else {
          return t('wallet.sell-wine')
        }
      } else if (crowdsaling) {
        if (pending && hash) {
          return t('wallet.waiting-confirmation')
        } else {
          return t('wallet.buy-wine')
        }
      }
    } else {
      return errorMessage ? t(errorMessage) : t('wallet.loading')
    }
  }

  // buy state validation
  useEffect(() => {
    if (ready && buying) {
      try {
        const { error: validationError, ...validationState } = validateBuy(String(state.count))
        setBuyValidationState(validationState)
        setValidationError(validationError || null)

        return () => {
          setBuyValidationState({})
          setValidationError()
        }
      } catch (error) {
        setBuyValidationState({})
        setValidationError(error)
      }
    }
  }, [ready, buying, validateBuy, state.count])

  // sell state validation
  useEffect(() => {
    if (ready && selling) {
      try {
        const { error: validationError, ...validationState } = validateSell(String(state.count))
        setSellValidationState(validationState)
        setValidationError(validationError || null)

        return () => {
          setSellValidationState({})
          setValidationError()
        }
      } catch (error) {
        setSellValidationState({})
        setValidationError(error)
      }
    }
  }, [ready, selling, validateSell, state.count])

  // crowdsale state validation
  useEffect(() => {
    if (ready && crowdsaling) {
      try {
        const { error: validationError, ...validationState } = validateCrowdsale(String(state.count))
        setCrowdsaleValidationState(validationState)
        setValidationError(validationError || null)

        return () => {
          setCrowdsaleValidationState({})
          setValidationError()
        }
      } catch (error) {
        setCrowdsaleValidationState({})
        setValidationError(error)
      }
    }
  }, [ready, crowdsaling, validateCrowdsale, state.count])

  const shouldRenderUnlock = validationError && validationError.code === ERROR_CODES.INSUFFICIENT_ALLOWANCE

  const errorMessage = getValidationErrorMessage(validationError)

  function renderFormData() {
    let conditionalRender
    if (buying && buyValidationState.inputValue) {
      conditionalRender = (
        <>
          <p>
            ${ready && amountFormatter(dollarize(buyValidationState.inputValue), 18, 2)}
          </p>
        </>
      )
    } else if (selling && sellValidationState.outputValue) {
      conditionalRender = (
        <>
          <p>
            ${ready && amountFormatter(dollarize(sellValidationState.outputValue), 18, 2)}
          </p>
        </>
      )
    } else if (crowdsaling && crowdsaleValidationState.inputValue) {
      conditionalRender = (
        <>
          <p>
            ${ready && amountFormatter(dollarize(crowdsaleValidationState.inputValue), 18, 2)}
          </p>
        </>
      )
    } else {
      conditionalRender = <p>$0.00</p>
    }

    return <>{conditionalRender}</>
  }

  function TokenVal() {
    if (buying && buyValidationState.inputValue) {
      return amountFormatter(buyValidationState.inputValue, 18, 4)
    } else if (selling && sellValidationState.outputValue) {
      return amountFormatter(sellValidationState.outputValue, 18, 4)
    } else if (crowdsaling && crowdsaleValidationState.inputValue) {
      return amountFormatter(crowdsaleValidationState.inputValue, 18, 4)
    } else {
      return '0'
    }
  }

  function renderSupplyData() {
    if (buying) {
      return reserveWINESToken && `${amountFormatter(reserveWINESToken, 18, 0)}/${tokenSupply}`
    } else if (selling) {
      return reserveWINESToken && `${amountFormatter(reserveWINESToken, 18, 0)}/${tokenSupply}`
    } else if (crowdsaling && tokenSupply && tokenCap) {
      if ((tokenCap - tokenSupply) < 0) {
        return tokenSupply && tokenCap && `0/${tokenCap}`
      } else {
        return tokenSupply && tokenCap && `${tokenCap - tokenSupply}/${tokenCap}`
      }
    }
    return t('wallet.not-available');
  }

  return (
    <>
      <Wrapper>
        <Header>
          <Account
            ready={ready}
            dollarPrice={dollarPrice}
            balanceWINES={balanceWINES}
            setShowConnect={setShowConnect}
          ></Account>
          <CloseIcon onClick={() => closeCheckout()}></CloseIcon>
        </Header>
        <ContentWrapper>
          <TopFrame>
            <ImgStyle src={state.image} alt="Viniswap" />
            <InfoFrame pending={pending}>
              <CurrentPrice>
                <Description>{buying ? t('wallet.pay') : selling ? t('wallet.sell') : t('wallet.crowdsale')}</Description>
                <WineTitle>{state.title} <b>{state.tokenName}</b></WineTitle>
                <USDPrice>{renderFormData()}</USDPrice>
                <WineCount><b>{t('wallet.available')} </b>{renderSupplyData()}</WineCount>
              </CurrentPrice>
            </InfoFrame>
            {(!pending || !currentTransactionHash) && <IncrementToken initialValue={selling ? 1 : 1} step={1}/>}
          </TopFrame>

          {pending && currentTransactionHash ? (
            <CheckoutControls buying={buying}>
              <CheckoutPrompt>
                <i>{t('wallet.pending-transaction')}</i>
              </CheckoutPrompt>
              <CheckoutPrompt>
                <EtherscanLink href={link(currentTransactionHash)} target="_blank" rel="noopener noreferrer">
                  {t('wallet.view-etherscan')}
            </EtherscanLink>
              </CheckoutPrompt>
            </CheckoutControls>
          ) : (
              <CheckoutControls buying={buying}>
                <Form></Form>
                <SelectToken
                  selectedTokenSymbol={selectedTokenSymbol}
                  setSelectedTokenSymbol={setSelectedTokenSymbol}
                  prefix={TokenVal()}
                />
              </CheckoutControls>
            )}
          {shouldRenderUnlock ? (
            <ButtonFrame
              text={`${t('wallet.unlock')} ${buying ? selectedTokenSymbol : state.tokenName}`}
              type={'cta'}
              pending={pending}
              onClick={() => {
                unlock(buying).then(({ hash }) => {
                  setCurrentTransaction(hash, TRADE_TYPES.UNLOCK, undefined)
                })
              }}
            />
          ) : (
              <ButtonFrame
                className="button"
                pending={pending}
                disabled={validationError !== null || (pending && currentTransactionHash)}
                text={getText(account, errorMessage, ready, pending, currentTransactionHash)}
                type={'cta'}
                onClick={() => {
                  if (account === null) {
                    setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
                      setShowConnect(true)
                    })
                  } else {
                    ; (buying
                      ? buy(buyValidationState.maximumInputValue, buyValidationState.outputValue)
                      : selling
                        ? sell(sellValidationState.inputValue, sellValidationState.minimumOutputValue)
                        : crowdsale(crowdsaleValidationState.maximumInputValue, crowdsaleValidationState.outputValue)
                    ).then(response => {
                      setCurrentTransaction(
                        response.hash,
                        state.tradeType,
                        buying ? buyValidationState.outputValue : selling ? sellValidationState.inputValue : crowdsaleValidationState.outputValue
                      )
                    }).catch(console.error)
                  }
                }}
              />
            )}
        </ContentWrapper>
      </Wrapper>
    </>
  )
}

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 32px;
  box-sizing: border-box;
  overflow-y: scroll;
`

const Header = styled.div`
  width: 100%;
  color: #fff;
  font-weight: 500;
  margin: 0px;
  font-size: 1rem;
  letter-spacing: 1.33px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const ContentWrapper = styled.div`
  flex: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`


const TopFrame = styled.div`
  width: 100%;
  color: white;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  padding-bottom: 16px;
`


const Description = styled.div`
  font-size: 1rem;
  font-weight: 300;
  letter-spacing: 1.33px;
  padding-bottom: 8px;
`

const CloseIcon = styled(Close)`
  cursor: pointer;
  height: 24px;
  width: 24px;
`

const InfoFrame = styled.div`
  opacity: ${props => (props.pending ? 0.6 : 1)};
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: flex-start;
`

const ImgStyle = styled.img`
  width: 33%;
  padding: 2rem 0 2rem 0;
  box-sizing: border-box;
`
const WineCount = styled.span`
  font-weight: normal;
  margin: 0px;
  margin-top: 8px;
  font-size: 0.9rem;
  letter-spacing: 1.06px;
`

const WineTitle = styled.div`
  font-size: 2rem;
  font-weight: 500;
`;

const USDPrice = styled.div`
  font-size: 1rem;
  letter-spacing: 1.46px;
  font-weight: 500;
  padding-bottom: 16px;
`

const CurrentPrice = styled.div`
  font-weight: 600;
  font-size: 18px;
  margin: 0px;
  font-feature-settings: 'tnum' on, 'onum' on;
`

const CheckoutControls = styled.span`
  width: 100%;
  padding: 16px 0px 32px 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
`

const CheckoutPrompt = styled.p`
  font-weight: 500;
  font-size: 1rem;
  margin-bottom: 0;
  text-align: left;
  width: 100%;
`

const ButtonFrame = styled(Button)`
  height: 48px;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
`

const EtherscanLink = styled.a`
  text-decoration: underline;
  color: white;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  margin-top: 8px;
`
const Connect = styled.div`
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid white;
  cursor: ${props => (props.balanceWINES ? 'auto' : 'pointer')};

  transform: scale(1);
  transition: transform 0.3s ease;

  :hover {
    transform: ${props => (props.balanceWINES ? 'scale(1)' : 'scale(1.02)')};
  }
`

const Status = styled.div`
  display: ${props => (props.balanceWINES ? 'initial' : 'none')};
  width: 12px;
  height: 12px;
  border-radius: 100%;
  margin-left: 12px;
  margin-top: 2px;
  float: right;
  background-color: ${props =>
    props.account === null ? '#CF2C0A' : props.ready ? '#66BB66' : '#CF2C0A'};
`
