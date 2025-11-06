import { useState, ChangeEvent, FormEvent, useCallback, useRef, useEffect } from 'react'

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => void
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const onSubmitRef = useRef(onSubmit)

  // Update ref when onSubmit changes
  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setValues((prev: T) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    setErrors((prev: Partial<Record<keyof T, string>>) => {
      if (prev[name as keyof T]) {
        const newErrors = { ...prev }
        delete newErrors[name as keyof T]
        return newErrors
      }
      return prev
    })
  }, [])

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault()
    const newErrors: Partial<Record<keyof T, string>> = {}

    // Basic validation
    Object.keys(values).forEach((key) => {
      const value = values[key]
      if (typeof value === 'string' && value.trim() === '' && key === 'name') {
        newErrors[key as keyof T] = 'This field is required'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmitRef.current(values)
  }, [values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  const setValuesDirect = useCallback((newValues: T) => {
    setValues(newValues)
  }, [])

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    reset,
    setValues: setValuesDirect,
  }
}
