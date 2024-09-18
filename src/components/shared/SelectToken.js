import React from 'react'
import styled from 'styled-components'

import { TOKEN_SYMBOLS } from '../../utils'

import { KeyboardArrowDown } from '@styled-icons/material'

const SelectMenu = styled.select`
  display: block;
  font-size: 1rem;
  margin: 1rem;
  width: 100%;
  height: 48px;
  max-width: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0;
  margin-top: 1rem;
  appearance: none;
  background-color: transparent;
  color: #fff;
  display: flex;
  flex-direction: row;
  padding-left: 1rem;
`

const SelectItem = styled.option`
  border: none;
  width: 100%;
  border-radius: 24px;
  background-color: #9a999e;
  padding: 0px 0.5rem 0px 0.5rem;
`

const options = Object.keys(TOKEN_SYMBOLS)
  .filter(s => s !== 'MTB' && s !== 'DAI')
  .map(s => ({ value: s, label: s }))

function renderOptions(token, i, selectedTokenSymbol, prefix) {
  if (selectedTokenSymbol === token.value) {
    return (
      <SelectItem key={i} value={token.value}>
        {prefix + ' ' + token.label}
      </SelectItem>
    )
  } else {
    return (
      <SelectItem key={i} value={token.value}>
        {token.label}
      </SelectItem>
    )
  }
}

export default function SelectToken({ selectedTokenSymbol, setSelectedTokenSymbol, prefix }) {
  return (
    <>
      <SelectMenu
        onChange={e => {
          setSelectedTokenSymbol(e.target.value)
        }}
        className="dropdown"
      >
        {options.map((item, i) => renderOptions(item, i, selectedTokenSymbol, prefix))}
      </SelectMenu>

      <NoHeight>
        <DropControl alt="dropdown-arrow" />
      </NoHeight>
    </>
  )
}

const NoHeight = styled.div`
  height: 0px;
  position: relative;
  top: -38px;
  left: 144px;
`

const DropControl = styled(KeyboardArrowDown)`
  height: 18px;
  width: 18px;
`
