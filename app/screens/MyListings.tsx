import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { fetchProducts, updateProduct, deleteProduct } from '../../lib/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Edit2, Trash2, Save, X } from 'lucide-react';

interface Listing {
  Id?: string;
  id?: string;
  Name?: string;
  crop?: string;
  ItemName?: string;
  Quantity?: string | number;
  Unit?: string;
  Price?: string | number;
  DeliveryDate?: string;
  Location?: string;
  FarmerName?: string;
  farmer?: string;
  Seller?: string;
}

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    price: '',
    deliveryDate: '',
    location: '',
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const products = await fetchProducts();
        const mine = (products || []).filter((p: any) => {
          const farmerName =
            p.FarmerName || p.farmer || p.Seller || "";
          const farmerId = p.FarmerId || p.farmerId || "";
          return (
            farmerName === user.username ||
            farmerId === user.id
          );
        });
        setListings(mine);
      } catch (err) {
        console.error('Failed to load listings', err);
        alert('Could not load your listings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const beginEdit = (item: Listing) => {
    const id = String(item.Id || item.id || '');
    setEditingId(id);
    setEditForm({
      name: String(item.Name || item.crop || item.ItemName || ''),
      quantity: String(item.Quantity ?? ''),
      unit: String(item.Unit || 'kg'),
      price: String(item.Price ?? ''),
      deliveryDate: String(item.DeliveryDate || ''),
      location: String((item as any).Location || ''),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (item: Listing) => {
    const id = String(item.Id || item.id || '');
    if (!id) {
      alert('This listing cannot be edited because it has no ID.');
      return;
    }
    setSavingId(id);
    try {
      await updateProduct(id, {
        Name: editForm.name,
        Quantity: editForm.quantity,
        Unit: editForm.unit,
        Price: editForm.price,
        DeliveryDate: editForm.deliveryDate,
        Location: editForm.location,
      });

      setListings((prev) =>
        prev.map((p) =>
          (p.Id || p.id) === (item.Id || item.id)
            ? {
                ...p,
                Name: editForm.name,
                Quantity: editForm.quantity,
                Unit: editForm.unit,
                Price: editForm.price,
                DeliveryDate: editForm.deliveryDate,
                Location: editForm.location,
              }
            : p
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save listing', err);
      alert('Could not save changes. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item: Listing) => {
    const id = String(item.Id || item.id || '');
    if (!id) {
      alert('This listing cannot be deleted because it has no ID.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setListings((prev) => prev.filter((p) => (p.Id || p.id) !== (item.Id || item.id)));
    } catch (err) {
      console.error('Failed to delete listing', err);
      alert('Could not delete listing. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Listings" showBack />
      <div className="max-w-md mx-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
            <p className="text-gray-500">Loading your listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>You have not published any listings yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((item) => {
              const id = String(item.Id || item.id || '');
              const isEditing = editingId === id;
              const name = item.Name || item.crop || item.ItemName || 'Unknown Crop';
              const qty = item.Quantity ?? '';
              const unit = item.Unit || 'kg';
              const price = item.Price ?? '';
              const deliveryDate = item.DeliveryDate || '';
              const location = (item as any).Location || '';

              return (
                <div key={id || name} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm"
                          />
                        ) : (
                          name
                        )}
                      </h3>
                      <p className="text-xs text-gray-500">
                        ID: {id || 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSave(item)}
                            disabled={savingId === id}
                            className="p-2 rounded-full bg-green-50 text-green-700 border border-green-200"
                          >
                            {savingId === id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-2 rounded-full bg-gray-50 text-gray-700 border border-gray-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => beginEdit(item)}
                            className="p-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === id}
                            className="p-2 rounded-full bg-red-50 text-red-700 border border-red-200 disabled:opacity-60"
                          >
                            {deletingId === id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Quantity</div>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm"
                          />
                          <select
                            value={editForm.unit}
                            onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                            className="px-2 py-1 border border-gray-200 rounded-md text-sm bg-white"
                          >
                            <option value="kg">kg</option>
                            <option value="quintal">quintal</option>
                            <option value="ton">ton</option>
                          </select>
                        </div>
                      ) : (
                        <span>
                          {qty} {unit}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Price</div>
                      {isEditing ? (
                        <div className="flex items-center">
                          <span className="mr-1 text-gray-500 text-xs">₹</span>
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm"
                          />
                        </div>
                      ) : (
                        <span>₹{price}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Delivery Date</div>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.deliveryDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm"
                        />
                      ) : (
                        <span>{deliveryDate || '-'}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Location</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm"
                        />
                      ) : (
                        <span>{location || '-'}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav userType="farmer" />
    </div>
  );
}

