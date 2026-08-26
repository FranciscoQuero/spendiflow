import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { Card } from '../components/Card';
import { SegmentedControl } from '../components/SegmentedControl';
import { Chip } from '../components/Chip';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme, hexToRgba } from '../theme/colors';
import { formatCurrency, formatPercentage, getMonthName } from '../utils/formatters';
import { computeMonthlyNetWorthSeries } from '../utils/netWorthHistory';
import { ChartPeriod, TransactionScope } from '../types';
import { t } from '../locales/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

type ChartsView = 'flow' | 'netWorth';

const PERIOD_OPTIONS: { value: ChartPeriod; labelKey: 'charts.week' | 'charts.month' | 'charts.quarter' | 'charts.year' }[] = [
  { value: 'week', labelKey: 'charts.week' },
  { value: 'month', labelKey: 'charts.month' },
  { value: 'quarter', labelKey: 'charts.quarter' },
  { value: 'year', labelKey: 'charts.year' },
];

const formatMonthLabel = (year: number, month: number, locale: string): string => {
  const name = getMonthName(month, locale, 'long');
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};

export const ChartsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [view, setView] = useState<ChartsView>('flow');
  const [period, setPeriod] = useState<ChartPeriod>('month');
  const [scopeFilter, setScopeFilter] = useState<TransactionScope | undefined>(undefined);
  const settings = useStore((state) => state.settings);
  const { getPeriodSummary, getDailyTotals } = useTransactions();
  const { bankAccounts, investments, debts } = useAccounts();

  const toggleScope = (value: TransactionScope) => {
    setScopeFilter((prev) => (prev === value ? undefined : value));
  };

  const summary = useMemo(
    () => getPeriodSummary(period, undefined, scopeFilter),
    [period, scopeFilter, getPeriodSummary]
  );
  const dailyTotals = useMemo(
    () => getDailyTotals(period, 'expense', scopeFilter),
    [period, scopeFilter, getDailyTotals]
  );
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const pieData = useMemo(() => {
    if (summary.byCategory.length === 0) {
      return [{ name: t('charts.noData'), population: 1, color: theme.textSecondary, legendFontColor: theme.textSecondary }];
    }
    return summary.byCategory.map((cat) => ({
      name: cat.categoryName,
      population: cat.total,
      color: cat.color,
      legendFontColor: theme.text,
      legendFontSize: 12,
    }));
  }, [summary.byCategory, theme]);

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

  const netWorthSeries = useMemo(
    () => computeMonthlyNetWorthSeries(bankAccounts, investments, debts),
    [bankAccounts, investments, debts]
  );

  const netWorthLineData = useMemo(
    () => ({
      labels: netWorthSeries.map((p) => `${p.month}/${String(p.year).slice(2)}`),
      datasets: [
        {
          data: netWorthSeries.map((p) => p.value),
          color: (opacity = 1) => hexToRgba(theme.primary, opacity),
          strokeWidth: 2,
        },
      ],
    }),
    [netWorthSeries, theme.primary]
  );

  // Fila mes -> valor -> variación vs. mes anterior, más reciente primero.
  const netWorthRows = useMemo(
    () =>
      netWorthSeries
        .map((point, index) => ({
          ...point,
          diff: index > 0 ? point.value - netWorthSeries[index - 1].value : undefined,
        }))
        .reverse(),
    [netWorthSeries]
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

        {/* View Switcher */}
        <View style={styles.viewSelector}>
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'flow', label: t('charts.viewFlow') },
              { value: 'netWorth', label: t('charts.viewNetWorth') },
            ]}
          />
        </View>

        {view === 'flow' ? (
          <>
            {/* Filtros: período (chips) + ámbito (chips de filtro togglables) */}
            <View style={styles.filterRow}>
              <View style={styles.periodGroup}>
                {PERIOD_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={t(option.labelKey)}
                    selected={period === option.value}
                    onPress={() => setPeriod(option.value)}
                    variant="tinted"
                    dense
                  />
                ))}
              </View>
              <View style={styles.scopeGroup}>
                <Chip
                  label={t('charts.scopePersonal')}
                  selected={scopeFilter === 'personal'}
                  onPress={() => toggleScope('personal')}
                  icon="person-outline"
                  variant="tinted"
                  dense
                />
                <Chip
                  label={t('charts.scopeBusiness')}
                  selected={scopeFilter === 'business'}
                  onPress={() => toggleScope('business')}
                  icon="briefcase-outline"
                  variant="tinted"
                  dense
                />
              </View>
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
                      color: (opacity = 1) => hexToRgba(theme.text, opacity),
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
                  yAxisSuffix={settings.currencySymbol}
                  chartConfig={{
                    backgroundColor: theme.card,
                    backgroundGradientFrom: theme.card,
                    backgroundGradientTo: theme.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => hexToRgba(theme.expense, opacity),
                    labelColor: (opacity = 1) => hexToRgba(theme.textSecondary, opacity),
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
          </>
        ) : (
          <>
            {/* Net Worth Chart */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('charts.netWorthChartTitle')}</Text>
              {netWorthSeries.length > 0 ? (
                <LineChart
                  data={netWorthLineData}
                  width={CHART_WIDTH - 32}
                  height={200}
                  yAxisLabel=""
                  yAxisSuffix={settings.currencySymbol}
                  chartConfig={{
                    backgroundColor: theme.card,
                    backgroundGradientFrom: theme.card,
                    backgroundGradientTo: theme.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => hexToRgba(theme.primary, opacity),
                    labelColor: (opacity = 1) => hexToRgba(theme.textSecondary, opacity),
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: theme.primary,
                    },
                  }}
                  style={styles.barChart}
                  bezier
                />
              ) : (
                <Text style={styles.noDataText}>{t('charts.netWorthNoData')}</Text>
              )}
            </Card>

            {/* Net Worth Monthly List */}
            {netWorthRows.length > 0 && (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>{t('charts.netWorthListTitle')}</Text>
                {netWorthRows.map((row, index) => (
                  <View
                    key={`${row.year}-${row.month}`}
                    style={[
                      styles.netWorthRow,
                      index === netWorthRows.length - 1 && styles.netWorthRowLast,
                    ]}
                  >
                    <Text style={styles.netWorthRowMonth}>
                      {formatMonthLabel(row.year, row.month, locale)}
                    </Text>
                    <View style={styles.netWorthRowValues}>
                      <Text style={styles.netWorthRowValue}>
                        {formatCurrency(row.value, settings.currencySymbol, locale)}
                      </Text>
                      {row.diff !== undefined && (
                        <Text
                          style={[
                            styles.netWorthRowDiff,
                            row.diff >= 0 ? styles.incomeValue : styles.expenseValue,
                          ]}
                        >
                          {row.diff >= 0 ? '+' : ''}
                          {formatCurrency(row.diff, settings.currencySymbol, locale)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    rowGap: 8,
    marginBottom: 20,
  },
  periodGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  scopeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.expense,
    fontVariant: ['tabular-nums'],
  },
  chartCard: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  pieContainer: {
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: theme.textSecondary,
    paddingVertical: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.text,
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    fontVariant: ['tabular-nums'],
  },
  categoryPercent: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  barChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  viewSelector: {
    marginBottom: 16,
  },
  netWorthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  netWorthRowLast: {
    borderBottomWidth: 0,
  },
  netWorthRowMonth: {
    fontSize: 15,
    color: theme.text,
  },
  netWorthRowValues: {
    alignItems: 'flex-end',
  },
  netWorthRowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    fontVariant: ['tabular-nums'],
  },
  netWorthRowDiff: {
    fontSize: 13,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  incomeValue: {
    color: theme.income,
  },
  expenseValue: {
    color: theme.expense,
  },
});
