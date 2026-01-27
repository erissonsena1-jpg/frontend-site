import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const Financial = () => {
  const { sales, expenses, saveExpenses, products } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [period, setPeriod] = useState('month');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0]
  });

  const stats = useMemo(() => {
    const now = new Date();
    let startDate;

    if (period === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else {
      startDate = new Date(0);
    }

    const filteredSales = sales.filter(s => new Date(s.date) >= startDate);
    const filteredExpenses = expenses.filter(e => new Date(e.date) >= startDate);

    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

    const cost = filteredSales.reduce((sum, sale) => {
      const saleCost = sale.items.reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        return itemSum + (product?.costPrice || 0) * item.quantity;
      }, 0);
      return sum + saleCost;
    }, 0);

    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - cost - expensesTotal;
    const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

    return {
      revenue,
      cost,
      expenses: expensesTotal,
      profit,
      margin,
      salesCount: filteredSales.length
    };
  }, [sales, expenses, products, period]);

  const openDialog = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      toast.error('Preencha todos os campos!');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date
    };

    saveExpenses([...expenses, newExpense]);
    toast.success('Despesa registrada com sucesso!');
    setIsDialogOpen(false);
  };

  const categories = [
    { value: 'rent', label: 'Aluguel' },
    { value: 'energy', label: 'Energia' },
    { value: 'water', label: 'Água' },
    { value: 'purchase', label: 'Compras' },
    { value: 'salary', label: 'Salários' },
    { value: 'other', label: 'Outros' }
  ];

  return (
    <div className="space-y-6" data-testid="financial-page">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit' }}>Financeiro</h1>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40" data-testid="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={openDialog} 
            data-testid="add-expense-button"
            className="h-12 px-6 bg-primary hover:bg-primary/90 font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Despesa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-stone-200" data-testid="revenue-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Faturamento</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              R$ {stats.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1">{stats.salesCount} vendas</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200" data-testid="expenses-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Despesas</CardTitle>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-red-600">
              R$ {stats.expenses.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1">Custo: R$ {stats.cost.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200" data-testid="profit-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Lucro</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-mono ${
              stats.profit >= 0 ? 'text-primary' : 'text-red-600'
            }`}>
              R$ {stats.profit.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1">Margem: {stats.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200" data-testid="summary-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Receita</span>
                <span className="font-mono font-medium text-green-600">+{stats.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Custo</span>
                <span className="font-mono font-medium text-red-600">-{stats.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Despesas</span>
                <span className="font-mono font-medium text-red-600">-{stats.expenses.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Histórico de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-stone-500 py-8">Nenhuma despesa registrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="expenses-table">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Categoria</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-600">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map((expense) => (
                    <tr key={expense.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`expense-row-${expense.id}`}>
                      <td className="py-3 px-4 font-mono text-sm">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">{expense.description}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-stone-100 text-stone-700 rounded">
                          {categories.find(c => c.value === expense.category)?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-red-600">
                        R$ {expense.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="expense-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit' }}>Nova Despesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  data-testid="expense-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger data-testid="expense-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    data-testid="expense-amount-input"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    data-testid="expense-date-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="font-mono"
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="save-expense-button" className="bg-primary hover:bg-primary/90">
                Registrar Despesa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financial;