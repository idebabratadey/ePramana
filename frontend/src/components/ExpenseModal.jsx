import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { categories } from '../mock';

const ExpenseModal = ({ open, onClose, onSave, expense }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (expense) {
      const expenseDate = expense.date 
        ? expense.date 
        : (expense.created_at ? expense.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);

      setFormData({
        title: expense.title,
        amount: expense.amount.toString(),
        category: expense.category,
        date: expenseDate,
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [expense, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      id: expense?.id,
    };
    onSave(expenseData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* ADDED NEON BORDERS AND DARK BACKGROUND TO THE MODAL CONTENT */}
      <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
        <DialogHeader>
          <DialogTitle className="text-2xl dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {expense ? 'Update the expense details below' : 'Fill in the details to add a new expense'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="dark:text-gray-300">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Groceries"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount" className="dark:text-gray-300">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="dark:text-gray-300">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-emerald-500/50">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="dark:text-gray-200 focus:dark:bg-gray-800 focus:dark:text-emerald-400">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date" className="dark:text-gray-300">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50 [color-scheme:dark]"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 transition-all duration-200 hover:scale-105 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-400">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg dark:hover:bg-emerald-500 dark:shadow-neon-emerald">
              {expense ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;