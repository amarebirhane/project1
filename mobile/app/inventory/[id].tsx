import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { Package, Clock, ArrowLeft, Edit } from 'lucide-react-native';

export default function InventoryDetailScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchItemDetails = async () => {
        try {
            const response = await client.get(`/inventory/items/${id}`);
            setItem(response.data);
        } catch (error) {
            console.error('Error fetching inventory item:', error);
            Alert.alert('Error', 'Failed to fetch item details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItemDetails();
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!item) return null;

    const isLowStock = item.quantity <= 10;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    Item Details
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                        <Package size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.item_name}</Text>
                    <Text style={[styles.itemSku, { color: colors.muted }]}>SKU: {item.sku || 'N/A'}</Text>

                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: item.is_active ? '#dcfce7' : '#fee2e2' }]}>
                            <Text style={[styles.badgeText, { color: item.is_active ? '#16a34a' : '#dc2626' }]}>
                                {item.is_active ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.badgeText, { color: colors.text }]}>
                                {item.category || 'Uncategorized'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoGrid}>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.muted }]}>STOCK LEVEL</Text>
                        <Text style={[
                            styles.infoValue,
                            { color: isLowStock ? '#f59e0b' : colors.text }
                        ]}>
                            {item.quantity}
                        </Text>
                        {isLowStock && <Text style={styles.lowStockWarning}>Low Stock!</Text>}
                    </View>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.muted }]}>SELLING PRICE</Text>
                        <Text style={[styles.infoValue, { color: colors.primary }]}>
                            ${item.selling_price?.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {item.description && (
                    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                        <Text style={[styles.sectionText, { color: colors.muted }]}>
                            {item.description}
                        </Text>
                    </View>
                )}

                <View style={[styles.metaSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.metaRow}>
                        <Clock size={16} color={colors.muted} />
                        <Text style={[styles.metaText, { color: colors.muted }]}>
                            Added: {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Edit size={16} color={colors.muted} />
                        <Text style={[styles.metaText, { color: colors.muted }]}>
                            Last modified: {new Date(item.updated_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: colors.primary, borderWidth: 1 }]}
                        onPress={() => Alert.alert("Edit", "Editing is coming to mobile soon.")}
                    >
                        <Edit size={20} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit Item</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    card: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        padding: 20,
        borderRadius: 25,
        marginBottom: 16,
    },
    itemName: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 14,
        marginBottom: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    infoCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    lowStockWarning: {
        color: '#f59e0b',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    },
    section: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    sectionText: {
        fontSize: 14,
        lineHeight: 22,
    },
    metaSection: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        gap: 10,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
