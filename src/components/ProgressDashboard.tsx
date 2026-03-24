import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Flame, 
  CheckCircle2, 
  Plus, 
  Loader2,
  BarChart3,
  Calendar as CalendarIcon,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  doc,
  where,
  limit,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './Modal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface ProgressDashboardProps {
  userId: string;
}

interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  completed: boolean;
  date: string;
}

export default function ProgressDashboard({ userId }: ProgressDashboardProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalUnit, setNewGoalUnit] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState('daily');
  
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const goalsQuery = query(
      collection(db, `users/${userId}/goals`),
      orderBy('createdAt', 'desc')
    );
    const habitsQuery = query(
      collection(db, `users/${userId}/habits`),
      orderBy('createdAt', 'desc')
    );
    const logsQuery = query(
      collection(db, `users/${userId}/habitLogs`),
      orderBy('date', 'desc'),
      limit(100)
    );

    const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
      setLoading(false);
    });

    const unsubHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit)));
    });

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      setHabitLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitLog)));
    });

    return () => {
      unsubGoals();
      unsubHabits();
      unsubLogs();
    };
  }, [userId]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalTarget) return;
    setModalLoading(true);
    try {
      await addDoc(collection(db, `users/${userId}/goals`), {
        title: newGoalTitle,
        targetValue: Number(newGoalTarget),
        currentValue: 0,
        unit: newGoalUnit,
        deadline: newGoalDeadline || null,
        createdAt: serverTimestamp()
      });
      setNewGoalTitle('');
      setNewGoalTarget('');
      setNewGoalUnit('');
      setNewGoalDeadline('');
      setIsGoalModalOpen(false);
    } catch (error) {
      console.error("Error adding goal:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    setModalLoading(true);
    try {
      await addDoc(collection(db, `users/${userId}/habits`), {
        name: newHabitName,
        frequency: newHabitFreq,
        createdAt: serverTimestamp()
      });
      setNewHabitName('');
      setIsHabitModalOpen(false);
    } catch (error) {
      console.error("Error adding habit:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = habitLogs.find(log => log.habitId === habitId && log.date === today);
    
    try {
      if (existingLog) {
        await updateDoc(doc(db, `users/${userId}/habitLogs`, existingLog.id), {
          completed: !existingLog.completed
        });
      } else {
        await addDoc(collection(db, `users/${userId}/habitLogs`), {
          habitId,
          date: today,
          completed: true
        });
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      await updateDoc(doc(db, `users/${userId}/goals`, goalId), {
        currentValue: newValue
      });

      // Show celebration if reached target for the first time in this session
      if (newValue >= goal.targetValue && goal.currentValue < goal.targetValue) {
        setCompletedGoal({ ...goal, currentValue: newValue });
        setIsCelebrationOpen(true);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  // Calculate stats
  const getHabitStreak = (habitId: string) => {
    let streak = 0;
    const sortedLogs = habitLogs
      .filter(log => log.habitId === habitId && log.completed)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (sortedLogs.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = today;
    
    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(currentDate.getTime() - logDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }
    return streak;
  };

  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayLogs = habitLogs.filter(log => log.date === date && log.completed);
      return {
        date: date.split('-').slice(1).join('/'),
        completed: dayLogs.length,
        total: habits.length
      };
    });
  };

  const overallCompletionRate = habits.length > 0 
    ? Math.round((habitLogs.filter(l => l.completed).length / (habits.length * 30)) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Progress Dashboard</h2>
          <p className="text-slate-500">Track your growth and celebrate your wins</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Target className="w-5 h-5 text-indigo-600" />
            <span>Set Goal</span>
          </button>
          <button 
            onClick={() => setIsHabitModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Flame className="w-5 h-5" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Habits */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass p-6 rounded-3xl border-white/60 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Trophy className="text-indigo-600 w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completion</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{overallCompletionRate}%</div>
                <p className="text-xs text-slate-400 mt-1">Last 30 days average</p>
              </div>
              <div className="glass p-6 rounded-3xl border-white/60 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Flame className="text-emerald-600 w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Top Streak</span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {Math.max(0, ...habits.map(h => getHabitStreak(h.id)))} Days
                </div>
                <p className="text-xs text-slate-400 mt-1">Keep the momentum going!</p>
              </div>
              <div className="glass p-6 rounded-3xl border-white/60 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Target className="text-blue-600 w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Goals</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{goals.length}</div>
                <p className="text-xs text-slate-400 mt-1">Focused & driven</p>
              </div>
            </div>

            {/* Habit Tracking Chart */}
            <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-bold text-xl flex items-center gap-2">
                  <BarChart3 className="text-indigo-600 w-5 h-5" />
                  Weekly Consistency
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }}
                    />
                    <Bar dataKey="completed" radius={[6, 6, 0, 0]} barSize={40}>
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.completed === entry.total && entry.total > 0 ? '#4f46e5' : '#818cf8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Habits List */}
            <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 shadow-xl">
              <div className="px-8 py-6 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Daily Habits</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{habits.length} Active</span>
              </div>
              <div className="divide-y divide-slate-50">
                {habits.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-500 font-medium">No habits defined yet.</p>
                  </div>
                ) : (
                  habits.map((habit) => {
                    const today = new Date().toISOString().split('T')[0];
                    const isCompletedToday = habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
                    const streak = getHabitStreak(habit.id);
                    
                    return (
                      <div key={habit.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleHabit(habit.id)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              isCompletedToday 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <div>
                            <h4 className={`font-bold transition-all ${isCompletedToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {habit.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400 font-medium capitalize">{habit.frequency}</span>
                              {streak > 0 && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                                  <span className="text-xs text-orange-500 font-bold flex items-center gap-1">
                                    <Flame className="w-3 h-3" />
                                    {streak} day streak
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Goals */}
          <div className="space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl">
              <h3 className="font-display font-bold text-xl mb-8 flex items-center gap-2">
                <Target className="text-indigo-600 w-5 h-5" />
                Strategic Goals
              </h3>
              <div className="space-y-8">
                {goals.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No goals set yet.</p>
                ) : (
                  goals.map((goal) => {
                    const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                    const isCompleted = goal.currentValue >= goal.targetValue;
                    
                    return (
                      <div key={goal.id} className={`space-y-3 p-4 rounded-2xl transition-all ${isCompleted ? 'bg-emerald-50/50 border border-emerald-100' : ''}`}>
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-bold ${isCompleted ? 'text-emerald-900' : 'text-slate-900'}`}>{goal.title}</h4>
                              {isCompleted && <Trophy className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {goal.currentValue} / {goal.targetValue} {goal.unit}
                            </p>
                          </div>
                          <span className={`text-sm font-black ${isCompleted ? 'text-emerald-600' : 'text-indigo-600'}`}>{progress}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full shadow-lg ${isCompleted ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateGoalProgress(goal.id, Math.max(0, goal.currentValue - 1))}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all"
                          >
                            -1
                          </button>
                          <button 
                            onClick={() => updateGoalProgress(goal.id, Math.min(goal.targetValue, goal.currentValue + 1))}
                            disabled={isCompleted}
                            className={`px-3 py-1 border rounded-lg text-xs font-bold transition-all ${
                              isCompleted 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 cursor-default' 
                                : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                            }`}
                          >
                            {isCompleted ? 'Completed!' : '+1'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Motivation Card */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500 rounded-full blur-[40px]" />
              </div>
              <div className="relative z-10">
                <TrendingUp className="text-indigo-400 w-8 h-8 mb-4" />
                <h4 className="font-display font-bold text-xl mb-2">Keep Pushing</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  "Success is the sum of small efforts, repeated day in and day out."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      <Modal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        title="Set New Strategic Goal"
      >
        <form onSubmit={handleAddGoal} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Goal Title</label>
            <input 
              required
              type="text" 
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g. Read 50 books"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Target Value</label>
              <input 
                required
                type="number" 
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="50"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Unit</label>
              <input 
                required
                type="text" 
                value={newGoalUnit}
                onChange={(e) => setNewGoalUnit(e.target.value)}
                placeholder="books"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Deadline (Optional)</label>
            <input 
              type="date" 
              value={newGoalDeadline}
              onChange={(e) => setNewGoalDeadline(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={modalLoading}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
            >
              {modalLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Set Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* New Habit Modal */}
      <Modal 
        isOpen={isHabitModalOpen} 
        onClose={() => setIsHabitModalOpen(false)} 
        title="Create New Habit"
      >
        <form onSubmit={handleAddHabit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Habit Name</label>
            <input 
              required
              type="text" 
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Morning Meditation"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Frequency</label>
            <select 
              value={newHabitFreq}
              onChange={(e) => setNewHabitFreq(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setIsHabitModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={modalLoading}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
            >
              {modalLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Create Habit
            </button>
          </div>
        </form>
      </Modal>
      {/* Celebration Modal */}
      <AnimatePresence>
        {isCelebrationOpen && completedGoal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCelebrationOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] p-10 text-center shadow-2xl overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />
              
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8"
              >
                <Trophy className="w-12 h-12 text-emerald-600" />
              </motion.div>

              <h3 className="font-display text-3xl font-black text-slate-900 mb-4">
                Goal Achieved!
              </h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Incredible work! You've successfully reached your target for <br />
                <span className="font-bold text-slate-900">"{completedGoal.title}"</span>.
              </p>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 mb-8">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Final Result</div>
                <div className="text-2xl font-black text-emerald-600">
                  {completedGoal.targetValue} {completedGoal.unit}
                </div>
              </div>

              <button 
                onClick={() => setIsCelebrationOpen(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all"
              >
                Keep it up!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
