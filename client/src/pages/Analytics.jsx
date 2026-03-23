import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Users, Receipt, Bot, BarChart2 } from 'lucide-react'
import * as analyticsService from '../services/analyticsService'

const CATEGORY_COLORS = {
  food: '#6C63FF',
  travel: '#FF6584',
  utilities: '#FF8906',
  shopping: '#2CB67D',
  misc: '#A7A9BE',
  grocery: '#6C63FF',
  entertainment: '#FF6584',
  health: '#2CB67D',
  rent: '#FF8906',
}

const DARK_TOOLTIP = {
  contentStyle: {
    background: '#252436',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#FFFFFE'
  },
  labelStyle: { color: '#A7A9BE' },
  itemStyle: { color: '#FFFFFE' }
}

function StatCard({ icon: Icon, label, value, color, prefix = '₹' }) {
  return (
    <div className="glass card-hover" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color === 'gradient' ? 'linear-gradient(135deg,#6C63FF,#FF6584)' : color === 'green' ? 'rgba(44,182,125,0.15)' : color === 'red' ? 'rgba(255,101,132,0.15)' : 'rgba(108,99,255,0.15)',
        flexShrink: 0
      }}>
        <Icon size={22} color={color === 'gradient' ? 'white' : color === 'green' ? '#2CB67D' : color === 'red' ? '#FF6584' : '#6C63FF'} />
      </div>
      <div>
        <p style={{ fontSize: '13px', color: '#A7A9BE', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFE', fontFamily: "'Space Grotesk',sans-serif" }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value}
        </p>
      </div>
    </div>
  )
}

const CustomPieLegend = ({ data }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
    {data.map((item, i) => {
      const total = data.reduce((s, d) => s + d.total, 0)
      const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : 0
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[item.category] || '#A7A9BE' }} />
          <span style={{ fontSize: '12px', color: '#A7A9BE' }}>{item.category} — ₹{item.total.toFixed(0)} ({pct}%)</span>
        </div>
      )
    })}
  </div>
)

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsService.getOverview()
      .then(res => setOverview(res.data?.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#FF6584)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={24} color="white" />
          </div>
          <p style={{ color: '#A7A9BE' }}>Loading analytics...</p>
        </div>
      </div>
    )
  }

  const categoryData = (overview?.categoryBreakdown || []).map(c => ({
    ...c,
    fill: CATEGORY_COLORS[c.category] || '#A7A9BE'
  }))

  const topGroupsData = overview?.mostExpensiveGroup?.name !== 'N/A'
    ? [{ name: overview.mostExpensiveGroup.name, total: overview.mostExpensiveGroup.total }]
    : []

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '28px', color: '#FFFFFE' }}>Analytics</h1>
        <p style={{ color: '#A7A9BE', fontSize: '14px', marginTop: '4px' }}>Spending trends and insights</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
        <StatCard icon={Receipt} label="Total This Month" value={overview?.totalExpenses || 0} color="gradient" />
        <StatCard icon={TrendingUp} label="You Are Owed" value={overview?.totalOwed || 0} color="green" />
        <StatCard icon={TrendingDown} label="You Owe" value={overview?.totalOwing || 0} color="red" />
        <StatCard icon={Users} label="Total Groups" value={overview?.totalGroups || 0} color="purple" prefix="" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Monthly Spending Trend */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '20px', color: '#FFFFFE' }}>
            Monthly Spending Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={overview?.monthlyExpenses || []}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#A7A9BE', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A7A9BE', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip {...DARK_TOOLTIP} formatter={v => [`₹${v.toFixed(0)}`, 'Spending']} />
              <Area type="monotone" dataKey="total" stroke="#6C63FF" strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '20px', color: '#FFFFFE' }}>
            Category Breakdown
          </h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...DARK_TOOLTIP} formatter={v => [`₹${v.toFixed(0)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <CustomPieLegend data={categoryData} />
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#A7A9BE', padding: '40px 0' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📊</p>
              <p>No data this month yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Most Expensive Group */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '20px', color: '#FFFFFE' }}>
            Top Groups by Spending
          </h3>
          {topGroupsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topGroupsData} barCategoryGap="40%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C63FF" />
                    <stop offset="100%" stopColor="#FF6584" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#A7A9BE', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A7A9BE', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip {...DARK_TOOLTIP} formatter={v => [`₹${v.toFixed(0)}`, 'Total']} />
                <Bar dataKey="total" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#A7A9BE', padding: '40px 0' }}>
              <p>📭 No group expense data</p>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="glass card-hover" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(108,99,255,0.08),rgba(255,101,132,0.08))', border: '1px solid rgba(108,99,255,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div className="gradient-bg" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="white" />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', color: '#FFFFFE' }}>AI Insights</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {overview?.categoryBreakdown?.length > 0 && (
              <div className="glass" style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p style={{ color: '#FFFFFE', fontSize: '14px' }}>
                  🍕 You spend most on <strong style={{ color: '#6C63FF' }}>{overview.categoryBreakdown.sort((a, b) => b.total - a.total)[0]?.category}</strong> this month
                </p>
              </div>
            )}
            {overview?.mostExpensiveGroup?.name !== 'N/A' && (
              <div className="glass" style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p style={{ color: '#FFFFFE', fontSize: '14px' }}>
                  🏆 Biggest group expense is <strong style={{ color: '#FF6584' }}>{overview.mostExpensiveGroup.name}</strong>
                </p>
              </div>
            )}
            {overview?.totalOwed > 0 && (
              <div className="glass" style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p style={{ color: '#FFFFFE', fontSize: '14px' }}>
                  💰 You are owed <strong style={{ color: '#2CB67D' }}>₹{overview.totalOwed.toFixed(0)}</strong> across all groups
                </p>
              </div>
            )}
            {!overview?.categoryBreakdown?.length && !overview?.totalOwed && (
              <div style={{ textAlign: 'center', color: '#A7A9BE', padding: '20px 0' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</p>
                <p>Add expenses to see insights</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
