import { useState } from 'react';
import { BookOpen, TrendingUp, Layers, Shield, DollarSign, AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Calculator } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  icon: typeof BookOpen;
  category: 'basics' | 'spot' | 'futures' | 'risk';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  summary: string;
  sections: { heading: string; content: string; keyPoints?: string[] }[];
}

const LESSONS: Lesson[] = [
  {
    id: 'what-is-crypto',
    title: 'What is Cryptocurrency?',
    icon: BookOpen,
    category: 'basics',
    difficulty: 'Beginner',
    duration: '5 min',
    summary: 'Understand the fundamentals of cryptocurrency and blockchain technology.',
    sections: [
      {
        heading: 'The Basics',
        content: 'A cryptocurrency is a digital or virtual currency secured by cryptography, making it nearly impossible to counterfeit. Most cryptocurrencies are decentralized networks based on blockchain technology — a distributed ledger enforced by a network of computers.',
        keyPoints: [
          'Decentralized — no central authority like a bank controls it',
          'Built on blockchain — a public ledger of all transactions',
          'Secured by cryptography — preventing fraud and double-spending',
          'Bitcoin (BTC) was the first cryptocurrency, launched in 2009',
        ],
      },
      {
        heading: 'How Blockchain Works',
        content: 'A blockchain is a chain of blocks, each containing a list of transactions. When a new transaction occurs, it is broadcast to a network of computers (nodes) that validate it. Once verified, the transaction is grouped with others into a block, which is then added to the chain. This makes the transaction permanent and transparent.',
      },
      {
        heading: 'Why People Trade Crypto',
        content: 'People trade cryptocurrencies for various reasons: potential investment gains, belief in the technology, hedging against inflation, or simply curiosity. The crypto market is known for its high volatility, which creates both opportunities and risks for traders.',
      },
    ],
  },
  {
    id: 'spot-trading',
    title: 'Understanding Spot Trading',
    icon: TrendingUp,
    category: 'spot',
    difficulty: 'Beginner',
    duration: '6 min',
    summary: 'Learn how buying and selling crypto on the spot market works.',
    sections: [
      {
        heading: 'What is Spot Trading?',
        content: 'Spot trading is the simplest form of crypto trading. You buy a cryptocurrency at the current market price and own it outright. Later, you can sell it — hopefully at a higher price. The difference between your buy and sell price is your profit or loss.',
        keyPoints: [
          'You actually own the crypto you buy',
          'You can only profit when the price goes up',
          'No leverage or borrowed funds involved',
          'Lower risk compared to futures trading',
        ],
      },
      {
        heading: 'Market Orders vs Limit Orders',
        content: 'A market order executes immediately at the current best available price. A limit order lets you set a specific price — your order only executes if the market reaches that price. Market orders are simple but you have no control over the exact price. Limit orders give you price control but may never execute if the market doesn\'t reach your target.',
      },
      {
        heading: 'Calculating Profit & Loss',
        content: 'If you buy 0.5 BTC at $60,000 and sell at $65,000, your profit is ($65,000 - $60,000) x 0.5 = $2,500. If the price drops to $55,000 and you sell, your loss is ($60,000 - $55,000) x 0.5 = $2,500. Always factor in that you only realize a profit or loss when you actually sell — until then, it\'s just "unrealized" PnL.',
      },
    ],
  },
  {
    id: 'futures-trading',
    title: 'Introduction to Futures',
    icon: Layers,
    category: 'futures',
    difficulty: 'Intermediate',
    duration: '8 min',
    summary: 'Understand leverage, margin, long/short positions, and liquidation.',
    sections: [
      {
        heading: 'What are Futures?',
        content: 'Futures are contracts that let you speculate on the price direction of an asset without owning it. Unlike spot trading, futures allow you to profit from both rising AND falling prices. You can also use leverage to multiply your position size.',
        keyPoints: [
          'Go long to profit from price increases',
          'Go short to profit from price decreases',
          'Use leverage to amplify your position',
          'You don\'t own the underlying asset',
        ],
      },
      {
        heading: 'Leverage Explained',
        content: 'Leverage lets you control a larger position with a smaller amount of money (margin). For example, with 10x leverage and $1,000 margin, you control a $10,000 position. A 1% price move in your favor results in a 10% gain on your margin. But a 1% move against you means a 10% loss. Leverage amplifies both gains AND losses.',
      },
      {
        heading: 'Margin and Liquidation',
        content: 'Margin is the collateral you deposit to open a leveraged position. If the price moves against you and your losses approach your margin amount, your position gets "liquidated" — automatically closed by the exchange. You lose your margin. The liquidation price depends on your leverage: higher leverage means the price needs to move less against you before liquidation.',
      },
      {
        heading: 'Example: Long vs Short',
        content: 'Say BTC is at $60,000. You open a $1,000 margin long position at 10x leverage. Your position size is $10,000 (0.1667 BTC). If BTC rises to $66,000 (+10%), your profit is $1,000 — a 100% return on margin. If BTC drops to $54,000 (-10%), you lose your entire $1,000 margin. A short position works in reverse: you profit when the price falls.',
      },
    ],
  },
  {
    id: 'risk-management',
    title: 'Risk Management Essentials',
    icon: Shield,
    category: 'risk',
    difficulty: 'Beginner',
    duration: '7 min',
    summary: 'The most important lesson: how to protect your capital and manage risk.',
    sections: [
      {
        heading: 'Why Risk Management Matters',
        content: 'The #1 reason new traders lose money is poor risk management, not bad analysis. Even the best traders are wrong frequently. The key is ensuring that when you\'re wrong, you lose a small, manageable amount — not your entire account.',
        keyPoints: [
          'Never risk more than you can afford to lose',
          'Diversify — don\'t put everything in one coin',
          'Use stop-loss orders to limit downside',
          'Start with small positions while learning',
        ],
      },
      {
        heading: 'Position Sizing',
        content: 'A common rule is to risk no more than 1-2% of your total capital on any single trade. If you have $100,000 in demo credits, that means risking at most $1,000-$2,000 per trade. This way, even a string of losses won\'t wipe out your account. In futures, be especially careful — high leverage can make a small position very risky.',
      },
      {
        heading: 'Stop-Loss and Take-Profit',
        content: 'A stop-loss is an order to sell/close your position when the price reaches a certain level, limiting your loss. A take-profit does the same for locking in gains. Even though CryptoSim EDU doesn\'t enforce stop-losses, practicing with mental stop-losses — deciding in advance at what price you\'ll exit — is a critical habit to develop.',
      },
      {
        heading: 'Emotional Discipline',
        content: 'Fear and greed are a trader\'s worst enemies. FOMO (Fear Of Missing Out) drives people to buy at the top. Panic selling drives people to sell at the bottom. Having a plan before you enter a trade — and sticking to it — is what separates successful traders from gamblers.',
      },
    ],
  },
  {
    id: 'market-analysis',
    title: 'Reading Market Data',
    icon: DollarSign,
    category: 'basics',
    difficulty: 'Intermediate',
    duration: '6 min',
    summary: 'Learn to interpret price charts, volume, and market cap.',
    sections: [
      {
        heading: 'Price Charts',
        content: 'Price charts visualize the historical movement of an asset\'s price. The sparkline charts in CryptoSim EDU show the 7-day price trend. An upward-sloping chart indicates the price has been rising; a downward slope means it\'s been falling. The key insight is that past performance doesn\'t guarantee future results — charts help you understand context, not predict the future.',
      },
      {
        heading: 'Volume and Market Cap',
        content: 'Volume measures how much of the asset has been traded in a given period. High volume suggests strong interest and can confirm price moves. Market cap (price x circulating supply) measures the total value of all coins in circulation. Larger market cap coins (like Bitcoin) tend to be less volatile than smaller ones.',
        keyPoints: [
          'High volume = more market participants and liquidity',
          'Market cap helps compare the relative size of coins',
          '24h change shows recent momentum, not long-term trend',
        ],
      },
      {
        heading: 'Understanding Volatility',
        content: 'Volatility measures how much prices fluctuate. Crypto is famously volatile — 10-20% swings in a single day are common. High volatility means high risk but also high opportunity. As a beginner, it\'s wise to start with less volatile assets (larger market cap coins) before exploring smaller, more volatile ones.',
      },
    ],
  },
  {
    id: 'common-mistakes',
    title: 'Common Beginner Mistakes',
    icon: AlertTriangle,
    category: 'risk',
    difficulty: 'Beginner',
    duration: '5 min',
    summary: 'Avoid the pitfalls that catch most new traders.',
    sections: [
      {
        heading: 'Top 5 Mistakes',
        content: 'Learn from the mistakes others have made so you don\'t have to make them yourself.',
        keyPoints: [
          '1. Chasing pumps — buying after a coin already surged',
          '2. Over-leveraging — using high leverage without understanding the risk',
          '3. No plan — entering trades without an exit strategy',
          '4. Revenge trading — trying to win back losses with bigger, riskier trades',
          '5. Ignoring fees — in real trading, fees eat into profits over time',
        ],
      },
      {
        heading: 'The Right Mindset',
        content: 'Trading is a skill that takes time to develop. Treat your demo credits as if they were real money — that way you\'ll build good habits. Focus on learning and improving your process, not on making money. If you make good decisions consistently, the results will follow. And remember: no one wins every trade. The goal is to win more than you lose over time.',
      },
    ],
  },
];

