import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Layout from '../components/Layout';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine } from 'recharts';
import { supabase } from '../supabaseClient';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Analytics = () => {
  const [expenses, setExpenses] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(0);
  
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [academicTerm, setAcademicTerm] = useState('all');

  // Keep state for dark mode so charts can react
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Basic check to see if we are currently in dark mode
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDark(document.documentElement.classList.contains("dark"));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    setIsDark(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  /* =========================
     FETCH DATA
  ========================== */
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: expenseData } = await supabase.from('expenses').select('*').eq('user_id', user.id);
      setExpenses(expenseData || []);

      const { data: profileData } = await supabase.from("profiles").select("budget_limit").eq("id", user.id).single();
      if (profileData) setBudgetLimit(profileData.budget_limit || 0);
    };
    fetchData();
  }, []);

  /* =========================
     MOM VELOCITY BADGE LOGIC
  ========================== */
  const currentMonth = new Date().getMonth();
  const currentYearNum = new Date().getFullYear();
  
  const thisMonthTotal = expenses
    .filter(exp => new Date(exp.created_at).getMonth() === currentMonth && new Date(exp.created_at).getFullYear() === currentYearNum)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const lastMonthTotal = expenses
    .filter(exp => new Date(exp.created_at).getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && new Date(exp.created_at).getFullYear() === (currentMonth === 0 ? currentYearNum - 1 : currentYearNum))
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const momChange = lastMonthTotal === 0 ? 0 : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  const isSpendingDown = momChange <= 0;

  /* =========================
     FILTERING & DATA PREP
  ========================== */
  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.created_at);
    const expMonth = expDate.getMonth();
    const matchYear = selectedYear === 'all' || expDate.getFullYear().toString() === selectedYear;
    const matchMonth = selectedMonth === 'all' || (expMonth + 1).toString() === selectedMonth;
    const matchTerm = academicTerm === 'all' || 
      (academicTerm === 'spring' && expMonth >= 0 && expMonth <= 4) ||
      (academicTerm === 'summer' && expMonth >= 5 && expMonth <= 6) ||
      (academicTerm === 'fall' && expMonth >= 7 && expMonth <= 11);
    return matchYear && matchMonth && matchTerm;
  });

  const categoryData = Object.entries(
    filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(selectedYear === 'all' ? new Date().getFullYear() : Number(selectedYear), i).toLocaleString('default', { month: 'short' });
    const total = expenses
      .filter(exp => {
        const expDate = new Date(exp.created_at);
        const matchYear = selectedYear === 'all' || expDate.getFullYear().toString() === selectedYear;
        return expDate.getMonth() === i && matchYear;
      })
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    return { month, amount: total };
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const avgExpense = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;

  /* =========================
     UI
  ========================== */
  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] flex items-center gap-2">
            <Activity className="text-emerald-600 dark:text-emerald-400" /> Advanced Analytics
          </h1>
          <div className="flex flex-wrap gap-3">
            <Select value={academicTerm} onValueChange={setAcademicTerm}>
              <SelectTrigger className="w-40 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-500/50 dark:text-emerald-400 dark:hover:shadow-neon-emerald transition-all">
                <SelectValue placeholder="Academic Term" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-emerald-500/50">
                <SelectItem value="all" className="dark:text-gray-200 focus:dark:bg-gray-800">All Terms</SelectItem>
                <SelectItem value="spring" className="dark:text-gray-200 focus:dark:bg-gray-800">Spring (Jan-May)</SelectItem>
                <SelectItem value="summer" className="dark:text-gray-200 focus:dark:bg-gray-800">Summer (Jun-Jul)</SelectItem>
                <SelectItem value="fall" className="dark:text-gray-200 focus:dark:bg-gray-800">Fall (Aug-Dec)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                <SelectItem value="all" className="dark:text-gray-200 focus:dark:bg-gray-800">All Months</SelectItem>
                {Array.from({length: 12}, (_, i) => (
                  <SelectItem key={i+1} value={(i+1).toString()} className="dark:text-gray-200 focus:dark:bg-gray-800">{new Date(0, i).toLocaleString('default', { month: 'long' })}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                <SelectItem value="all" className="dark:text-gray-200 focus:dark:bg-gray-800">All Years</SelectItem>
                <SelectItem value="2026" className="dark:text-gray-200 focus:dark:bg-gray-800">2026</SelectItem>
                <SelectItem value="2025" className="dark:text-gray-200 focus:dark:bg-gray-800">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-emerald-500 dark:bg-gray-900 dark:border-y-gray-800 dark:border-r-gray-800 dark:border-l-emerald-400 dark:hover:shadow-neon-emerald">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent (Filtered)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">₹{totalAmount.toLocaleString()}</div>
              {selectedMonth === 'all' && academicTerm === 'all' && lastMonthTotal > 0 && (
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isSpendingDown ? 'text-green-600 dark:text-emerald-400 dark:drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-red-500 dark:text-red-400 dark:drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}>
                  {isSpendingDown ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                  {Math.abs(momChange).toFixed(1)}% {isSpendingDown ? 'less' : 'more'} than last month
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="transition-all duration-300 hover:shadow-lg dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-500/50 dark:hover:shadow-neon-emerald">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{filteredExpenses.length}</div>
            </CardContent>
          </Card>
          
          <Card className="transition-all duration-300 hover:shadow-lg dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-500/50 dark:hover:shadow-neon-emerald">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">₹{avgExpense.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Radar Chart */}
          <Card className="transition-all duration-300 hover:shadow-xl dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-500/50 dark:hover:shadow-neon-emerald">
            <CardHeader>
              <CardTitle className="dark:text-gray-200">Expense DNA Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-600">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={categoryData}>
                    <PolarGrid stroke={isDark ? "#374151" : "#e5e7eb"} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar 
                      name="Spending" 
                      dataKey="value" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={isDark ? 0.3 : 0.5} 
                      // Add SVG glow filter if in dark mode
                      style={isDark ? { filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' } : {}}
                    />
                    <Tooltip 
                      formatter={(value) => `₹${value.toLocaleString()}`} 
                      contentStyle={{ borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#fff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', color: isDark ? '#f3f4f6' : '#111827' }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="transition-all duration-300 hover:shadow-xl dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-500/50 dark:hover:shadow-neon-emerald">
            <CardHeader>
              <CardTitle className="dark:text-gray-200">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-600">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100} 
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      stroke={isDark ? "none" : "#fff"}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `₹${value.toLocaleString()}`} 
                      contentStyle={{ borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#fff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', color: isDark ? '#f3f4f6' : '#111827' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="transition-all duration-300 hover:shadow-xl lg:col-span-2 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-500/50 dark:hover:shadow-neon-emerald">
            <CardHeader>
              <CardTitle className="dark:text-gray-200">Monthly Spending Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} vertical={false} />
                  <XAxis dataKey="month" stroke={isDark ? "#9ca3af" : "#666"} tickLine={false} />
                  <YAxis stroke={isDark ? "#9ca3af" : "#666"} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', border: isDark ? '1px solid #374151' : 'none', borderRadius: '8px', color: isDark ? '#f3f4f6' : '#111827' }}
                    cursor={{ fill: isDark ? '#1f2937' : '#f3f4f6' }}
                  />
                  <Legend wrapperStyle={{ color: isDark ? '#9ca3af' : '#666' }} />
                  
                  {budgetLimit > 0 && (
                    <ReferenceLine 
                      y={budgetLimit} 
                      label={{ position: 'top', value: 'Monthly Budget Limit', fill: '#ef4444', fontSize: 12 }} 
                      stroke="#ef4444" 
                      strokeDasharray="5 5" 
                      strokeWidth={isDark ? 3 : 2} 
                      style={isDark ? { filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.8))' } : {}}
                    />
                  )}
                  
                  <Bar dataKey="amount" name="Total Spent" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.amount > budgetLimit && budgetLimit > 0 ? '#ef4444' : '#3b82f6'} 
                        // Subtle glow on the bars in dark mode
                        style={isDark ? { filter: entry.amount > budgetLimit && budgetLimit > 0 ? 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' : 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' } : {}}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;