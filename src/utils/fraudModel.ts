// Import required libraries
import * as tf from '@tensorflow/tfjs';
import UAParser from 'ua-parser-js';

// Define the structure for transaction data
interface TransactionData {
  amount: number;          // Transaction amount
  timeOfDay: number;       // Hour of the day (0-23)
  dayOfWeek: number;       // Day of the week (0-6)
  merchant: string;        // Merchant name
  category: string;        // Transaction category
  deviceInfo: any;         // Device information
  ipAddress: string;       // IP address
  userLocation: string;    // User's location
  velocity: number;        // Number of transactions in recent time
  totalAmount24h: number;  // Total amount in last 24 hours
  cardNumber: string;      // Card number (last 4 digits)
}

// Cache for model to avoid reinitializing
let cachedModel: tf.Sequential | null = null;

// Initialize and train the fraud detection model
export const initializeModels = async () => {
  try {
    // Return cached model if available
    if (cachedModel) {
      console.log('Using cached fraud detection model');
      return { model: cachedModel };
    }

    // Initialize TensorFlow.js with WebGL backend for GPU acceleration
    await tf.setBackend('webgl');
    await tf.ready();
    console.log('TensorFlow.js initialized with WebGL backend');
    
    // Create a sequential model with optimized architecture
    const model = tf.sequential();
    
    // Input layer - increased input features for better analysis
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [12], // Increased from 10 to include more features
      kernelInitializer: 'heNormal'
    }));
    
    // Hidden layers for better pattern recognition
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));
    
    // Output layer
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal'
    }));

    // Compile with optimized parameters
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Generate training data with better patterns
    const { features, labels } = generateTrainingData();
    
    // Train the model
    await model.fit(features, labels, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      verbose: 0
    });

    // Cache the model
    cachedModel = model;
    console.log('Fraud detection model initialized and cached');
    return { model };
  } catch (error) {
    console.error('Failed to initialize fraud detection model:', error);
    throw error;
  }
};

// Generate synthetic training data with realistic patterns
const generateTrainingData = () => {
  const data = [];
  const labels = [];

  // Generate legitimate transactions (70% of data)
  for (let i = 0; i < 700; i++) {
    const amount = Math.random() * 500 + 10; // $10-$510
    const timeOfDay = 8 + Math.random() * 12; // 8 AM to 8 PM
    const dayOfWeek = Math.floor(Math.random() * 5) + 1; // Weekdays
    const isHighRiskCategory = Math.random() < 0.1; // 10% high risk
    const isRoundAmount = amount % 100 === 0 ? 1 : 0;
    const velocity = Math.random() * 3; // Low velocity
    const merchantRisk = Math.random() * 0.3; // Low merchant risk
    const deviceRisk = Math.random() * 0.2; // Low device risk
    const locationRisk = Math.random() * 0.2; // Low location risk
    const patternRisk = Math.random() * 0.3; // Low pattern risk
    const amountRisk = amount > 1000 ? 0.8 : amount / 1000; // Amount-based risk
    const timeRisk = (timeOfDay < 6 || timeOfDay > 22) ? 0.8 : 0.1; // Time-based risk

    data.push([
      amount / 10000, // Normalized amount
      timeOfDay / 24, // Normalized time
      dayOfWeek / 7, // Normalized day
      isHighRiskCategory ? 1 : 0,
      isRoundAmount,
      velocity / 10, // Normalized velocity
      merchantRisk,
      deviceRisk,
      locationRisk,
      patternRisk,
      amountRisk,
      timeRisk
    ]);
    labels.push([0]); // Legitimate
  }

  // Generate fraudulent transactions (30% of data)
  for (let i = 0; i < 300; i++) {
    const amount = Math.random() * 9000 + 1000; // $1000-$10000
    const timeOfDay = Math.random() * 6; // Late night/early morning
    const dayOfWeek = Math.floor(Math.random() * 7); // Any day
    const isHighRiskCategory = Math.random() < 0.6; // 60% high risk
    const isRoundAmount = Math.random() < 0.7 ? 1 : 0; // 70% round amounts
    const velocity = 3 + Math.random() * 7; // High velocity
    const merchantRisk = 0.5 + Math.random() * 0.5; // High merchant risk
    const deviceRisk = 0.4 + Math.random() * 0.6; // High device risk
    const locationRisk = 0.3 + Math.random() * 0.7; // High location risk
    const patternRisk = 0.4 + Math.random() * 0.6; // High pattern risk
    const amountRisk = amount > 5000 ? 1 : amount / 5000; // High amount risk
    const timeRisk = (timeOfDay < 6 || timeOfDay > 22) ? 1 : 0.6; // High time risk

    data.push([
      amount / 10000, // Normalized amount
      timeOfDay / 24, // Normalized time
      dayOfWeek / 7, // Normalized day
      isHighRiskCategory ? 1 : 0,
      isRoundAmount,
      velocity / 10, // Normalized velocity
      merchantRisk,
      deviceRisk,
      locationRisk,
      patternRisk,
      amountRisk,
      timeRisk
    ]);
    labels.push([1]); // Fraudulent
  }

  return {
    features: tf.tensor2d(data),
    labels: tf.tensor2d(labels)
  };
};

