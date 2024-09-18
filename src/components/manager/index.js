import React, { useState, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next';

export default function Web3ReactManager({ children }) {
  const { setConnector, error, active } = useWeb3Context()
  const { t } = useTranslation();

  // initialization management
  useEffect(() => {
    if (!active) {
      if (window.ethereum) {
        try {
          const library = new ethers.providers.Web3Provider(window.ethereum)
          library.listAccounts().then(accounts => {
            if (accounts.length >= 1) {
              setConnector('Injected')
            } else {
              setConnector('Network')
            }
          })
        } catch {
          setConnector('Network')
        }
      } else {
        setConnector('Network')
      }
    }
  }, [active, setConnector])

  const [, setShowLoader] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 750)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (error && error.message.startsWith("Unsupported Network")) {
    return (
      <Container>
        <CardWrapper>
          {t('labels.unsupported-network')}
        </CardWrapper>
      </Container>
    )
  }

  if (error || !active) {
    return (<div></div>);
  } else {
    return children
  }
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
`

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
`