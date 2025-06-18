import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase, Transaction } from '../contexts/DatabaseContext';
import { AlertTriangle, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { currentUser, isAdmin } = useAuth();
  const { getTransactionsByUserId, getAllTransactions } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    fraudTransactions: 0,
    totalAmount: 0,
    fraudAmount: 0
  });

  useEffect(() => {
    if (currentUser) {
      const userTransactions = isAdmin 
        ? getAllTransactions() 
        : getTransactionsByUserId(currentUser.id);
      
      setTransactions(userTransactions.slice(0, 5)); // Get the 5 most recent transactions
      
      // Calculate statistics
      const allTransactions = isAdmin ? getAllTransactions() : getTransactionsByUserId(currentUser.id);
      const totalTransactions = allTransactions.length;
      const fraudTransactions = allTransactions.filter(t => t.isFraud).length;
      const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);
      const fraudAmount = allTransactions
        .filter(t => t.isFraud)
        .reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        totalTransactions,
        fraudTransactions,
        totalAmount,
        fraudAmount
      });
    }
  }, [currentUser, getTransactionsByUserId, isAdmin, getAllTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/transaction"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Transaction
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex-1 min-w-[200px] max-w-none">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-full">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalTransactions}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex-1 min-w-[200px] max-w-none">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-full">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Fraud Detected</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.fraudTransactions}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex-1 min-w-[200px] max-w-none">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-full">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalAmount)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex-1 min-w-[200px] max-w-none">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-full">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Fraud Amount</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{formatCurrency(stats.fraudAmount)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            {transactions.length > 0 ? (
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
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.merchant}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.isFraud ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Fraud Detected
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Legitimate
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No transactions found</p>
              </div>
            )}
          </div>
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
            <Link
              to="/history"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all transactions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;