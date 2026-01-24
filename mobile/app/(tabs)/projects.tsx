import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import client from '@/api/client';
import { Plus, Folder, Calendar, Search, X, Filter } from 'lucide-react-native';

export default function ProjectsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const fetchProjects = async () => {
        try {
            const response = await client.get('/projects/?skip=0&limit=50');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProjects();
    };

    const getStatusColor = (isActive: boolean) => {
        return isActive ? '#10b981' : colors.muted;
    }

    const filteredProjects = useMemo(() => {
        return projects.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && item.is_active) ||
                (statusFilter === 'inactive' && !item.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchQuery, statusFilter]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/projects/${item.id}` as any)}
        >
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Folder size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.is_active) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.is_active) }]}>
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
                {item.description || 'No description'}
            </Text>

            <View style={styles.footer}>
                <View style={styles.footerItem}>
                    <Calendar size={14} color={colors.muted} style={{ marginRight: 4 }} />
                    <Text style={[styles.date, { color: colors.muted }]}>
                        {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'No end date'}
                    </Text>
                </View>
                {item.budget && (
                    <Text style={[styles.budget, { color: colors.primary }]}>
                        ${item.budget.toLocaleString()}
                    </Text>
                )}
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
                        placeholder="Search projects..."
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
                    <View style={styles.filtersContent}>
                        {(['all', 'active', 'inactive'] as const).map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.statusChip,
                                    {
                                        backgroundColor: statusFilter === filter ? colors.primary : colors.secondary,
                                        borderColor: statusFilter === filter ? colors.primary : colors.border
                                    }
                                ]}
                                onPress={() => setStatusFilter(filter)}
                            >
                                <Text style={[
                                    styles.statusChipText,
                                    { color: statusFilter === filter ? '#fff' : colors.text }
                                ]}>
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredProjects}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.muted }]}>
                                {searchQuery || statusFilter !== 'all' ? "No projects match your search." : "No projects found."}
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/projects/create')}
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
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    statusChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    list: {
        padding: 16,
        paddingBottom: 80,
    },
    item: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    description: {
        fontSize: 14,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontSize: 12,
    },
    budget: {
        fontSize: 14,
        fontWeight: 'bold',
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
