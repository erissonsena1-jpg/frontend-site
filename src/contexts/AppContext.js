import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const initializeData = () => {
  const defaultProducts = [
    {
      id: '1',
      barcode: '7891234567890',
      name: 'Leite Integral 1L',
      salePrice: 5.99,
      costPrice: 4.20,
      minStock: 10
    },
    {
      id: '2',
      barcode: '7891234567891',
      name: 'Pão Francês 500g',
      salePrice: 8.50,
      costPrice: 6.00,
      minStock: 20
    },
    {
      id: '3',
      barcode: '7891234567892',
      name: 'Arroz Branco 5kg',
      salePrice: 28.90,
      costPrice: 22.00,
      minStock: 5
    }
  ];

  const defaultBatches = [
    {
      id: 'b1',
      productId: '1',
      batchNumber: 'LT2025001',
      expirationDate: '2025-02-15',
      quantity: 24,
      initialQuantity: 30
    },
    {
      id: 'b2',
      productId: '2',
      batchNumber: 'PF2025001',
      expirationDate: '2025-01-05',
      quantity: 50,
      initialQuantity: 50
    },
    {
      id: 'b3',
      productId: '3',
      batchNumber: 'AR2025001',
      expirationDate: '2025-12-30',
      quantity: 15,
      initialQuantity: 20
    }
  ];

  const defaultUsers = [
    {
      id: 'u1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Administrador'
    },
    {
      id: 'u2',
      username: 'caixa',
      password: 'caixa123',
      role: 'cashier',
      name: 'Operador de Caixa'
    }
  ];

  if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(defaultProducts));
  }
  if (!localStorage.getItem('batches')) {
    localStorage.setItem('batches', JSON.stringify(defaultBatches));
  }
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem('sales')) {
    localStorage.setItem('sales', JSON.stringify([]));
  }
  if (!localStorage.getItem('expenses')) {
    localStorage.setItem('expenses', JSON.stringify([]));
  }
  if (!localStorage.getItem('cashRegisters')) {
    localStorage.setItem('cashRegisters', JSON.stringify([]));
  }
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cashRegisters, setCashRegisters] = useState([]);
  const [currentCashRegister, setCurrentCashRegister] = useState(null);

  useEffect(() => {
    initializeData();
    loadData();
    
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    const storedCash = localStorage.getItem('currentCashRegister');
    if (storedCash) {
      setCurrentCashRegister(JSON.parse(storedCash));
    }
  }, []);

  const loadData = () => {
    setProducts(JSON.parse(localStorage.getItem('products') || '[]'));
    setBatches(JSON.parse(localStorage.getItem('batches') || '[]'));
    setSales(JSON.parse(localStorage.getItem('sales') || '[]'));
    setExpenses(JSON.parse(localStorage.getItem('expenses') || '[]'));
    setCashRegisters(JSON.parse(localStorage.getItem('cashRegisters') || '[]'));
  };

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const saveProducts = (newProducts) => {
    localStorage.setItem('products', JSON.stringify(newProducts));
    setProducts(newProducts);
  };

  const saveBatches = (newBatches) => {
    localStorage.setItem('batches', JSON.stringify(newBatches));
    setBatches(newBatches);
  };

  const saveSales = (newSales) => {
    localStorage.setItem('sales', JSON.stringify(newSales));
    setSales(newSales);
  };

  const saveExpenses = (newExpenses) => {
    localStorage.setItem('expenses', JSON.stringify(newExpenses));
    setExpenses(newExpenses);
  };

  const saveCashRegisters = (newCashRegisters) => {
    localStorage.setItem('cashRegisters', JSON.stringify(newCashRegisters));
    setCashRegisters(newCashRegisters);
  };

  const openCashRegister = (openingBalance) => {
    const newCashRegister = {
      id: Date.now().toString(),
      openingDate: new Date().toISOString(),
      openingBalance: parseFloat(openingBalance),
      userId: currentUser?.id,
      status: 'open'
    };
    setCurrentCashRegister(newCashRegister);
    localStorage.setItem('currentCashRegister', JSON.stringify(newCashRegister));
    return newCashRegister;
  };

  const closeCashRegister = (closingBalance) => {
    if (!currentCashRegister) return null;
    
    const salesInPeriod = sales.filter(s => 
      new Date(s.date) >= new Date(currentCashRegister.openingDate)
    );
    const totalSales = salesInPeriod.reduce((sum, s) => sum + s.total, 0);
    const expectedBalance = currentCashRegister.openingBalance + totalSales;
    const difference = parseFloat(closingBalance) - expectedBalance;
    
    const closedRegister = {
      ...currentCashRegister,
      closingDate: new Date().toISOString(),
      closingBalance: parseFloat(closingBalance),
      totalSales,
      expectedBalance,
      difference,
      status: 'closed'
    };
    
    const newCashRegisters = [...cashRegisters, closedRegister];
    saveCashRegisters(newCashRegisters);
    setCurrentCashRegister(null);
    localStorage.removeItem('currentCashRegister');
    return closedRegister;
  };

  const getProductStock = (productId) => {
    return batches
      .filter(b => b.productId === productId)
      .reduce((sum, b) => sum + b.quantity, 0);
  };

  const addSale = (sale) => {
    const newSale = {
      ...sale,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      userId: currentUser?.id
    };
    
    sale.items.forEach(item => {
      let remainingQty = item.quantity;
      const productBatches = batches
        .filter(b => b.productId === item.productId && b.quantity > 0)
        .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
      
      productBatches.forEach(batch => {
        if (remainingQty > 0 && batch.quantity > 0) {
          const qtyToDeduct = Math.min(batch.quantity, remainingQty);
          batch.quantity -= qtyToDeduct;
          remainingQty -= qtyToDeduct;
        }
      });
    });
    
    saveBatches([...batches]);
    const newSales = [...sales, newSale];
    saveSales(newSales);
    return newSale;
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      login,
      logout,
      products,
      saveProducts,
      batches,
      saveBatches,
      sales,
      saveSales,
      expenses,
      saveExpenses,
      cashRegisters,
      saveCashRegisters,
      currentCashRegister,
      openCashRegister,
      closeCashRegister,
      getProductStock,
      addSale,
      loadData
    }}>
      {children}
    </AppContext.Provider>
  );
};