"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    userId: string;
    type: 'pod_invite' | 'resume_comment' | 'resume_shared';
    message: string;
    metadata: Record<string, string>;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loadNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const mapNotification = (n: any): Notification => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        message: n.message,
        metadata: n.metadata || {},
        isRead: n.is_read,
        createdAt: n.created_at,
    });

    const loadNotifications = useCallback(async () => {
        try {
            const response = await api.get('/notifications/');
            setNotifications(response.data.map(mapNotification));

            // Get unread count
            const countResponse = await api.get('/notifications/unread-count');
            setUnreadCount(countResponse.data.count);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, loadNotifications]);

    const markAsRead = async (notificationId: string) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loadNotifications,
                markAsRead,
                markAllAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
