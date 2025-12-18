"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui"
import { User, Building } from "lucide-react"







interface UserTypeSelectorProps {
  onSelect: (type: "NATURAL" | "EMPRESA") => void
}

export function UserTypeSelector({ onSelect }: UserTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="text-center">
          <User className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <CardTitle className="text-xl">Persona Natural</CardTitle>
          <CardDescription className="text-base">
            Compras ocasionales para el hogar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => onSelect("NATURAL")}
            className="w-full"
            size="lg"
          >
            Continuar como Persona Natural
          </Button>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="text-center">
          <Building className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <CardTitle className="text-xl">Empresa / Institución</CardTitle>
          <CardDescription className="text-base">
            Compras frecuentes, precios mayoristas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => onSelect("EMPRESA")}
            className="w-full"
            size="lg"
          >
            Continuar como Empresa
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}