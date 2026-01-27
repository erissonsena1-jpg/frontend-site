import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const Reports = () => {
  const { sales, products, batches, expenses, getProductStock } = useApp();
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    if (reportType === 'sales') {
      const filteredSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= start && saleDate <= end;
      });

      const total = filteredSales.reduce((sum, s) => sum + s.total, 0);
      const count = filteredSales.length;

      return {
        title: 'Relatório de Vendas',
        data: filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date)),
        summary: { total, count }
      };
    }

    if (reportType === 'bestsellers') {
      const productSales = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              name: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        });
      });

      const data = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);

      return {
        title: 'Produtos Mais Vendidos',
        data,
        summary: null
      };
    }

    if (reportType === 'stock') {
      const data = products.map(p => ({
        ...p,
        stock: getProductStock(p.id),
        batches: batches.filter(b => b.productId === p.id)
      }));

      return {
        title: 'Relatório de Estoque',
        data,
        summary: null
      };
    }

    if (reportType === 'expiring') {
      const data = batches
        .map(b => {
          const product = products.find(p => p.id === b.productId);
          const daysUntilExpiry = Math.ceil((new Date(b.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
          return { ...b, product, daysUntilExpiry };
        })
        .filter(item => item.daysUntilExpiry <= 30 && item.daysUntilExpiry >= 0)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      return {
        title: 'Produtos Vencendo',
        data,
        summary: null
      };
    }

    if (reportType === 'profit') {
      const filteredSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= start && saleDate <= end;
      });

      const filteredExpenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate >= start && expDate <= end;
      });

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

      return {
        title: 'Relatório de Lucro',
        data: null,
        summary: { revenue, cost, expenses: expensesTotal, profit }
      };
    }

    return { title: '', data: [], summary: null };
  }, [reportType, startDate, endDate, sales, products, batches, expenses, getProductStock]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(18);
    doc.text('MercadoFlow', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.text(filteredData.title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    if (startDate || endDate) {
      const period = `Periodo: ${startDate || 'Inicio'} ate ${endDate || 'Hoje'}`;
      doc.text(period, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    } else {
      yPos += 5;
    }

    doc.setFontSize(10);

    if (reportType === 'sales' && filteredData.data) {
      yPos += 5;
      doc.text(`Total de Vendas: ${filteredData.summary.count}`, 15, yPos);
      yPos += 6;
      doc.text(`Valor Total: R$ ${filteredData.summary.total.toFixed(2)}`, 15, yPos);
      yPos += 10;

      filteredData.data.slice(0, 30).forEach((sale) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const date = new Date(sale.date).toLocaleString('pt-BR');
        doc.text(`${date} - R$ ${sale.total.toFixed(2)}`, 15, yPos);
        yPos += 6;
      });
    }

    if (reportType === 'bestsellers' && filteredData.data) {
      filteredData.data.slice(0, 30).forEach((item, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${item.name}`, 15, yPos);
        yPos += 6;
        doc.text(`   Qtd: ${item.quantity} | Receita: R$ ${item.revenue.toFixed(2)}`, 15, yPos);
        yPos += 8;
      });
    }

    if (reportType === 'stock' && filteredData.data) {
      filteredData.data.forEach((item) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${item.name} - Estoque: ${item.stock}`, 15, yPos);
        yPos += 6;
      });
    }

    if (reportType === 'expiring' && filteredData.data) {
      filteredData.data.forEach((item) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${item.product?.name} - ${item.daysUntilExpiry} dias`, 15, yPos);
        yPos += 6;
        doc.text(`   Lote: ${item.batchNumber} | Qtd: ${item.quantity}`, 15, yPos);
        yPos += 8;
      });
    }

    if (reportType === 'profit' && filteredData.summary) {
      const { revenue, cost, expenses, profit } = filteredData.summary;
      yPos += 5;
      doc.text(`Faturamento: R$ ${revenue.toFixed(2)}`, 15, yPos);
      yPos += 6;
      doc.text(`Custo: R$ ${cost.toFixed(2)}`, 15, yPos);
      yPos += 6;
      doc.text(`Despesas: R$ ${expenses.toFixed(2)}`, 15, yPos);
      yPos += 6;
      doc.text(`Lucro: R$ ${profit.toFixed(2)}`, 15, yPos);
    }

    doc.save(`relatorio-${reportType}-${Date.now()}.pdf`);
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit' }}>Relatórios</h1>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Configurações do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="report-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="bestsellers">Mais Vendidos</SelectItem>
                  <SelectItem value="stock">Estoque Atual</SelectItem>
                  <SelectItem value="expiring">Vencendo</SelectItem>
                  <SelectItem value="profit">Lucro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                data-testid="start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                data-testid="end-date-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={exportToPDF} 
                data-testid="export-pdf-button"
                className="w-full h-10 bg-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200" data-testid="report-preview-card">
        <CardHeader>
          <CardTitle>{filteredData.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {reportType === 'sales' && filteredData.data && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="text-sm text-stone-600">Total de Vendas</p>
                  <p className="text-2xl font-bold font-mono text-primary">{filteredData.summary.count}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-600">Valor Total</p>
                  <p className="text-2xl font-bold font-mono text-primary">R$ {filteredData.summary.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 px-4 font-medium text-stone-600">Data</th>
                      <th className="text-right py-3 px-4 font-medium text-stone-600">Valor</th>
                      <th className="text-left py-3 px-4 font-medium text-stone-600">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.data.slice(0, 50).map((sale) => (
                      <tr key={sale.id} className="border-b border-stone-100">
                        <td className="py-3 px-4 font-mono text-sm">
                          {new Date(sale.date).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-primary">
                          R$ {sale.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">{sale.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'bestsellers' && filteredData.data && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Posição</th>
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Produto</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-600">Qtd Vendida</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-600">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.data.slice(0, 20).map((item, index) => (
                    <tr key={item.productId} className="border-b border-stone-100">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-right font-mono">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-primary">
                        R$ {item.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'stock' && filteredData.data && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Produto</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Estoque</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Lotes</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-600">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.data.map((item) => (
                    <tr key={item.id} className="border-b border-stone-100">
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-center font-mono">{item.stock}</td>
                      <td className="py-3 px-4 text-center font-mono">{item.batches.length}</td>
                      <td className="py-3 px-4 text-right font-mono text-primary">
                        R$ {(item.stock * item.costPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'expiring' && filteredData.data && (
            <div>
              {filteredData.data.length === 0 ? (
                <p className="text-center text-stone-500 py-8">Nenhum produto vencendo nos próximos 30 dias</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-200">
                        <th className="text-left py-3 px-4 font-medium text-stone-600">Produto</th>
                        <th className="text-left py-3 px-4 font-medium text-stone-600">Lote</th>
                        <th className="text-center py-3 px-4 font-medium text-stone-600">Dias</th>
                        <th className="text-center py-3 px-4 font-medium text-stone-600">Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.data.map((item) => (
                        <tr key={item.id} className="border-b border-stone-100">
                          <td className="py-3 px-4 font-medium">{item.product?.name}</td>
                          <td className="py-3 px-4 font-mono text-sm">{item.batchNumber}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                              item.daysUntilExpiry <= 7
                                ? 'bg-red-100 text-red-700'
                                : item.daysUntilExpiry <= 15
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {item.daysUntilExpiry}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {reportType === 'profit' && filteredData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">Receitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold font-mono text-green-700">
                    R$ {filteredData.summary.revenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700">Custos + Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold font-mono text-red-700">
                    R$ {(filteredData.summary.cost + filteredData.summary.expenses).toFixed(2)}
                  </p>
                  <p className="text-sm text-stone-600 mt-2">
                    Custo: R$ {filteredData.summary.cost.toFixed(2)} | 
                    Despesas: R$ {filteredData.summary.expenses.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-stone-200 md:col-span-2">
                <CardHeader>
                  <CardTitle>Lucro Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-4xl font-bold font-mono ${
                    filteredData.summary.profit >= 0 ? 'text-primary' : 'text-red-600'
                  }`}>
                    R$ {filteredData.summary.profit.toFixed(2)}
                  </p>
                  <p className="text-sm text-stone-600 mt-2">
                    Margem: {filteredData.summary.revenue > 0 
                      ? ((filteredData.summary.profit / filteredData.summary.revenue) * 100).toFixed(1)
                      : 0}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;