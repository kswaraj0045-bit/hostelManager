import Expense from '../models/Expense.js'
import Settlement from '../models/Settlement.js'
import Group from '../models/Group.js'
import { calculateBalances } from '../utils/calculateBalances.js'

export const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const groups = await Group.find({ 'members.user': userId })
    const groupIds = groups.map(g => g._id)

    const allExpenses = await Expense.find({ group_id: { $in: groupIds } })
      .populate('paid_by', 'name email avatar')
      .populate('splits.user', 'name email avatar')
    const allSettlements = await Settlement.find({ group_id: { $in: groupIds } })
      .populate('paid_by', 'name email avatar')
      .populate('paid_to', 'name email avatar')

    const balances = calculateBalances(allExpenses, allSettlements)
    const userIdStr = userId.toString()

    let totalOwed = 0
    let totalOwing = 0
    balances.forEach(b => {
      if (b.owed === userIdStr) totalOwed += b.amount
      if (b.owes === userIdStr) totalOwing += b.amount
    })

    const monthlyExpenses = await Expense.find({
      group_id: { $in: groupIds },
      date: { $gte: monthStart }
    })
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthName = mStart.toLocaleString('default', { month: 'short' })
      const exps = allExpenses.filter(e => {
        const d = new Date(e.date)
        return d >= mStart && d < mEnd
      })
      monthlyTrend.push({ month: monthName, total: exps.reduce((s, e) => s + e.amount, 0) })
    }

    // Category breakdown this month
    const catMap = {}
    monthlyExpenses.forEach(e => {
      const cat = e.category || 'misc'
      if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 }
      catMap[cat].total += e.amount
      catMap[cat].count += 1
    })
    const categoryBreakdown = Object.entries(catMap).map(([category, v]) => ({ category, ...v }))

    // Most expensive group this month
    const groupExpMap = {}
    monthlyExpenses.forEach(e => {
      const gid = e.group_id.toString()
      if (!groupExpMap[gid]) groupExpMap[gid] = 0
      groupExpMap[gid] += e.amount
    })
    let mostExpensiveGroup = { name: 'N/A', total: 0 }
    Object.entries(groupExpMap).forEach(([gid, total]) => {
      if (total > mostExpensiveGroup.total) {
        const g = groups.find(g => g._id.toString() === gid)
        if (g) mostExpensiveGroup = { name: g.name, total }
      }
    })

    // Top spender this month
    const spenderMap = {}
    monthlyExpenses.forEach(e => {
      const pid = e.paid_by?._id?.toString() || e.paid_by?.toString()
      const pname = e.paid_by?.name || 'Unknown'
      if (!spenderMap[pid]) spenderMap[pid] = { name: pname, amount: 0 }
      spenderMap[pid].amount += e.amount
    })
    let topSpender = { name: 'N/A', amount: 0 }
    Object.values(spenderMap).forEach(s => {
      if (s.amount > topSpender.amount) topSpender = s
    })

    res.json({
      success: true,
      data: {
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalGroups: groups.length,
        totalOwed: parseFloat(totalOwed.toFixed(2)),
        totalOwing: parseFloat(totalOwing.toFixed(2)),
        monthlyExpenses: monthlyTrend,
        categoryBreakdown,
        mostExpensiveGroup,
        topSpender
      }
    })
  } catch (err) {
    next(err)
  }
}

export const getGroupAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params
    const group = await Group.findById(id).populate('members.user', 'name email avatar')
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' })
    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString())
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' })

    const now = new Date()
    const allExpenses = await Expense.find({ group_id: id })
      .populate('paid_by', 'name email avatar')
      .populate('splits.user', 'name email avatar')
    const allSettlements = await Settlement.find({ group_id: id })
      .populate('paid_by', 'name email avatar')
      .populate('paid_to', 'name email avatar')

    const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0)

    // Category breakdown
    const catMap = {}
    allExpenses.forEach(e => {
      const cat = e.category || 'misc'
      if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 }
      catMap[cat].total += e.amount
      catMap[cat].count += 1
    })
    const categoryBreakdown = Object.entries(catMap).map(([category, v]) => ({ category, ...v }))

    // Member contributions
    const balances = calculateBalances(allExpenses, allSettlements)
    const memberContributions = group.members.map(m => {
      const mid = m.user._id.toString()
      const paid = allExpenses
        .filter(e => (e.paid_by?._id?.toString() || e.paid_by?.toString()) === mid)
        .reduce((s, e) => s + e.amount, 0)
      const owesItems = balances.filter(b => b.owes === mid)
      const owes = owesItems.reduce((s, b) => s + b.amount, 0)
      return { name: m.user.name, paid: parseFloat(paid.toFixed(2)), owes: parseFloat(owes.toFixed(2)) }
    })

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthName = mStart.toLocaleString('default', { month: 'short' })
      const exps = allExpenses.filter(e => {
        const d = new Date(e.date)
        return d >= mStart && d < mEnd
      })
      monthlyTrend.push({ month: monthName, total: exps.reduce((s, e) => s + e.amount, 0) })
    }

    res.json({
      success: true,
      data: {
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        categoryBreakdown,
        memberContributions,
        monthlyTrend
      }
    })
  } catch (err) {
    next(err)
  }
}