const CATEGORIES = [
  { id: 'all' as const, label: 'All Lessons', icon: BookOpen },
  { id: 'basics' as const, label: 'Basics', icon: Lightbulb },
  { id: 'spot' as const, label: 'Spot Trading', icon: TrendingUp },
  { id: 'futures' as const, label: 'Futures', icon: Layers },
  { id: 'risk' as const, label: 'Risk Management', icon: Shield },
];

export function LearnSection() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basics' | 'spot' | 'futures' | 'risk'>('all');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const filteredLessons = selectedCategory === 'all'
    ? LESSONS
    : LESSONS.filter((l) => l.category === selectedCategory);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Hero */}
      <div className="card overflow-hidden p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Learning Center</h1>
            </div>
            <p className="text-sm text-slate-400">
              Start with the basics and work your way up. Each lesson takes 5-8 minutes and builds on the previous one.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{LESSONS.length}</p>
              <p className="text-xs text-slate-500">Lessons</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{LESSONS.reduce((s, l) => s + parseInt(l.duration), 0)}</p>
              <p className="text-xs text-slate-500">Min Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
                  : 'border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {filteredLessons.map((lesson) => {
          const Icon = lesson.icon;
          const isExpanded = expandedLesson === lesson.id;

          return (
            <div key={lesson.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-800/30"
              >
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                  lesson.category === 'futures' ? 'bg-amber-500/10 ring-1 ring-amber-500/20' :
                  lesson.category === 'risk' ? 'bg-rose-500/10 ring-1 ring-rose-500/20' :
                  lesson.category === 'spot' ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' :
                  'bg-blue-500/10 ring-1 ring-blue-500/20'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    lesson.category === 'futures' ? 'text-amber-400' :
                    lesson.category === 'risk' ? 'text-rose-400' :
                    lesson.category === 'spot' ? 'text-emerald-400' :
                    'text-blue-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{lesson.title}</h3>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      lesson.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                      lesson.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {lesson.difficulty}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{lesson.summary}</p>
                  <p className="mt-1 text-xs text-slate-600">{lesson.duration} read</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 flex-shrink-0 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-500" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4 sm:p-6 animate-fade-in">
                  <div className="space-y-5">
                    {lesson.sections.map((section, i) => (
                      <div key={i}>
                        <h4 className="mb-2 text-sm font-semibold text-white">{section.heading}</h4>
                        <p className="text-sm leading-relaxed text-slate-300">{section.content}</p>
                        {section.keyPoints && (
                          <ul className="mt-3 space-y-1.5">
                            {section.keyPoints.map((point, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {lesson.id === 'futures-trading' && <PnLCalculator />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        <p className="text-xs text-slate-400">
          CryptoSim EDU is an educational tool only. All credits are fictitious and no real money is involved.
          The information in these lessons is for educational purposes and should not be considered financial advice.
          Real cryptocurrency trading involves significant risk of loss. Always do your own research and consult
          a licensed financial advisor before investing real money.
        </p>
      </div>
    </div>
  );
}

function PnLCalculator() {
  const [margin, setMargin] = useState('1000');
  const [leverage, setLeverage] = useState('10');
  const [priceChange, setPriceChange] = useState('5');

  const m = parseFloat(margin) || 0;
  const lev = parseInt(leverage) || 1;
  const change = parseFloat(priceChange) || 0;

  const positionSize = m * lev;
  const pnl = positionSize * (change / 100);
  const pnlPct = (pnl / m) * 100;

  return (
    <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
        <Calculator className="h-4 w-4" /> Interactive PnL Calculator
      </h4>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label-text mb-1 block">Margin ($)</label>
          <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="label-text mb-1 block">Leverage</label>
          <input type="number" value={leverage} onChange={(e) => setLeverage(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="label-text mb-1 block">Price Change (%)</label>
          <input type="number" value={priceChange} onChange={(e) => setPriceChange(e.target.value)} className="input-field text-sm" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <p className="label-text mb-1">Position Size</p>
          <p className="text-sm font-bold text-white">${positionSize.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <p className="label-text mb-1">PnL ($)</p>
          <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <p className="label-text mb-1">ROI (%)</p>
          <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <p className="label-text mb-1">Liquidation at</p>
          <p className="text-sm font-bold text-rose-400">-{(100 / lev).toFixed(1)}%</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Try it: With $1,000 margin at 10x leverage, a 5% price move in your favor earns you $500 (50% ROI).
        But a 10% move against you liquidates your entire $1,000 margin.
      </p>
    </div>
  );
}
