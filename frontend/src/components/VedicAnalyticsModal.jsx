import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// --- ANCIENT SANSKRIT DICTIONARY ---
const sanskritDictionary = {
  "Income": "आय (Aaya)",
  "Expense": "व्यय (Vyaya)",
  "Balance": "संचय (Sanchaya)",
  "Food": "आहार (Ahara)",
  "Transport": "यात्रा (Yatra)",
  "Housing": "निवास (Nivas)",
  "Utilities": "उपयोग (Upayoga)",
  "Entertainment": "मनोरंजन (Manoranjan)",
  "Shopping": "क्रय (Kraya)",
  "Health": "स्वास्थ्य (Swasthya)",
  "Others": "अन्य (Anya)",
  "Insurance": "बीमा (Bima)",
  "Recharge & Bills": "विद्युत एवं संचार (Vidyut/Sanchar)"
};

// Hindi script mapping for the native Indian Calendar outputs
const hindiMonthMap = {
  "Chaitra": "चैत्र", "Vaisakha": "वैशाख", "Jyaistha": "ज्येष्ठ", 
  "Asadha": "आषाढ़", "Sravana": "श्रावण", "Bhadra": "भाद्रपद", 
  "Asvina": "अश्विन", "Kartika": "कार्तिक", "Agrahayana": "मार्गशीर्ष", 
  "Pausa": "पौष", "Magha": "माघ", "Phalguna": "फाल्गुन"
};

const CHAKRA_COLORS = ['#E8A317', '#B87333', '#CD853F', '#D2691E', '#8B4513', '#A0522D', '#DAA520'];

// --- TRUE HINDU CALENDAR CONVERSION ---
// This uses the native browser 'en-IN-u-ca-indian' locale to mathematically 
// convert Gregorian dates into the exact Saka Samvat calendar dates.
const getVedicMonthYear = (dateObj) => {
  const formatter = new Intl.DateTimeFormat('en-IN-u-ca-indian', {
    month: 'long',
    year: 'numeric'
  });
  
  const parts = formatter.formatToParts(dateObj);
  const englishName = parts.find(p => p.type === 'month')?.value || "";
  const year = parts.find(p => p.type === 'year')?.value || "";
  
  return {
    rawMonth: englishName,
    hindiMonth: hindiMonthMap[englishName] || englishName,
    year: parseInt(year, 10),
    // Vikram Samvat is technically +135 from Saka Samvat, so we do a quick mathematical conversion for the UI
    vikramSamvat: parseInt(year, 10) + 135 
  };
};

// --- PURE SVG ASHOKA CHAKRA ---
const AshokaChakra = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full opacity-90 drop-shadow-md" style={{ stroke: '#000080', fill: 'none' }}>
    <circle cx="50" cy="50" r="46" strokeWidth="4" />
    <circle cx="50" cy="50" r="41" strokeWidth="1" />
    <circle cx="50" cy="50" r="8" strokeWidth="1" fill="#000080" />
    {Array.from({ length: 24 }).map((_, i) => (
      <line key={i} x1="50" y1="50" x2="50" y2="4" strokeWidth="1.5" transform={`rotate(${i * 15} 50 50)`} />
    ))}
  </svg>
);

