import { writable } from 'svelte/store'

export const toggleHelp = writable(false)
export const openedFile = writable("No file provided")
export const currentView = writable("editor")
export const reloadOverride = writable([false, false]) // [Enables UI reload, Resets memory pointer to orig]
export const consoleSelected = writable(false)
export const activeStoplight = writable("sim-status-not-ready")