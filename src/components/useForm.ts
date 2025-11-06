import { useState, ChangeEvent, FormEvent } from 'react'

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => void
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = (e: FormEvent) => {
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

    onSubmit(values)
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
  }

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    reset,
    setValues,
  }
}