// Dynamic fraud detection function - analyzes each transaction independently
export const detectFraud = async (
  models: { model: tf.Sequential },
  transaction: TransactionData,
  userHistory: any[]
) => {
  try {
    if (!models?.model) {
      throw new Error('Fraud detection model not initialized');
    }

    // Calculate transaction-specific risk factors
    const riskFactors = calculateTransactionRisk(transaction, userHistory);
    
    // Use tf.tidy to automatically clean up tensors
    const prediction = tf.tidy(() => {
      const features = [
        transaction.amount / 10000, // Normalized amount
        transaction.timeOfDay / 24, // Normalized time
        transaction.dayOfWeek / 7, // Normalized day
        riskFactors.categoryRisk,
        riskFactors.roundAmountRisk,
        riskFactors.velocityRisk,
        riskFactors.merchantRisk,
        riskFactors.deviceRisk,
        riskFactors.locationRisk,
        riskFactors.patternRisk,
        riskFactors.amountRisk,
        riskFactors.timeRisk
      ];

      const inputTensor = tf.tensor2d([features]);
      return models.model.predict(inputTensor) as tf.Tensor;
    });

    const probability = (await prediction.data())[0];
    prediction.dispose();

    // Get detailed risk analysis
    const detailedRiskFactors = identifySpecificRiskFactors(transaction, riskFactors, userHistory);
    
    // Dynamic threshold based on transaction characteristics
    const threshold = calculateDynamicThreshold(transaction, riskFactors);
    
    return {
      isFraud: probability > threshold,
      probability: Math.min(probability, 0.99), // Cap at 99%
      riskFactors: detailedRiskFactors
    };
  } catch (error) {
    console.error('Error in fraud detection:', error);
    throw error;
  }
};

// Calculate transaction-specific risk factors
const calculateTransactionRisk = (transaction: TransactionData, history: any[]) => {
  const currentTime = new Date();
  
  // Amount risk - based on transaction amount
  const amountRisk = transaction.amount > 5000 ? 1 : 
                    transaction.amount > 1000 ? 0.6 : 
                    transaction.amount > 500 ? 0.3 : 0.1;

  // Time risk - based on time of day
  const timeRisk = (transaction.timeOfDay >= 0 && transaction.timeOfDay < 6) ? 0.8 :
                  (transaction.timeOfDay >= 22) ? 0.6 : 0.1;

  // Category risk - based on transaction category
  const highRiskCategories = ['Cryptocurrency', 'Jewelry', 'Electronics', 'Gaming'];
  const categoryRisk = highRiskCategories.includes(transaction.category) ? 1 : 0;

  // Round amount risk
  const roundAmountRisk = transaction.amount % 100 === 0 ? 1 : 0;

  // Velocity risk - based on recent transactions
  const recentTransactions = history.filter(t => {
    const transactionTime = new Date(t.date).getTime();
    const timeDiff = currentTime.getTime() - transactionTime;
    return timeDiff <= 60 * 60 * 1000; // Last hour
  });
  const velocityRisk = recentTransactions.length >= 3 ? 1 : recentTransactions.length / 3;

  // Merchant risk - based on merchant familiarity
  const knownMerchants = new Set(history.slice(-20).map(t => t.merchant));
  const merchantRisk = knownMerchants.has(transaction.merchant) ? 0.1 : 0.7;

  // Device risk - based on device familiarity
  const knownDevices = new Set(history.slice(-10).map(t => t.deviceInfo));
  const deviceRisk = knownDevices.has(transaction.deviceInfo) ? 0.1 : 0.6;

  // Location risk - simplified
  const locationRisk = transaction.userLocation === 'Unknown' ? 0.5 : 0.1;

  // Pattern risk - based on user behavior
  const patternRisk = calculatePatternRisk(transaction, history);

  return {
    amountRisk,
    timeRisk,
    categoryRisk,
    roundAmountRisk,
    velocityRisk,
    merchantRisk,
    deviceRisk,
    locationRisk,
    patternRisk
  };
};

