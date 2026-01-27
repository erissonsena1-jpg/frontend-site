import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  ShoppingCart,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { products, batches, sales, expenses, getProductStock } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter(s => {
      const saleDate = new Date(s.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayExpenses = expenses.filter(e => {
      const expDate = new Date(e.date);
      expDate.setHours(0, 0, 0, 0);
      return expDate.getTime() === today.getTime();
    }).reduce((sum, e) => sum + e.amount, 0);

    const expiringProducts = batches.filter(b => {
      const daysUntilExpiry = Math.ceil((new Date(b.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    });

    const lowStockProducts = products.filter(p => {
      const stock = getProductStock(p.id);
      return stock <= (p.minStock || 5);
    });

    return {
      todayRevenue,
      todayExpenses,
      todayProfit: todayRevenue - todayExpenses,
      totalProducts: products.length,
      expiringCount: expiringProducts.length,
      lowStockCount: lowStockProducts.length,
      todaySalesCount: todaySales.length
    };
  }, [sales, expenses, batches, products, getProductStock]);

  const expiringProducts = useMemo(() => {
    return batches
      .map(b => {
        const product = products.find(p => p.id === b.productId);
        const daysUntilExpiry = Math.ceil((new Date(b.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
        return { ...b, product, daysUntilExpiry };
      })
      .filter(item => item.daysUntilExpiry <= 30 && item.daysUntilExpiry >= 0)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 5);
  }, [batches, products]);

  const getExpiryBadgeClass = (days) => {
    if (days <= 7) return 'bg-red-100 text-red-700 border-red-200';
    if (days <= 15) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit' }}>Dashboard</h1>
        <Button 
          onClick={() => navigate('/pdv')} 
          data-testid="go-to-pdv-button"
          className="h-12 px-6 bg-primary hover:bg-primary/90 font-medium"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Abrir PDV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-stone-200" data-testid="revenue-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Vendas Hoje</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              R$ {stats.todayRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1">{stats.todaySalesCount} vendas realizadas</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200" data-testid="profit-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Lucro Hoje</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              R$ {stats.todayProfit.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1">Despesas: R$ {stats.todayExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200" data-testid="products-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Produtos</CardTitle>
            <Package className="w-5 h-5 text-stone-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {stats.totalProducts}
            </div>
            <p className="text-xs text-stone-500 mt-1">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200" data-testid="alerts-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Alertas</CardTitle>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Vencendo</span>
                <span className="text-lg font-bold font-mono text-amber-600">{stats.expiringCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Estoque baixo</span>
                <span className="text-lg font-bold font-mono text-red-600">{stats.lowStockCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-stone-200" data-testid="expiring-products-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl" style={{ fontFamily: 'Outfit' }}>Produtos Vencendo</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/validade')}
                data-testid="view-all-expiring-button"
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expiringProducts.length === 0 ? (
              <p className="text-stone-500 text-center py-8">Nenhum produto vencendo nos próximos 30 dias</p>
            ) : (
              <div className="space-y-3">
                {expiringProducts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{item.product?.name}</p>
                      <p className="text-sm text-stone-600 font-mono">Lote: {item.batchNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getExpiryBadgeClass(item.daysUntilExpiry)}`}>
                        {item.daysUntilExpiry} dias
                      </span>
                      <p className="text-sm text-stone-600 mt-1 font-mono">{item.quantity} un.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-200" data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle className="text-xl" style={{ fontFamily: 'Outfit' }}>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => navigate('/pdv')} 
                data-testid="quick-pdv-button"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="w-6 h-6" />
                <span>Nova Venda</span>
              </Button>
              <Button 
                onClick={() => navigate('/produtos')} 
                data-testid="quick-products-button"
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2 border-stone-300 hover:bg-stone-100"
              >
                <Package className="w-6 h-6" />
                <span>Produtos</span>
              </Button>
              <Button 
                onClick={() => navigate('/estoque')} 
                data-testid="quick-stock-button"
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2 border-stone-300 hover:bg-stone-100"
              >
                <AlertTriangle className="w-6 h-6" />
                <span>Estoque</span>
              </Button>
              <Button 
                onClick={() => navigate('/relatorios')} 
                data-testid="quick-reports-button"
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2 border-stone-300 hover:bg-stone-100"
              >
                <Calendar className="w-6 h-6" />
                <span>Relatórios</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;