import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
}

function Calendar({ value, onChange, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    value ? new Date(value) : new Date()
  )

  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleSelect = (day: number) => {
    const selected = new Date(year, month, day)
    onChange?.(selected)
  }

  const isSelected = (day: number) => {
    if (!value) return false
    return (
      value.getFullYear() === year &&
      value.getMonth() === month &&
      value.getDate() === day
    )
  }

  const isToday = (day: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {monthNames[month]} {year}
        </div>
        <button
          onClick={nextMonth}
          className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}

        {blanks.map((i) => (
          <div key={`blank-${i}`} className="py-1" />
        ))}

        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleSelect(day)}
            className={cn(
              "py-1 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
              isSelected(day) &&
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
