import { useMemo } from 'react';
import { cn } from '../../utils/format';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TICK_FONT = { size: 11, weight: '500', family: "'Inter', sans-serif" };

const ChartLine = ({
  data = [],
  xKey,
  yKeys = [],
  labels = [],
  colors = [],
  height = 300,
  className = '',
  formatX = (v) => v
}) => {
  const chartData = useMemo(() => {
    if (!data.length || !yKeys.length) return { labels: [], datasets: [] };

    return {
      labels: data.map(d => formatX(d[xKey])),
      datasets: yKeys.map((key, i) => ({
        label: labels[i] || key,
        data: data.map(d => d[key] || 0),
        borderColor: colors[i] || `hsl(${i * 60}, 70%, 50%)`,
        backgroundColor: `${colors[i] || `hsl(${i * 60}, 70%, 50%)`}1A`,
        borderWidth: 3,
        fill: true,
        tension: 0.25,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors[i] || `hsl(${i * 60}, 70%, 50%)`,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      }))
    };
  }, [data, xKey, yKeys, labels, colors, formatX]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 16, right: 20, bottom: 0, left: 0 } },
    plugins: {
      legend: {
        display: labels.length > 1,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: TICK_FONT
        }
      },
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
        displayColors: false,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: TICK_FONT, maxRotation: 30, minRotation: 10 }
      },
      y: {
        grid: { color: 'rgba(15,23,42,0.06)' },
        ticks: {
          color: '#94A3B8',
          font: TICK_FONT,
          callback: (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)
        }
      }
    },
    interaction: { intersect: false, mode: 'index' }
  }), [labels]);

  return (
    <div className={cn('w-full h-full min-h-0', className)} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ChartLine;