// Calculate pattern risk based on user behavior
const calculatePatternRisk = (transaction: TransactionData, history: any[]) => {
  if (history.length === 0) return 0.3; // New user - moderate risk

  const recentHistory = history.slice(-10);
  
  // Check amount patterns
  const avgAmount = recentHistory.reduce((sum, t) => sum + t.amount, 0) / recentHistory.length;
  const amountDeviation = Math.abs(transaction.amount - avgAmount) / avgAmount;
  
  // Check time patterns
  const commonHours = recentHistory.map(t => new Date(t.date).getHours());
  const isUnusualTime = !commonHours.includes(transaction.timeOfDay);
  
  // Check category patterns
  const commonCategories = new Set(recentHistory.map(t => t.category));
  const isUnusualCategory = !commonCategories.has(transaction.category);
  
  let risk = 0;
  if (amountDeviation > 5) risk += 0.4; // Amount significantly different
  if (isUnusualTime) risk += 0.3; // Unusual time
  if (isUnusualCategory) risk += 0.2; // Unusual category
  
  return Math.min(risk, 1);
};

// Calculate dynamic threshold based on transaction characteristics
const calculateDynamicThreshold = (transaction: TransactionData, riskFactors: any) => {
  let baseThreshold = 0.7; // Base threshold
  
  // Lower threshold for high-risk scenarios
  if (transaction.amount > 5000) baseThreshold -= 0.1;
  if (riskFactors.categoryRisk === 1) baseThreshold -= 0.1;
  if (riskFactors.velocityRisk > 0.7) baseThreshold -= 0.15;
  if (riskFactors.timeRisk > 0.6) baseThreshold -= 0.1;
  
  // Higher threshold for low-risk scenarios
  if (transaction.amount < 100) baseThreshold += 0.1;
  if (riskFactors.merchantRisk < 0.3) baseThreshold += 0.05;
  if (riskFactors.deviceRisk < 0.3) baseThreshold += 0.05;
  
  return Math.max(0.5, Math.min(0.9, baseThreshold)); // Keep between 50% and 90%
};

// Identify specific risk factors for user feedback
const identifySpecificRiskFactors = (
  transaction: TransactionData,
  riskFactors: any,
  history: any[]
) => {
  const factors = [];
  
  // Amount-based factors
  if (transaction.amount > 5000) {
    factors.push(`High transaction amount: $${transaction.amount.toFixed(2)}`);
  }
  
  // Time-based factors
  if (transaction.timeOfDay >= 0 && transaction.timeOfDay < 6) {
    factors.push('Transaction during unusual hours (midnight to 6 AM)');
  } else if (transaction.timeOfDay >= 22) {
    factors.push('Late night transaction (after 10 PM)');
  }
  
  // Category-based factors
  if (riskFactors.categoryRisk === 1) {
    factors.push(`High-risk transaction category: ${transaction.category}`);
  }
  
  // Round amount factor
  if (riskFactors.roundAmountRisk === 1 && transaction.amount >= 100) {
    factors.push('Suspicious round amount');
  }
  
  // Velocity factors
  if (riskFactors.velocityRisk > 0.7) {
    factors.push('Multiple transactions detected in short time period');
  }
  
  // Merchant factors
  if (riskFactors.merchantRisk > 0.5) {
    factors.push(`Transaction with unfamiliar merchant: ${transaction.merchant}`);
  }
  
  // Device factors
  if (riskFactors.deviceRisk > 0.5) {
    factors.push('Transaction from unrecognized device');
  }
  
  // Pattern factors
  if (riskFactors.patternRisk > 0.5) {
    factors.push('Transaction pattern differs from normal behavior');
  }
  
  return factors.length > 0 ? factors : ['Transaction flagged by AI model'];
};