const VedicAnalyticsModal = ({ open, onClose, expenses, monthlyIncome }) => {
  
  // 1. Get Today's exact Vedic Date boundaries
  const todayVedic = getVedicMonthYear(new Date());

  // 2. FILTER: Only keep expenses that mathematically fall inside the current Vedic Month!
  const currentVedicExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date || exp.created_at);
      const expVedic = getVedicMonthYear(expDate);
      return expVedic.rawMonth === todayVedic.rawMonth && expVedic.year === todayVedic.year;
    });
  }, [expenses, todayVedic]);

  // 3. Calculate Totals using ONLY the truly filtered Vedic expenses
  const totalVyaya = currentVedicExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalAaya = monthlyIncome || 0;
  const sanchaya = totalAaya - totalVyaya;

  const vedicCategories = currentVedicExpenses.reduce((acc, exp) => {
    const ancientName = sanskritDictionary[exp.category] || exp.category;
    acc[ancientName] = (acc[ancientName] || 0) + exp.amount;
    return acc;
  }, {});

  const chartData = Object.entries(vedicCategories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl bg-[#FFFBF0] border-[#E8A317] border-2 shadow-[0_0_40px_rgba(232,163,23,0.15)] dark:bg-gray-950 dark:border-[#B87333]">
        <DialogHeader className="border-b border-[#E8A317]/30 pb-4 mb-2">
          <DialogTitle className="text-3xl font-bold text-[#B87333] flex items-center gap-3 justify-center font-serif">
            <Sparkles className="text-[#E8A317]" />
            सनातन अर्थशास्त्र (Sanatan Arthashastra)
            <Sparkles className="text-[#E8A317]" />
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-medium text-gray-700 dark:text-gray-300">
            Nalanda Framework • विक्रम संवत {todayVedic.vikramSamvat} (Vikram Samvat) • मास: {todayVedic.hindiMonth} ({todayVedic.rawMonth})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[75vh] overflow-y-auto px-2 pb-4 custom-scrollbar">
          
          {/* The Tri-Fold Wealth Structure */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-b from-white to-[#F9F6EE] border-[#B87333]/40 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2 text-center"><CardTitle className="text-xl text-[#8B4513] dark:text-[#E8A317]">आय (Aaya)</CardTitle></CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Wealth Inflow</p>
                <div className="text-3xl font-bold text-green-700 dark:text-green-500">₹{totalAaya}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-white to-[#FFF0F0] border-red-900/20 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2 text-center"><CardTitle className="text-xl text-red-800 dark:text-red-400">व्यय (Vyaya)</CardTitle></CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Vedic Month Expenditure</p>
                <div className="text-3xl font-bold text-red-700 dark:text-red-500">₹{totalVyaya}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-white to-[#F0F8FF] border-blue-900/20 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2 text-center"><CardTitle className="text-xl text-blue-800 dark:text-blue-400">संचय (Sanchaya)</CardTitle></CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preserved Wealth</p>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-500">₹{sanchaya}</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart and List Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            <Card className="border-[#B87333]/30 bg-[#FFFBF0]/50 dark:bg-gray-900/50 shadow-inner">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl text-[#8B4513] dark:text-[#E8A317] text-center font-serif">
                  व्यय चक्र (Expenditure Chakra)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-6">
                <div className="relative w-full h-[300px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={90} outerRadius={130} paddingAngle={3} dataKey="value" stroke="none">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHAKRA_COLORS[index % CHAKRA_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ borderRadius: '8px', borderColor: '#B87333', backgroundColor: '#FFFBF0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 font-serif text-center px-4">
                      No expenditure recorded yet in this specific Vedic Month.
                    </div>
                  )}

                  {chartData.length > 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-[140px] h-[140px] flex items-center justify-center">
                        <AshokaChakra />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#B87333]/30 bg-white/50 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-xl text-[#8B4513] dark:text-[#E8A317] text-center border-b border-[#B87333]/20 pb-3 font-serif">
                  व्यय विवरण (Category Details)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 pt-2 h-[280px] overflow-y-auto custom-scrollbar pr-2">
                  {chartData.map((data, index) => (
                    <div key={data.name} className="flex justify-between items-center p-3 rounded-lg bg-[#FFFBF0] dark:bg-gray-950 border border-[#E8A317]/20 shadow-sm transition-transform hover:scale-[1.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: CHAKRA_COLORS[index % CHAKRA_COLORS.length] }}></div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{data.name}</span>
                      </div>
                      <span className="font-bold text-[#8B4513] dark:text-[#E8A317] text-lg">₹{data.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-center text-sm text-[#8B4513] dark:text-[#B87333] font-serif italic pt-2">
            "धर्मेण धनमाहरेत्" (Wealth should be acquired and managed with Dharma)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VedicAnalyticsModal;