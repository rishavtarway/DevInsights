import { usePullRequestMetrics } from '@/hooks/useMetrics';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PullRequestChartProps = {
  repoId: string;
  timeRange: 'day' | 'week' | 'month';
};

export default function PullRequestChart({ repoId, timeRange }: PullRequestChartProps) {
  const { data: metrics, isLoading, error } = usePullRequestMetrics(repoId, timeRange);
  
  // Process data for the chart
  const chartData = metrics?.map(metric => ({
    date: format(parseISO(metric.timestamp), 'MMM dd'),
    pullRequests: metric.value
  })) || [];
  
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading chart data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Error loading chart data</div>;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-80">
      <h3 className="text-lg font-medium mb-4">Pull Request Activity</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pullRequests" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
