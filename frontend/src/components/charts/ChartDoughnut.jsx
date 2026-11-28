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

const TICK_FONT = { size: 11, weight: '500', family: "'Inter', sans-serif" };

const ChartDoughnut = ({
  data = [],
  labelKey = 'name',
  valueKey = 'total',
  colorKey = 'color',
  height = 300,
  className = ''
}) => {
  const total = useMemo(() => data.reduce((sum, d) => sum + (d[valueKey] || 0), 0), [data, valueKey]);

  const chartData = useMemo(() => {
    if (!data.length) return { labels: [], datasets: [] };

    return {
      labels: data.map(d => d[labelKey]),
      datasets: [{
        data: data.map(d => d[valueKey] || 0),
        backgroundColor: data.map(d => d[colorKey] || '#64748B'),
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  }, [data, labelKey, valueKey, colorKey]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    layout: { padding: 20 },
    plugins: {
      title: {
        display: false
      },
      subtitle: {
        display: false
      },
      legend: {
        display: true,
        position: 'right',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: TICK_FONT
        },
        generateLabels: (chart) => {
          const original = ChartJS.overrides.doughnut.plugins.legend.labels.generateLabels(chart);
          return original.map((label, i) => ({
            ...label,
            text: `${label.text} · ${data[i] ? `${((data[i][valueKey] / total) * 100).toFixed(1)}%` : ''}`
          }));
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
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label} — ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)} (${percentage}%)`;
          }
        }
      }
    }
  }), [data, valueKey, total]);

  return (
    <div className={cn('w-full h-full min-h-0', className)} style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default ChartDoughnut;
