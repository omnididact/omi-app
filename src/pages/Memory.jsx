
import React, { useState, useEffect } from "react";
import { Thought } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Hash, MoreVertical, Trash2, Edit3, Filter, SortAsc, Smile, Frown, Meh, Archive, RefreshCcw, CheckSquare, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageTransition from "../components/PageTransition";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Memory() {
  const [allThoughts, setAllThoughts] = useState([]);
  const [filteredThoughts, setFilteredThoughts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [moodFilter, setMoodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [deleteThought, setDeleteThought] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedThoughts, setSelectedThoughts] = new useState(new Set());

  useEffect(() => {
    loadAllThoughts();
  }, []);

  useEffect(() => {
    filterAndSortThoughts();
  }, [allThoughts, searchTerm, selectedCategory, moodFilter, dateFilter, sortBy]);

  const loadAllThoughts = async () => {
    setIsLoading(true);
    // Load all thoughts that are archived (memory_banked)
    const thoughts = await Thought.filter({ status: "memory_banked" }, "-created_date");
    setAllThoughts(thoughts);
    setSelectedThoughts(new Set()); // Clear selection when thoughts are reloaded
    setIsLoading(false);
  };

  const handleDeleteThought = async (thought) => {
    try {
      await Thought.delete(thought.id);
      setAllThoughts(prev => prev.filter(t => t.id !== thought.id));
      setDeleteThought(null);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Entity already deleted, just update the UI
        console.warn(`Thought with ID ${thought.id} already deleted`);
        setAllThoughts(prev => prev.filter(t => t.id !== thought.id));
        setDeleteThought(null);
      } else {
        console.error("Error deleting thought:", error);
        alert("Error deleting thought. Please try again.");
      }
    }
  };

  const handleMoveToAction = async (thought) => {
    try {
      await Thought.update(thought.id, { 
        status: "actioned",
        task_status: "not_started"
      });
      setAllThoughts(prev => prev.filter(t => t.id !== thought.id));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Entity already deleted/moved, just update the UI
        console.warn(`Thought with ID ${thought.id} already moved or deleted`);
        setAllThoughts(prev => prev.filter(t => t.id !== thought.id));
      } else {
        console.error("Error moving thought:", error);
        alert("Error moving thought. Please try again.");
      }
    }
  };

  const toggleThoughtSelection = (thoughtId) => {
    const newSelected = new Set(selectedThoughts);
    if (newSelected.has(thoughtId)) {
      newSelected.delete(thoughtId);
    } else {
      newSelected.add(thoughtId);
    }
    setSelectedThoughts(newSelected);
  };

  const selectAllThoughts = () => {
    if (selectedThoughts.size === filteredThoughts.length && filteredThoughts.length > 0) {
      setSelectedThoughts(new Set());
    } else {
      setSelectedThoughts(new Set(filteredThoughts.map(t => t.id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedThoughts.size === 0) return;
    
    try {
      const selectedIdsArray = Array.from(selectedThoughts);
      for (const thoughtId of selectedIdsArray) {
        try {
          await Thought.delete(thoughtId);
        } catch (e) {
          // If entity is not found, it might have been already deleted.
          // We can ignore this specific error and continue with the bulk operation.
          if (e.response && e.response.status === 404) {
            console.warn(`Thought with ID ${thoughtId} not found for deletion, likely already deleted.`);
          } else {
            // For any other error, we should stop and report it.
            throw e;
          }
        }
      }
      setAllThoughts(prev => prev.filter(t => !selectedThoughts.has(t.id)));
      setSelectedThoughts(new Set());
      setBulkMode(false); // Exit bulk mode after action
    } catch (error) {
      console.error("Error bulk deleting:", error);
      alert("Error deleting thoughts. Please try again.");
    }
  };

  const bulkMoveToAction = async () => {
    if (selectedThoughts.size === 0) return;
    
    try {
      const selectedIdsArray = Array.from(selectedThoughts);
      for (const thoughtId of selectedIdsArray) {
        try {
          await Thought.update(thoughtId, { 
            status: "actioned",
            task_status: "not_started"
          });
        } catch (e) {
          // If entity is not found, it might have been already deleted/moved.
          // We can ignore this specific error and continue with the bulk operation.
          if (e.response && e.response.status === 404) {
            console.warn(`Thought with ID ${thoughtId} not found for moving, likely already deleted or moved.`);
          } else {
            // For any other error, we should stop and report it.
            throw e;
          }
        }
      }
      setAllThoughts(prev => prev.filter(t => !selectedThoughts.has(t.id)));
      setSelectedThoughts(new Set());
      setBulkMode(false); // Exit bulk mode after action
    } catch (error) {
      console.error("Error bulk moving to action:", error);
      alert("Error moving thoughts. Please try again.");
    }
  };

  const filterAndSortThoughts = () => {
    let filtered = [...allThoughts];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(thought => thought.category === selectedCategory);
    }

    // Mood filter
    if (moodFilter !== "all") {
      if (moodFilter === "positive") {
        filtered = filtered.filter(thought => thought.mood_score > 0.2);
      } else if (moodFilter === "negative") {
        filtered = filtered.filter(thought => thought.mood_score < -0.2);
      } else if (moodFilter === "neutral") {
        filtered = filtered.filter(thought => thought.mood_score >= -0.2 && thought.mood_score <= 0.2);
      }
    }

    // Date filter
    if (dateFilter !== "all") {
      filtered = filtered.filter(thought => { // Moved thoughtDate declaration inside filter callback
        const thoughtDate = new Date(thought.created_date);
        if (dateFilter === "today") {
          return isToday(thoughtDate);
        } else if (dateFilter === "yesterday") {
          return isYesterday(thoughtDate);
        } else if (dateFilter === "week") {
          return isThisWeek(thoughtDate);
        } else if (dateFilter === "month") {
          return isThisMonth(thoughtDate);
        }
        return true; // Should not reach here if dateFilter is one of the defined values
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(thought => 
        thought.processed_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thought.transcription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thought.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === "mood") {
      filtered.sort((a, b) => b.mood_score - a.mood_score);
    } else if (sortBy === "category") {
      filtered.sort((a, b) => a.category.localeCompare(b.category));
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
    }

    setFilteredThoughts(filtered);
  };

  const getCategoryColor = (category) => {
    const colors = {
      reflection: "bg-purple-100 text-purple-700 border-purple-200",
      idea: "bg-yellow-100 text-yellow-700 border-yellow-200", 
      concern: "bg-red-100 text-red-700 border-red-200",
      goal: "bg-green-100 text-green-700 border-green-200",
      memory: "bg-blue-100 text-blue-700 border-blue-200",
      task: "bg-orange-100 text-orange-700 border-orange-200",
      emotion: "bg-pink-100 text-pink-700 border-pink-200",
      observation: "bg-gray-100 text-gray-700 border-gray-200"
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getUniqueCategories = () => {
    const categories = allThoughts.map(thought => thought.category);
    return [...new Set(categories)].filter(Boolean);
  };

  const getMoodEmoji = (score) => {
    if (score > 0.2) return "😊";
    if (score > -0.2) return "😐";
    return "😔";
  };

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    if (isThisMonth(date)) return format(date, "MMM d");
    return format(date, "MMM d, yyyy");
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading your thoughts..." />
        </div>
      </PageTransition>
    );
  }

  const categoryStats = getUniqueCategories().map(category => ({
    category,
    count: allThoughts.filter(t => t.category === category).length
  }));

  return (
    <PageTransition>
      <div className="p-4 space-y-6">
        {/* Enhanced Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Thoughts
            </h1>
            <Button 
              variant="outline" 
              size="icon"
              onClick={loadAllThoughts}
              className="ml-2 border-gray-200"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-600">{allThoughts.length} total thoughts</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{filteredThoughts.length} showing</span>
            {bulkMode && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-blue-500 font-medium">{selectedThoughts.size} selected</span>
              </>
            )}
          </div>
        </div>

        {allThoughts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Archive className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Your mind archive is empty</h2>
            <p className="text-gray-600">Start recording thoughts to build your personal knowledge base.</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-blue-500 text-white border-0">
                <CardContent className="p-3 text-center">
                  <Archive className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-lg font-bold">{allThoughts.length}</p>
                  <p className="text-xs opacity-90">Total</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500 text-white border-0">
                <CardContent className="p-3 text-center">
                  <Smile className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-lg font-bold">{allThoughts.filter(t => t.mood_score > 0.2).length}</p>
                  <p className="text-xs opacity-90">Positive</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-500 text-white border-0">
                <CardContent className="p-3 text-center">
                  <Hash className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-lg font-bold">{categoryStats.length}</p>
                  <p className="text-xs opacity-90">Categories</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500 text-white border-0">
                <CardContent className="p-3 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-lg font-bold">{allThoughts.filter(t => isToday(new Date(t.created_date))).length}</p>
                  <p className="text-xs opacity-90">Today</p>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search thoughts, tags, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-200"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-2">
                {/* Category Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200">
                      <Filter className="w-4 h-4 mr-1" />
                      Category: {selectedCategory === "all" ? "All" : selectedCategory}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                      All ({allThoughts.length})
                    </DropdownMenuItem>
                    {categoryStats.map(({ category, count }) => (
                      <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                        {category} ({count})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mood Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200">
                      {moodFilter === "positive" ? <Smile className="w-4 h-4 mr-1" /> : 
                       moodFilter === "negative" ? <Frown className="w-4 h-4 mr-1" /> :
                       moodFilter === "neutral" ? <Meh className="w-4 h-4 mr-1" /> :
                       "😊😐😔"}
                      Mood: {moodFilter === "all" ? "All" : moodFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Mood</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setMoodFilter("all")}>All Moods</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMoodFilter("positive")}>
                      <Smile className="w-4 h-4 mr-2" /> Positive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMoodFilter("neutral")}>
                      <Meh className="w-4 h-4 mr-2" /> Neutral
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMoodFilter("negative")}>
                      <Frown className="w-4 h-4 mr-2" /> Negative
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Date Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200">
                      <Calendar className="w-4 h-4 mr-1" />
                      {dateFilter === "all" ? "All Time" : dateFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDateFilter("all")}>All Time</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("today")}>Today</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("yesterday")}>Yesterday</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("week")}>This Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("month")}>This Month</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200">
                      <SortAsc className="w-4 h-4 mr-1" />
                      Sort: {sortBy}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("date")}>Most Recent</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("mood")}>Most Positive</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("category")}>Category</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("priority")}>Priority</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Mode Toggle */}
                <Button
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    setSelectedThoughts(new Set()); // Clear selection when toggling mode
                  }}
                  className={bulkMode ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-white border-gray-200"}
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Bulk Edit
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {bulkMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 overflow-hidden" // overflow-hidden to prevent height transition issues
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllThoughts}
                        className="text-blue-600 border-blue-200"
                      >
                        {selectedThoughts.size === filteredThoughts.length && filteredThoughts.length > 0 ? "Deselect All" : "Select All"}
                      </Button>
                      <span className="text-sm text-blue-700">
                        {selectedThoughts.size} of {filteredThoughts.length} selected
                      </span>
                    </div>
                  </div>
                  
                  {selectedThoughts.size > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={bulkMoveToAction}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Move to Actions
                      </Button>
                      <Button
                        size="sm"
                        onClick={bulkDelete}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="space-y-4">
              {filteredThoughts.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Search className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">No thoughts match your filters</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setMoodFilter("all");
                      setDateFilter("all");
                      setSelectedThoughts(new Set()); // Clear selection also when clearing filters
                      setBulkMode(false); // Exit bulk mode
                    }}
                    className="border-gray-200"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="wait">
                    {filteredThoughts.map((thought, index) => {
                      const isSelected = selectedThoughts.has(thought.id);
                      
                      return (
                        <motion.div
                          key={thought.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -300 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card className={`bg-white border-gray-200 hover:shadow-md transition-all duration-300 ${
                            isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                          }`}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Bulk Select Checkbox */}
                                    {bulkMode && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex-shrink-0"
                                      >
                                        <button
                                          onClick={() => toggleThoughtSelection(thought.id)}
                                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            isSelected 
                                              ? 'bg-blue-500 border-blue-500 text-white' 
                                              : 'border-gray-300 hover:border-blue-400'
                                          }`}
                                        >
                                          {isSelected && <Check className="w-3 h-3" />}
                                        </button>
                                      </motion.div>
                                    )}
                                    
                                    <Badge className={`${getCategoryColor(thought.category)} border text-xs`}>
                                      {thought.category}
                                    </Badge>
                                    {thought.sub_category && (
                                      <Badge variant="outline" className="text-xs border-gray-200">{thought.sub_category}</Badge>
                                    )}
                                    <span className="text-xl">{getMoodEmoji(thought.mood_score)}</span>
                                    {thought.priority === "high" && (
                                      <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                                        High Priority
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Calendar className="w-3 h-3" />
                                      {getDateLabel(thought.created_date)}
                                    </div>
                                    {!bulkMode && ( // Hide individual dropdown in bulk mode
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="w-8 h-8">
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuItem 
                                            onClick={() => handleMoveToAction(thought)}
                                            className="text-blue-600"
                                          >
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Move to Actions
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => setDeleteThought(thought)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>

                                {/* Content */}
                                <p className="text-gray-900 leading-relaxed font-medium">
                                  {thought.processed_text}
                                </p>

                                {/* Tags */}
                                {thought.tags && thought.tags.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Hash className="w-3 h-3 text-gray-400" />
                                    {thought.tags.map((tag, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setSearchTerm(tag)}
                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                                      >
                                        {tag}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Original transcription if different */}
                                {thought.transcription !== thought.processed_text && (
                                  <details className="group">
                                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                                      View original transcription
                                    </summary>
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <p className="text-sm text-gray-600 italic">
                                        "{thought.transcription}"
                                      </p>
                                    </div>
                                  </details>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteThought} onOpenChange={() => setDeleteThought(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Thought</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this thought? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleDeleteThought(deleteThought)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
