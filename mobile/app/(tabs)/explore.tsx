import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { BarChart2, PieChart, TrendingUp, Briefcase } from 'lucide-react-native';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await client.get('/analytics/overview', {
        params: { period: 'year' } // Get yearly data for reports
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Analytics & Reports</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Detailed insights into your operations</Text>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <PieChart size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Breakdown</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {data?.category_breakdown?.expenses_by_category?.map((item: any, index: number) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownLabelRow}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{item.category}</Text>
                <Text style={[styles.categoryValue, { color: colors.text }]}>${item.total.toLocaleString()}</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.secondary }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(item.total / (data.kpis?.current_period?.expenses || 1)) * 100}%`
                    }
                  ]}
                />
              </View>
            </View>
          ))}
          {(!data?.category_breakdown?.expenses_by_category || data.category_breakdown.expenses_by_category.length === 0) && (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No categorical data available.</Text>
          )}
        </View>
      </View>

      {/* Monthly Trends - Simplified representation */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BarChart2 size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Trends</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.trendRow}>
            <View style={styles.trendInfo}>
              <TrendingUp size={16} color="#10b981" />
              <Text style={[styles.trendLabel, { color: colors.muted }]}>Projected Growth</Text>
            </View>
            <Text style={[styles.trendValue, { color: colors.text }]}>
              {data?.trends?.profit?.prediction?.next_value ? `$${data.trends.profit.prediction.next_value.toLocaleString()}` : 'N/A'}
            </Text>
          </View>
          <View style={styles.trendRow}>
            <View style={styles.trendInfo}>
              <Briefcase size={16} color={colors.primary} />
              <Text style={[styles.trendLabel, { color: colors.muted }]}>Efficiency Score</Text>
            </View>
            <Text style={[styles.trendValue, { color: colors.text }]}>
              {data?.kpis?.current_period?.profit_margin ? `${data.kpis.current_period.profit_margin.toFixed(1)}%` : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendLabel: {
    fontSize: 14,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});
