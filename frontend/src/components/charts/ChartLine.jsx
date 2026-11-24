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
        backgroundColor: `${colors[i] || `hsl(${i * 60}, 70%, 50%)`}20`,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors[i] || `hsl(${i * 60}, 70%, 50%)`,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }))
    };
  }, [data, xKey, yKeys, labels, colors, formatX]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: labels.length > 1,
        position: 'top',
        labels: { usePointStyle: true, padding: 20, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => `${context.dataset.label}: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 45 }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { 
          font: { size: 11 },
          callback: (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)
        }
      }
    },
    interaction: { intersect: false, mode: 'index' },
    elements: { line: { borderWidth: 2 } }
  }), []);

  return (
    <div className={cn('w-full h-full min-h-0 overflow-hidden', className)} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ChartLine;