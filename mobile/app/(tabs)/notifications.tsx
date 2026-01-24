import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { Bell, Check, Clock } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns'; // You might need to install date-fns or use native Intl

// Simple relative time formatter if date-fns is not installed
const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function NotificationsScreen() {
    const { colors } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await client.get('/notifications/'); // Standard CRUD usually
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // Fallback/Mock for demo if endpoint fails
            // setNotifications([
            //   { id: 1, title: 'Expense Approved', message: 'Your expense for Office Supplies was approved.', created_at: new Date().toISOString(), is_read: false },
            //   { id: 2, title: 'New Project', message: 'Project "Mobile App" has been created.', created_at: new Date(Date.now() - 86400000).toISOString(), is_read: true },
            // ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: number) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            await client.post(`/notifications/${id}/mark-read`);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await client.post('/notifications/mark-all-read');
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.item,
                {
                    backgroundColor: item.is_read ? colors.background : colors.card,
                    borderColor: colors.border,
                    opacity: item.is_read ? 0.7 : 1
                }
            ]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.is_read ? colors.border : colors.primary + '20' }]}>
                <Bell size={20} color={item.is_read ? colors.muted : colors.primary} />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: colors.text, fontWeight: item.is_read ? '500' : '700' }]}>
                        {item.title}
                    </Text>
                    {!item.is_read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={[styles.message, { color: colors.muted }]} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={[styles.time, { color: colors.muted }]}>
                    {getRelativeTime(item.created_at)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Mark all read</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Bell size={48} color={colors.muted} />
                            <Text style={[styles.emptyText, { color: colors.muted }]}>No notifications yet</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        padding: 0,
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        marginBottom: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    message: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    }
});
