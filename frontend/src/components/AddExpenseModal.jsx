import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CATEGORIES = [
  'Food',
  'Travel',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Transport',
  'Other',
];

export default function AddExpenseModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/expenses/', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Expense added!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(108, 99, 255, 0.2)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Add Expense
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Amount (₹)
              </label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="input-field"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange('amount')}
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                className="input-field"
                value={formData.expense_date}
                onChange={handleChange('expense_date')}
                required
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background:
                      formData.category === cat
                        ? 'rgba(108, 99, 255, 0.2)'
                        : 'rgba(108, 99, 255, 0.05)',
                    color:
                      formData.category === cat
                        ? '#8b83ff'
                        : 'var(--color-text-secondary)',
                    border:
                      formData.category === cat
                        ? '1px solid rgba(108, 99, 255, 0.4)'
                        : '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Description
            </label>
            <input
              id="expense-description"
              type="text"
              className="input-field"
              placeholder="What was this expense for?"
              value={formData.description}
              onChange={handleChange('description')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              id="save-expense-btn"
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
