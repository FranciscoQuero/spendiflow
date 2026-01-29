import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { ChartPeriod } from '../types';
import { t } from '../locales/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

export const ChartsScreen: React.FC = () => {
  const [period, setPeriod] = useState<ChartPeriod>('month');
  const settings = useStore((state) => state.settings);
  const { getPeriodSummary, getDailyTotals } = useTransactions();

  const summary = useMemo(() => getPeriodSummary(period), [period, getPeriodSummary]);
  const dailyTotals = useMemo(() => getDailyTotals(period, 'expense'), [period, getDailyTotals]);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const pieData = useMemo(() => {
    if (summary.byCategory.length === 0) {
      return [{ name: 'No data', population: 1, color: colors.textSecondary, legendFontColor: colors.textSecondary }];
    }
    return summary.byCategory.map((cat) => ({
      name: cat.categoryName,
      population: cat.total,
      color: cat.color,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }, [summary.byCategory]);

  const barData = useMemo(() => {
    if (dailyTotals.length === 0) {
      return {
        labels: [''],
        datasets: [{ data: [0] }],
      };
    }

    // Take last 7 data points for readability
    const recentData = dailyTotals.slice(-7);
    return {
      labels: recentData.map((d) => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          data: recentData.map((d) => d.total),
        },
      ],
    };
  }, [dailyTotals]);

  const PeriodTab = ({ value, label }: { value: ChartPeriod; label: string }) => (
    <Pressable
      style={[styles.periodTab, period === value && styles.periodTabActive]}
      onPress={() => setPeriod(value)}
    >
      <Text
        style={[
          styles.periodTabText,
          period === value && styles.periodTabTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('charts.title')}</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <PeriodTab value="week" label={t('charts.week')} />
          <PeriodTab value="month" label={t('charts.month')} />
          <PeriodTab value="quarter" label={t('charts.quarter')} />
          <PeriodTab value="year" label={t('charts.year')} />
        </View>

        {/* Total Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.totalLabel}>{t('charts.total')}</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(summary.totalExpenses, settings.currencySymbol, locale)}
          </Text>
        </Card>

        {/* Pie Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('charts.byCategory')}</Text>
          {summary.totalExpenses > 0 ? (
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                width={CHART_WIDTH - 32}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={false}
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>{t('charts.noData')}</Text>
          )}
        </Card>

        {/* Category Breakdown */}
        {summary.byCategory.length > 0 && (
          <Card style={styles.chartCard}>
            {summary.byCategory.map((cat, index) => (
              <View key={cat.categoryId} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: cat.color }]}
                  />
                  <Text style={styles.categoryName}>{cat.categoryName}</Text>
                </View>
                <View style={styles.categoryValues}>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(cat.total, settings.currencySymbol, locale)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {formatPercentage(cat.percentage)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Bar Chart - Trend */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('charts.trend')}</Text>
          {dailyTotals.length > 0 ? (
            <BarChart
              data={barData}
              width={CHART_WIDTH - 32}
              height={200}
              yAxisLabel=""
              yAxisSuffix="€"
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.6,
              }}
              style={styles.barChart}
              showValuesOnTopOfBars
              fromZero
            />
          ) : (
            <Text style={styles.noDataText}>{t('charts.noData')}</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    color: 'white',
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.expense,
  },
  chartCard: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  pieContainer: {
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    color: colors.text,
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  categoryPercent: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  barChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
