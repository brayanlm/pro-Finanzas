import { useMemo } from 'react';
import { cn } from '../../utils/format';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ChartDoughnut = ({ 
  data = [], 
  labelKey = 'name', 
  valueKey = 'total', 
  colorKey = 'color',
  height = 300,
  className = ''
}) => {
  const chartData = useMemo(() => {
    if (!data.length) return { labels: [], datasets: [] };

    const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);

    return {
      labels: data.map(d => d[labelKey]),
      datasets: [{
        data: data.map(d => d[valueKey] || 0),
        backgroundColor: data.map(d => d[colorKey] || '#6b7280'),
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  }, [data, labelKey, valueKey, colorKey]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 11 },
          generateLabels: (chart) => {
            const original = ChartJS.overrides.doughnut.plugins.legend.labels.generateLabels(chart);
            return original.map((label, i) => ({
              ...label,
              text: `${label.text} ${data[i] ? `${((data[i][valueKey] / total) * 100).toFixed(1)}%` : ''}`
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)} (${percentage}%)`;
          }
        }
      }
    }
  }), [data, labelKey, valueKey]);

  const total = useMemo(() => data.reduce((sum, d) => sum + (d[valueKey] || 0), 0), [data, valueKey]);

  return (
    <div className={cn('w-full min-h-0 overflow-hidden', className)} style={{ height }}>
      <div className="flex items-center justify-center h-full">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ChartDoughnut;