import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import client from '@/api/client';
import { TrendingUp, TrendingDown, DollarSign, Plus, Briefcase, Receipt, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

// Simple card component
const SummaryCard = ({ title, amount, icon: Icon, type, colors }: any) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { color: colors.muted }]}>{title}</Text>
      <View style={[styles.iconContainer, { backgroundColor: type === 'positive' ? '#dcfce7' : type === 'negative' ? '#fee2e2' : '#e0f2fe' }]}>
        <Icon size={20} color={type === 'positive' ? '#16a34a' : type === 'negative' ? '#dc2626' : '#0284c7'} />
      </View>
    </View>
    <Text style={[styles.cardAmount, { color: colors.text }]}>
      ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
    </Text>
  </View>
);

const QuickAction = ({ title, icon: Icon, onPress, colors }: any) => (
  <TouchableOpacity
    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
    onPress={onPress}
  >
    <View style={[styles.actionIcon, { backgroundColor: colors.primary + '10' }]}>
      <Icon size={24} color={colors.primary} />
    </View>
    <Text style={[styles.actionText, { color: colors.text }]}>{title}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch dashboard metrics
      const [analyticsRes, expensesRes] = await Promise.all([
        client.get('/analytics/overview', { params: { period: 'month' } }),
        client.get('/expenses/?skip=0&limit=5')
      ]);

      setData(analyticsRes.data);
      setRecentExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const kpis = data?.kpis?.current_period;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.muted }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name || user?.username || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.actionsContainer}>
          <QuickAction
            title="Add Expense"
            icon={Receipt}
            onPress={() => router.push('/expenses/create')}
            colors={colors}
          />
          <QuickAction
            title="New Project"
            icon={Briefcase}
            onPress={() => router.push('/projects/create')}
            colors={colors}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Overview</Text>
          <Text style={[styles.dateRange, { color: colors.muted }]}>
            {data?.period?.start_date ? new Date(data.period.start_date).toLocaleDateString() : ''}
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <SummaryCard
            title="Revenue"
            amount={kpis?.revenue}
            icon={TrendingUp}
            type="positive"
            colors={colors}
          />
          <SummaryCard
            title="Expenses"
            amount={kpis?.expenses}
            icon={TrendingDown}
            type="negative"
            colors={colors}
          />
          <SummaryCard
            title="Net Profit"
            amount={kpis?.profit}
            icon={DollarSign}
            type="neutral"
            colors={colors}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => router.push('/expenses')}>
            <Text style={{ color: colors.primary, fontSize: 14 }}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.recentContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />
          ) : recentExpenses.length > 0 ? (
            recentExpenses.map((expense, idx) => (
              <TouchableOpacity
                key={expense.id}
                style={[styles.recentItem, idx !== recentExpenses.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={() => router.push(`/expenses/${expense.id}`)}
              >
                <View style={[styles.recentIcon, { backgroundColor: colors.primary + '10' }]}>
                  <Receipt size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>{expense.title}</Text>
                  <Text style={[styles.recentDate, { color: colors.muted }]}>{new Date(expense.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.recentAmount, { color: colors.text }]}>${expense.amount.toFixed(2)}</Text>
                <ChevronRight size={16} color={colors.muted} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted, padding: 20 }]}>No recent expenses.</Text>
          )}
        </View>

        {/* Profit Margin Indicator */}
        <View style={[styles.marginCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 24 }]}>
          <View style={styles.marginHeader}>
            <Text style={[styles.marginTitle, { color: colors.text }]}>Profit Margin</Text>
            <Text style={[styles.marginPercent, { color: colors.primary }]}>{kpis?.profit_margin?.toFixed(1) || 0}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(Math.max(kpis?.profit_margin || 0, 0), 100)}%`
                }
              ]}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateRange: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    padding: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  recentContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  recentIcon: {
    padding: 8,
    borderRadius: 8,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  recentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  marginCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  marginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  marginTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  marginPercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});
