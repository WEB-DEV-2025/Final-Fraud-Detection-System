import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormData {
  amount: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  merchant: string;
  category: string;
}

function TransactionForm() {
  const { currentUser } = useAuth();
  const { addTransaction } = useDatabase();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ isFraud: boolean; probability: number } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: currentUser?.name || '',
    merchant: '',
    category: 'Shopping'
  });

  const validateExpiryDate = (expiryDate: string): boolean => {
    // Check format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;

    const [month, year] = expiryDate.split('/').map(num => parseInt(num, 10));
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Get last 2 digits
    const currentMonth = now.getMonth() + 1; // Months are 0-based

    // Validate month
    if (month < 1 || month > 12) return false;

    // Check if card is expired
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false;
    }

    return true;
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = e.target;
    
    // Auto-format expiry date
    if (value.length === 2 && !value.includes('/') && formData.expiryDate.length !== 3) {
      value = value + '/';
    }
    
    setFormData(prev => ({ ...prev, expiryDate: value }));
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Only allow numbers
    const cleaned = value.replace(/\D/g, '');
    // Limit to 16 digits
    const truncated = cleaned.slice(0, 16);
    setFormData(prev => ({ ...prev, cardNumber: truncated }));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Only allow numbers
    const cleaned = value.replace(/\D/g, '');
    // Limit to 4 digits (some cards have 4-digit CVV)
    const truncated = cleaned.slice(0, 4);
    setFormData(prev => ({ ...prev, cvv: truncated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setResult(null);
    
    try {
      // Validate card expiry
      const [month, year] = formData.expiryDate.split('/').map(num => parseInt(num, 10));
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        throw new Error('Card is expired');
      }

      // Validate card number (basic check)
      if (formData.cardNumber.length < 15 || formData.cardNumber.length > 16) {
        throw new Error('Invalid card number');
      }

      // Parse the numeric values
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      // Get the last 4 digits of the card number for storage
      const last4 = formData.cardNumber.slice(-4);
      
      // Get user's IP and location (in a real app, this would be more sophisticated)
      const deviceId = navigator.userAgent;
      const ipAddress = '127.0.0.1'; // Simulated IP
      const location = 'Local'; // Simulated location
      
      const transaction = await addTransaction({
        userId: currentUser?.id || '',
        amount,
        cardNumber: last4,
        cardholderName: formData.cardholderName,
        merchant: formData.merchant,
        category: formData.category,
        status: 'pending',
        deviceId,
        ipAddress,
        location
      });
      
      setResult({
        isFraud: transaction.isFraud,
        probability: transaction.fraudProbability
      });
      
      // Reset form if not fraud
      if (!transaction.isFraud) {
        setTimeout(() => {
          setFormData({
            amount: '',
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: currentUser?.name || '',
            merchant: '',
            category: 'Shopping'
          });
          toast.success('Transaction processed successfully!');
        }, 1000);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-white" />
            <h3 className="ml-2 text-lg leading-6 font-medium text-white">New Transaction</h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-blue-100">
            Enter payment details to verify transaction
          </p>
        </div>
        
        {result ? (
          <div className="px-4 py-5 sm:p-6 animate-fade-in">
            <div className={`p-6 rounded-lg ${result.isFraud ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center justify-center">
                {result.isFraud ? (
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                ) : (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                )}
              </div>
              <h3 className="mt-4 text-xl font-bold text-center text-gray-900">
                {result.isFraud ? 'Fraud Detected' : 'Transaction Approved'}
              </h3>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Fraud Probability:</span>
                  <span className="text-sm font-medium">{(result.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      result.probability > 0.7 
                        ? 'bg-red-600' 
                        : result.probability > 0.4 
                          ? 'bg-yellow-500' 
                          : 'bg-green-600'
                    }`} 
                    style={{ width: `${result.probability * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-6 flex justify-center space-x-4">
                {result.isFraud ? (
                  <button
                    onClick={() => setResult(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                ) : (
                  <button
                    onClick={() => setResult(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    New Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount ($)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="amount"
                    id="amount"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="merchant" className="block text-sm font-medium text-gray-700">
                  Merchant
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="merchant"
                    id="merchant"
                    required
                    value={formData.merchant}
                    onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Merchant name"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                  Card Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="cardNumber"
                    id="cardNumber"
                    required
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
                  Cardholder Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="cardholderName"
                    id="cardholderName"
                    required
                    value={formData.cardholderName}
                    onChange={(e) => setFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Full name as on card"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="expiryDate"
                    id="expiryDate"
                    required
                    value={formData.expiryDate}
                    onChange={handleExpiryDateChange}
                    maxLength={5}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="MM/YY"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                  CVV
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="cvv"
                    id="cvv"
                    required
                    value={formData.cvv}
                    onChange={handleCvvChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Transaction Category
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Shopping">Shopping</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Travel">Travel</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Cryptocurrency">Cryptocurrency</option>
                    <option value="Jewelry">Jewelry</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      amount: '',
                      cardNumber: '',
                      expiryDate: '',
                      cvv: '',
                      cardholderName: currentUser?.name || '',
                      merchant: '',
                      category: 'Shopping'
                    });
                  }}
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TransactionForm;