import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DollarSign, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CashRegister = () => {
  const { currentCashRegister, openCashRegister, closeCashRegister, sales } = useApp();
  const navigate = useNavigate();
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');

  const handleOpen = (e) => {
    e.preventDefault();
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast.error('Informe um valor válido para abertura!');
      return;
    }
    openCashRegister(openingBalance);
    toast.success('Caixa aberto com sucesso!');
    setOpeningBalance('');
    navigate('/pdv');
  };

  const handleClose = (e) => {
    e.preventDefault();
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      toast.error('Informe um valor válido para fechamento!');
      return;
    }
    const result = closeCashRegister(closingBalance);
    if (result) {
      toast.success('Caixa fechado com sucesso!');
      setClosingBalance('');
    }
  };

  const salesSinceOpen = currentCashRegister
    ? sales.filter(s => new Date(s.date) >= new Date(currentCashRegister.openingDate))
    : [];

  const totalSales = salesSinceOpen.reduce((sum, s) => sum + s.total, 0);
  const expectedBalance = currentCashRegister
    ? currentCashRegister.openingBalance + totalSales
    : 0;

  return (
    <div className="space-y-6" data-testid="cash-register-page">
      <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit' }}>Controle de Caixa</h1>

      {!currentCashRegister ? (
        <Card className="border-stone-200 max-w-md mx-auto" data-testid="open-cash-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle style={{ fontFamily: 'Outfit' }}>Caixa Fechado</CardTitle>
            <p className="text-sm text-stone-600 mt-2">Abra o caixa para iniciar as vendas</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOpen} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Valor de Abertura</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500 font-mono">
                    R$
                  </span>
                  <Input
                    id="openingBalance"
                    data-testid="opening-balance-input"
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="pl-12 h-14 text-lg font-mono"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                data-testid="open-cash-button"
                className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90"
              >
                <Unlock className="w-5 h-5 mr-2" />
                Abrir Caixa
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50" data-testid="cash-status-card">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
                <Unlock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-green-900" style={{ fontFamily: 'Outfit' }}>Caixa Aberto</CardTitle>
              <p className="text-sm text-green-700 mt-2">
                Aberto em: {new Date(currentCashRegister.openingDate).toLocaleString('pt-BR')}
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-stone-200" data-testid="opening-balance-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-600">Valor de Abertura</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono text-stone-900">
                  R$ {currentCashRegister.openingBalance.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-stone-200" data-testid="sales-total-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-600">Total Vendido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono text-primary">
                  R$ {totalSales.toFixed(2)}
                </p>
                <p className="text-xs text-stone-500 mt-1">{salesSinceOpen.length} vendas</p>
              </CardContent>
            </Card>

            <Card className="border-stone-200" data-testid="expected-balance-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-600">Saldo Esperado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono text-green-600">
                  R$ {expectedBalance.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-stone-200 max-w-md mx-auto" data-testid="close-cash-card">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Outfit' }}>Fechar Caixa</CardTitle>
              <p className="text-sm text-stone-600 mt-2">Confira o valor em caixa e registre o fechamento</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClose} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="closingBalance">Valor de Fechamento</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500 font-mono">
                      R$
                    </span>
                    <Input
                      id="closingBalance"
                      data-testid="closing-balance-input"
                      type="number"
                      step="0.01"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(e.target.value)}
                      className="pl-12 h-14 text-lg font-mono"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {closingBalance && (
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600">Diferença:</p>
                      <p className={`text-lg font-bold font-mono ${
                        parseFloat(closingBalance) - expectedBalance >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        R$ {(parseFloat(closingBalance) - expectedBalance).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  data-testid="close-cash-button"
                  className="w-full h-14 text-lg font-medium bg-red-600 hover:bg-red-700"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Fechar Caixa
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CashRegister;