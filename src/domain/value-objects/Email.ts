// ============================================
// VALUE OBJECT: Email
// Representa un email válido
// ============================================

export class Email {
  private readonly value: string

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Email inválido')
    }
    this.value = email.toLowerCase().trim()
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  // Factory method estático
  static create(email: string): Email {
    return new Email(email)
  }
}
