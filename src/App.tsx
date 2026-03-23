/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Target, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  ChevronRight,
  BrainCircuit,
  Zap,
  Quote,
  Layout,
  Menu,
  X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface PlanData {
  goals: string[];
  routines: string[];
  habits: string[];
  advice: string;
  weeklySchedule: { day: string; tasks: string[] }[];
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mainGoal: '',
    challenges: '',
    timeCommitment: '30-60 mins',
    focusArea: 'Health & Wellness'
  });

  const [todos, setTodos] = useState([
    { id: 1, text: "Review quarterly goals", completed: false },
    { id: 2, text: "Plan tomorrow's deep work session", completed: true },
    { id: 3, text: "Read 10 pages of a growth book", completed: false },
  ]);

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const planRef = useRef<HTMLDivElement>(null);

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const model = "gemini-3-flash-preview";
      const prompt = `
        Create a personalized life plan for ${formData.name}.
        Main Goal: ${formData.mainGoal}
        Challenges: ${formData.challenges}
        Daily Time Commitment: ${formData.timeCommitment}
        Focus Area: ${formData.focusArea}

        Return the response in JSON format with the following structure:
        {
          "goals": ["short term goal 1", "short term goal 2", "long term goal"],
          "routines": ["morning routine step", "evening routine step"],
          "habits": ["habit to build 1", "habit to build 2"],
          "advice": "A motivational and practical paragraph of advice.",
          "weeklySchedule": [
            { "day": "Monday", "tasks": ["task 1", "task 2"] },
            { "day": "Tuesday", "tasks": ["task 1", "task 2"] },
            { "day": "Wednesday", "tasks": ["task 1", "task 2"] },
            { "day": "Thursday", "tasks": ["task 1", "task 2"] },
            { "day": "Friday", "tasks": ["task 1", "task 2"] },
            { "day": "Saturday", "tasks": ["task 1", "task 2"] },
            { "day": "Sunday", "tasks": ["task 1", "task 2"] }
          ]
        }
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || "{}");
      setPlan(result);
      
      // Scroll to plan after a short delay to allow rendering
      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-blue-100/30 blur-[120px]" 
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-3xl px-6 py-3 flex justify-between items-center shadow-2xl shadow-indigo-100/20 border-white/40">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform duration-300">
                <Layout className="text-white w-6 h-6" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900">Life Planner</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-600">
              {['Home', 'Features', 'Plans', 'Contact'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  whileHover={{ y: -2 }}
                  className="hover:text-indigo-600 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
                </motion.a>
              ))}
              <button className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95">
                Get Started
              </button>
            </div>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-24 left-6 right-6 md:hidden"
            >
              <div className="glass rounded-3xl p-6 shadow-2xl border-white/40 flex flex-col gap-4">
                {['Home', 'Features', 'Plans', 'Contact'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-lg font-semibold text-slate-700 hover:text-indigo-600 py-2 border-b border-slate-100 last:border-0"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <button className="w-full mt-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100">
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-40 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/50 border border-white/80 shadow-sm backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-900/60">Your journey starts here</span>
              </div>
              
              <h1 className="font-display text-6xl md:text-8xl font-black tracking-tight mb-10 leading-[0.95] text-slate-900">
                Master your time.<br />
                <span className="gradient-text">Own your future.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
                The most advanced personal growth system ever built. Design a life of purpose, focus, and extraordinary results.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById('planner-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span>Start Your Blueprint</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-10 py-5 bg-white/80 text-slate-900 border border-slate-200 rounded-[2rem] font-bold text-lg hover:bg-white transition-all backdrop-blur-sm shadow-xl shadow-slate-200/50"
                >
                  Explore Features
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Daily Focus / To-Do List Section */}
        <section className="py-12 px-6">
          <div className="max-w-xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-white/60"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <CheckCircle2 className="text-white w-5 h-5" />
                  </div>
                  <h2 className="font-display font-bold text-xl">Daily Focus</h2>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {todos.filter(t => t.completed).length}/{todos.length} Done
                </span>
              </div>

              <div className="space-y-3">
                {todos.map((todo) => (
                  <motion.div 
                    key={todo.id}
                    whileHover={{ x: 4 }}
                    onClick={() => toggleTodo(todo.id)}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-white/40 border border-slate-100 hover:border-indigo-200 hover:bg-white/60 transition-all cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      todo.completed 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'border-slate-200 group-hover:border-indigo-300'
                    }`}>
                      {todo.completed && <CheckCircle2 className="text-white w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-medium transition-all ${
                      todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                    }`}>
                      {todo.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Target, title: "Goal Alignment", desc: "Break down massive dreams into actionable, bite-sized milestones." },
                { icon: Calendar, title: "Smart Routines", desc: "Design daily rhythms that protect your energy and focus." },
                { icon: BrainCircuit, title: "Insights", desc: "Personalized growth strategies based on your unique challenges." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="text-indigo-600 w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section id="planner-form" className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-bold mb-4">Let's build your blueprint</h2>
              <p className="text-slate-600">Tell us a bit about yourself, and we will generate a custom growth plan.</p>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass p-8 md:p-12 rounded-[2rem]"
            >
              <form onSubmit={generatePlan} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Your Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Alex"
                      className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Focus Area</label>
                    <select 
                      value={formData.focusArea}
                      onChange={(e) => setFormData({...formData, focusArea: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    >
                      <option>Health & Wellness</option>
                      <option>Career & Finance</option>
                      <option>Relationships</option>
                      <option>Personal Projects</option>
                      <option>Mindset & Spirituality</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">What's your #1 goal right now?</label>
                  <textarea 
                    required
                    value={formData.mainGoal}
                    onChange={(e) => setFormData({...formData, mainGoal: e.target.value})}
                    placeholder="Describe what you want to achieve in detail..."
                    className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">What's holding you back?</label>
                  <input 
                    type="text" 
                    value={formData.challenges}
                    onChange={(e) => setFormData({...formData, challenges: e.target.value})}
                    placeholder="e.g. Lack of time, procrastination, technical skills..."
                    className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Daily time available for growth</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['15 mins', '30-60 mins', '1-2 hours', '2+ hours'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData({...formData, timeCommitment: time})}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                          formData.timeCommitment === time 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Crafting Your Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Generate My Life Plan
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Personalized Plan Section */}
        <AnimatePresence>
          {plan && (
            <section ref={planRef} className="py-24 px-6 bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
              </div>

              <div className="max-w-5xl mx-auto relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div>
                      <span className="text-indigo-400 font-bold tracking-widest uppercase text-xs mb-4 block">Your Custom Blueprint</span>
                      <h2 className="font-display text-4xl md:text-6xl font-bold">The {formData.name} Protocol</h2>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                      <Zap className="text-yellow-400 w-5 h-5" />
                      <span className="text-sm font-medium">Optimized for ${formData.focusArea}</span>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Goals Column */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                          <Target className="text-indigo-400 w-5 h-5" />
                        </div>
                        <h3 className="font-display font-bold text-xl">Strategic Goals</h3>
                      </div>
                      {plan.goals.map((goal, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="p-5 rounded-2xl bg-white/5 border border-white/10 flex gap-4"
                        >
                          <div className="mt-1"><CheckCircle2 className="text-emerald-400 w-5 h-5" /></div>
                          <p className="text-slate-300 leading-relaxed">{goal}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Routines Column */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Calendar className="text-emerald-400 w-5 h-5" />
                        </div>
                        <h3 className="font-display font-bold text-xl">Daily Rhythms</h3>
                      </div>
                      {plan.routines.map((routine, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-slate-300 leading-relaxed">{routine}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Habits Column */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Sparkles className="text-blue-400 w-5 h-5" />
                        </div>
                        <h3 className="font-display font-bold text-xl">Core Habits</h3>
                      </div>
                      {plan.habits.map((habit, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                        >
                          <span className="text-slate-300">{habit}</span>
                          <ChevronRight className="text-white/20 w-5 h-5" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Advice Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-12 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 relative overflow-hidden"
                  >
                    <Quote className="absolute top-8 right-8 w-24 h-24 text-white/10 rotate-12" />
                    <div className="relative z-10 max-w-3xl">
                      <h3 className="font-display font-bold text-2xl mb-6 flex items-center gap-3">
                        <BrainCircuit className="w-7 h-7" />
                        Strategic Insight
                      </h3>
                      <p className="text-xl md:text-2xl text-indigo-50 font-medium leading-relaxed italic">
                        "{plan.advice}"
                      </p>
                    </div>
                  </motion.div>

                  <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button className="w-full sm:w-auto px-10 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all">
                      Download PDF Blueprint
                    </button>
                    <button className="w-full sm:w-auto px-10 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all">
                      Share with Community
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>
          )}
        </AnimatePresence>

        {/* Weekly Planner Section */}
        <AnimatePresence>
          {plan && (
            <section className="py-24 px-6 bg-white">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="text-center mb-16">
                    <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Weekly Planner</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">Your week at a glance, optimized for your goals and available time.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    {plan.weeklySchedule.map((dayPlan, i) => (
                      <motion.div
                        key={dayPlan.day}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
                      >
                        <h4 className="font-display font-bold text-lg mb-4 text-indigo-600 group-hover:scale-110 transition-transform origin-left">
                          {dayPlan.day}
                        </h4>
                        <ul className="space-y-3">
                          {dayPlan.tasks.map((task, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Layout className="text-white w-5 h-5" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight">LifePlanner</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Empowering individuals to take control of their destiny through structured planning and driven insights.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Engine</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>© 2026 LifePlanner. All rights reserved.</p>
            <p> Trons Creation </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-indigo-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
