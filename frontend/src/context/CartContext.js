import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create the cart context
export const CartContext = createContext();

// Create the provider component
export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { user, isAuthenticated } = useContext(AuthContext);

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user?.token]);

  // Fetch cart count
  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated()) {
      setCartCount(0);
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setCartCount(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Use totalItems from the API response, or calculate from carts structure
        const count = data.totalItems || 
          data.carts?.reduce((total, cart) => 
            total + cart.items.reduce((cartTotal, item) => cartTotal + item.quantity, 0), 0
          ) || 0;
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error('Error fetching cart count:', err);
      setCartCount(0);
    }
  }, [isAuthenticated, getAuthToken]);

  // Refresh cart count (to be called after adding/removing items)
  const refreshCartCount = useCallback(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  // Update cart count when user changes
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  // Context value
  const contextValue = {
    cartCount,
    refreshCartCount,
    fetchCartCount
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}; 