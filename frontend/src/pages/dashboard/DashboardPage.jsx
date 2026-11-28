import { useEffect } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import {
  formatCurrency,
  
  getVariationColor,
  
  formatPercent,
  cn
} from '../../utils/format';
import {
  
  
  Minus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Sparkles,
  Activity,
  Layers2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ChartBar from '../../components/charts/ChartBar';
import ChartDoughnut from '../../components/charts/ChartDoughnut';
import ChartLine from '../../components/charts/ChartLine';
import ChartHorizontalBar from '../../components/charts/ChartHorizontalBar';

/* ----------------------------- KPIs ----------------------------- */
const KPICard = ({ title, value, icon, variation, variationLabel, iconColor, TrendIcon }) => {
  const Icon = icon;
  const hasVariation = variation !== undefined;

  return (
    <Card className="stat-card group">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 truncate">
            {value}
          </p>
          {hasVariation && (
            <div className={cn('flex items-center gap-1.5 mt-2 text-sm', getVariationColor(variation))}>
              <span className="inline-flex items-center gap-0.5 font-semibold">
                {variation > 0 && <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />}
                {variation < 0 && <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />}
                {variation === 0 && <Minus className="w-3.5 h-3.5" aria-hidden="true" />}
                {Math.abs(variation)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400">vs {variationLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('stat-icon', iconColor)} aria-hidden="true">
          {TrendIcon ? <TrendIcon className="w-5 h-5" /> : <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
    </Card>
  );
};

/* ----------------------------- Móviles recientes ----------------------------- */
const RecentMovements = ({ movements }) => {
  if (!movements || movements.length === 0) {
    return (
      <Card className="stat-card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkles className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="empty-state-title">Sin movimientos recientes</h3>
          <p className="empty-state-desc">Crea tu primer movimiento desde la página de Historial.</p>
        </div>
      </Card>
    );
  }

  const formatIcon = (m) => {
    if (m.category?.icon) return <i className={cn(m.category.icon, m.type === 'income' ? 'text-income-600 dark:text-income-400' : 'text-expense-600 dark:text-expense-400')} />;
    return m.type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5 text-income-500" aria-hidden="true" /> : <ArrowDownRight className="w-3.5 h-3.5 text-expense-500" aria-hidden="true" />;
  };

  return (
    <Card className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-50">Últimos movimientos</h3>
        <a
          href="/history"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          Ver todos →
        </a>
      </div>
      <ul className="space-y-3" aria-label="Últimos movimientos">
        {movements.slice(0, 5).map((m) => (
          <li key={m.id} className="table-body-row flex items-center gap-3 px-3 py-2.5">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold',
                m.type === 'income'
                  ? 'bg-income-50 text-income-600 dark:bg-income-900/20'
                  : 'bg-expense-50 text-expense-600 dark:bg-expense-900/20'
              )}
              aria-hidden="true"
            >
              {formatIcon(m)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{m.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {m.category?.name} · {m.account?.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn('text-sm font-semibold', m.type === 'income' ? 'text-income-700 dark:text-income-300' : 'text-expense-700 dark:text-expense-300')}>
                {m.type === 'income' ? '+' : '−'}{formatCurrency(Math.abs(m.amount), m.currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(m.date).toLocaleDateString('es-ES')}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

/* ----------------------------- Resumen de cuentas ----------------------------- */
const AccountsSummary = ({ accounts }) => {
  if (!accounts || accounts.length === 0) return null;

  const sorted = [...accounts].sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0));

  return (
    <Card className="stat-card">
      <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-50">Resumen de cuentas</h3>
      <div className="space-y-3">
        {sorted.map((account) => (
          <div key={account.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-sm',
                  account.type === 'credit_card'
                    ? 'bg-expense-50 text-expense-600 dark:bg-expense-900/20'
                    : account.type === 'bank' || account.type === 'debit_card'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                      : 'bg-income-50 text-income-600 dark:bg-income-900/20'
                )}
                aria-hidden="true"
              >
                <i data-lucide={account.type} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{account.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {account.type} · {account.currency}
                </p>
              </div>
            </div>
            <p className="text-right text-sm font-bold text-gray-900 dark:text-gray-50 whitespace-nowrap">
              {formatCurrency(account.currentBalance, account.currency)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ----------------------------- Alertas de presupuestos ----------------------------- */
const BudgetAlerts = ({ alerts }) => {
  if (!alerts || (alerts.warning === 0 && alerts.danger === 0 && alerts.critical === 0)) return null;

  const total = (alerts.warning || 0) + (alerts.danger || 0) + (alerts.critical || 0);

  return (
    <Card className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-warning-50 text-warning-600 dark:bg-warning-900/20 flex items-center justify-center">
          <Activity className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-50">Presupuestos en alerta</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{total} {total === 1 ? 'presupuesto' : 'presupuestos'} cerca del límite</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {alerts.warning > 0 && <Badge variant="warning">{alerts.warning} Advertencia</Badge>}
        {alerts.danger > 0 && <Badge variant="danger">{alerts.danger} Peligro</Badge>}
        {alerts.critical > 0 && <Badge variant="danger">{alerts.critical} Crítico</Badge>}
      </div>
    </Card>
  );
};

/* ----------------------------- DashboardPage ----------------------------- */
const DashboardPage = () => {
  const { summary, charts, loading, fetchAll } = useDashboard();

  useEffect(() => {
    fetchAll('12m');
  }, [fetchAll]);

  const currentIncome = summary?.monthlyIncome || 0;
  const currentExpense = summary?.monthlyExpense || 0;
  const currentBalance = summary?.monthlyBalance || 0;
  const expensePct = summary?.expensePercentage || 0;
  const incomeVar = summary?.previousMonthComparison?.income?.variation || 0;
  const expenseVar = summary?.previousMonthComparison?.expense?.variation || 0;
  const balanceVar = summary?.previousMonthComparison?.balance?.variation || 0;

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="stat" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen actual de tus finanzas</p>
      </header>

      {/* KPIs */}
      <section aria-labelledby="summary-title">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <KPICard
            title="Saldo disponible"
            value={formatCurrency(currentBalance)}
            icon={Wallet}
            variation={balanceVar}
            variationLabel="mes anterior"
            iconColor="bg-primary-600"
          />
          <KPICard
            title="Ingresos del mes"
            value={formatCurrency(currentIncome)}
            icon={ArrowUpRight}
            variation={incomeVar}
            variationLabel="mes anterior"
            iconColor="bg-income-600"
          />
          <KPICard
            title="Gastos del mes"
            value={formatCurrency(currentExpense)}
            icon={ArrowDownRight}
            variation={expenseVar}
            variationLabel="mes anterior"
            iconColor="bg-expense-600"
          />
          <KPICard
            title="Ingresos vs gastos"
            value={`${formatPercent(expensePct)}`}
            icon={DollarSign}
            variation={expenseVar - incomeVar}
            variationLabel="mes anterior"
            iconColor="bg-warning-600"
            TrendIcon={Layers2}
          />
        </div>
      </section>

      {/* Gráficos */}
      <section aria-labelledby="charts-title" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="stat-card">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Evolución del balance mensual</h3>
            {charts?.balanceEvolution ? (
              <ChartLine
                data={charts.balanceEvolution}
                xKey="month"
                yKeys={['balance']}
                labels={['Balance']}
                colors={['#6366f1']}
                height={300}
              />
            ) : (
              <div className="skeleton-line h-64 w-full" />
            )}
          </Card>

          <Card className="stat-card">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Distribución de gastos por categoría</h3>
            {charts?.expenseDistribution ? (
              <ChartDoughnut
                data={charts.expenseDistribution}
                labelKey="name"
                valueKey="total"
                colorKey="color"
                height={300}
              />
            ) : (
              <div className="skeleton-line h-64 w-full" />
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="stat-card">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Ingresos vs gastos (12 meses)</h3>
            {charts?.incomeVsExpense ? (
              <ChartBar
                data={charts.incomeVsExpense}
                xKey="month"
                yKeys={['income', 'expense']}
                labels={['Ingresos', 'Gastos']}
                colors={['#16a34a', '#dc2626']}
                height={300}
              />
            ) : (
              <div className="skeleton-line h-64 w-full" />
            )}
          </Card>

          <Card className="stat-card">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Top categorías de gasto</h3>
            {charts?.topExpenseCategories ? (
              <ChartHorizontalBar
                data={charts.topExpenseCategories}
                labelKey="name"
                valueKey="total"
                colorKey="color"
                height={300}
              />
            ) : (
              <div className="skeleton-line h-64 w-full" />
            )}
          </Card>
        </div>
      </section>

      {/* Información adicional */}
      <section className="grid gap-6 lg:grid-cols-3" aria-label="Información adicional">
        <RecentMovements movements={summary?.recentMovements} />
        <AccountsSummary accounts={summary?.accountsSummary} />
        <BudgetAlerts alerts={summary?.budgetsAlert} />
      </section>
    </div>
  );
};

export default DashboardPage;
