import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase, Transaction } from '../contexts/DatabaseContext';
import { Search, Filter, AlertTriangle, CheckCircle } from 'lucide-react';

function TransactionHistory() {
  const { currentUser, isAdmin } = useAuth();
  const { getTransactionsByUserId, getAllTransactions } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    dateRange: 'all',
    fraudOnly: false
  });
  
  useEffect(() => {
    if (currentUser) {
      const userTransactions = isAdmin 
        ? getAllTransactions() 
        : getTransactionsByUserId(currentUser.id);
      
      // Sort by date, newest first
      const sortedTransactions = [...userTransactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setTransactions(sortedTransactions);
      setFilteredTransactions(sortedTransactions);
    }
  }, [currentUser, isAdmin, getTransactionsByUserId, getAllTransactions]);
  
  useEffect(() => {
    // Apply filters
    let results = [...transactions];
    
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(t => 
        t.merchant.toLowerCase().includes(term) || 
        t.cardholderName.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (filterOptions.status !== 'all') {
      results = results.filter(t => t.status === filterOptions.status);
    }
    
    // Fraud filter
    if (filterOptions.fraudOnly) {
      results = results.filter(t => t.isFraud);
    }
    
    // Date range filter
    if (filterOptions.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filterOptions.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      results = results.filter(t => new Date(t.date) >= startDate);
    }
    
    setFilteredTransactions(results);
  }, [transactions, searchTerm, filterOptions]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="col-span-1 sm:col-span-2">
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by merchant or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Status filter */}
            <div>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filterOptions.status}
                onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            
            {/* Date range filter */}
            <div>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filterOptions.dateRange}
                onChange={(e) => setFilterOptions({...filterOptions, dateRange: e.target.value})}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              id="fraudOnly"
              name="fraudOnly"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={filterOptions.fraudOnly}
              onChange={(e) => setFilterOptions({...filterOptions, fraudOnly: e.target.checked})}
            />
            <label htmlFor="fraudOnly" className="ml-2 block text-sm text-gray-700">
              Show fraud transactions only
            </label>
          </div>
        </div>
        
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {transaction.merchant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      •••• {transaction.cardNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {transaction.isFraud ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1.5" />
                            <span className="text-sm font-medium text-red-800">
                              Fraud ({(transaction.fraudProbability * 100).toFixed(0)}%)
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                            <span className="text-sm font-medium text-green-800">
                              Safe ({(transaction.fraudProbability * 100).toFixed(0)}%)
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;