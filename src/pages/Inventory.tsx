import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type InventoryPart } from '../lib/supabase';
import { DataTable, StatusBadge } from '../components/DataTable';
import { Modal, Button, Input, Select, Textarea } from '../components/Modal';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';
import { StockLevelGauge } from '../components/StockLevelGauge';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';


const CATEGORIES = [
  { value: '', label: 'all_categories' },
  { value: 'filters', label: 'filters' },
  { value: 'brakes', label: 'brakes' },
  { value: 'fluids', label: 'fluids' },
  { value: 'electrical', label: 'electrical' },
  { value: 'engine', label: 'engine' },
  { value: 'suspension', label: 'suspension' },
  { value: 'other', label: 'other' },
];

export function Inventory() {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [inventory, setInventory] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [form, setForm] = useState({
    name: '',
    part_number: '',
    quantity: '',
    min_stock: '5',
    unit_cost: '',
    selling_price: '',
    supplier: '',
    category: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('inventory_parts').select('*').order('name');
    setInventory(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      quantity: parseInt(form.quantity) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      unit_cost: parseFloat(form.unit_cost) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
    };
    if (editingPart) {
      await supabase.from('inventory_parts').update(payload).eq('id', editingPart.id);
    } else {
      await supabase.from('inventory_parts').insert([payload]);
    }
    setIsModalOpen(false);
    setEditingPart(null);
    resetForm();
    loadData();
  }

  function resetForm() {
    setForm({ name: '', part_number: '', quantity: '', min_stock: '5', unit_cost: '', selling_price: '', supplier: '', category: '' });
  }

  function openEdit(part: InventoryPart) {
    setEditingPart(part);
    setForm({
      name: part.name,
      part_number: part.part_number || '',
      quantity: part.quantity.toString(),
      min_stock: part.min_stock.toString(),
      unit_cost: part.unit_cost.toString(),
      selling_price: part.selling_price.toString(),
      supplier: part.supplier || '',
      category: part.category || '',
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm(t('confirm_delete'))) {
      const { error } = await supabase.from('inventory_parts').delete().eq('id', id);
      if (error) {
        toast.error(t('delete_error') || 'Failed to delete part');
      } else {
        toast.success(t('delete_success') || 'Part deleted successfully');
        loadData();
      }
    }
  }

  const filteredInventory = inventory.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.part_number?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const lowStockCount = inventory.filter((p) => p.quantity <= p.min_stock).length;
  const totalValue = inventory.reduce((sum, p) => sum + p.quantity * p.selling_price, 0);

  const getStockStatus = (part: InventoryPart) => {
    if (part.quantity === 0) return 'out-of-stock';
    if (part.quantity <= part.min_stock) return 'low-stock';
    return 'in-stock';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-foreground">{t('inventory')}</h1>
          <p className="text-muted-foreground">{t('parts_supplies')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingPart(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2 inline" />
          {t('add_part')}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('total_items')}</p>
              <p className="text-2xl font-bold text-foreground">{inventory.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-8 h-8 ${lowStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div>
              <p className="text-sm text-muted-foreground">{t('low_stock_alerts')}</p>
              <p className="text-2xl font-bold text-foreground">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold">{currency}</div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inventory_value')}</p>
              <p className="text-2xl font-bold text-foreground">{currency}{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('search_inventory')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-background text-foreground"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{t(c.label)}</option>
          ))}
        </select>
      </div>



      <DataTable
        data={filteredInventory}
        loading={loading}
        onRowClick={openEdit}
        columns={[
          { key: 'name', header: t('name'), render: (p) => <span className="font-medium">{p.name}</span> },
          { key: 'part_number', header: t('part_number') },
          { key: 'category', header: t('category'), render: (p) => p.category || '-' },
          {
            key: 'quantity',
            header: t('quantity'),
            render: (p) => (
              <StockLevelGauge
                current={p.quantity}
                min={p.min_stock}
                max={Math.max(p.quantity * 2, p.min_stock * 3, 20)}
              />
            ),
          },
          { key: 'selling_price', header: t('unit_cost'), render: (p) => `${currency}${p.selling_price.toFixed(2)}` },
          { key: 'supplier', header: t('supplier') },
          {
            key: 'actions',
            header: '',
            render: (p) => (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                {t('delete')}
              </button>
            ),
          },
        ]}
        emptyState={
          <EmptyState
            title={t('no_inventory_items')}
            description={t('no_inventory_desc')}
            icon={Package}
            action={{
              label: t('add_part'),
              onClick: () => { resetForm(); setEditingPart(null); setIsModalOpen(true); }
            }}
          />
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPart(null); }}
        title={editingPart ? t('edit_part') : t('add_part')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label={t('part_number')} value={form.part_number} onChange={(e) => setForm({ ...form, part_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('quantity')} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label={t('min_stock')} type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            <Select
              label={t('category')}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES.filter((c) => c.value).map(c => ({ value: c.value, label: t(c.label) }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('unit_cost')} type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            <Input label={t('selling_price')} type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
            <Input label={t('supplier')} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{editingPart ? t('edit') : t('add')} {t('inventory')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
