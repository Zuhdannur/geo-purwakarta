"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"

export interface AutocompleteOption {
  value: string
  label: string
  disabled?: boolean
}

export interface AutocompleteProps {
  options: AutocompleteOption[]
  value?: string
  onValueChange?: (value: string) => void
  onInputChange?: (text: string) => void
  asyncLoader?: (text: string) => Promise<AutocompleteOption[]>
  debounceMs?: number
  minChars?: number
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  contentClassName?: string
  width?: number | string
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  onInputChange,
  asyncLoader,
  debounceMs = 250,
  minChars = 0,
  placeholder = "Type to search...",
  emptyText = "No results.",
  disabled = false,
  className,
  inputClassName,
  contentClassName,
  width = 280,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [highlightIndex, setHighlightIndex] = React.useState(-1)
  const [loading, setLoading] = React.useState(false)
  const [asyncOptions, setAsyncOptions] = React.useState<AutocompleteOption[] | null>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const filtered = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase()
    if (!q) return options
    return options.filter(opt =>
      opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    )
  }, [options, inputValue])

  const effectiveList = asyncLoader ? (asyncOptions ?? []) : filtered

  const selectedOption = React.useMemo(() => options.find(o => o.value === value), [options, value])

  React.useEffect(() => {
    // If external value changes, reflect its label in input when closed
    if (!open && selectedOption) {
      setInputValue(selectedOption.label)
    }
    if (!open && !selectedOption && value === undefined) {
      setInputValue("")
    }
  }, [value, selectedOption, open])

  const commitSelection = (val: string) => {
    onValueChange?.(val)
    const opt = options.find(o => o.value === val)
    if (opt) setInputValue(opt.label)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setInputValue(text)
    onInputChange?.(text)
    if (!open) setOpen(true)
    setHighlightIndex(text ? 0 : -1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true)
      setHighlightIndex(0)
      return
    }
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex(i => Math.min(i + 1, effectiveList.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = effectiveList[highlightIndex]
      if (target && !target.disabled) commitSelection(target.value)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  React.useEffect(() => {
    if (!asyncLoader) return
    const q = inputValue.trim()
    if (q.length < minChars) {
      setAsyncOptions([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await asyncLoader(q)
        if (!active) return
        setAsyncOptions(results || [])
      } catch {
        if (!active) return
        setAsyncOptions([])
      } finally {
        if (active) setLoading(false)
      }
    }, debounceMs)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [inputValue, asyncLoader, debounceMs, minChars])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("w-full", className)} style={{ width: typeof width === "number" ? `${width}px` : width }}>
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={open ? inputValue : (selectedOption?.label ?? inputValue)}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={inputClassName}
            onBlur={() => {
              // Delay closing to allow item clicks
              setTimeout(() => setOpen(false), 100)
              // Snap text to selected label when blurring
              if (selectedOption) setInputValue(selectedOption.label)
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", contentClassName)} style={{ width: typeof width === "number" ? `${width}px` : width }}>
        <Command>
          <CommandList>
            <CommandEmpty>{loading ? "Searching..." : emptyText}</CommandEmpty>
            <CommandGroup>
              {effectiveList.map((opt, idx) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  onPointerDown={(e) => {
                    // Prevent Input blur from cancelling selection
                    e.preventDefault()
                    if (!opt.disabled) commitSelection(opt.value)
                  }}
                  className={cn("cursor-pointer", idx === highlightIndex && "bg-accent")}
                >
                  <span className="truncate">{opt.label}</span>
                  <Check className={cn("ml-auto h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


