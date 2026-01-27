import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Plus, Package, Edit } from 'lucide-react';
import { toast } from 'sonner';

const Stock = () => {
  const { products, batches, saveBatches } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    batchNumber: '',
    expirationDate: '',
    quantity: ''
  });
  const [adjustData, setAdjustData] = useState({
    batchId: '',
    adjustment: '',
    reason: ''
  });

  const openDialog = () => {
    setFormData({
      productId: '',
      batchNumber: '',
      expirationDate: '',
      quantity: ''
    });
    setIsDialogOpen(true);
  };

  const openAdjustDialog = (batch) => {
    setEditingBatch(batch);
    setAdjustData({
      batchId: batch.id,
      adjustment: '',
      reason: ''
    });
    setIsAdjustDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.productId || !formData.batchNumber || !formData.expirationDate || !formData.quantity) {
      toast.error('Preencha todos os campos!');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero!');
      return;
    }

    const newBatch = {
      id: Date.now().toString(),
      productId: formData.productId,
      batchNumber: formData.batchNumber,
      expirationDate: formData.expirationDate,
      quantity: quantity,
      initialQuantity: quantity
    };

    saveBatches([...batches, newBatch]);
    toast.success('Lote adicionado com sucesso!');
    setIsDialogOpen(false);
  };

  const handleAdjust = (e) => {
    e.preventDefault();

    const adjustment = parseInt(adjustData.adjustment);
    if (adjustment === 0 || isNaN(adjustment)) {
      toast.error('Informe um valor de ajuste válido!');
      return;
    }

    const batch = batches.find(b => b.id === adjustData.batchId);
    const newQuantity = batch.quantity + adjustment;

    if (newQuantity < 0) {
      toast.error('Ajuste resultaria em estoque negativo!');
      return;
    }

    const updatedBatches = batches.map(b =>
      b.id === adjustData.batchId
        ? { ...b, quantity: newQuantity }
        : b
    );

    saveBatches(updatedBatches);
    toast.success('Estoque ajustado com sucesso!');
    setIsAdjustDialogOpen(false);
  };

  const batchesWithProducts = batches.map(batch => ({
    ...batch,
    product: products.find(p => p.id === batch.productId)
  })).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

  const getExpiryStatus = (expirationDate) => {
    const days = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { status: 'expired', label: 'Vencido', color: 'bg-red-100 text-red-700 border-red-200' };
    if (days <= 7) return { status: 'critical', label: `${days} dias`, color: 'bg-red-100 text-red-700 border-red-200' };
    if (days <= 15) return { status: 'warning', label: `${days} dias`, color: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (days <= 30) return { status: 'caution', label: `${days} dias`, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { status: 'good', label: `${days} dias`, color: 'bg-green-100 text-green-700 border-green-200' };
  };

  return (
    <div className="space-y-6" data-testid="stock-page">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit' }}>Controle de Estoque</h1>
        <Button 
          onClick={openDialog} 
          data-testid="add-batch-button"
          className="h-12 px-6 bg-primary hover:bg-primary/90 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Lote
        </Button>
      </div>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Lotes em Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          {batchesWithProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">Nenhum lote cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="batches-table">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Produto</th>
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Lote</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Quantidade</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Validade</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {batchesWithProducts.map((batch) => {
                    const expiryInfo = getExpiryStatus(batch.expirationDate);
                    return (
                      <tr key={batch.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`batch-row-${batch.id}`}>
                        <td className="py-3 px-4 font-medium">{batch.product?.name || 'Produto não encontrado'}</td>
                        <td className="py-3 px-4 font-mono text-sm">{batch.batchNumber}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-medium">
                            {batch.quantity} / {batch.initialQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-sm">
                          {new Date(batch.expirationDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${expiryInfo.color}`}>
                            {expiryInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`adjust-batch-${batch.id}`}
                              onClick={() => openAdjustDialog(batch)}
                              className="h-8"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Ajustar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="batch-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit' }}>Novo Lote</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Produto *</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                  <SelectTrigger data-testid="batch-product-select">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Número do Lote *</Label>
                <Input
                  id="batchNumber"
                  data-testid="batch-number-input"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Data de Validade *</Label>
                <Input
                  id="expirationDate"
                  data-testid="batch-expiration-input"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  data-testid="batch-quantity-input"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="font-mono"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="save-batch-button" className="bg-primary hover:bg-primary/90">
                Adicionar Lote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent data-testid="adjust-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit' }}>Ajustar Estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust}>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="text-sm text-stone-600">Produto: <span className="font-medium text-stone-900">{editingBatch?.product?.name}</span></p>
                <p className="text-sm text-stone-600">Lote: <span className="font-mono font-medium text-stone-900">{editingBatch?.batchNumber}</span></p>
                <p className="text-sm text-stone-600">Estoque atual: <span className="font-mono font-medium text-primary">{editingBatch?.quantity}</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment">Ajuste (use + ou -) *</Label>
                <Input
                  id="adjustment"
                  data-testid="adjust-quantity-input"
                  type="number"
                  value={adjustData.adjustment}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustment: e.target.value })}
                  placeholder="Ex: +10 ou -5"
                  className="font-mono text-lg"
                  required
                />
                <p className="text-xs text-stone-500">
                  Novo estoque: <span className="font-mono font-medium">
                    {editingBatch && adjustData.adjustment ? editingBatch.quantity + parseInt(adjustData.adjustment || 0) : '-'}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  data-testid="adjust-reason-input"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="Ex: Perda, Quebra, Correção"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="save-adjust-button" className="bg-primary hover:bg-primary/90">
                Ajustar Estoque
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stock;