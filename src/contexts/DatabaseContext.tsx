import React, { createContext, useContext, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { initializeModels, detectFraud } from '../utils/fraudModel';
import UAParser from 'ua-parser-js';
import toast from 'react-hot-toast';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  cardNumber: string;
  cardholderName: string;
  date: string;
  merchant: string;
  isFraud: boolean;
  fraudProbability: number;
  status: 'completed' | 'pending' | 'declined';
  category: string;
  deviceInfo: string;
  ipAddress: string;
  userLocation: string;
  velocity: number;
  riskFactors: string[];
  browserFingerprint: string;
  deviceId: string;
}

interface DatabaseContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'isFraud' | 'fraudProbability' | 'riskFactors'>) => Promise<Transaction>;
  getTransactionsByUserId: (userId: string) => Transaction[];
  getAllTransactions: () => Transaction[];
  clearAllTransactions: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

const MOCK_TRANSACTIONS: Transaction[] = [];

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [models, setModels] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeSystem = async () => {
      try {
        setIsInitializing(true);
        
        // Initialize TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js initialized');

        // Load and warm up the model
        const initializedModels = await initializeModels();
        if (mounted) {
          setModels(initializedModels);
          console.log('Fraud detection model initialized');
        }

        // Load transactions from localStorage
        const savedTransactions = localStorage.getItem('transactions');
        if (mounted) {
          if (savedTransactions) {
            try {
              const parsedTransactions = JSON.parse(savedTransactions);
              setTransactions(Array.isArray(parsedTransactions) ? parsedTransactions : []);
            } catch (error) {
              console.error('Error parsing saved transactions:', error);
              setTransactions([]);
              localStorage.removeItem('transactions'); // Remove corrupted data
            }
          } else {
            setTransactions(MOCK_TRANSACTIONS);
            if (MOCK_TRANSACTIONS.length > 0) {
              localStorage.setItem('transactions', JSON.stringify(MOCK_TRANSACTIONS));
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize fraud detection system:', error);
        toast.error('Failed to initialize fraud detection system. Please try again.');
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeSystem();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Save transactions to localStorage whenever transactions change
    if (transactions.length >= 0) { // Allow saving empty array
      try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error('Error saving transactions to localStorage:', error);
      }
    }
  }, [transactions]);

  const getDeviceFingerprint = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    return {
      deviceInfo: JSON.stringify(result),
      browserFingerprint: `${result.browser.name}-${result.browser.version}-${result.os.name}`,
      deviceId: `${result.os.name}-${result.cpu.architecture}-${result.engine.name}`
    };
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'date' | 'isFraud' | 'fraudProbability' | 'riskFactors'>) => {
    if (!models) {
      throw new Error('Fraud detection system not initialized');
    }

    const deviceInfo = getDeviceFingerprint();
    const userTransactions = getTransactionsByUserId(transactionData.userId);
    
    // Calculate transaction velocity (last 24h)
    const recentTransactions = userTransactions.filter(t => {
      const transactionTime = new Date(t.date).getTime();
      const currentTime = new Date().getTime();
      return (currentTime - transactionTime) <= 24 * 60 * 60 * 1000;
    });

    const velocity = recentTransactions.length;
    const totalAmount24h = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

    const transactionForDetection = {
      ...transactionData,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      velocity,
      totalAmount24h,
      ...deviceInfo
    };

    const { isFraud, probability, riskFactors } = await detectFraud(
      models,
      transactionForDetection,
      userTransactions
    );

    const newTransaction: Transaction = {
      ...transactionData,
      ...deviceInfo,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      isFraud,
      fraudProbability: probability,
      status: isFraud ? 'declined' : 'completed',
      riskFactors,
      velocity
    };

    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
  };

  const getTransactionsByUserId = (userId: string) => {
    return transactions.filter(t => t.userId === userId);
  };

  const getAllTransactions = () => {
    return transactions;
  };

  const clearAllTransactions = () => {
    setTransactions([]);
    localStorage.removeItem('transactions');
    
    // Clear any other transaction-related localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('transaction')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  if (isInitializing) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Initializing fraud detection system...</p>
      </div>
    </div>;
  }

  const value = {
    transactions,
    addTransaction,
    getTransactionsByUserId,
    getAllTransactions,
    clearAllTransactions
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}