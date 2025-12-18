"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { LucideIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"





interface OptimizedRegistrationCardProps {
  icon: LucideIcon
  title: string
  description: string
  features: string[]
  badge: {
    icon: LucideIcon
    text: string
    variant: "blue" | "emerald"
  }
  buttonText: string
  onClick: () => void
  isScrolling?: boolean // Opcional, ya no se usa para evitar parpadeo
}

export function OptimizedRegistrationCard({
  icon: Icon,
  title,
  description,
  features,
  badge,
  buttonText,
  onClick,
  isScrolling
}: OptimizedRegistrationCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Optimizar animaciones (sin cambios durante scroll para evitar parpadeo)
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.willChange = 'transform, opacity'
    }
  }, [])

  const badgeClasses = badge.variant === "blue" 
    ? "bg-blue-50 text-blue-700 border-blue-200" 
    : "bg-emerald-50 text-emerald-700 border-emerald-200"

  const buttonClasses = badge.variant === "blue"
    ? "w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
    : "w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"

  const iconClasses = badge.variant === "blue"
    ? "mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-optimized group-hover:shadow-2xl transition-all transform group-hover:scale-110 animation-optimized"
    : "mx-auto w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-optimized group-hover:shadow-2xl transition-all transform group-hover:scale-110 animation-optimized"

  const decoratorClasses = badge.variant === "blue"
    ? "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -translate-y-16 translate-x-16 opacity-50 gpu-accelerated"
    : "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-full -translate-y-16 translate-x-16 opacity-50 gpu-accelerated"

  return (
    <Card 
      ref={cardRef}
      className="group relative overflow-hidden border-0 backdrop-blur-optimized bg-white/80 shadow-optimized hover:shadow-3xl transition-all duration-300 hover-optimized shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={decoratorClasses}></div>
      
      <CardHeader className="relative z-10 text-center pt-8 pb-6">
        <div className={iconClasses}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        
        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </CardTitle>
        <CardDescription className="text-lg text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 px-8 pb-8">
        <div className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-2 h-2 ${badge.variant === "blue" ? "bg-blue-500" : "bg-emerald-500"} rounded-full`}></div>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <Badge variant="outline" className={`${badgeClasses} px-4 py-2`}>
            <badge.icon className="h-4 w-4 mr-2" />
            {badge.text}
          </Badge>
        </div>

        <Button 
          onClick={onClick}
          className={buttonClasses}
          size="lg"
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  )
}
