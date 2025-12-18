"use client"
// ============================================
// COMPONENTE: DashboardCard
// Componente reutilizable para tarjetas del dashboard
// ============================================








import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { ArrowRight } from "lucide-react"
import type { DashboardCard as DashboardCardType } from "@/lib"

interface DashboardCardProps {
  card: DashboardCardType
  disabled?: boolean
  onClick?: () => void
}

export function DashboardCard({ card, disabled = false, onClick }: DashboardCardProps) {
  const router = useRouter()
  const Icon = card.icon
  const BadgeIcon = card.badge?.icon

  const handleClick = () => {
    if (disabled) return
    if (onClick) {
      onClick()
    } else {
      router.push(card.route)
    }
  }

  return (
    <Card 
      className={`group hover:shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/80 border-0 shadow-lg hover:-translate-y-2 ${
        card.borderAccent ? 'border-l-4 border-l-emerald-500' : ''
      }`}
    >
      <CardHeader className="pb-4">
        {card.badge ? (
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 ${card.iconBgColor} rounded-xl flex items-center justify-center group-hover:bg-opacity-80 transition-colors transform group-hover:scale-110`}>
              <Icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <Badge className={card.badge.color}>
              {BadgeIcon && <BadgeIcon className="w-3 h-3 mr-1" />}
              {card.badge.text}
            </Badge>
          </div>
        ) : (
          <div className={`w-12 h-12 ${card.iconBgColor} rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-80 transition-colors transform group-hover:scale-110`}>
            <Icon className={`h-6 w-6 ${card.iconColor}`} />
          </div>
        )}
        
        <CardTitle className={`text-xl text-gray-900 group-hover:${card.iconColor?.replace('text-', 'text-')} transition-colors`}>
          {card.title}
        </CardTitle>
        
        <CardDescription className="text-gray-600">
          {card.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {card.metadata && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{card.metadata.label}</span>
              <Badge 
                variant="secondary" 
                className={`${card.metadata.valueBgColor} ${card.metadata.valueTextColor} ${
                  card.metadata.value === '...' ? 'animate-pulse' : ''
                }`}
              >
                {card.metadata.value === '...' ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                ) : (
                  card.metadata.value
                )}
              </Badge>
            </div>
          )}

          <Button 
            className={`w-full h-12 ${
              card.buttonVariant === 'outline' 
                ? 'border-gray-300 hover:bg-gray-50' 
                : card.buttonGradient 
                  ? `bg-gradient-to-r ${card.buttonGradient} hover:from-${card.buttonGradient.split('-')[1]}-700 hover:to-${card.buttonGradient.split('-')[3]}-700 shadow-lg group-hover:shadow-xl text-white` 
                  : ''
            } transition-all transform hover:scale-[1.02]`}
            variant={card.buttonVariant || 'default'}
            disabled={disabled}
            onClick={handleClick}
          >
            {disabled ? (
              "Disponible tras validación"
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>{card.buttonText}</span>
                {card.buttonGradient && <ArrowRight className="w-4 h-4" />}
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}