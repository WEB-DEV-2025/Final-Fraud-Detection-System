import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase, Transaction } from '../contexts/DatabaseContext';
import { Navigate } from 'react-router-dom';
import { BarChart2, PieChart, TrendingUp, AlertTriangle, Users, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Simple component to display a stat card
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: string;
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

// Detailed fraud transaction component
const FraudTransactionCard = ({ transaction }: { transaction: Transaction }) => (
  <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
    <div className="px-4 py-5 sm:p-6">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{transaction.merchant}</h4>
          <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${transaction.amount.toFixed(2)}
          </p>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {(transaction.fraudProbability * 100).toFixed(1)}% Risk
          </div>
        </div>
      </div>
      
      <div className="mt-4 bg-red-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-red-800 mb-2">Risk Factors:</h5>
        <div className="space-y-2">
          {transaction.riskFactors.map((factor, index) => (
            <div key={index} className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
              <span className="text-sm text-red-700">{factor}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Transaction Details:</span>
        </div>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900">{transaction.category}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Card Number</dt>
            <dd className="mt-1 text-sm text-gray-900">•••• {transaction.cardNumber}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Device ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{transaction.deviceId}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">IP Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{transaction.ipAddress}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
);

function AdminPanel() {
  const { isAdmin } = useAuth();
  const { getAllTransactions } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    fraudTransactions: 0,
    totalAmount: 0,
    fraudAmount: 0,
    categories: {} as Record<string, number>,
    merchants: {} as Record<string, number>,
  });

  const clearDatabase = () => {
    if (window.confirm('Are you sure you want to clear all transaction data? This action cannot be undone and will permanently delete all transactions for all users.')) {
      try {
        // Clear localStorage completely
        localStorage.removeItem('transactions');
        
        // Also clear any other related data that might exist
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('transaction')) {
            keysToRemove.push(key);
          }
        }
        
        // Remove all transaction-related keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Reset local state immediately
        setTransactions([]);
        setStats({
          totalTransactions: 0,
          fraudTransactions: 0,
          totalAmount: 0,
          fraudAmount: 0,
          categories: {},
          merchants: {}
        });
        
        // Force a page reload to ensure the DatabaseContext picks up the changes
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
        toast.success('Transaction database cleared successfully! Page will refresh to update all components.');
      } catch (error) {
        console.error('Error clearing database:', error);
        toast.error('Failed to clear database. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const allTransactions = getAllTransactions();
      setTransactions(allTransactions);
      
      // Calculate statistics
      const totalTx = allTransactions.length;
      const fraudTx = allTransactions.filter(t => t.isFraud);
      const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);
      const fraudAmount = fraudTx.reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate category statistics
      const categories: Record<string, number> = {};
      allTransactions.forEach(transaction => {
        const { category } = transaction;
        categories[category] = (categories[category] || 0) + 1;
      });
      
      // Calculate merchant statistics
      const merchants: Record<string, number> = {};
      allTransactions.forEach(transaction => {
        const { merchant } = transaction;
        merchants[merchant] = (merchants[merchant] || 0) + 1;
      });
      
      setStats({
        totalTransactions: totalTx,
        fraudTransactions: fraudTx.length,
        totalAmount,
        fraudAmount,
        categories,
        merchants
      });
    }
  }, [isAdmin, getAllTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  // Get fraudulent transactions
  const fraudulentTransactions = transactions.filter(t => t.isFraud);

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={clearDatabase}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Database
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Transactions" 
          value={stats.totalTransactions} 
          icon={BarChart2} 
          color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Fraud Transactions" 
          value={stats.fraudTransactions} 
          icon={AlertTriangle} 
          color="bg-red-100 text-red-600" 
        />
        <StatCard 
          title="Total Amount" 
          value={formatCurrency(stats.totalAmount)} 
          icon={TrendingUp} 
          color="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Fraud Amount" 
          value={formatCurrency(stats.fraudAmount)} 
          icon={PieChart} 
          color="bg-purple-100 text-purple-600" 
        />
      </div>

      {/* Fraud Transactions Section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Fraud Detections</h2>
        <div className="space-y-4">
          {fraudulentTransactions.length > 0 ? (
            fraudulentTransactions.map(transaction => (
              <FraudTransactionCard key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No fraud detected</h3>
              <p className="mt-1 text-sm text-gray-500">No fraudulent transactions have been detected yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;