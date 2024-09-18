import React from 'react'
import { useAppContext } from '../../context'
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

export default function Form() {
  const [state, setState] = useAppContext()
  const { t } = useTranslation();

  function handleChange(event) {
    const { value } = event.target;
    setState(state => ({ 
      ...state, 
      email: value,
      emailValid: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)
    }))
  }

  return (
    <>
      <p style={{alignSelf: 'flex-start', fontSize: '0.9rem'}}>{t('wallet.your-email')}: *</p>
      <FormInput style={{ borderColor: state.emailValid ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,0,0.5)' }} type="email" placeholder={t('wallet.email')} value={state.email} onChange={handleChange}></FormInput>
    </>
  )
}

const FormInput = styled.input`
  width: 100%;
  padding: 12px 20px;
  font-size: 0.8em;
  margin: 8px 0;
  box-sizing: border-box;
  border: none;
  border-bottom: 2px solid rgba(255,255,255,0.1);
  background-color: transparent;
  color: white;
  outline: none;
`

