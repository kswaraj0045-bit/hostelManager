import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';
import * as groupService from '../services/groupService.js';
import * as billService from '../services/billService.js';
import * as choreService from '../services/choreService.js';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  buildDailyNotificationKey,
  getNotificationPreferences,
  saveNotificationPreferences
} from '../utils/notificationPreferences.js';

const NotificationContext = createContext(null);

const canUseBrowserNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window;

const notifyOncePerDay = (type, id, title, body) => {
  if (!canUseBrowserNotifications() || window.Notification.permission !== 'granted') return;

  const key = buildDailyNotificationKey(type, id);
  if (window.localStorage.getItem(key)) return;

  window.localStorage.setItem(key, 'sent');
  new window.Notification(title, { body });
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, joinGroup, leaveGroup } = useSocket();
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [permission, setPermission] = useState(
    canUseBrowserNotifications() ? window.Notification.permission : 'unsupported'
  );

  const currentUserId = user?._id?.toString?.() || user?._id;
  const supported = canUseBrowserNotifications();

  useEffect(() => {
    setPreferences(getNotificationPreferences());
    if (supported) setPermission(window.Notification.permission);
  }, [supported]);

  useEffect(() => {
    saveNotificationPreferences(preferences);
  }, [preferences]);

  const requestPermission = async () => {
    if (!supported) return 'unsupported';
    const result = await window.Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!user || !socket) return;

    let active = true;
    let joinedGroupIds = [];

    const handleExpenseAdded = (expense) => {
      if (!preferences.expenses || permission !== 'granted') return;
      const payerId = expense?.paid_by?._id?.toString?.() || expense?.paid_by?.toString?.();
      if (payerId === currentUserId) return;

      notifyOncePerDay(
        'expense',
        expense._id,
        'New expense added',
        `${expense.paid_by?.name || 'Someone'} added "${expense.description}" for Rs ${Number(expense.amount || 0).toFixed(2)}.`
      );
    };

    const handleBillNotification = (bill) => {
      if (!preferences.bills || permission !== 'granted') return;
      const assignedTo = bill?.assigned_to?._id?.toString?.() || bill?.assigned_to?.toString?.();
      if (!assignedTo || assignedTo !== currentUserId || bill?.paid) return;

      notifyOncePerDay(
        'bill',
        bill._id,
        'Bill reminder',
        `"${bill.title}" is assigned to you for Rs ${Number(bill.amount || 0).toFixed(2)}.`
      );
    };

    const handleChoreNotification = (chore) => {
      if (!preferences.chores || permission !== 'granted') return;
      const assignedTo = chore?.assigned_to?._id?.toString?.() || chore?.assigned_to?.toString?.();
      if (!assignedTo || assignedTo !== currentUserId || chore?.status !== 'pending') return;

      notifyOncePerDay(
        'chore-live',
        chore._id,
        'Chore reminder',
        `You have a pending chore: "${chore.title}".`
      );
    };

    const joinAllGroups = async () => {
      try {
        const res = await groupService.getGroups();
        if (!active) return;

        joinedGroupIds = (res.data?.data || []).map((group) => group._id);
        joinedGroupIds.forEach((groupId) => joinGroup(groupId));
      } catch (err) {
        console.error('Failed to join notification rooms', err);
      }
    };

    joinAllGroups();

    socket.on('expense:added', handleExpenseAdded);
    socket.on('bill:added', handleBillNotification);
    socket.on('bill:updated', handleBillNotification);
    socket.on('chore:added', handleChoreNotification);
    socket.on('chore:updated', handleChoreNotification);

    return () => {
      active = false;
      joinedGroupIds.forEach((groupId) => leaveGroup(groupId));
      socket.off('expense:added', handleExpenseAdded);
      socket.off('bill:added', handleBillNotification);
      socket.off('bill:updated', handleBillNotification);
      socket.off('chore:added', handleChoreNotification);
      socket.off('chore:updated', handleChoreNotification);
    };
  }, [user, socket, joinGroup, leaveGroup, preferences, permission, currentUserId]);

  useEffect(() => {
    if (!user || permission !== 'granted') return;
    if (!preferences.bills && !preferences.chores) return;

    let cancelled = false;

    const checkScheduledNotifications = async () => {
      try {
        const groupsRes = await groupService.getGroups();
        if (cancelled) return;

        const groups = groupsRes.data?.data || [];

        for (const group of groups) {
          const [billsRes, choresRes] = await Promise.all([
            preferences.bills ? billService.getBills(group._id) : Promise.resolve({ data: { data: [] } }),
            preferences.chores ? choreService.getChores(group._id) : Promise.resolve({ data: { data: [] } })
          ]);

          if (cancelled) return;

          const bills = billsRes.data?.data || [];
          const chores = choresRes.data?.data || [];

          bills.forEach((bill) => {
            const assignedTo = bill?.assigned_to?._id?.toString?.() || bill?.assigned_to?.toString?.();
            if (assignedTo !== currentUserId || bill.paid || !bill.due_date) return;

            const daysLeft = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 2) return;

            notifyOncePerDay(
              'bill-due',
              bill._id,
              daysLeft < 0 ? 'Overdue bill' : 'Upcoming bill',
              `"${bill.title}" in ${group.name} is due ${daysLeft < 0 ? 'now' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}.`
            );
          });

          chores.forEach((chore) => {
            const assignedTo = chore?.assigned_to?._id?.toString?.() || chore?.assigned_to?.toString?.();
            if (assignedTo !== currentUserId || chore.status !== 'pending' || !chore.due_date) return;

            const dueDate = new Date(chore.due_date);
            const today = new Date();
            const isToday =
              dueDate.getFullYear() === today.getFullYear() &&
              dueDate.getMonth() === today.getMonth() &&
              dueDate.getDate() === today.getDate();

            if (!isToday) return;

            notifyOncePerDay(
              'chore-due',
              chore._id,
              'Chore due today',
              `"${chore.title}" in ${group.name} is assigned to you today.`
            );
          });
        }
      } catch (err) {
        console.error('Failed to check notifications', err);
      }
    };

    checkScheduledNotifications();
    const intervalId = window.setInterval(checkScheduledNotifications, 5 * 60 * 1000);
    window.addEventListener('focus', checkScheduledNotifications);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkScheduledNotifications);
    };
  }, [user, permission, preferences, currentUserId]);

  const value = useMemo(() => ({
    preferences,
    permission,
    supported,
    requestPermission,
    updatePreference
  }), [preferences, permission, supported]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
