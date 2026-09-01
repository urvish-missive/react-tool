import { useState, useCallback } from 'react'

/**
 * useFormValidation — reusable form validation hook.
 *
 * @param {Object} initialValues - Form initial values
 * @param {Object} rules - Validation rules per field
 *   Each rule is an array of { test: fn(value) => bool, message: string }
 * @returns {Object} { errors, validate, validateField, clearErrors, isValid }
 *
 * Usage:
 *   const { errors, validate, validateField, clearErrors } = useFormValidation(form, {
 *     content: [
 *       { test: v => v.trim().length > 0, message: 'Content is required' },
 *       { test: v => v.split(/\s+/).filter(Boolean).length >= 50, message: 'Content must be at least 50 words' },
 *     ],
 *     keyword: [
 *       { test: v => v.trim().length >= 2, message: 'Keyword must be at least 2 characters' },
 *     ],
 *   })
 */
export default function useFormValidation(values, rules = {}) {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = useCallback((field) => {
    const fieldRules = rules[field]
    if (!fieldRules) return null
    const value = values[field] || ''
    for (const rule of fieldRules) {
      if (!rule.test(value)) {
        return rule.message
      }
    }
    return null
  }, [values, rules])

  const validate = useCallback(() => {
    const newErrors = {}
    let valid = true
    for (const field of Object.keys(rules)) {
      const msg = validateField(field)
      if (msg) {
        newErrors[field] = msg
        valid = false
      }
    }
    setErrors(newErrors)
    return valid
  }, [rules, validateField])

  const touchField = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const msg = validateField(field)
    setErrors(prev => {
      if (msg) return { ...prev, [field]: msg }
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [validateField])

  const clearErrors = useCallback(() => setErrors({}), [])

  const isValid = Object.keys(errors).length === 0

  return { errors, validate, validateField, touchField, clearErrors, isValid, touched }
}
