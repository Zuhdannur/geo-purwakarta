"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  width?: string | number
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  width = 200,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between",
            triggerClassName,
            className
          )}
          style={{ width: typeof width === "number" ? `${width}px` : width }}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("p-0", contentClassName)}
        style={{ width: typeof width === "number" ? `${width}px` : width }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option, index) => (
                <CommandItem
                  key={`${option.value}-${index}`}
                  value={option.value}
                  keywords={[option.label, option.value]}
                  onPointerDown={() => {
                    onValueChange?.(option.value)
                    setOpen(false)
                  }}
                  onSelect={(selected) => {
                    onValueChange?.(selected)
                    setOpen(false)
                  }}
                  disabled={option.disabled}
                  className={cn(
                    "cursor-pointer",
                    value === option.value && "bg-accent"
                  )}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Multi-select variant
export interface MultiComboboxProps {
  options: ComboboxOption[]
  values?: string[]
  onValuesChange?: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  width?: string | number
  maxDisplayed?: number
}

export function MultiCombobox({
  options,
  values = [],
  onValuesChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  width = 200,
  maxDisplayed = 2,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((option) => values.includes(option.value))

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder
    if (selectedOptions.length <= maxDisplayed) {
      return selectedOptions.map((option) => option.label).join(", ")
    }
    return `${selectedOptions.length} options selected`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between",
            triggerClassName,
            className
          )}
          style={{ width: typeof width === "number" ? `${width}px` : width }}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("p-0", contentClassName)}
        style={{ width: typeof width === "number" ? `${width}px` : width }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option, index) => {
                const isSelected = values.includes(option.value)
                return (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={option.value}
                    keywords={[option.label, option.value]}
                    onPointerDown={() => {
                      const newValues = values.includes(option.value)
                        ? values.filter((value) => value !== option.value)
                        : [...values, option.value]
                      onValuesChange?.(newValues)
                    }}
                    onSelect={(selected) => {
                      const newValues = values.includes(selected)
                        ? values.filter((value) => value !== selected)
                        : [...values, selected]
                      onValuesChange?.(newValues)
                    }}
                    disabled={option.disabled}
                    className={cn(
                      "cursor-pointer",
                      isSelected && "bg-accent"
                    )}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
