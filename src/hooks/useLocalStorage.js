import { useState } from 'react'

/**
 * A custom hook that works just like useState, but automatically
 * saves and loads the value from localStorage.
 *
 * @param {string} key      - The localStorage key to store data under
 * @param {*}      initial  - The initial value if nothing is stored yet
 * @returns [value, setValue] - Same API as useState
 */
export function useLocalStorage(key, initial) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initial
    } catch (err) {
      console.warn(`useLocalStorage: failed to read key "${key}"`, err)
      return initial
    }
  })

  const setValue = (value) => {
    try {
      // Support functional updates, just like React's setState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (err) {
      console.warn(`useLocalStorage: failed to write key "${key}"`, err)
    }
  }

  return [storedValue, setValue]
}
