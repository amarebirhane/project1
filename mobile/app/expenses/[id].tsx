import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { ArrowLeft, Trash2, Calendar, Tag, DollarSign, User, Building, FileText } from 'lucide-react-native';

export default function ExpenseDetailScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const router = useRouter();
    const [expense, setExpense] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchExpense = async () => {
        try {
            const response = await client.get(`/expenses/${id}`);
            setExpense(response.data);
        } catch (error) {
            console.error('Error fetching expense details:', error);
            Alert.alert('Error', 'Failed to load expense details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpense();
    }, [id]);

    const handleDelete = () => {
        Alert.alert(
            "Delete Expense",
            "Are you sure you want to delete this expense?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await client.delete(`/expenses/${id}`);
                            Alert.alert("Success", "Expense deleted successfully");
                            router.back();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete expense");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!expense) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Expense Details</Text>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Trash2 size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>${expense.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.detailsGroup}>
                    <DetailItem
                        icon={FileText}
                        label="Title"
                        value={expense.title}
                        colors={colors}
                    />
                    <DetailItem
                        icon={Tag}
                        label="Category"
                        value={expense.category}
                        colors={colors}
                        isTag
                    />
                    <DetailItem
                        icon={Calendar}
                        label="Date"
                        value={new Date(expense.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        colors={colors}
                    />
                    <DetailItem
                        icon={Building}
                        label="Vendor"
                        value={expense.vendor || 'Not specified'}
                        colors={colors}
                    />
                    <DetailItem
                        icon={User}
                        label="Created By"
                        value={`User ID: ${expense.created_by_id}`}
                        colors={colors}
                    />
                </View>

                {expense.description && (
                    <View style={[styles.descriptionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.descriptionTitle, { color: colors.muted }]}>Description</Text>
                        <Text style={[styles.descriptionText, { color: colors.text }]}>{expense.description}</Text>
                    </View>
                )}

                <View style={[styles.statusBox, { backgroundColor: expense.is_approved ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.statusText, { color: expense.is_approved ? '#16a34a' : '#dc2626' }]}>
                        {expense.is_approved ? 'Approved' : 'Pending Approval'}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const DetailItem = ({ icon: Icon, label, value, colors, isTag }: any) => (
    <View style={styles.detailItem}>
        <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Icon size={20} color={colors.primary} />
        </View>
        <View style={styles.itemContent}>
            <Text style={[styles.itemLabel, { color: colors.muted }]}>{label}</Text>
            <Text style={[
                styles.itemValue,
                { color: colors.text },
                isTag && [styles.tag, { backgroundColor: colors.primary + '15', color: colors.primary }]
            ]}>
                {value}
            </Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteBtn: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    amountCard: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    amountLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    amountValue: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    detailsGroup: {
        gap: 20,
        marginBottom: 24,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemContent: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    itemValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    tag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 14,
        textTransform: 'uppercase',
    },
    descriptionBox: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    descriptionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    statusBox: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
});
