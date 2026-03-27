"use client";

import React, { useState, useEffect } from "react";
import { getDashboardAnalytics, getUserSignups } from "@/app/admin/dashboard/actions";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    ArrowUpRight,
    ArrowDownRight,
    Users,
    MousePointerClick,
    Search,
    Eye,
    UserPlus,
    ShieldCheck,
} from "lucide-react";



const KPICard = ({ title, value, trend, trendValue, icon: Icon }: any) => {
    const isPositive = trend === "up";
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className="p-2 bg-gray-50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
                <div className="flex items-center gap-2">
                    <div
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-rose-700 bg-rose-50"
                            }`}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                        ) : (
                            <ArrowDownRight className="w-3 h-3" />
                        )}
                        {trendValue}%
                    </div>
                    <span className="text-xs text-gray-400">vs prev period</span>
                </div>
            </div>
        </div>
    );
};

export function AnalyticsDashboard() {
    const [dateRange, setDateRange] = useState("30D");
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        let days = 30;
        if (dateRange === "7D") days = 7;
        if (dateRange === "90D") days = 90;

        setIsLoading(true);
        Promise.all([
            getDashboardAnalytics(days),
            getUserSignups(days),
        ]).then(([analytics, users]) => {
            setData(analytics);
            setUserData(users);
            setIsLoading(false);
        });
    }, [dateRange]);

    if (isLoading || !data) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6 flex flex-col items-center justify-center font-sans">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Crunching the numbers...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Discover GroomLocal — Real-time insights
                    </p>
                </div>

                {/* Date Toggles */}
                <div className="flex items-center bg-gray-100/80 rounded-lg p-1 border border-gray-200/50">
                    {["7D", "30D", "90D"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${dateRange === range
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto pb-[1px]">
                {["Overview", "Lead Actions", "Search Intel", "Listings", "Journeys"].map(
                    (tab, i) => (
                        <button
                            key={tab}
                            className={`px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${i === 0
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            {tab}
                        </button>
                    )
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
                <KPICard
                    title="Total Sessions"
                    value={data.kpis.sessions.value}
                    trend={data.kpis.sessions.trend}
                    trendValue={data.kpis.sessions.trendValue}
                    icon={Users}
                />
                <KPICard
                    title="Lead Actions"
                    value={data.kpis.leadActions.value}
                    trend={data.kpis.leadActions.trend}
                    trendValue={data.kpis.leadActions.trendValue}
                    icon={MousePointerClick}
                />
                <KPICard
                    title="Searches"
                    value={data.kpis.searches.value}
                    trend={data.kpis.searches.trend}
                    trendValue={data.kpis.searches.trendValue}
                    icon={Search}
                />
                <KPICard
                    title="Impressions"
                    value={data.kpis.impressions.value}
                    trend={data.kpis.impressions.trend}
                    trendValue={data.kpis.impressions.trendValue}
                    icon={Eye}
                />
                {userData && (
                    <>
                        <KPICard
                            title="User Signups"
                            value={userData.total.toString()}
                            trend={userData.trend}
                            trendValue={userData.trendValue}
                            icon={UserPlus}
                        />
                        <KPICard
                            title="Claimed Listings"
                            value={userData.claimedCount.toString()}
                            trend="up"
                            trendValue="0"
                            icon={ShieldCheck}
                        />
                    </>
                )}
            </div>

            {/* Grid Layout row 2: Main Chart + Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Left Col (2/3): Area Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Lead actions over time
                        </h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data.trendData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDir" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCall" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="website"
                                    stackId="1"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    fill="url(#colorWeb)"
                                    name="Website clicks"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="directions"
                                    stackId="1"
                                    stroke="#14B8A6"
                                    strokeWidth={2}
                                    fill="url(#colorDir)"
                                    name="Directions"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="calls"
                                    stackId="1"
                                    stroke="#F59E0B"
                                    strokeWidth={2}
                                    fill="url(#colorCall)"
                                    name="Phone calls"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Col (1/3): Breakdown Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        Action breakdown
                    </h2>
                    <div className="space-y-6">
                        {data.breakdownData.map((item: any, i: number) => {
                            const maxVal = data.breakdownData.reduce((acc: number, cur: any) => acc + cur.value, 0);
                            const percent = maxVal === 0 ? 0 : Math.round((item.value / maxVal) * 100);

                            return (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {item.value.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Grid Layout row 3: Radial + Specifics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Action Rate Radial */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <h2 className="text-lg font-semibold text-gray-900 self-start mb-2">
                        Search intelligence
                    </h2>
                    <p className="text-sm text-gray-500 self-start mb-6">
                        Search-to-action conversion rate
                    </p>
                    <div className="relative h-[200px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.searchRateData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={10}
                                >
                                    {data.searchRateData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-bold text-gray-900">{data.searchRateData[0]?.value || 0}%</span>
                            <span className="text-sm text-gray-500">Conv. Rate</span>
                        </div>
                    </div>
                </div>

                {/* Top Searches Component */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        Top performing searches
                    </h2>
                    <div className="flex flex-col justify-center h-[200px] gap-4">
                        {data.topSearches.length > 0 ? data.topSearches.map((search: any, i: number) => {
                            const maxVol = data.topSearches[0].volume;
                            const width = Math.max(10, Math.round((search.volume / maxVol) * 100));
                            return (
                                <div key={i} className="flex flex-col gap-1 z-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700 font-medium">{search.term}</span>
                                        <span className="text-gray-500">{search.volume.toLocaleString()} searches</span>
                                    </div>
                                    <div className="w-full bg-transparent h-6 relative flex items-center">
                                        <div
                                            className="absolute left-0 h-full bg-blue-50 rounded bg-opacity-80"
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Search className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-sm">No search data available yet</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Signups Table */}
            {userData && userData.recentSignups.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Recent signups</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {userData.current} new in this period, {userData.total} total
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">Signed up</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">Last sign-in</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">Claimed listing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userData.recentSignups.map((user: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-3 px-4 font-medium text-gray-900">{user.email}</td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {user.lastSignIn
                                                ? new Date(user.lastSignIn).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : <span className="text-gray-400">Never</span>
                                            }
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.claimedListing ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    {user.claimedListing}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">None</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
