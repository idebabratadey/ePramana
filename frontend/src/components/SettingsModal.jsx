import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertTriangle } from 'lucide-react'; // <-- Added the warning icon!
import { categories as CATEGORIES } from '../mock';

const SettingsModal = ({ open, onClose, onSave, profile, existingLimits }) => {
  const [formData, setFormData] = useState({
    monthly_income: '',
    budget_limit: '',
    category_limits: {},
  });

  useEffect(() => {
    if (open) {
      const initialLimits = {};
      CATEGORIES.forEach(cat => {
        initialLimits[cat] = existingLimits?.[cat]?.toString() || '';
      });

      setFormData({
        monthly_income: profile?.monthlyIncome?.toString() || '',
        budget_limit: profile?.budgetLimit?.toString() || '',
        category_limits: initialLimits,
      });
    }
  }, [profile, existingLimits, open]);

  const handleCategoryChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      category_limits: {
        ...prev.category_limits,
        [category]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const cleanedLimits = {};
    Object.entries(formData.category_limits).forEach(([cat, val]) => {
      if (val !== '') {
        cleanedLimits[cat] = parseFloat(val) || 0;
      }
    });

    onSave({
      monthly_income: parseFloat(formData.monthly_income) || 0,
      budget_limit: parseFloat(formData.budget_limit) || 0,
      category_limits: cleanedLimits,
    });
  };

  // --- NEW: REAL-TIME MATH CALCULATION ---
  const globalBudget = parseFloat(formData.budget_limit) || 0;
  const totalCategoryLimit = Object.values(formData.category_limits).reduce((sum, val) => {
    return sum + (parseFloat(val) || 0);
  }, 0);

  // Only show warning if they have entered category limits and it doesn't match the global budget
  const showWarning = totalCategoryLimit > 0 && globalBudget > 0 && totalCategoryLimit !== globalBudget;
  const isOverAllocated = totalCategoryLimit > globalBudget;
  // ---------------------------------------

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
        <DialogHeader>
          <DialogTitle className="text-2xl dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
            Financial Settings
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Set your overall income and specific category budgets.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          
          {/* SECTION 1: GLOBAL SETTINGS */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border dark:bg-gray-900/50 dark:border-gray-800">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Global Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="monthly_income" className="dark:text-gray-300">Monthly Income (₹)</Label>
              <Input
                id="monthly_income"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                required
                className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget_limit" className="dark:text-gray-300">Total Monthly Budget (₹)</Label>
              <Input
                id="budget_limit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.budget_limit}
                onChange={(e) => setFormData({ ...formData, budget_limit: e.target.value })}
                required
                className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* SECTION 2: CATEGORY LIMITS */}
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100 dark:bg-emerald-950/10 dark:border-emerald-500/30">
            <h3 className="font-semibold text-blue-800 dark:text-emerald-400">Category Budgets (Optional)</h3>
            <p className="text-xs text-blue-600 mb-2 dark:text-emerald-500/70">Leave blank if you don't want a limit for a category.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map((category) => (
                <div key={category} className="space-y-2">
                  <Label htmlFor={`cat-${category}`} className="text-sm dark:text-gray-300">{category}</Label>
                  <Input
                    id={`cat-${category}`}
                    type="number"
                    step="0.01"
                    placeholder="₹0.00"
                    value={formData.category_limits[category] || ''}
                    onChange={(e) => handleCategoryChange(category, e.target.value)}
                    className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* NEW: DYNAMIC WARNING NOTIFICATION */}
          {showWarning && (
            <div className={`p-3 rounded-lg border flex items-start gap-3 text-sm transition-all ${
              isOverAllocated 
                ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-500/50 dark:text-red-300 dark:shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-500/50 dark:text-yellow-300 dark:shadow-[0_0_10px_rgba(234,179,8,0.2)]'
            }`}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Budget Mismatch Notice</p>
                <p className="mt-1">
                  The sum of your individual categories (<strong>₹{totalCategoryLimit}</strong>) is {isOverAllocated ? 'greater than' : 'less than'} your Total Monthly Budget (<strong>₹{globalBudget}</strong>). 
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2 dark:bg-gray-900">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-400 transition-all">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all">
              Save All Settings
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;