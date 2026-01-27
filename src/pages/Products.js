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
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

const Products = () => {
  const { products, saveProducts, batches, getProductStock } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    salePrice: '',
    costPrice: '',
    minStock: '10'
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  );

  const openDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode,
        name: product.name,
        salePrice: product.salePrice.toString(),
        costPrice: product.costPrice.toString(),
        minStock: (product.minStock || 10).toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: '',
        name: '',
        salePrice: '',
        costPrice: '',
        minStock: '10'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.barcode || !formData.name || !formData.salePrice || !formData.costPrice) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const isDuplicate = products.some(p => 
      p.barcode === formData.barcode && p.id !== editingProduct?.id
    );

    if (isDuplicate) {
      toast.error('Código de barras já existe!');
      return;
    }

    if (editingProduct) {
      const updatedProducts = products.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              barcode: formData.barcode,
              name: formData.name,
              salePrice: parseFloat(formData.salePrice),
              costPrice: parseFloat(formData.costPrice),
              minStock: parseInt(formData.minStock)
            }
          : p
      );
      saveProducts(updatedProducts);
      toast.success('Produto atualizado com sucesso!');
    } else {
      const newProduct = {
        id: Date.now().toString(),
        barcode: formData.barcode,
        name: formData.name,
        salePrice: parseFloat(formData.salePrice),
        costPrice: parseFloat(formData.costPrice),
        minStock: parseInt(formData.minStock)
      };
      saveProducts([...products, newProduct]);
      toast.success('Produto criado com sucesso!');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (productId) => {
    const productBatches = batches.filter(b => b.productId === productId);
    if (productBatches.length > 0) {
      toast.error('Não é possível excluir produto com lotes cadastrados!');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      saveProducts(products.filter(p => p.id !== productId));
      toast.success('Produto excluído com sucesso!');
    }
  };

  return (
    <div className="space-y-6" data-testid="products-page">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit' }}>Produtos</h1>
        <Button 
          onClick={() => openDialog()} 
          data-testid="add-product-button"
          className="h-12 px-6 bg-primary hover:bg-primary/90 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card className="border-stone-200">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
            <Input
              data-testid="search-products-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou código de barras..."
              className="pl-10 h-12 text-base"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="products-table">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-stone-600">Nome</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-600">Preço Venda</th>
                    <th className="text-right py-3 px-4 font-medium text-stone-600">Preço Custo</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Estoque</th>
                    <th className="text-center py-3 px-4 font-medium text-stone-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const stock = getProductStock(product.id);
                    const isLowStock = stock <= (product.minStock || 5);
                    return (
                      <tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`product-row-${product.id}`}>
                        <td className="py-3 px-4 font-mono text-sm">{product.barcode}</td>
                        <td className="py-3 px-4 font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-right font-mono text-primary font-medium">
                          R$ {product.salePrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-600">
                          R$ {product.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full font-mono font-medium ${
                            isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {stock}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              data-testid={`edit-product-${product.id}`}
                              onClick={() => openDialog(product)}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              data-testid={`delete-product-${product.id}`}
                              onClick={() => handleDelete(product.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
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
        <DialogContent data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit' }}>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras *</Label>
                <Input
                  id="barcode"
                  data-testid="product-barcode-input"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  data-testid="product-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Preço de Venda *</Label>
                  <Input
                    id="salePrice"
                    data-testid="product-saleprice-input"
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Preço de Custo *</Label>
                  <Input
                    id="costPrice"
                    data-testid="product-costprice-input"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  data-testid="product-minstock-input"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="save-product-button" className="bg-primary hover:bg-primary/90">
                {editingProduct ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;