type ImeKeyboardEvent = {
  nativeEvent?: { isComposing?: boolean; keyCode?: number }
  isComposing?: boolean
  keyCode?: number
}

/** Returns whether a keyboard event belongs to an active IME composition. */
export function isImeComposing(event: ImeKeyboardEvent): boolean {
  const keyboardEvent = event.nativeEvent ?? event
  return keyboardEvent.isComposing === true || keyboardEvent.keyCode === 229
}
