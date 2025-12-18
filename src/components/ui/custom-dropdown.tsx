"use client"
import { Check } from "lucide-react"


interface DropdownOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface CustomDropdownProps {
  isOpen: boolean
  onClose: () => void
  selectedValue: string
  onSelect: (value: string) => void
  options: DropdownOption[]
  title: string
  buttonLabel: string
  width?: string
}

export function CustomDropdown({
  isOpen,
  onClose,
  selectedValue,
  onSelect,
  options,
  title,
  buttonLabel,
  width = "w-56"
}: CustomDropdownProps) {
  if (!isOpen) return null

  const handleSelect = (value: string) => {
    onSelect(value)
    onClose()
  }

  return (
    <div className={`absolute bottom-full left-0 mb-2 ${width} z-[9999] animate-in fade-in duration-200`}>
      <div className="backdrop-blur-sm bg-white/95 rounded-2xl shadow-2xl border border-emerald-100">
        {/* Header */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>

        {/* Options */}
        <div className="py-2 max-h-[300px] overflow-y-auto">
          {options.map((option) => {
            const IconComponent = option.icon
            const isSelected = selectedValue === option.value

            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors duration-150 flex items-center space-x-3 ${isSelected ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                  }`}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                <span className="text-sm font-medium">{option.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-emerald-600 ml-auto" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
