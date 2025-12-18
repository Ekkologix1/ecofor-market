// ============================================
// VALUE OBJECT: UserId
// Representa un ID de usuario válido
// ============================================

export class UserId {
  private readonly value: string

  constructor(id: string) {
    if (!this.isValid(id)) {
      throw new Error('ID de usuario inválido')
    }
    this.value = id
  }

  private isValid(id: string): boolean {
    // Validar que sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  getValue(): string {
    return this.value
  }

  equals(other: UserId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  // Factory method estático
  static create(id?: string): UserId {
    if (id) {
      return new UserId(id)
    }
    // Generar un nuevo UUID si no se proporciona
    return new UserId(crypto.randomUUID())
  }

  // Método para validar sin crear instancia
  static isValid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }
}
