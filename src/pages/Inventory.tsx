import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { supabase, type InventoryPart } from '../lib/supabase';
import { Modal, Button as ModalButton, Input, Select } from '../components/Modal';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  Truck,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Download,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: '', label: 'all_parts' },
  { value: 'fluids', label: 'fluids_chemicals' },
  { value: 'brakes', label: 'brakes_rotors' },
  { value: 'tires', label: 'tires_wheels' },
  { value: 'filters', label: 'filters' },
  { value: 'electrical', label: 'batteries_electrical' },
  { value: 'suspension', label: 'suspension_steering' },
  { value: 'engine', label: 'engine' },
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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
      toast.success(t('part_updated_success') || 'Part updated successfully');
    } else {
      await supabase.from('inventory_parts').insert([payload]);
      toast.success(t('part_added_success') || 'Part added successfully');
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
    const matchCategory = !categoryFilter || p.category.toLowerCase().includes(categoryFilter.toLowerCase()) || (categoryFilter === '' && true);
    return matchSearch && matchCategory;
  });

  // Pagination Logic
  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const lowStockCount = inventory.filter((p) => p.quantity <= p.min_stock).length;
  const totalValue = inventory.reduce((sum, p) => sum + p.quantity * p.selling_price, 0);
  const totalItemsCount = inventory.length;

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-900 p-6 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Home</span>
            <span>›</span>
            <span>Inventory</span>
            <span>›</span>
            <span className="text-foreground font-medium">Parts Management</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Parts & Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage stock levels, pricing, and reordering.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-white dark:bg-neutral-800">
            <Download className="w-4 h-4" />
            {t('export_report') || 'Export Report'}
          </Button>
          <Button
            className="gap-2 shadow-lg shadow-primary/20"
            onClick={() => { resetForm(); setEditingPart(null); setIsModalOpen(true); }}
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            {t('add_new_part') || 'Add New Part'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-6 flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{t('low_stock_alerts') || 'LOW STOCK ALERTS'}</p>
              <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">{lowStockCount}</h3>
              <p className="text-sm font-medium text-red-600 mt-1">{t('items_below_reorder') || 'Items below reorder point'}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-full">
              <Bell className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-6 flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{t('total_inventory_value') || 'TOTAL INVENTORY VALUE'}</p>
              <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">{currency}{totalValue.toLocaleString()}</h3>
              <p className="text-sm font-medium text-emerald-600 mt-1">{t('value_increase') || '+8.5% from last month'}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
              <span className="w-6 h-6 flex items-center justify-center text-xl font-bold text-emerald-600">{currency}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6 flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{t('total_items') || 'TOTAL ITEMS'}</p>
              <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">{totalItemsCount}</h3>
              <p className="text-sm font-medium text-blue-600 mt-1">{t('active_parts') || 'Active parts in system'}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Sidebar Categories */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-4 sticky top-6">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-neutral-900 dark:text-white">{t('categories') || 'Categories'}</h3>
          </div>
          <div className="space-y-1">
            {CATEGORIES.map(cat => {
              // Approximate counts (mock for now as real count requires complex reduce)
              const isActive = categoryFilter === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => { setCategoryFilter(cat.value); setCurrentPage(1); }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  <span>{t(cat.label) || cat.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Inventory List */}
        <div className="flex-1 min-w-0 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col">

          {/* Toolbar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-50/30 dark:bg-neutral-900/30">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white dark:bg-neutral-800 text-foreground"
                placeholder={t('search_part_oem') || "Search by Part Name or OEM #..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="bg-white dark:bg-neutral-800 gap-2 flex-1 sm:flex-none">
                <Filter className="w-3.5 h-3.5" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="bg-white dark:bg-neutral-800 gap-2 flex-1 sm:flex-none">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-neutral-600">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">{t('part_details') || 'PART DETAILS'}</th>
                  <th className="px-6 py-4 text-left">{t('category') || 'CATEGORY'}</th>
                  <th className="px-6 py-4 text-center">{t('in_stock') || 'IN STOCK'}</th>
                  <th className="px-6 py-4 text-center">{t('reorder_pt') || 'REORDER PT'}</th>
                  <th className="px-6 py-4 text-right">{t('unit_cost') || 'UNIT COST'}</th>
                  <th className="px-6 py-4 text-center">{t('status') || 'STATUS'}</th>
                  <th className="px-6 py-4 text-right">{t('actions') || 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading inventory...</td></tr>
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No parts found matching your criteria.</td></tr>
                ) : (
                  paginatedItems.map((part) => (
                    <tr key={part.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50 transition-colors group cursor-pointer" onClick={() => openEdit(part)}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900 dark:text-white text-base">{part.name}</div>
                        <div className="text-xs font-mono text-neutral-400 mt-1">OEM: {part.part_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{part.category || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "font-bold text-base",
                          part.quantity <= part.min_stock ? "text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-white"
                        )}>
                          {part.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-neutral-400">{part.min_stock}</td>
                      <td className="px-6 py-4 text-right font-medium font-mono">
                        {currency}{part.selling_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                          part.quantity === 0 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" :
                            part.quantity <= part.min_stock ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                              "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        )}>
                          {part.quantity === 0 ? t('out_of_stock') || 'Out Stock' :
                            part.quantity <= part.min_stock ? t('reorder_soon') || 'Reorder' :
                              t('in_stock') || 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); openEdit(part); }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/30 dark:bg-neutral-900/30 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <div>
              Showing <span className="font-medium text-neutral-900 dark:text-white">{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalItems, currentPage * itemsPerPage)}</span> of <span className="font-medium text-neutral-900 dark:text-white">{totalItems}</span> parts
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
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
              options={CATEGORIES.filter(c => c.value).map(c => ({ value: c.value, label: t(c.label) || c.label }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('unit_cost')} type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            <Input label={t('selling_price')} type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
            <Input label={t('supplier')} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div className="flex justify-between items-center pt-4">
            {editingPart && (
              <Button type="button" variant="destructive" onClick={() => handleDelete(editingPart.id)}>
                {t('delete_part') || 'Delete Part'}
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
              <Button type="submit">{editingPart ? t('save_changes') : t('add_part')}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
