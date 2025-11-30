import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react';

interface NotificationsProps {
  onClose: () => void;
}

type NotificationType = 'info' | 'warning' | 'success';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationFormState {
  title: string;
  message: string;
  type: NotificationType;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    type: 'warning',
    title: 'Certification Expiring Soon',
    message: 'Your NDT Level II certification expires in 7 months',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'info',
    title: 'New Job Card Assigned',
    message: 'You have been assigned to Boeing 737-800 wing inspection',
    time: '5 hours ago',
    read: false,
  },
  {
    id: 3,
    type: 'success',
    title: 'Maintenance Completed',
    message: 'Airbus A320 engine overhaul completed successfully',
    time: '1 day ago',
    read: true,
  },
  {
    id: 4,
    type: 'info',
    title: 'Schedule Update',
    message: 'Maintenance schedule for November has been updated',
    time: '2 days ago',
    read: true,
  },
  {
    id: 5,
    type: 'warning',
    title: 'Parts Low Stock Alert',
    message: 'Hydraulic fluid stock is running low',
    time: '3 days ago',
    read: true,
  },
];

const defaultFormState: NotificationFormState = {
  title: '',
  message: '',
  type: 'info',
};

function getTimestampLabel(): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

export function Notifications({ onClose }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isAdding, setIsAdding] = useState(false);
  const [formState, setFormState] = useState<NotificationFormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setFormError(null);
  };

  const toggleReadState = (id: number) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: !notification.read } : notification,
      ),
    );
  };

  const dismissNotification = (id: number) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormError(null);
    setFormState((previous) => ({
      ...previous,
      [name]: name === 'type' ? (value as NotificationType) : value,
    }));
  };

  const handleAddNotification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);
    if (!formState.title.trim() || !formState.message.trim()) {
      setFormError('Title and message are required.');
      return;
    }

    const newNotification: NotificationItem = {
      id: Date.now(),
      type: formState.type,
      title: formState.title.trim(),
      message: formState.message.trim(),
      time: getTimestampLabel(),
      read: false,
    };

    setNotifications((previous) => [newNotification, ...previous]);
    resetForm();
    setIsAdding(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-[#1e2837] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#2d3748]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-xl">Notifications</h3>
            <p className="text-[#94a3b8] text-xs mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAdding((value) => !value);
                resetForm();
              }}
              className="text-[#60a5fa] hover:text-[#3b82f6] text-sm"
            >
              {isAdding ? 'Cancel' : 'Add' }
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add Notification Form */}
      {isAdding && (
        <form onSubmit={handleAddNotification} className="border-b border-[#2d3748]">
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="notification-title" className="text-xs text-[#94a3b8] uppercase tracking-wide">
                Title
              </label>
              <input
                id="notification-title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleInputChange}
                className="w-full rounded-md bg-[#0f172a] border border-[#2d3748] px-3 py-2 text-sm text-white placeholder:text-[#64748b]"
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="notification-message" className="text-xs text-[#94a3b8] uppercase tracking-wide">
                Message
              </label>
              <textarea
                id="notification-message"
                name="message"
                value={formState.message}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-md bg-[#0f172a] border border-[#2d3748] px-3 py-2 text-sm text-white placeholder:text-[#64748b]"
                placeholder="Provide more information"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="notification-type" className="text-xs text-[#94a3b8] uppercase tracking-wide">
                Type
              </label>
              <select
                id="notification-type"
                name="type"
                value={formState.type}
                onChange={handleInputChange}
                className="w-full rounded-md bg-[#0f172a] border border-[#2d3748] px-3 py-2 text-sm text-white"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
              </select>
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-[#60a5fa] text-white rounded-md hover:bg-[#3b82f6] transition-colors"
              >
                Save Notification
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-[#94a3b8]">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-[#2d3748] transition-colors ${
                !notification.read ? 'bg-[#1e2837]' : 'bg-transparent'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h4 className="text-white text-sm font-medium">{notification.title}</h4>
                      <p className="text-[#94a3b8] text-sm mb-2">{notification.message}</p>
                      <span className="text-[#64748b] text-xs">{notification.time}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleReadState(notification.id)}
                          className="text-[#60a5fa] hover:text-[#3b82f6] p-1 rounded"
                          aria-label={notification.read ? 'Mark notification as unread' : 'Mark notification as read'}
                        >
                          {notification.read ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 8.25l9-5.25 9 5.25M4.5 10.5v6.75A2.25 2.25 0 006.75 19.5h10.5A2.25 2.25 0 0019.5 17.25V10.5"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 8.25l9 5.25 9-5.25"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M21.75 7.5v9a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 16.5v-9"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M21.75 7.5A2.25 2.25 0 0019.5 5.25h-15A2.25 2.25 0 002.25 7.5m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.5a2.25 2.25 0 01-2.16 0l-7.5-4.5A2.25 2.25 0 012.25 7.743V7.5"
                              />
                            </svg>
                          )}
                          <span className="sr-only">
                            {notification.read ? 'Mark unread' : 'Mark read'}
                          </span>
                        </button>
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="text-[#f87171] hover:text-[#ef4444] p-1 rounded"
                          aria-label="Dismiss notification"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="sr-only">Dismiss</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#2d3748]">
        <button
          onClick={markAllAsRead}
          className="w-full text-center text-[#60a5fa] hover:text-[#3b82f6] text-sm transition-colors disabled:text-[#475569]"
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
}
