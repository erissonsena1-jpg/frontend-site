import React, { useState, useEffect, useRef } from 'react';
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
import { Separator } from '../components/ui/separator';
import { X, Plus, Minus, ShoppingCart, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PDV = () => {
  const { products, batches, currentCashRegister, addSale, getProductStock } = useApp();
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('money');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [additionalType, setAdditionalType] = useState('percent');
  const [additionalValue, setAdditionalValue] = useState('');
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    if (!currentCashRegister) {
      toast.error('Nenhum caixa aberto. Abra o caixa primeiro.');
      navigate('/caixa');
    }
  }, [currentCashRegister, navigate]);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart]);

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      const stock = getProductStock(product.id);
      if (stock <= 0) {
        toast.error('Produto sem estoque!');
        setBarcode('');
        return;
      }

      const existingItem = cart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < stock) {
          updateQuantity(product.id, existingItem.quantity + 1);
        } else {
          toast.error('Quantidade máxima em estoque atingida!');
        }
      } else {
        setCart([...cart, {
          productId: product.id,
          name: product.name,
          price: product.salePrice,
          quantity: 1,
          maxStock: stock
        }]);
      }
      setBarcode('');
    } else {
      toast.error('Produto não encontrado!');
      setBarcode('');
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cart.find(i => i.productId === productId);
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    if (newQuantity > item.maxStock) {
      toast.error('Quantidade maior que estoque disponível!');
      return;
    }
    setCart(cart.map(item => 
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = discountValue ? 
    (discountType === 'percent' ? (subtotal * parseFloat(discountValue) / 100) : parseFloat(discountValue))
    : 0;
  
  const additionalAmount = additionalValue ? 
    (additionalType === 'percent' ? (subtotal * parseFloat(additionalValue) / 100) : parseFloat(additionalValue))
    : 0;
  
  const total = subtotal - discountAmount + additionalAmount;

  const finalizeSale = () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio!');
      return;
    }

    const sale = {
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      discount: discountAmount,
      additional: additionalAmount,
      total,
      paymentMethod
    };

    addSale(sale);
    toast.success('Venda finalizada com sucesso!');
    setCart([]);
    setDiscountValue('');
    setAdditionalValue('');
    setPaymentMethod('money');
    barcodeInputRef.current?.focus();
  };

  const paymentMethods = [
    { value: 'money', label: 'Dinheiro', icon: DollarSign },
    { value: 'pix', label: 'PIX', icon: Smartphone },
    { value: 'card', label: 'Cartão', icon: CreditCard }
  ];

  return (
    <div className="h-[calc(100vh-8rem)]" data-testid="pdv-page">
      <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>PDV - Ponto de Venda</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-stone-200" data-testid="barcode-scanner-card">
            <CardHeader>
              <CardTitle>Leitura de Código</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    ref={barcodeInputRef}
                    data-testid="barcode-input"
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Digite ou escaneie o código de barras"
                    className="h-12 text-lg font-mono"
                  />
                </div>
                <Button type="submit" data-testid="add-product-button" className="h-12 px-6 bg-primary hover:bg-primary/90">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-stone-200 flex-1" data-testid="products-grid-card">
            <CardHeader>
              <CardTitle>Produtos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {products.map(product => {
                  const stock = getProductStock(product.id);
                  return (
                    <button
                      key={product.id}
                      data-testid={`product-${product.id}-button`}
                      onClick={() => setBarcode(product.barcode)}
                      className="p-4 bg-white border border-stone-200 rounded-lg hover:border-primary hover:shadow-md transition-all duration-200 text-left"
                      disabled={stock <= 0}
                    >
                      <p className="font-medium text-stone-900 truncate">{product.name}</p>
                      <p className="text-lg font-bold font-mono text-primary mt-1">
                        R$ {product.salePrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">Estoque: {stock}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-stone-200" data-testid="cart-card">
            <CardHeader className="bg-primary text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrinho ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-stone-500 py-8">Carrinho vazio</p>
                ) : (
                  cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg" data-testid={`cart-item-${item.productId}`}>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-sm font-mono text-primary">R$ {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          data-testid={`decrease-${item.productId}`}
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-mono font-medium" data-testid={`quantity-${item.productId}`}>
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          data-testid={`increase-${item.productId}`}
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`remove-${item.productId}`}
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => removeItem(item.productId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">Subtotal:</span>
                    <span className="font-mono font-medium text-stone-900">
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Desconto</Label>
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={setDiscountType}>
                        <SelectTrigger className="w-20" data-testid="discount-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="fixed">R$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        data-testid="discount-input"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 h-9 font-mono"
                      />
                    </div>
                    {discountAmount > 0 && (
                      <p className="text-xs text-green-600 font-mono">
                        - R$ {discountAmount.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Acréscimo</Label>
                    <div className="flex gap-2">
                      <Select value={additionalType} onValueChange={setAdditionalType}>
                        <SelectTrigger className="w-20" data-testid="additional-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="fixed">R$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        data-testid="additional-input"
                        value={additionalValue}
                        onChange={(e) => setAdditionalValue(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 h-9 font-mono"
                      />
                    </div>
                    {additionalAmount > 0 && (
                      <p className="text-xs text-red-600 font-mono">
                        + R$ {additionalAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-2 block">Forma de Pagamento</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(method => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.value}
                          data-testid={`payment-${method.value}`}
                          onClick={() => setPaymentMethod(method.value)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            paymentMethod === method.value
                              ? 'border-primary bg-primary/5'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs font-medium block">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-stone-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 font-medium">Total:</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold font-mono text-primary" data-testid="cart-total">
                        R$ {total.toFixed(2)}
                      </span>
                      {(discountAmount > 0 || additionalAmount > 0) && (
                        <p className="text-xs text-stone-500 mt-1">
                          Subtotal: R$ {subtotal.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={finalizeSale}
                  data-testid="finalize-sale-button"
                  disabled={cart.length === 0}
                  className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90"
                >
                  Finalizar Venda
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PDV;