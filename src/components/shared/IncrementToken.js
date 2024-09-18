import React from 'react'
import styled from 'styled-components'
import { Plus } from '@styled-icons/evil';
import { Minus } from '@styled-icons/evil';
import { useCount } from '../checkout/Checkout'

const SelectFrame = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  color: #fff;
  padding: 16px 0;

  /* margin-top: 0.5rem;
  margin-bottom: 0.5rem; */
`

const SelectMenu = styled.div`
  font-size: 1.5rem;
  font-weight: 300;
  padding: 0 16px;
  box-sizing: border-box;
  margin: 0;
  border: none;
  text-align: center;
`

const IncrementButton = styled(Plus)`
  cursor: pointer;
  user-select: none;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`
const DecrementButton = styled(Minus)`
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default function IncrementToken({ initialValue, max, step }) {
  const [count, incrementCount, decrementCount] = useCount(initialValue, max, step)

  return (
    <SelectFrame>
      <DecrementButton size="34" onClick={decrementCount}></DecrementButton>
      <SelectMenu>{count}</SelectMenu>
      <IncrementButton size="34" onClick={incrementCount}></IncrementButton>
    </SelectFrame>
  )
}
