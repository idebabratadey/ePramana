import { categories } from '../mock';
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Settings, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
// --- NEW IMPORTS FOR THE PASSWORD MODAL ---
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
// ------------------------------------------
import Layout from "../components/Layout";
import ExpenseModal from "../components/ExpenseModal";
import SettingsModal from "../components/SettingsModal";
import { supabase } from "../supabaseClient";
import { toast } from "../hooks/use-toast";
// Vedic Analytics Modal ---
import VedicAnalyticsModal from "../components/VedicAnalyticsModal";

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Profile & Financial State
  const [fullName, setFullName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [categoryLimits, setCategoryLimits] = useState({});

  // --- NEW: PASSWORD RECOVERY STATE ---
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // State for VedicAnalyticsModal --
  const [showVedicModal, setShowVedicModal] = useState(false);

  /* =========================
     PASSWORD RECOVERY LISTENER (AGGRESSIVE)
  ========================== */
  useEffect(() => {
    // 1. Aggressively check the raw URL the millisecond the page loads
    // This catches the Supabase token before React Router has a chance to hide it!
    const currentHash = window.location.hash;
    const currentUrl = window.location.href;
    
    if (currentHash.includes("type=recovery") || currentUrl.includes("type=recovery")) {
      setShowUpdatePassword(true);
    }

    // 2. Listen for the official Supabase event as a reliable fallback
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
    });

    // 3. Clean up the listener when the component unmounts
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // First, check if the user typed the same password twice
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Passwords do not match." });
      return;
    }

    // Tell Supabase to securely update the password for this user
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Your password has been securely updated!" });
      setShowUpdatePassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      
      // Clean up the URL so the modal doesn't get stuck open if they refresh the page
      window.location.hash = ''; 
      window.history.replaceState(null, '', window.location.pathname);
    }
  };
  // -------------------------------------

  /* =========================
     FETCH PROFILE & LIMITS
  ========================== */
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, monthly_income, budget_limit")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setFullName(profileData.full_name);
        setMonthlyIncome(profileData.monthly_income || 0);
        setBudgetLimit(profileData.budget_limit || 0);
      }

      const { data: limitsData } = await supabase
        .from("category_limits")
        .select("category, amount")
        .eq("user_id", user.id);

      if (limitsData) {
        const limitsMap = {};
        limitsData.forEach(item => {
          limitsMap[item.category] = item.amount;
        });
        setCategoryLimits(limitsMap);
      }
    };

    fetchData();
  }, []);

  /* =========================
     FETCH EXPENSES
  ========================== */
  useEffect(() => {
    const fetchExpenses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error", description: error.message });
        return;
      }

      setExpenses(data || []);
    };

    fetchExpenses();
  }, []);

  /* =========================
     FILTER LOGIC & DATE SORTING
  ========================== */
  useEffect(() => {
    let filtered = [...expenses];

    if (searchTerm) {
      filtered = filtered.filter((exp) =>
        exp.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((exp) => exp.category === categoryFilter);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at);
      const dateB = new Date(b.date || b.created_at);
      return dateB - dateA; 
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, categoryFilter]);

  /* =========================
     SAVE SETTINGS 
  ========================== */
  const handleSaveSettings = async (settingsData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        monthly_income: settingsData.monthly_income,
        budget_limit: settingsData.budget_limit,
      });

    if (profileError) {
      toast({ title: "Error", description: profileError.message });
      return;
    }

    const limitPromises = Object.entries(settingsData.category_limits).map(([category, amount]) => {
      return supabase
        .from("category_limits")
        .upsert({
          user_id: user.id,
          category: category,
          amount: amount
        }, { onConflict: 'user_id, category' });
    });

    await Promise.all(limitPromises);

    setMonthlyIncome(settingsData.monthly_income);
    setBudgetLimit(settingsData.budget_limit);
    setCategoryLimits(settingsData.category_limits);
    
    toast({ title: "Success", description: "All financial settings saved!" });
    setShowSettingsModal(false);
  };

  /* =========================
     EXPENSE CRUD ACTIONS
  ========================== */
  const handleAddExpense = async (expense) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("expenses")
      .insert([{
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          created_at: expense.date,
          user_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }

    setExpenses((prev) => [data, ...prev]);
    toast({ title: "Success", description: "Expense added successfully!" });
    setShowModal(false);
  };

  const handleEditExpense = async (expense) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("expenses")
      .update({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        created_at: expense.date,
      })
      .eq("id", expense.id)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }

    setExpenses((prev) => prev.map((exp) => exp.id === expense.id ? { ...exp, ...expense } : exp));
    toast({ title: "Success", description: "Expense updated successfully!" });
    setEditingExpense(null);
    setShowModal(false);
  };

  const handleDeleteExpense = async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }

    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    toast({ title: "Success", description: "Expense deleted successfully!" });
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingExpense(null);
    setShowModal(false);
  };

  /* =========================
     STATS & FINANCIAL CALCULATIONS
  ========================== */
  const thisMonthExpensesArray = expenses.filter((exp) => {
    const expDate = new Date(exp.date || exp.created_at);
    const now = new Date();
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  });

  const thisMonthExpenses = thisMonthExpensesArray.reduce((sum, exp) => sum + exp.amount, 0);

  const thisMonthCategoryTotals = thisMonthExpensesArray.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const categoryTotalsAllTime = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const biggestCategory = Object.entries(categoryTotalsAllTime).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const remainingBudget = budgetLimit - thisMonthExpenses;
  const budgetPercentage = budgetLimit > 0 ? Math.min((thisMonthExpenses / budgetLimit) * 100, 100) : 0;
  const isOverBudget = budgetLimit > 0 && thisMonthExpenses > budgetLimit;

  const today = new Date();
  const currentDay = today.getDate(); 
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); 

  const dailyAverage = currentDay > 0 ? (thisMonthExpenses / currentDay) : 0;
  const projectedTotal = dailyAverage * daysInMonth;
  const projectedDifference = budgetLimit - projectedTotal;

  /* =========================
     UI
  ========================== */
  return (
    <Layout>
      <div className="space-y-6">

        {/* Welcome & Settings Header (UPDATED WITH VEDIC BUTTON) */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
            Welcome {fullName || "User"}
          </h2>
          <div className="flex gap-3">
            {/* NEW VEDIC BUTTON */}
            <Button 
              onClick={() => setShowVedicModal(true)} 
              className="bg-[#B87333] hover:bg-[#8B4513] text-white shadow-[0_0_10px_rgba(184,115,51,0.5)] transition-all flex gap-2"
            >
              <Sparkles size={18} /> सनातन (Vedic View)
            </Button>
            
            <Button variant="outline" onClick={() => setShowSettingsModal(true)} className="flex gap-2 dark:border-emerald-500/50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:shadow-neon-emerald transition-all">
              <Settings size={18} /> Financial Settings
            </Button>
          </div>
        </div>

        {/* Global Over-Budget Warning Banner */}
        {isOverBudget && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-center gap-3 shadow-sm dark:bg-red-950/40 dark:border-red-500 dark:text-red-400 dark:shadow-neon-red transition-all">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <p className="font-bold">Total Budget Exceeded!</p>
              <p className="text-sm">You have spent ₹{Math.abs(remainingBudget)} over your global monthly limit.</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {["Monthly Income", "Spent This Month", "Remaining Budget", "Biggest Category"].map((title, index) => (
            <Card key={title} className="transition-all duration-300 dark:bg-gray-900 dark:border-emerald-500/30 dark:hover:shadow-neon-emerald">
              <CardHeader><CardTitle className="dark:text-gray-300">{title}</CardTitle></CardHeader>
              <CardContent>
                {index === 0 && <div className="text-2xl font-bold text-green-600 dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">₹{monthlyIncome}</div>}
                {index === 1 && (
                  <>
                    <div className="text-2xl font-bold dark:text-gray-100">₹{thisMonthExpenses}</div>
                    {budgetLimit > 0 && (
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-800">
                        <div 
                          className={`h-2.5 rounded-full transition-all ${isOverBudget ? 'bg-red-600 dark:bg-red-500 dark:shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-blue-600 dark:bg-blue-500 dark:shadow-[0_0_10px_rgba(59,130,246,0.8)]'}`} 
                          style={{ width: `${budgetPercentage}%` }}
                        ></div>
                      </div>
                    )}
                    {budgetLimit > 0 && <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">{budgetPercentage.toFixed(0)}% of ₹{budgetLimit} limit</p>}
                  </>
                )}
                {index === 2 && <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-500 dark:text-red-400 dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'dark:text-gray-100'}`}>₹{remainingBudget}</div>}
                {index === 3 && <div className="text-2xl font-bold dark:text-gray-100">{biggestCategory}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Smart Insights & Predictions */}
        {(thisMonthExpenses > 0) && (
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100 shadow-sm dark:from-indigo-950/40 dark:to-blue-950/40 dark:border-indigo-500/30 dark:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" /> Smart Insights & Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <p>You are spending an average of <span className="font-bold text-indigo-700 dark:text-indigo-400 dark:drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">₹{dailyAverage.toFixed(0)} per day</span>.</p>
                  <p>At this rate, your projected spending for this month is <span className="font-bold text-indigo-700 dark:text-indigo-400 dark:drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">₹{projectedTotal.toFixed(0)}</span>.</p>
                </div>
                
                {budgetLimit > 0 && (
                  <div className={`p-4 rounded-lg border w-full md:w-1/2 transition-colors ${projectedTotal > budgetLimit ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-500/50 dark:text-red-300 dark:shadow-neon-red' : 'bg-green-50 border-green-200 text-green-800 dark:bg-emerald-950/30 dark:border-emerald-500/50 dark:text-emerald-300 dark:shadow-neon-emerald'}`}>
                    <p className="font-semibold flex items-center gap-2">
                      {projectedTotal > budgetLimit ? <AlertTriangle size={18} /> : '✅'} 
                      Smart Suggestion:
                    </p>
                    <p className="text-sm mt-1">
                      {projectedTotal > budgetLimit 
                        ? `You are on track to EXCEED your budget by ₹${Math.abs(projectedDifference).toFixed(0)}. Try to reduce daily spending to stay within your ₹${budgetLimit} limit.` 
                        : `Great job! If you keep this up, you will have ₹${projectedDifference.toFixed(0)} safely left over at the end of the month.`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Progress Bars */}
        {Object.keys(categoryLimits).length > 0 && (
          <Card className="bg-slate-50 border-slate-200 dark:bg-gray-900 dark:border-emerald-500/30 dark:hover:shadow-neon-emerald transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg text-slate-700 dark:text-slate-200">Category Budgets (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(categoryLimits).map(([category, limit]) => {
                  const spent = thisMonthCategoryTotals[category] || 0;
                  const percentage = Math.min((spent / limit) * 100, 100);
                  const isOver = spent > limit;
                  const isWarning = percentage >= 80 && !isOver;

                  let barColor = 'bg-green-500 dark:bg-emerald-500 dark:shadow-neon-emerald';
                  if (isWarning) barColor = 'bg-yellow-400 dark:bg-yellow-400 dark:shadow-[0_0_10px_rgba(250,204,21,0.8)]';
                  if (isOver) barColor = 'bg-red-500 dark:bg-red-500 dark:shadow-neon-red';

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold flex items-center gap-2 dark:text-gray-200">
                          {category} 
                          {isOver && <AlertTriangle size={14} className="text-red-500 dark:text-red-400 dark:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />}
                        </span>
                        <span className={isOver ? "text-red-600 font-bold dark:text-red-400" : "text-gray-600 dark:text-gray-400"}>
                          ₹{spent} / ₹{limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-800">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-500 font-medium dark:text-gray-400">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Table */}
        <Card className="transition-all duration-300 dark:bg-gray-900 dark:border-emerald-500/30 dark:hover:shadow-neon-emerald">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="dark:text-gray-200 focus:dark:bg-gray-800 focus:dark:text-emerald-400">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border dark:border-gray-800">
              <Table>
                <TableHeader className="dark:bg-gray-950/50">
                  <TableRow className="dark:border-gray-800">
                    <TableHead className="dark:text-gray-400">Date</TableHead>
                    <TableHead className="dark:text-gray-400">Title</TableHead>
                    <TableHead className="dark:text-gray-400">Category</TableHead>
                    <TableHead className="dark:text-gray-400">Amount</TableHead>
                    <TableHead className="dark:text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="dark:border-gray-800 dark:hover:bg-gray-800/50">
                      <TableCell className="dark:text-gray-300">
                        {new Date(expense.date || expense.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{expense.title}</TableCell>
                      <TableCell className="dark:text-gray-300">{expense.category}</TableCell>
                      <TableCell className="dark:text-gray-100 font-medium">₹{expense.amount}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-400" onClick={() => openEditModal(expense)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="destructive" size="sm" className="dark:hover:shadow-neon-red" onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Floating Add Button */}
        <Button
          onClick={() => setShowModal(true)}
          className="fixed bottom-8 right-8 rounded-full h-14 w-14 shadow-lg dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all hover:scale-105"
        >
          <Plus size={24} />
        </Button>

        {/* MODALS */}
        <ExpenseModal
          open={showModal}
          onClose={closeModal}
          onSave={editingExpense ? handleEditExpense : handleAddExpense}
          expense={editingExpense}
        />

        <SettingsModal
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
          profile={{ monthlyIncome, budgetLimit }}
          existingLimits={categoryLimits}
        />

        {/* UPDATE PASSWORD MODAL */}
        <Dialog open={showUpdatePassword} onOpenChange={setShowUpdatePassword}>
          <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
            <DialogHeader>
              <DialogTitle className="text-2xl dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                Secure Your Account
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Please enter a new password below to reset your access.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="dark:text-gray-300">New Password</Label>
                <Input
                  id="new-password" type="password" placeholder="••••••••" required
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="dark:text-gray-300">Confirm New Password</Label>
                <Input
                  id="confirm-new-password" type="password" placeholder="••••••••" required
                  value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all">
                Update Password
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* NEW: VEDIC ANALYTICS MODAL */}
        <VedicAnalyticsModal 
          open={showVedicModal} 
          onClose={() => setShowVedicModal(false)} 
          expenses={expenses} // <--- FIX: Pass ALL raw expenses here!
          monthlyIncome={monthlyIncome} 
        />

      </div>
    </Layout>
  );
};

export default Dashboard;