import { useState } from "react"

export function saveToSessionStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return
    try {
        const serializedValue = JSON.stringify(value)
        sessionStorage.setItem(key, serializedValue)
    } catch (error) {
        console.error("Error saving to sessionStorage:", error)
    }
}

export function loadFromSessionStorage(key: string) {
    if (typeof window === "undefined") return null
    try {
        const serializedValue = sessionStorage.getItem(key)
        if (serializedValue === null) {
            return null
        }
        return JSON.parse(serializedValue)
    } catch (error) {
        console.error("Error loading from sessionStorage:", error)
        return null
    }
}