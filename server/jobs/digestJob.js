import cron from 'node-cron'
import mongoose from 'mongoose'
import Expense from '../models/Expense.js'
import Chore from '../models/Chore.js'
import Bill from '../models/Bill.js'
import Group from '../models/Group.js'
import Digest from '../models/Digest.js'
import User from '../models/User.js'
import { askGemini } from '../config/gemini.js'
import { sendEmail } from '../utils/sendEmail.js'

const digestEmailHtml = (name, content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0E17;padding:20px;border-radius:12px">
    <div style="background:linear-gradient(135deg,#6C63FF,#FF6584);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
      <h1 style="color:white;margin:0;font-size:24px">🏠 HostelLife</h1>
    </div>
    <div style="background:#1C1B29;padding:24px;border-radius:12px;color:#FFFFFE">
      <h2 style="color:#6C63FF;margin-bottom:12px">📊 Weekly Digest</h2>
      <p>Hi <strong>${name}</strong>, here's your weekly summary:</p>
      <div style="margin-top:16px;white-space:pre-line;color:#A7A9BE;line-height:1.6">${content}</div>
    </div>
    <p style="text-align:center;color:#A7A9BE;font-size:12px;margin-top:16px">HostelLife — Manage hostel life smarter</p>
  </div>
`

const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

export const startDigestJob = () => {
  cron.schedule('0 9 * * 0', async () => {
    const weekStart = getWeekStart(new Date())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const groups = await Group.find().lean()
    const users = new Set()
    groups.forEach(g => g.members.forEach(m => users.add((m.user?._id || m.user)?.toString())))

    for (const userId of users) {
      try {
        const groupIds = groups
          .filter(g => g.members.some(m => m.user.toString() === userId))
          .map(g => g._id)

        const expenses = await Expense.find({
          group_id: { $in: groupIds },
          date: { $gte: weekStart, $lt: weekEnd }
        }).populate('paid_by', 'name').lean()

        const chores = await Chore.find({
          group_id: { $in: groupIds },
          status: 'pending'
        }).populate('assigned_to', 'name').populate('group_id', 'name').lean()

        const bills = await Bill.find({
          group_id: { $in: groupIds },
          paid: false
        }).populate('group_id', 'name').lean()

        const weekData = {
          expenses: expenses.map(e => ({ desc: e.description, amount: e.amount, paidBy: e.paid_by?.name })),
          pendingChores: chores.map(c => ({ title: c.title, assignedTo: c.assigned_to?.name, group: c.group_id?.name })),
          unpaidBills: bills.map(b => ({ title: b.title, amount: b.amount, group: b.group_id?.name }))
        }

        const prompt = `Generate a friendly weekly summary for a hostel student. Include total spent, pending chores, upcoming bills. Keep it under 150 words. Data: ${JSON.stringify(weekData)}`
        const content = await askGemini(prompt, JSON.stringify(weekData))

        await Digest.create({
          user_id: new mongoose.Types.ObjectId(userId),
          content,
          week_start: weekStart,
          week_end: weekEnd
        })

        const user = await User.findById(userId).select('email name emailNotifications')
        if (user?.email && user?.emailNotifications?.reminders !== false) {
          sendEmail({
            to: user.email,
            subject: '🏠 Your Weekly HostelLife Digest',
            html: digestEmailHtml(user.name, content)
          }).catch(console.error)
        }
      } catch (err) {
        console.error('Digest job error for user', userId, err.message)
      }
    }
    console.log('Digest job completed')
  })
  console.log('Digest job scheduled (Sunday 9:00 AM)')
}