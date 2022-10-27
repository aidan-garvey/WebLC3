import { writable } from 'svelte/store';

export const toggleHelp = writable(false);
export const objFile = writable(null);
export const objMap = writable(null);
export const openedFile = writable("No file provided");
export const currentView = writable("editor");