import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import client from '@/api/client';
import { Plus, Receipt, Search, X, Trash2, Filter } from 'lucide-react-native';

const CATEGORIES = ['all', 'salary', 'rent', 'utilities', 'marketing', 'equipment', 'travel', 'supplies', 'insurance', 'taxes', 'other'];

export default function ExpensesScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const fetchExpenses = async () => {
        try {
            // Fetch all expenses, we'll filter client-side for better UX on mobile
            const response = await client.get('/expenses/?skip=0&limit=100');
            setExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchExpenses();
    };

    const handleDelete = async (id: number) => {
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
                            setExpenses(expenses.filter(e => e.id !== id));
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete expense");
                        }
                    }
                }
            ]
        );
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory || item.category === selectedCategory.toUpperCase();
            return matchesSearch && matchesCategory;
        });
    }, [expenses, searchQuery, selectedCategory]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/expenses/${item.id}` as any)}
        >
            <View style={styles.iconContainer}>
                <Receipt size={24} color={colors.primary} />
            </View>
            <View style={styles.itemDetails}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={styles.itemMeta}>
                    <Text style={[styles.itemCategory, { color: colors.primary, backgroundColor: colors.primary + '10' }]}>
                        {item.category}
                    </Text>
                    <Text style={[styles.itemDate, { color: colors.muted }]}>
                        {new Date(item.date).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            <View style={styles.itemRight}>
                <Text style={[styles.itemAmount, { color: colors.text }]}>
                    ${item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
                    <Search size={20} color={colors.muted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search expenses..."
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

            {showFilters && (
                <View style={[styles.filtersList, { borderBottomColor: colors.border }]}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={CATEGORIES}
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

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredExpenses}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.muted }]}>
                                {searchQuery || selectedCategory !== 'all' ? "No expenses match your filters." : "No expenses found."}
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/expenses/create')}
            >
                <Plus size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    list: {
        padding: 16,
        paddingBottom: 80, // Space for FAB
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
        marginRight: 16,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemCategory: {
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        textTransform: 'uppercase',
    },
    itemDate: {
        fontSize: 12,
    },
    itemRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteBtn: {
        padding: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
});
