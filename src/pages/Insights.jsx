
import React, { useState, useEffect } from "react";
import { Thought } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { BarChart3, TrendingUp, Brain, Calendar, Smile, Frown, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import PageTransition from "../components/PageTransition";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Insights() {
  const [thoughts, setThoughts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadAllThoughts();
  }, []);

  const loadAllThoughts = async () => {
    setIsLoading(true);
    const allThoughts = await Thought.list("-created_date");
    setThoughts(allThoughts);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const refreshData = async () => {
    await loadAllThoughts();
  };

  // Category Analysis
  const getCategoryData = () => {
    const categories = {};
    thoughts.forEach(thought => {
      categories[thought.category] = (categories[thought.category] || 0) + 1;
    });
    return Object.entries(categories).map(([category, count]) => ({
      name: category,
      value: count,
      percentage: ((count / thoughts.length) * 100).toFixed(1)
    }));
  };

  // Mood Analysis
  const getMoodData = () => {
    if (thoughts.length === 0) return [];
    
    const positive = thoughts.filter(t => (t.mood_score || 0) > 0.2).length;
    const neutral = thoughts.filter(t => {
      const score = t.mood_score || 0;
      return score >= -0.2 && score <= 0.2;
    }).length;
    const negative = thoughts.filter(t => (t.mood_score || 0) < -0.2).length;
    
    return [
      { name: "Positive", value: positive, color: "#10b981" },
      { name: "Neutral", value: neutral, color: "#6b7280" },
      { name: "Negative", value: negative, color: "#ef4444" }
    ];
  };

  // Priority Distribution
  const getPriorityData = () => {
    const priorities = { high: 0, medium: 0, low: 0 };
    thoughts.forEach(thought => {
      priorities[thought.priority] = (priorities[thought.priority] || 0) + 1;
    });
    return Object.entries(priorities).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  };

  // Status Distribution
  const getStatusData = () => {
    const statuses = { pending: 0, memory_banked: 0, actioned: 0 };
    thoughts.forEach(thought => {
      statuses[thought.status] = (statuses[thought.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count
    }));
  };

  // Daily Activity
  const getDailyActivity = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayThoughts = thoughts.filter(thought => 
        startOfDay(new Date(thought.created_date)).getTime() === date.getTime()
      );
      
      last7Days.push({
        date: format(date, 'MMM d'),
        thoughts: dayThoughts.length,
        avgMood: dayThoughts.length > 0 
          ? dayThoughts.reduce((sum, t) => sum + t.mood_score, 0) / dayThoughts.length 
          : 0
      });
    }
    return last7Days;
  };

  // Average mood score
  const getAverageMood = () => {
    if (thoughts.length === 0) return 0;
    const validMoodScores = thoughts.filter(t => typeof t.mood_score === 'number');
    if (validMoodScores.length === 0) return 0;
    return validMoodScores.reduce((sum, thought) => sum + thought.mood_score, 0) / validMoodScores.length;
  };

  // Most common tags
  const getTopTags = () => {
    const tagCounts = {};
    thoughts.forEach(thought => {
      thought.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#6b7280'];

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Analyzing your thoughts..." />
        </div>
      </PageTransition>
    );
  }

  const categoryData = getCategoryData();
  const moodData = getMoodData();
  const priorityData = getPriorityData();
  const statusData = getStatusData();
  const dailyData = getDailyActivity();
  const averageMood = getAverageMood();
  const topTags = getTopTags();

  return (
    <PageTransition>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              OMI
            </h1>
            <p className="text-gray-600 text-sm">
              Analyzing {thoughts.length} thoughts from your brain
            </p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={refreshData}
            className="ml-4 border-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Last updated: {format(lastUpdated, "MMM d, h:mm a")}
          </p>
        </div>

        {thoughts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No insights yet</h2>
            <p className="text-gray-600">Record some thoughts to see your mind's patterns.</p>
          </div>
        ) : (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-500 text-white border-0">
                <CardContent className="p-4 text-center">
                  <Brain className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{thoughts.length}</p>
                  <p className="text-xs opacity-90">Total Thoughts</p>
                </CardContent>
              </Card>

              <Card className="bg-green-500 text-white border-0">
                <CardContent className="p-4 text-center">
                  {averageMood > 0 ? <Smile className="w-8 h-8 mx-auto mb-2" /> : <Frown className="w-8 h-8 mx-auto mb-2" />}
                  <p className="text-2xl font-bold">{(averageMood * 100).toFixed(0)}%</p>
                  <p className="text-xs opacity-90">Avg Mood</p>
                </CardContent>
              </Card>

              <Card className="bg-cyan-500 text-white border-0">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{Math.round(thoughts.length / 7)}</p>
                  <p className="text-xs opacity-90">Avg/Day</p>
                </CardContent>
              </Card>

              <Card className="bg-orange-500 text-white border-0">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{thoughts.filter(t => t.status === 'actioned').length}</p>
                  <p className="text-xs opacity-90">Actions Taken</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Thought Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {categoryData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-xs text-gray-600">{item.name} ({item.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mood Distribution */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Mood Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={moodData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6">
                        {moodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Daily Activity & Mood Trend */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">7-Day Activity & Mood</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" stroke="#3b82f6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[-1, 1]} />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="thoughts" name="Thoughts" stroke="#3b82f6" strokeWidth={3} />
                      <Line yAxisId="right" type="monotone" dataKey="avgMood" name="Avg Mood" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Processing Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Tags */}
            {topTags.length > 0 && (
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Most Common Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {topTags.map((item, index) => (
                      <Badge 
                        key={item.tag}
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200"
                      >
                        #{item.tag} ({item.count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
