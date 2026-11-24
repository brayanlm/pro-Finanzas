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
        label: 'Total',
        data: sortedData.map(d => d[valueKey] || 0),
        backgroundColor: sortedData.map(d => d[colorKey] || '#6b7280'),
        borderRadius: 6,
        borderSkipped: false
      }]
    };
  }, [data, labelKey, valueKey, colorKey, maxBars]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => `Gasto: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.x)}`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { 
          font: { size: 11 },
          callback: (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)
        }
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  }), []);

  return (
    <div className={cn('w-full h-full min-h-0 overflow-hidden', className)} style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ChartHorizontalBar;