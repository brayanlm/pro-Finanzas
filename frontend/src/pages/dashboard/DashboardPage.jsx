import { useEffect } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { formatCurrency, formatPercent, getVariationColor, getVariationIcon } from '../../utils/format';
import { TrendingUp, TrendingDown, Minus, Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ChartBar from '../../components/charts/ChartBar';
import ChartDoughnut from '../../components/charts/ChartDoughnut';
import ChartLine from '../../components/charts/ChartLine';
import ChartHorizontalBar from '../../components/charts/ChartHorizontalBar';

const KPICard = ({ title, value, icon, variation, variationLabel, iconColor, className }) => {
  const Icon = icon;
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {variation !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span className={getVariationColor(variation)}>{getVariationIcon(variation)}</span>
              <span className={getVariationColor(variation)}>{Math.abs(variation)}%</span>
              <span className="text-gray-500 dark:text-gray-400">vs {variationLabel}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
};

const RecentMovements = ({ movements }) => {
  if (!movements || movements.length === 0) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Últimos movimientos</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay movimientos recientes
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Últimos movimientos</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          {movements.slice(0, 5).map((movement) => (
            <div key={movement.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  movement.type === 'income' ? 'bg-income-100 text-income-600' : 'bg-expense-100 text-expense-600'
                }`}>
                  {movement.category?.icon ? (
                    <i className={movement.category.icon} />
                  ) : (
                    movement.type === 'income' ? '+' : '-'
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{movement.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {movement.category?.name} • {movement.account?.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  movement.type === 'income' ? 'text-income-600' : 'text-expense-600'
                }`}>
                  {movement.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(movement.amount))}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(movement.date).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
};

const AccountsSummary = ({ accounts }) => {
  if (!accounts || accounts.length === 0) return null;

  return (
    <Card>
      <Card.Header>
        <Card.Title>Resumen de cuentas</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</p>
                <Badge variant={account.type === 'credit_card' ? 'danger' : 'default'}>
                  {account.type}
                </Badge>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(account.currentBalance, account.currency)}
              </p>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
};

const BudgetAlerts = ({ alerts }) => {
  if (!alerts || (alerts.warning === 0 && alerts.danger === 0 && alerts.critical === 0)) {
    return null;
  }

  return (
    <Card className="border-warning-200 dark:border-warning-800">
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Presupuestos en alerta
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex items-center gap-4 text-sm">
          {alerts.warning > 0 && (
            <Badge variant="warning">{alerts.warning} Advertencia</Badge>
          )}
          {alerts.danger > 0 && (
            <Badge variant="danger">{alerts.danger} Peligro</Badge>
          )}
          {alerts.critical > 0 && (
            <Badge variant="danger">{alerts.critical} Crítico</Badge>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

const DashboardPage = () => {
  const { summary, charts, loading, fetchAll } = useDashboard();

  useEffect(() => {
    fetchAll('12m');
  }, [fetchAll]);

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    );
  }

  const currentIncome = summary?.monthlyIncome || 0;
  const currentExpense = summary?.monthlyExpense || 0;
  const currentBalance = summary?.monthlyBalance || 0;
  const expensePct = summary?.expensePercentage || 0;
  const incomeVar = summary?.previousMonthComparison?.income?.variation || 0;
  const expenseVar = summary?.previousMonthComparison?.expense?.variation || 0;
  const balanceVar = summary?.previousMonthComparison?.balance?.variation || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Resumen de tus finanzas</p>
      </div>

      {/* 1. Resumen financiero */}
      <section className="space-y-4" aria-labelledby="summary-title">
        <h2 id="summary-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Resumen financiero
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            title="Gastos / Ingresos"
            value={formatPercent(expensePct)}
            icon={DollarSign}
            variation={expenseVar - incomeVar}
            variationLabel="mes anterior"
            iconColor="bg-warning-600"
          />
        </div>
      </section>

      {/* 2. Gráficos */}
      <section className="space-y-6" aria-labelledby="charts-title">
        <h2 id="charts-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Gráficos
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Card.Header>
              <Card.Title>Evolución del balance mensual</Card.Title>
            </Card.Header>
            <Card.Content>
              {charts?.balanceEvolution ? (
                <ChartLine
                  data={charts.balanceEvolution}
                  xKey="month"
                  yKeys={['balance']}
                  labels={['Balance']}
                  colors={['#4f46e5']}
                  height={300}
                />
              ) : (
                <Skeleton variant="card" className="h-80" />
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Distribución de gastos por categoría</Card.Title>
            </Card.Header>
            <Card.Content>
              {charts?.expenseDistribution ? (
                <ChartDoughnut
                  data={charts.expenseDistribution}
                  labelKey="name"
                  valueKey="total"
                  colorKey="color"
                  height={300}
                />
              ) : (
                <Skeleton variant="card" className="h-80" />
              )}
            </Card.Content>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Card.Header>
              <Card.Title>Ingresos vs Gastos (12 meses)</Card.Title>
            </Card.Header>
            <Card.Content>
              {charts?.incomeVsExpense ? (
                <ChartBar
                  data={charts.incomeVsExpense}
                  xKey="month"
                  yKeys={['income', 'expense']}
                  labels={['Ingresos', 'Gastos']}
                  colors={['#22c55e', '#ef4444']}
                  height={300}
                />
              ) : (
                <Skeleton variant="card" className="h-80" />
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Top 10 categorías de gasto</Card.Title>
            </Card.Header>
            <Card.Content>
              {charts?.topExpenseCategories ? (
                <ChartHorizontalBar
                  data={charts.topExpenseCategories}
                  labelKey="name"
                  valueKey="total"
                  colorKey="color"
                  height={300}
                />
              ) : (
                <Skeleton variant="card" className="h-80" />
              )}
            </Card.Content>
          </Card>
        </div>
      </section>

      {/* 3. Información adicional */}
      <section className="space-y-4" aria-labelledby="info-title">
        <h2 id="info-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Información adicional
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <RecentMovements movements={summary?.recentMovements} />
          <AccountsSummary accounts={summary?.accountsSummary} />
          <BudgetAlerts alerts={summary?.budgetsAlert} />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;