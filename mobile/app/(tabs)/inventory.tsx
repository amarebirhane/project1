import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import client from '@/api/client';
import { Package, Search, X, Filter, AlertTriangle, ChevronRight } from 'lucide-react-native';

export default function InventoryScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(['all']);
        items.forEach(item => {
            if (item.category) cats.add(item.category.toLowerCase());
        });
        return Array.from(cats);
    }, [items]);

    const fetchInventory = async () => {
        try {
            const response = await client.get('/inventory/items', {
                params: { skip: 0, limit: 100 }
            });
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            Alert.alert('Error', 'Failed to fetch inventory items');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchInventory();
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch =
                item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory =
                selectedCategory === 'all' ||
                (item.category && item.category.toLowerCase() === selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, selectedCategory]);

    const renderItem = ({ item }: { item: any }) => {
        const isLowStock = item.quantity <= 10;

        return (
            <TouchableOpacity
                style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/inventory/${item.id}` as any)}
            >
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
                    <Package size={24} color={colors.primary} />
                </View>

                <View style={styles.itemDetails}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.item_name}
                    </Text>
                    <Text style={[styles.itemSku, { color: colors.muted }]}>
                        SKU: {item.sku || 'N/A'}
                    </Text>
                </View>

                <View style={styles.itemRight}>
                    <View style={styles.stockContainer}>
                        {isLowStock && (
                            <AlertTriangle size={14} color="#f59e0b" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[
                            styles.itemStock,
                            { color: isLowStock ? '#f59e0b' : colors.text }
                        ]}>
                            Qty: {item.quantity}
                        </Text>
                    </View>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>
                        ${item.selling_price?.toFixed(2)}
                    </Text>
                </View>
                <ChevronRight size={16} color={colors.muted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Inventory</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
                    <Search size={20} color={colors.muted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search items or SKU..."
                        placeholderTextColor={colors.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={20} color={colors.muted} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary + '20' : 'transparent' }]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Filter size={20} color={showFilters ? colors.primary : colors.muted} />
                </TouchableOpacity>
            </View>

            {showFilters && categories.length > 1 && (
                <View style={[styles.filtersList, { borderBottomColor: colors.border }]}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={categories}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: selectedCategory === item ? colors.primary : colors.secondary,
                                        borderColor: selectedCategory === item ? colors.primary : colors.border
                                    }
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    { color: selectedCategory === item ? '#fff' : colors.text }
                                ]}>
                                    {item.charAt(0).toUpperCase() + item.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.filtersContent}
                    />
                </View>
            )}

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Package size={48} color={colors.muted} />
                            <Text style={[styles.emptyText, { color: colors.muted }]}>
                                {searchQuery ? "No items match your search." : "No inventory items found."}
                            </Text>
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
        paddingTop: 16,
        paddingBottom: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 22,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersList: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconContainer: {
        padding: 10,
        borderRadius: 10,
        marginRight: 12,
    },
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 12,
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemStock: {
        fontSize: 13,
        fontWeight: '500',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
