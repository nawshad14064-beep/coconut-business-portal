import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  getDocFromServer,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  User, 
  CoconutStock, 
  PeelingProcess, 
  Sale, 
  OperationType 
} from './types';
import { handleFirestoreError, displayDate, formatDate } from './utils';
import { 
  LayoutDashboard, 
  Package, 
  Scissors, 
  ShoppingCart, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Users,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'peeling' | 'sales' | 'husk_sales'>('dashboard');
  
  const [stocks, setStocks] = useState<CoconutStock[]>([]);
  const [processes, setProcesses] = useState<PeelingProcess[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [huskSales, setHuskSales] = useState<Sale[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user profile exists in Firestore, otherwise create it
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDocFromServer(userDocRef);
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'staff' // Default role
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback if user doc doesn't exist yet
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'staff'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) return;

    const stockUnsubscribe = onSnapshot(
      query(collection(db, 'coconut_stock'), orderBy('receivedDate', 'desc')),
      (snapshot) => {
        setStocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoconutStock)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'coconut_stock')
    );

    const processUnsubscribe = onSnapshot(
      query(collection(db, 'peeling_processes'), orderBy('startDate', 'desc')),
      (snapshot) => {
        setProcesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeelingProcess)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'peeling_processes')
    );

    const salesUnsubscribe = onSnapshot(
      query(collection(db, 'sales'), orderBy('date', 'desc')),
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'sales')
    );

    const huskSalesUnsubscribe = onSnapshot(
      query(collection(db, 'husk_sales'), orderBy('date', 'desc')),
      (snapshot) => {
        setHuskSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'husk_sales')
    );

    return () => {
      stockUnsubscribe();
      processUnsubscribe();
      salesUnsubscribe();
      huskSalesUnsubscribe();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coconut Manager</h1>
          <p className="text-gray-600 mb-8">Manage your stock, peeling, and sales in one place.</p>
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 text-emerald-600 mb-1">
            <Package className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">Coconut Biz</span>
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Management System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeTab === 'stock'} 
            onClick={() => setActiveTab('stock')} 
            icon={<Package className="w-5 h-5" />} 
            label="Stock" 
          />
          <NavItem 
            active={activeTab === 'peeling'} 
            onClick={() => setActiveTab('peeling')} 
            icon={<Scissors className="w-5 h-5" />} 
            label="Peeling" 
          />
          <NavItem 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
            icon={<ShoppingCart className="w-5 h-5" />} 
            label="DC Sales" 
          />
          <NavItem 
            active={activeTab === 'husk_sales'} 
            onClick={() => setActiveTab('husk_sales')} 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Husk Sales" 
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <Dashboard 
              key="dashboard" 
              stocks={stocks} 
              processes={processes} 
              sales={sales} 
              huskSales={huskSales} 
            />
          )}
          {activeTab === 'stock' && (
            <StockManager 
              key="stock" 
              stocks={stocks} 
              user={user} 
            />
          )}
          {activeTab === 'peeling' && (
            <PeelingManager 
              key="peeling" 
              processes={processes} 
              stocks={stocks} 
              user={user} 
            />
          )}
          {activeTab === 'sales' && (
            <SalesManager 
              key="sales" 
              sales={sales} 
              title="DC Coconut Sales" 
              collectionName="sales" 
              user={user} 
            />
          )}
          {activeTab === 'husk_sales' && (
            <SalesManager 
              key="husk_sales" 
              sales={huskSales} 
              title="Husk Sales" 
              collectionName="husk_sales" 
              user={user} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
          : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Sub-components
function Dashboard({ stocks, processes, sales, huskSales }: { 
  stocks: CoconutStock[], 
  processes: PeelingProcess[], 
  sales: Sale[], 
  huskSales: Sale[],
  key?: string
}) {
  const totalStock = stocks.reduce((acc, s) => acc + s.quantity, 0);
  const totalSales = sales.reduce((acc, s) => acc + (s.quantity * s.price), 0);
  const totalHuskSales = huskSales.reduce((acc, s) => acc + (s.quantity * s.price), 0);
  const activePeeling = processes.filter(p => !p.endDate).length;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Stock" value={totalStock} icon={<Package className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Active Peeling" value={activePeeling} icon={<Scissors className="text-amber-600" />} color="bg-amber-50" />
        <StatCard title="DC Sales Revenue" value={`$${totalSales.toLocaleString()}`} icon={<ShoppingCart className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Husk Sales Revenue" value={`$${totalHuskSales.toLocaleString()}`} icon={<TrendingUp className="text-purple-600" />} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Recent Stock
          </h3>
          <div className="space-y-4">
            {stocks.slice(0, 5).map(stock => (
              <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">{stock.source}</p>
                  <p className="text-xs text-gray-500">{displayDate(stock.receivedDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{stock.quantity} units</p>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    stock.status === 'received' ? 'bg-blue-100 text-blue-700' :
                    stock.status === 'peeling' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {stock.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Recent Sales
          </h3>
          <div className="space-y-4">
            {sales.slice(0, 5).map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">{sale.customerName}</p>
                  <p className="text-xs text-gray-500">{displayDate(sale.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${(sale.quantity * sale.price).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{sale.quantity} units @ ${sale.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StockManager({ stocks, user }: { stocks: CoconutStock[], user: User, key?: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ quantity: 0, source: '', receivedDate: formatDate(new Date()) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'coconut_stock'), {
        ...formData,
        status: 'received',
        createdBy: user.uid
      });
      setIsAdding(false);
      setFormData({ quantity: 0, source: '', receivedDate: formatDate(new Date()) });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'coconut_stock');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Stock Management</h2>
          <p className="text-gray-500">Track and manage incoming coconut shipments.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isAdding ? <ChevronRight className="w-5 h-5 rotate-90" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'Cancel' : 'Add Stock'}
        </button>
      </header>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source / Supplier</label>
            <input 
              required
              type="text" 
              value={formData.source}
              onChange={e => setFormData({...formData, source: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Green Farm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input 
              required
              type="number" 
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
              Save Shipment
            </button>
          </div>
        </motion.form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Source</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stocks.map(stock => (
              <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{stock.source}</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">{stock.quantity}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{displayDate(stock.receivedDate)}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    stock.status === 'received' ? 'bg-blue-100 text-blue-700' :
                    stock.status === 'peeling' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {stock.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function PeelingManager({ processes, stocks, user }: { processes: PeelingProcess[], stocks: CoconutStock[], user: User, key?: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ stockId: '', peelerName: '', quantity: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create peeling process
      await addDoc(collection(db, 'peeling_processes'), {
        ...formData,
        startDate: formatDate(new Date()),
        createdBy: user.uid
      });
      
      // Update stock status
      const stockRef = doc(db, 'coconut_stock', formData.stockId);
      await updateDoc(stockRef, { status: 'peeling' });

      setIsAdding(false);
      setFormData({ stockId: '', peelerName: '', quantity: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'peeling_processes');
    }
  };

  const handleComplete = async (process: PeelingProcess, weightAfter: number, huskQuantity: number) => {
    try {
      const processRef = doc(db, 'peeling_processes', process.id);
      await updateDoc(processRef, {
        endDate: formatDate(new Date()),
        weightAfter,
        huskQuantity
      });

      // Check if all coconuts from this stock are done (simplified: just mark stock completed)
      const stockRef = doc(db, 'coconut_stock', process.stockId);
      await updateDoc(stockRef, { status: 'completed' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'peeling_processes');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Peeling Process</h2>
          <p className="text-gray-500">Manage and monitor the coconut peeling workflow.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isAdding ? <ChevronRight className="w-5 h-5 rotate-90" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'Cancel' : 'Start Peeling'}
        </button>
      </header>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Stock</label>
            <select 
              required
              value={formData.stockId}
              onChange={e => setFormData({...formData, stockId: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Choose stock...</option>
              {stocks.filter(s => s.status === 'received').map(s => (
                <option key={s.id} value={s.id}>{s.source} ({s.quantity} units)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peeler Name</label>
            <input 
              required
              type="text" 
              value={formData.peelerName}
              onChange={e => setFormData({...formData, peelerName: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input 
              required
              type="number" 
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
              Start
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processes.map(process => (
          <div key={process.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            {!process.endDate && (
              <div className="absolute top-0 right-0 p-2">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${process.endDate ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {process.endDate ? <CheckCircle2 className="w-6 h-6" /> : <Scissors className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{process.peelerName}</h4>
                <p className="text-xs text-gray-500">{displayDate(process.startDate)}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-bold text-gray-900">{process.quantity} units</span>
              </div>
              {process.weightAfter && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">DC Weight:</span>
                  <span className="font-bold text-emerald-600">{process.weightAfter} kg</span>
                </div>
              )}
              {process.huskQuantity && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Husks:</span>
                  <span className="font-bold text-amber-600">{process.huskQuantity} units</span>
                </div>
              )}
            </div>

            {!process.endDate ? (
              <button 
                onClick={() => {
                  const weight = prompt("Enter DC Weight (kg):");
                  const husks = prompt("Enter Husk Quantity:");
                  if (weight && husks) handleComplete(process, parseFloat(weight), parseInt(husks));
                }}
                className="w-full py-2 bg-emerald-50 text-emerald-600 font-bold rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Complete Process
              </button>
            ) : (
              <div className="text-center py-2 bg-gray-50 text-gray-500 text-xs font-bold rounded-lg uppercase tracking-wider">
                Finished on {displayDate(process.endDate).split(',')[0]}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SalesManager({ sales, title, collectionName, user }: { sales: Sale[], title: string, collectionName: string, user: User, key?: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ quantity: 0, price: 0, customerName: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, collectionName), {
        ...formData,
        date: formatDate(new Date()),
        createdBy: user.uid
      });
      setIsAdding(false);
      setFormData({ quantity: 0, price: 0, customerName: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500">Record and track your business revenue.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isAdding ? <ChevronRight className="w-5 h-5 rotate-90" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'Cancel' : 'New Sale'}
        </button>
      </header>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input 
              required
              type="text" 
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input 
              required
              type="number" 
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit</label>
            <input 
              required
              type="number" 
              step="0.01"
              value={formData.price}
              onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
              Record Sale
            </button>
          </div>
        </motion.form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{sale.customerName}</td>
                <td className="px-6 py-4 text-gray-600">{sale.quantity} units</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">${(sale.quantity * sale.price).toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{displayDate(sale.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
