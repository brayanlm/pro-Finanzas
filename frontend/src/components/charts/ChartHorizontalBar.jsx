import { useMemo } from 'react';
import { cn } from '../../utils/format';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TICK_FONT = { size: 11, weight: '500', family: "'Inter', sans-serif" };

const ChartHorizontalBar = ({
  data = [],
  labelKey = 'name',
  valueKey = 'total',
  colorKey = 'color',
  height = 300,
  className = '',
  maxBars = 10
}) => {
  const chartData = useMemo(() => {
    if (!data.length) return { labels: [], datasets: [] };

    const sortedData = [...data]
      .sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
      .slice(0, maxBars)
      .reverse();

    return {
      labels: sortedData.map(d => d[labelKey]),
      datasets: [{
        label: 'Gasto',
        data: sortedData.map(d => d[valueKey] || 0),
        backgroundColor: sortedData.map(d => d[colorKey] || '#64748B'),
        borderRadius: 6,
        borderSkipped: false
      }]
    };
  }, [data, labelKey, valueKey, colorKey, maxBars]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    layout: { padding: { top: 16, right: 20, bottom: 0, left: 0 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#11141B',
        titleColor: '#FFFFFF',
        bodyColor: '#E2E8F0',
        borderColor: '#FFFFFF',
        borderWidth: 0,
        cornerRadius: 10,
        boxPadding: 10,
        padding: { x: 12, y: 10 },
        titleFont: { size: 13, weight: '600', family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        callbacks: {
          label: (context) => `Gasto: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.x)}`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(15,23,42,0.06)' },
        ticks: {
          color: '#94A3B8',
          font: TICK_FONT,
          callback: (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#64748B',
          font: TICK_FONT,
          padding: 8
        }
      }
    }
  }), []);

  return (
    <div className={cn('w-full h-full min-h-0', className)} style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ChartHorizontalBar;
