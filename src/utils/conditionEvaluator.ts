export const evaluateCondition = (doc: any, condition?: string) => {
  if (!condition) return true

  const parts = condition.split(' ')

  if (parts.length !== 3) return true

  const field = parts[0]
  const operator = parts[1]
  const value = Number(parts[2])

  const fieldValue = doc[field]

  if (operator === '>') return fieldValue > value
  if (operator === '<') return fieldValue < value
  if (operator === '>=') return fieldValue >= value
  if (operator === '<=') return fieldValue <= value
  if (operator === '==') return fieldValue == value

  return true
}
