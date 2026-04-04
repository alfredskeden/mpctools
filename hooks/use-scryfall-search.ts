"use client";

import { useReducer, useRef, useCallback, useEffect } from "react";
import type { ScryfallCard } from "@/lib/scryfall-types";

type ScryfallSearchState = {
  query: string;
  suggestions: string[];
  selectedCard: ScryfallCard | null;
  isLoading: boolean;
  error: string | null;
};

type ScryfallSearchAction =
  | { type: "SET_QUERY"; payload: string }
  | { type: "SET_SUGGESTIONS"; payload: string[] }
  | { type: "SET_SELECTED_CARD"; payload: ScryfallCard }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR" };

const initialState: ScryfallSearchState = {
  query: "",
  suggestions: [],
  selectedCard: null,
  isLoading: false,
  error: null,
};

function reducer(
  state: ScryfallSearchState,
  action: ScryfallSearchAction,
): ScryfallSearchState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload, error: null };
    case "SET_SUGGESTIONS":
      return { ...state, suggestions: action.payload, isLoading: false };
    case "SET_SELECTED_CARD":
      return {
        ...state,
        selectedCard: action.payload,
        suggestions: [],
        isLoading: false,
        error: null,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "CLEAR":
      return initialState;
    /* v8 ignore next */
    default:
      return state;
  }
}

export function useScryfallSearch() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const setQuery = useCallback((q: string) => {
    dispatch({ type: "SET_QUERY", payload: q });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!q.trim()) {
      dispatch({ type: "SET_SUGGESTIONS", payload: [] });
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const res = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Failed to fetch suggestions");
        const data = await res.json();
        dispatch({ type: "SET_SUGGESTIONS", payload: data.data });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          dispatch({
            type: "SET_ERROR",
            payload: "Failed to load suggestions",
          });
        }
      }
    }, 300);
  }, []);

  const selectCard = useCallback(async (name: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
        { signal: controller.signal },
      );
      if (!res.ok) throw new Error("Card not found");
      const card = await res.json();
      dispatch({ type: "SET_SELECTED_CARD", payload: card });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        dispatch({ type: "SET_ERROR", payload: "Failed to load card" });
      }
    }
  }, []);

  const clearCard = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return { ...state, setQuery, selectCard, clearCard };
}
