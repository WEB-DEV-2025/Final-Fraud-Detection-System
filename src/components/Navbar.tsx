import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Home, CreditCard, History, BarChart2, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-lg font-bold text-gray-900">Fraud Detection</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out flex items-center ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
            <Link
              to="/transaction"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out flex items-center ${
                isActive('/transaction') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              New Transaction
            </Link>
            <Link
              to="/history"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out flex items-center ${
                isActive('/history') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <History className="h-4 w-4 mr-1" />
              Transaction History
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out flex items-center ${
                  isActive('/admin') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                Admin Panel
              </Link>
            )}
          </div>

          <div className="hidden md:flex md:items-center">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="mr-3">
                <span className="text-sm font-medium text-gray-700">{currentUser?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Dashboard
              </div>
            </Link>
            <Link
              to="/transaction"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/transaction') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                New Transaction
              </div>
            </Link>
            <Link
              to="/history"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/history') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Transaction History
              </div>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/admin') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Admin Panel
                </div>
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-medium">
                    {currentUser?.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{currentUser?.name}</div>
                <div className="text-sm font-medium text-gray-500">{currentUser?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-4">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign out
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;