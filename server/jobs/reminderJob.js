import cron from 'node-cron'
import Reminder from '../models/Reminder.js'
import Chore from '../models/Chore.js'
import User from '../models/User.js'
import { sendEmail, emailTemplate } from '../utils/sendEmail.js'
import { sendPushNotification } from '../utils/pushNotification.js'

export const startReminderJob = () => {
  // Job 1: every minute — fire reminders due within next 5 minutes
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date()
      const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000)

      const reminders = await Reminder.find({
        remind_at: { $gte: now, $lte: fiveMinLater },
        isCompleted: false,
        $or: [
          { isSnoozed: false },
          { snoozedUntil: { $lte: now } }
        ]
      }).populate('user_id', 'name email pushSubscription')

      for (const reminder of reminders) {
        const user = reminder.user_id

        // Send push notification
        if (reminder.channels?.push && user?.pushSubscription) {
          sendPushNotification(user.pushSubscription, {
            title: reminder.title,
            body: reminder.description || 'You have a reminder',
            url: '/calendar'
          }).catch(console.error)
        }

        // Send email
        if (reminder.channels?.email && user?.email) {
          sendEmail({
            to: user.email,
            subject: `⏰ Reminder: ${reminder.title}`,
            html: emailTemplate(`
              <h2 style="color:#6C63FF;margin-bottom:12px">⏰ ${reminder.title}</h2>
              <p>${reminder.description || 'You have a scheduled reminder.'}</p>
              <p style="color:#A7A9BE;font-size:12px;margin-top:16px">Scheduled for: ${new Date(reminder.remind_at).toLocaleString()}</p>
            `)
          }).catch(console.error)
        }

        // Handle repeat or complete
        if (reminder.repeat === 'none') {
          await Reminder.findByIdAndUpdate(reminder._id, { isCompleted: true })
        } else if (reminder.repeat === 'daily') {
          const next = new Date(reminder.remind_at)
          next.setDate(next.getDate() + 1)
          await Reminder.findByIdAndUpdate(reminder._id, { remind_at: next, isSnoozed: false, snoozedUntil: null })
        } else if (reminder.repeat === 'weekly') {
          const next = new Date(reminder.remind_at)
          next.setDate(next.getDate() + 7)
          await Reminder.findByIdAndUpdate(reminder._id, { remind_at: next, isSnoozed: false, snoozedUntil: null })
        } else if (reminder.repeat === 'monthly') {
          const next = new Date(reminder.remind_at)
          next.setMonth(next.getMonth() + 1)
          await Reminder.findByIdAndUpdate(reminder._id, { remind_at: next, isSnoozed: false, snoozedUntil: null })
        }
      }
    } catch (err) {
      console.error('Reminder job error:', err.message)
    }
  })

  // Job 2: every day at 8am — send chore reminders
  cron.schedule('0 8 * * *', async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const chores = await Chore.find({
        due_date: { $gte: today, $lt: tomorrow },
        status: 'pending'
      }).populate('assigned_to', 'name email')

      for (const chore of chores) {
        if (chore.assigned_to) {
          console.log(`Reminder: ${chore.assigned_to.name} has chore "${chore.title}" today`)
          if (chore.assigned_to.email) {
            sendEmail({
              to: chore.assigned_to.email,
              subject: `Chore reminder: ${chore.title}`,
              html: emailTemplate(`
                <h2 style="color:#6C63FF;margin-bottom:12px">🧹 Chore Reminder</h2>
                <p>Hi <strong>${chore.assigned_to.name}</strong>,</p>
                <p>your chore today is: <strong>${chore.title}</strong>. Don't forget!</p>
              `)
            }).catch(console.error)
          }
        } else {
          console.log(`Reminder: Chore "${chore.title}" is due today (unassigned)`)
        }
      }
    } catch (err) {
      console.error('Chore reminder job error:', err.message)
    }
  })

  console.log('Reminder jobs scheduled (every minute + daily 8:00 AM)')
}
