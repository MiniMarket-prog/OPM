"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id?: string // Corrected: Make id optional
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type Action =
  | {
      type: typeof actionTypes.ADD_TOAST
      toast: ToasterToast
    }
  | {
      type: typeof actionTypes.UPDATE_TOAST
      toast: Partial<ToasterToast>
    }
  | {
      type: typeof actionTypes.DISMISS_TOAST
      toastId?: string
    }
  | {
      type: typeof actionTypes.REMOVE_TOAST
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToatTimeout = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case actionTypes.DISMISS_TOAST:
      const { toastId } = action
      // ! Side effects ! - This means all toasts will be dismissed if toastId is not provided.
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === toastId || toastId === undefined
            ? {
                ...toast,
                open: false,
              }
            : toast,
        ),
      }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: ((state: State) => void)[] = []

let state: State = {
  toasts: [],
}

function setState(action: Action) {
  state = reducer(state, action)
  listeners.forEach((listener) => listener(state))
}

function dispatch(action: Action) {
  if (action.type === actionTypes.ADD_TOAST) {
    addToatTimeout(action.toast.id!) // Use non-null assertion as id is generated
  }

  setState(action)
}

function useToast() {
  const [toasterState, setToasterState] = React.useState(state)

  React.useEffect(() => {
    listeners.push(setToasterState)
    return () => {
      const index = listeners.indexOf(setToasterState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [toasterState])

  return {
    ...toasterState,
    toast: React.useCallback((props: Omit<ToasterToast, "id">) => {
      // Corrected: Accept props without id, as id is generated internally
      const id = genId()
      const update = (props: Partial<ToasterToast>) =>
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: { ...props, id },
        })
      const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) {
              dismiss()
            }
          },
        },
      })
      return {
        id: id,
        dismiss,
        update,
      }
    }, []),
  }
}

export { useToast, reducer as toastReducer }
