import { useCommitMetrics } from '@/hooks/useMetrics';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type CommitActivityChartProps = {
  repoId: string;
  timeRange: 'day' | 'week' | 'month';
};

export default function CommitActivityChart({ repoId, timeRange }: CommitActivityChartProps) {
  const { data: metrics, isLoading, error } = useCommitMetrics(repoId, timeRange);
  
  // Process data for the chart
  const chartData = metrics?.map(metric => ({
    date: format(parseISO(metric.timestamp), 'MMM dd'),
    commits: metric.value
  })) || [];
  
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading chart data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Error loading chart data</div>;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-80">
      <h3 className="text-lg font-medium mb-4">Commit Activity</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="commits" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
