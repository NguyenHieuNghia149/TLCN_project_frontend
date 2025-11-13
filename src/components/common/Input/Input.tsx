import React, { forwardRef, InputHTMLAttributes } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  required?: boolean
  icon?: React.ReactNode
  rightButton?: React.ReactNode
  tone?: 'light' | 'dark'
  labelClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      required,
      icon,
      rightButton,
      className = '',
      tone = 'light',
      labelClassName = '',
      ...props
    },
    ref
  ) => {
    const inputId =
      props.id || `input-${Math.random().toString(36).substr(2, 9)}`

    const darkClasses =
      ' !bg-slate-800 !text-slate-100 placeholder:!text-slate-400 !border-slate-700 focus:!border-indigo-500 focus:!ring-2 focus:!ring-indigo-500/30 '

    return (
      <div className="input-wrapper">
        {label && (
          <label
            htmlFor={inputId}
            className={`input-label ${tone === 'dark' ? 'text-slate-200' : ''} ${labelClassName}`}
          >
            {label}
            {required && <span className="input-required">*</span>}
          </label>
        )}

        <div className="input-container">
          {icon && (
            <div
              className={`input-icon ${tone === 'dark' ? 'text-slate-400' : ''}`}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`input-field ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''} ${
              tone === 'dark' ? darkClasses : ''
            } ${className}`}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : success
                  ? `${inputId}-success`
                  : undefined
            }
            {...props}
          />

          {rightButton && (
            <div className="input-right-button">{rightButton}</div>
          )}
        </div>

        {error && (
          <div
            id={`${inputId}-error`}
            className={`input-message input-message-error ${tone === 'dark' ? 'text-red-400' : ''}`}
            role="alert"
          >
            {error}
          </div>
        )}

        {success && !error && (
          <div
            id={`${inputId}-success`}
            className={`input-message input-message-success ${tone === 'dark' ? 'text-emerald-400' : ''}`}
          >
            {success}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
