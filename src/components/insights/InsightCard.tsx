import { useState } from 'react';

type InsightCardProps = {
  insight: {
    id: string;
    title: string;
    description: string;
    recommendation: string;
    priority: number;
    created_at: string;
  };
};

export default function InsightCard({ insight }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return 'bg-red-100 text-red-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };
  
  const formattedDate = new Date(insight.created_at).toLocaleDateString();
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900">{insight.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(insight.priority)}`}>
            Priority {insight.priority}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">Generated on {formattedDate}</p>
        
        {isExpanded ? (
          <>
            <p className="text-gray-700 mb-4">{insight.description}</p>
            
            <div className="bg-indigo-50 p-3 rounded-md mb-4">
              <h4 className="text-sm font-semibold text-indigo-900 mb-1">Recommendation</h4>
              <p className="text-sm text-indigo-800">{insight.recommendation}</p>
            </div>
            
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Show less
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-700 mb-4 line-clamp-2">{insight.description}</p>
            
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Read more
            </button>
          </>
        )}
      </div>
    </div>
  );
}
