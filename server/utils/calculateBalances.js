const getId = (ref) => {
  if (!ref) return null
  return ref._id ? ref._id.toString() : ref.toString()
}

export const calculateBalances = (expenses = [], settlements = []) => {
  const debt = {}

  const addDebt = (from, to, amount) => {
    if (!from || !to || !Number.isFinite(amount)) return
    if (!debt[from]) debt[from] = {}
    if (!debt[from][to]) debt[from][to] = 0
    debt[from][to] += amount
  }

  expenses.forEach((expense) => {
    const payerId = getId(expense?.paid_by)
    if (!payerId || !Array.isArray(expense?.splits)) return

    expense.splits.forEach((split) => {
      const owerId = getId(split?.user)
      const splitAmount = parseFloat(split?.amount)

      if (!owerId || owerId === payerId) return
      if (!Number.isFinite(splitAmount) || splitAmount <= 0) return

      addDebt(owerId, payerId, splitAmount)
    })
  })

  settlements.forEach((settlement) => {
    const fromId = getId(settlement?.paid_by)
    const toId = getId(settlement?.paid_to)
    const settlementAmount = parseFloat(settlement?.amount)

    if (!fromId || !toId || fromId === toId) return
    if (!Number.isFinite(settlementAmount) || settlementAmount <= 0) return

    addDebt(fromId, toId, -settlementAmount)
  })

  const results = []
  const allUsers = new Set()

  Object.keys(debt).forEach((userId) => allUsers.add(userId))
  Object.values(debt).forEach((userDebt) => {
    Object.keys(userDebt).forEach((userId) => allUsers.add(userId))
  })

  const users = Array.from(allUsers)

  for (let i = 0; i < users.length; i += 1) {
    for (let j = i + 1; j < users.length; j += 1) {
      const userA = users[i]
      const userB = users[j]
      const aOwesB = debt[userA]?.[userB] || 0
      const bOwesA = debt[userB]?.[userA] || 0
      const net = aOwesB - bOwesA

      if (Math.abs(net) <= 0.01) continue

      if (net > 0.01) {
        results.push({
          owes: userA,
          owed: userB,
          amount: parseFloat(net.toFixed(2))
        })
      } else {
        results.push({
          owes: userB,
          owed: userA,
          amount: parseFloat(Math.abs(net).toFixed(2))
        })
      }
    }
  }

  return results
}
