import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Expiration = () => {
  const { products, batches } = useApp();
  const navigate = useNavigate();

  const expirationData = useMemo(() => {
    const now = new Date();
    const batchesWithInfo = batches.map(batch => {
      const product = products.find(p => p.id === batch.productId);
      const daysUntilExpiry = Math.ceil((new Date(batch.expirationDate) - now) / (1000 * 60 * 60 * 24));
      const value = product ? batch.quantity * product.costPrice : 0;
      return { ...batch, product, daysUntilExpiry, value };
    });

    const expired = batchesWithInfo.filter(b => b.daysUntilExpiry < 0);
    const critical = batchesWithInfo.filter(b => b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 7);
    const warning = batchesWithInfo.filter(b => b.daysUntilExpiry > 7 && b.daysUntilExpiry <= 15);
    const caution = batchesWithInfo.filter(b => b.daysUntilExpiry > 15 && b.daysUntilExpiry <= 30);

    const totalAtRisk = [...expired, ...critical, ...warning, ...caution].reduce((sum, b) => sum + b.value, 0);

    return {
      expired,
      critical,
      warning,
      caution,
      totalAtRisk,
      allItems: [...expired, ...critical, ...warning, ...caution].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    };
  }, [products, batches]);

  const getStatusInfo = (daysUntilExpiry) => {
    if (daysUntilExpiry < 0) {
      return {
        label: 'VENCIDO',
        color: 'bg-red-100 text-red-700 border-red-300',
        badge: 'bg-red-600 text-white',
        suggestion: 'Baixar produto'
      };
    }
    if (daysUntilExpiry <= 7) {
      return {
        label: `${daysUntilExpiry} dias`,
        color: 'bg-red-50 border-red-200',
        badge: 'bg-red-100 text-red-700 border-red-200',
        suggestion: 'Promoção urgente'
      };
    }
    if (daysUntilExpiry <= 15) {
      return {
        label: `${daysUntilExpiry} dias`,
        color: 'bg-amber-50 border-amber-200',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        suggestion: 'Promoção'
      };
    }
    return {
      label: `${daysUntilExpiry} dias`,
      color: 'bg-yellow-50 border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      suggestion: 'Monitorar'
    };
  };

  return (
    <div className="space-y-6" data-testid="expiration-page">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit' }}>Controle de Validade</h1>
        <Button 
          onClick={() => navigate('/estoque')} 
          data-testid="go-to-stock-button"
          variant="outline"
          className="h-12 px-6"
        >
          <Package className="w-5 h-5 mr-2" />
          Gerenciar Estoque
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50" data-testid="expired-count-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-red-600 mb-1">Vencidos</p>
              <p className="text-3xl font-bold font-mono text-red-700">{expirationData.expired.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200" data-testid="critical-count-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-stone-600 mb-1">7 dias ou menos</p>
              <p className="text-3xl font-bold font-mono text-red-600">{expirationData.critical.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200" data-testid="warning-count-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-stone-600 mb-1">8-15 dias</p>
              <p className="text-3xl font-bold font-mono text-amber-600">{expirationData.warning.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200" data-testid="caution-count-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-stone-600 mb-1">16-30 dias</p>
              <p className="text-3xl font-bold font-mono text-yellow-600">{expirationData.caution.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-stone-200">
        <CardHeader className="bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-amber-600" />
              <div>
                <CardTitle style={{ fontFamily: 'Outfit' }}>Valor em Risco</CardTitle>
                <p className="text-sm text-stone-600 mt-1">Custo dos produtos vencendo/vencidos</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-mono text-amber-700">
                R$ {expirationData.totalAtRisk.toFixed(2)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Produtos por Status de Validade</CardTitle>
        </CardHeader>
        <CardContent>
          {expirationData.allItems.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">Nenhum produto vencendo nos próximos 30 dias</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="expiration-list">
              {expirationData.allItems.map((item) => {
                const statusInfo = getStatusInfo(item.daysUntilExpiry);
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-lg border-2 ${statusInfo.color}`}
                    data-testid={`expiration-item-${item.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-stone-900">{item.product?.name}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-stone-600">Lote</p>
                            <p className="font-mono font-medium text-stone-900">{item.batchNumber}</p>
                          </div>
                          <div>
                            <p className="text-stone-600">Validade</p>
                            <p className="font-mono font-medium text-stone-900">
                              {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-stone-600">Quantidade</p>
                            <p className="font-mono font-medium text-stone-900">{item.quantity} un.</p>
                          </div>
                          <div>
                            <p className="text-stone-600">Valor em Risco</p>
                            <p className="font-mono font-medium text-red-600">R$ {item.value.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="inline-block px-4 py-2 bg-white rounded-lg border border-stone-200">
                          <p className="text-xs text-stone-600 mb-1">Sugestão</p>
                          <p className="font-medium text-stone-900 text-sm">{statusInfo.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expiration;