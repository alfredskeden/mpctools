"use client";

import { useRef } from "react";

type ScryfallSearchProps = {
  query: string;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  onQueryChange: (q: string) => void;
  onSelect: (name: string) => void;
};

export function ScryfallSearch({
  query,
  suggestions,
  isLoading,
  error,
  onQueryChange,
  onSelect,
}: ScryfallSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      onSelect(suggestions[0]);
    }
    if (e.key === "Escape") {
      onQueryChange("");
    }
  };

  return (
    <div className="relative w-full max-w-md" data-testid="scryfall-search">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a card..."
        aria-label="Search for a card"
        aria-autocomplete="list"
        aria-controls={
          suggestions.length > 0 ? "scryfall-suggestions" : undefined
        }
        className="w-full rounded border border-surface-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-accent-blue focus:outline-none"
        data-testid="scryfall-input"
      />
      {isLoading && (
        <div
          className="absolute right-3 top-2.5"
          aria-label="Loading"
          data-testid="scryfall-loading"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
        </div>
      )}
      {error && (
        <p
          className="mt-1 text-xs text-red-500"
          role="alert"
          data-testid="scryfall-error"
        >
          {error}
        </p>
      )}
      {suggestions.length > 0 && (
        <ul
          id="scryfall-suggestions"
          role="listbox"
          aria-label="Card suggestions"
          className="absolute z-10 mt-1 w-full rounded border border-surface-border bg-surface-raised shadow-lg"
          data-testid="scryfall-suggestions"
        >
          {suggestions.map((name) => (
            <li
              key={name}
              role="option"
              aria-selected={false}
              className="cursor-pointer px-3 py-2 text-sm text-text-primary hover:bg-surface-overlay"
              onClick={() => onSelect(name)}
              data-testid={`suggestion-item`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
