/*
 * stores.js
 *
 *  Store data to pass between UI components
 */

import { writable } from 'svelte/store'

// Boolean: Open WebLC3 documentation modal
export const toggleHelp = writable(false)

// Boolean: Dark mode
export const darkMode = writable(true)

// String: Filename of current assembly file
export const openedFile = writable("untitled.asm")

// String: Filename of assembled .obj file
export const assembledFile = writable("SIMULATOR STATUS")

// String: "editor" or "simulator" view
export const currentView = writable("editor")

// Boolean: Select Console (window is key interruptable)
export const consoleSelected = writable(false)

// String: Editor content of latest save
export const latestSnapshot = writable("")

// String: ID of active stoplight in SimulatorStatus
export const activeStoplight = writable("sim-status-not-ready")

// Boolean: Simulator UI is ready to update
export const UIReady = writable(false)

// Integer: Change text in main step control button
export const updateMainButton = writable(0)

/* [Boolean, Boolean]:
 *  [0] - Enable Simulator Memory component reload
 *  [1] - Reset Memory pointer to .orig
 */
export const reloadOverride = writable([false, false])