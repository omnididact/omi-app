
import React, { useState, useEffect } from "react";
import { Thought } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, Square, Clock, Flag, Trash2, MoreVertical, Edit3, Play, RotateCcw, Filter, SortAsc, Sparkles, Loader2, ChevronDown, ChevronUp, Pause, Check, Plus, ExternalLink, Search, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
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

// Interactive Insight Component with nested expansion
const InteractiveInsight = ({ insightKey, insightValue, thoughtId, onCreateTask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deeperInsight, setDeeperInsight] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDeeperInsight = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await InvokeLLM({
        prompt: `You are a world-class expert providing advice. A user wants to explore a specific point in more detail. Your response must be non-obvious, highly specific, and objective-oriented. Avoid generic advice.

        **Specific Insight to Deepen:** "${insightValue}"
        **Original Context:** ${insightKey}

        Provide concrete strategies, name potential tools, identify specific risks, and give actionable, measurable steps related to this specific insight.`,
        response_json_schema: {
          type: "object",
          properties: {
            detailed_explanation: {
              type: "string",
              description: "A comprehensive explanation of this specific insight"
            },
            specific_steps: {
              type: "array",
              items: { type: "string" },
              description: "3-5 specific, actionable steps related to this insight"
            },
            potential_challenges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  challenge: { type: "string" },
                  solution: { type: "string" }
                }
              }, // Fixed: Removed extra " and closed the object correctly
              description: "Potential challenges specific to this insight and solutions"
            },
            resources_or_tools: {
              type: "array",
              items: { type: "string" },
              description: "Specific tools, resources, or methods that would help with this insight"
            },
            pro_tip: {
              type: "string",
              description: "A professional tip or best practice related to this insight"
            }
          }
        }
      });
      setDeeperInsight(response);
    } catch (error) {
      console.error("Error generating deeper insight:", error);
      alert("Error generating deeper insight. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTask = (taskText) => {
    onCreateTask(taskText);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 mb-1 capitalize">
            {insightKey.replace(/_/g, ' ')}:
          </p>
          {Array.isArray(insightValue) ? (
            <ul className="text-sm text-gray-700 space-y-1">
              {insightValue.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                  <span className="break-words">{typeof item === 'object' ? `${item.challenge}: ${item.solution}` : item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-700 break-words">{insightValue}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateTask(Array.isArray(insightValue) ? insightValue.join(', ') : insightValue)}
            className="text-blue-600 hover:bg-blue-100 p-1"
            title="Turn into task"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!isExpanded) generateDeeperInsight();
              setIsExpanded(!isExpanded);
            }}
            className="text-blue-600 hover:bg-blue-100 p-1"
            title="Explore deeper"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-gray-200 overflow-hidden"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Exploring deeper...</span>
              </div>
            ) : deeperInsight ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Detailed Explanation:</p>
                  <p className="text-gray-700 break-words">{deeperInsight.detailed_explanation}</p>
                </div>

                {deeperInsight.specific_steps && (
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Specific Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                      {deeperInsight.specific_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0">{i + 1}.</span>
                          <span className="flex-1 break-words">{step}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateTask(step)}
                            className="text-blue-600 hover:bg-blue-100 p-1 ml-2 flex-shrink-0"
                            title="Turn into task"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {deeperInsight.potential_challenges && (
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Potential Challenges:</p>
                    <div className="space-y-2">
                      {deeperInsight.potential_challenges.map((item, i) => (
                        <div key={i} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="font-medium text-yellow-800 text-xs break-words">Challenge: {item.challenge}</p>
                          <p className="text-yellow-700 text-xs break-words">Solution: {item.solution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deeperInsight.resources_or_tools && (
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Resources & Tools:</p>
                    <ul className="space-y-1">
                      {deeperInsight.resources_or_tools.map((resource, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700">
                          <span className="text-green-500 flex-shrink-0">→</span>
                          <span className="text-xs break-words">{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {deeperInsight.pro_tip && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="font-medium text-blue-800 text-xs mb-1">💡 Pro Tip:</p>
                    <p className="text-blue-700 text-xs italic break-words">{deeperInsight.pro_tip}</p>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Todo() {
  const [allActionThoughts, setAllActionThoughts] = useState([]);
  const [displayedThoughts, setDisplayedThoughts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteThought, setDeleteThought] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtering & Sorting State - Default to priority sorting
  const [filterStatus, setFilterStatus] = useState("all_active");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("priority"); // Default to priority

  // UI State
  const [expandedThoughtId, setExpandedThoughtId] = useState(null);
  const [taskInsights, setTaskInsights] = useState({});
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(null);
  const [deeperStepInsights, setDeeperStepInsights] = useState({});

  // New State for Bulk Operations
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  useEffect(() => {
    loadActionThoughts();
  }, []);

  useEffect(() => {
    filterAndSortThoughts();
  }, [allActionThoughts, filterStatus, filterPriority, sortBy, searchTerm]);

  const loadActionThoughts = async () => {
    setIsLoading(true);
    const thoughts = await Thought.filter({ 
      status: "actioned", 
      task_status: { $ne: "completed" }
    }, "-created_date");
    setAllActionThoughts(thoughts);
    setSelectedTasks(new Set()); // Reset selected tasks on load
    setIsLoading(false);
  };
  
  const filterAndSortThoughts = () => {
    let filtered = [...allActionThoughts];

    // Status filter
    if (filterStatus !== "all_active") {
      filtered = filtered.filter(t => t.task_status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(thought => 
        thought.processed_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thought.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort - Default to HIGH priority first
    if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
    } else if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    
    setDisplayedThoughts(filtered);
  };

  const toggleTaskSelection = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const selectAllTasks = () => {
    if (selectedTasks.size === displayedThoughts.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(displayedThoughts.map(t => t.id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    
    try {
      for (const taskId of selectedTasks) {
        try {
          await Thought.delete(taskId);
        } catch (e) {
          // If entity is not found, it might have been already deleted.
          // We can ignore this specific error and continue with the bulk operation.
          if (e.response && e.response.status === 404) {
            console.warn(`Thought with ID ${taskId} not found for deletion, likely already deleted.`);
          } else {
            // For any other error, we should stop and report it.
            throw e;
          }
        }
      }
      setAllActionThoughts(prev => prev.filter(t => !selectedTasks.has(t.id)));
      setSelectedTasks(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error("Error during bulk delete operation:", error);
      alert("An error occurred while deleting tasks. Please try again.");
    }
  };

  const bulkChangeStatus = async (newStatus) => {
    if (selectedTasks.size === 0) return;
    
    try {
      for (const taskId of selectedTasks) {
        await Thought.update(taskId, { task_status: newStatus });
      }
      
      if (newStatus === "completed") {
        setAllActionThoughts(prev => prev.filter(t => !selectedTasks.has(t.id)));
      } else {
        setAllActionThoughts(prev => prev.map(t => 
          selectedTasks.has(t.id) ? { ...t, task_status: newStatus } : t
        ));
      }
      
      setSelectedTasks(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error("Error bulk updating status:", error);
      alert("Error updating tasks. Please try again.");
    }
  };

  const bulkMoveToMemory = async () => {
    if (selectedTasks.size === 0) return;
    
    try {
      for (const taskId of selectedTasks) {
        await Thought.update(taskId, { status: "memory_banked" });
      }
      setAllActionThoughts(prev => prev.filter(t => !selectedTasks.has(t.id)));
      setSelectedTasks(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error("Error bulk moving to memory:", error);
      alert("Error moving tasks. Please try again.");
    }
  };

  const cycleTaskStatus = async (thought) => {
    // Simplified cycle: any active status becomes 'in_progress', and 'in_progress' becomes 'completed'
    const newStatus = thought.task_status === 'in_progress' ? 'completed' : 'in_progress';
    
    try {
      await Thought.update(thought.id, { task_status: newStatus });
      
      if (newStatus === "completed") {
        // Remove from active list (archive)
        setAllActionThoughts(prev => prev.filter(t => t.id !== thought.id));
      } else {
        // Update in place
        setAllActionThoughts(prev => prev.map(t => 
          t.id === thought.id ? { ...t, task_status: newStatus } : t
        ));
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Error updating task. Please try again.");
    }
  };

  const putTaskOnHold = async (thought) => {
    try {
      await Thought.update(thought.id, { 
        task_status: 'on_hold',
        priority: 'low' // Move held tasks to low priority
      });
      setAllActionThoughts(prev => prev.map(t => 
        t.id === thought.id ? { ...t, task_status: 'on_hold', priority: 'low' } : t
      ));
    } catch (error) {
      console.error("Error putting task on hold:", error);
      alert("Error putting task on hold. Please try again.");
    }
  };

  const handleDeleteThought = async (thought) => {
    try {
      await Thought.delete(thought.id);
      setAllActionThoughts(prev => prev.filter(t => t.id !== thought.id));
      setDeleteThought(null);
    } catch (error) {
      console.error("Error deleting thought:", error);
      alert("Error deleting thought. Please try again.");
    }
  };

  const handleMoveToMemory = async (thought) => {
    try {
      await Thought.update(thought.id, { status: "memory_banked" });
      setAllActionThoughts(prev => prev.filter(t => t.id !== thought.id));
    } catch (error) {
      console.error("Error moving thought:", error);
      alert("Error moving thought. Please try again.");
    }
  };

  const generateTaskInsights = async (thought) => {
    if (!thought || isGeneratingInsight) return;
    setIsGeneratingInsight(thought.id);
    
    try {
      const response = await InvokeLLM({
        prompt: `You are an AI productivity coach and world-class project manager. Your advice must be non-obvious, highly specific, and objective-oriented. Avoid clichés and generic statements. Analyze this task and provide comprehensive, actionable insights.

        **Task:** "${thought.processed_text}"
        **Category:** ${thought.category}
        **Priority:** ${thought.priority}
        **Current Status:** ${thought.task_status}
        **Existing Action Steps:** ${thought.action_steps?.map(s => s.step).join(', ') || 'None'}

        Generate detailed insights to help them complete this task successfully. Focus on concrete strategies, potential pitfalls with solutions, and specific tools or frameworks.`,
        response_json_schema: {
          type: "object",
          properties: {
            sub_task_breakdown: {
              type: "array",
              items: { type: "string" },
              description: "Break this task into 3-5 smaller, manageable sub-tasks"
            },
            potential_obstacles: {
              type: "array",
              items: { 
                type: "object",
                properties: {
                  obstacle: { type: "string" },
                  solution: { type: "string" }
                }
              },
              description: "Identify 2-3 potential challenges and specific solutions"
            },
            recommended_resources: {
              type: "array",
              items: { type: "string" },
              description: "Suggest helpful tools, websites, or resources for this task"
            },
            motivational_insight: {
              type: "string",
              description: "An encouraging, personalized motivational insight for this task"
            },
            estimated_time: {
              type: "string",
              description: "Realistic time estimate to complete this task"
            },
            success_tips: {
              type: "array",
              items: { type: "string" },
              description: "3-4 specific tips for successfully completing this task"
            }
          }
        }
      });

      setTaskInsights(prev => ({ ...prev, [thought.id]: response }));
    } catch (error) {
      console.error("Error generating insights:", error);
      alert("There was an error generating insights. Please try again.");
    } finally {
      setIsGeneratingInsight(null);
    }
  };

  const generateDeeperStepInsight = async (thought, actionStep, index) => {
    const thoughtId = thought.id;
    if (isGeneratingInsight === `${thoughtId}-${index}`) return;

    setIsGeneratingInsight(`${thoughtId}-${index}`);
    setDeeperStepInsights(prev => ({
      ...prev,
      [thoughtId]: {
        ...prev[thoughtId],
        [index]: { isLoading: true }
      }
    }));

    try {
      const response = await InvokeLLM({
        prompt: `You are a world-class expert. A user wants to explore a specific action step in more detail. Your response must be non-obvious, highly specific, and objective-oriented. Avoid generic advice.

        **Original Task:** "${thought.processed_text}"
        **Action Step to Deepen:** "${actionStep.step}"
        **AI Recommendation for this step:** "${actionStep.recommendation}"

        Provide concrete strategies, name potential tools, identify specific risks, and give further actionable, measurable sub-steps related to *only* this action step.`,
        response_json_schema: {
          type: "object",
          properties: {
            detailed_explanation: { type: "string", description: "A non-obvious, expert explanation of why this step is important." },
            specific_sub_steps: { type: "array", items: { type: "string" }, description: "3-5 specific, measurable sub-steps to complete this action." },
            potential_challenges: { type: "array", items: { type: "object", properties: { challenge: { type: "string" }, solution: { type: "string" } } }, description: "Potential challenges for this specific step and how to overcome them." },
            pro_tip: { type: "string", description: "A professional, non-obvious tip for executing this step effectively." }
          }
        }
      });
      setDeeperStepInsights(prev => ({
        ...prev,
        [thoughtId]: {
          ...prev[thoughtId],
          [index]: { data: response, isLoading: false }
        }
      }));
    } catch (error) {
      console.error("Error generating deeper step insight:", error);
      alert("Error generating deeper insight. Please try again.");
      setDeeperStepInsights(prev => ({
        ...prev,
        [thoughtId]: {
          ...prev[thoughtId],
          [index]: { isLoading: false }
        }
      }));
    } finally {
      setIsGeneratingInsight(null);
    }
  };

  const handleCreateTaskFromInsight = async (taskText) => {
    try {
      await Thought.create({
        transcription: taskText,
        processed_text: taskText,
        category: "task",
        status: "actioned",
        task_status: "not_started",
        priority: "medium",
        mood_score: 0,
        tags: ["from-insight"],
        action_steps: []
      });

      // Show success notification
      alert("✅ Task created successfully! Check your To-Do list.");
      // Refresh the list to show new task
      loadActionThoughts();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task. Please try again.");
    }
  };

  const toggleExpand = (thoughtId) => {
    setExpandedThoughtId(prevId => (prevId === thoughtId ? null : thoughtId));
  };
  
  const getCategoryColor = (category) => {
    const colors = {
      concern: "bg-red-100 text-red-700 border-red-200",
      goal: "bg-green-100 text-green-700 border-green-200",
      task: "bg-blue-100 text-blue-700 border-blue-200", // Changed from orange
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };
  
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high': 
        return { 
          icon: <Flag className="w-4 h-4 text-red-500" />, 
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200"
        };
      case 'medium': 
        return { 
          icon: <Clock className="w-4 h-4 text-yellow-600" />, 
          color: "text-yellow-700",
          bgColor: "bg-yellow-50 border-yellow-200"
        };
      case 'low': 
        return { 
          icon: <Square className="w-4 h-4 text-gray-500" />, // Changed from green
          color: "text-gray-600", // Changed from green
          bgColor: "bg-gray-50 border-gray-200" // Changed from green
        };
      default: 
        return { 
          icon: <Square className="w-4 h-4 text-gray-500" />, 
          color: "text-gray-600",
          bgColor: "bg-gray-50 border-gray-200"
        };
    }
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'not_started':
      case 'on_hold':
      default:
        return <Play className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTaskStatusText = (status) => {
    switch (status) {
      case 'in_progress': return 'Complete';
      case 'not_started':
      case 'on_hold':
      default: return 'Start';
    }
  };
  
  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading your action steps..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-4 space-y-6">
        {/* Enhanced Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Action Center
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-600">{allActionThoughts.length} active tasks</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{displayedThoughts.filter(t => t.priority === 'high').length} high priority</span>
            {bulkMode && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-blue-500 font-medium">{selectedTasks.size} selected</span>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>

        {/* Compact Filter Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white border-gray-200">
                <Filter className="w-4 h-4 mr-1" />
                {filterStatus.replace('_', ' ')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus("all_active")}>All Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("not_started")}>Not Started</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("in_progress")}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("on_hold")}>On Hold</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white border-gray-200">
                <Flag className="w-4 h-4 mr-1" />
                {filterPriority === 'all' ? 'All' : filterPriority}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterPriority("all")}>All Priorities</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("high")}>High Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("medium")}>Medium Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("low")}>Low Priority</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white border-gray-200">
                <SortAsc className="w-4 h-4 mr-1" />
                {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("priority")}>Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Mode Toggle */}
          <Button
            variant={bulkMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedTasks(new Set());
            }}
            className={bulkMode ? "bg-blue-500 hover:bg-blue-600" : "bg-white border-gray-200"}
          >
            <CheckSquare className="w-4 h-4 mr-1" />
            Bulk Edit
          </Button>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {bulkMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllTasks}
                    className="text-blue-600 border-blue-200"
                  >
                    {selectedTasks.size === displayedThoughts.length ? "Deselect All" : "Select All"}
                  </Button>
                  <span className="text-sm text-blue-700">
                    {selectedTasks.size} of {displayedThoughts.length} selected
                  </span>
                </div>
              </div>
              
              {selectedTasks.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden"
                >
                  <Button
                    size="sm"
                    onClick={() => bulkChangeStatus("in_progress")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Start Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => bulkChangeStatus("completed")}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Complete Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => bulkChangeStatus("on_hold")}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Hold Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={bulkMoveToMemory}
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    Move to Thoughts
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
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {allActionThoughts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <CheckSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">All clear!</h2>
            <p className="text-gray-600">Record new thoughts or process pending ones to see them here.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            <AnimatePresence>
              {displayedThoughts.map((thought) => {
                const { icon: priorityIcon, color: priorityColor, bgColor } = getPriorityInfo(thought.priority);
                const isExpanded = expandedThoughtId === thought.id;
                const insightData = taskInsights[thought.id];
                const isSelected = selectedTasks.has(thought.id);

                return (
                  <motion.div key={thought.id} layout>
                    <Card 
                      className={`${bgColor} border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden ${
                        isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                      }`}
                    >
                      <CardContent className="p-0">
                        {/* Main Task Row - Fixed for mobile */}
                        <div className="flex items-center gap-3 p-4">
                          {/* Bulk Select Checkbox */}
                          {bulkMode && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex-shrink-0"
                            >
                              <button
                                onClick={() => toggleTaskSelection(thought.id)}
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

                          {/* Priority Indicator */}
                          <div className="flex items-center gap-1 flex-shrink-0" title={`Priority: ${thought.priority}`}>
                            {priorityIcon}
                          </div>

                          {/* Task Content - Fixed truncation */}
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-gray-900 font-medium leading-snug break-words">
                              {thought.processed_text}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge className={`${getCategoryColor(thought.category)} text-xs`}>
                                {thought.category}
                              </Badge>
                              {thought.sub_category && (
                                <Badge variant="outline" className="text-xs border-gray-200">{thought.sub_category}</Badge>
                              )}
                              {thought.task_status === 'on_hold' && (
                                <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                  On Hold
                                </Badge>
                              )}
                              {thought.tags && thought.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {thought.tags.slice(0, 2).map((tag, i) => (
                                    <span key={i} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Cycle Status Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cycleTaskStatus(thought)}
                              className="flex items-center gap-1 hover:bg-gray-100 px-2"
                              title={getTaskStatusText(thought.task_status)}
                            >
                              {getTaskStatusIcon(thought.task_status)}
                              <span className="text-xs font-medium hidden sm:inline">{getTaskStatusText(thought.task_status)}</span>
                            </Button>

                            {/* Hold Button */}
                            {thought.task_status !== 'on_hold' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => putTaskOnHold(thought)}
                                className="text-orange-600 hover:bg-orange-100 px-2"
                                title="Put on hold"
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Expand/More Options */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(thought.id)}
                              className="text-gray-500 hover:bg-gray-100 px-2"
                            >
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                <ChevronDown className="w-4 h-4" />
                              </motion.div>
                            </Button>
                          </div>
                        </div>

                        {/* EXPANDED VIEW */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-200 bg-gray-50"
                            >
                              <div className="p-4 space-y-4">
                                {/* Task Details */}
                                <div className="flex items-center justify-between text-sm text-gray-600 flex-wrap gap-2">
                                  <span>Created: {format(new Date(thought.created_date), 'MMM d, h:mm a')}</span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleMoveToMemory(thought)}
                                      className="text-blue-600 hover:bg-blue-100"
                                    >
                                      <Edit3 className="w-4 h-4 mr-1" />
                                      Move to Thoughts
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteThought(thought)}
                                      className="text-red-600 hover:bg-red-100"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>

                                {/* Original Action Steps */}
                                {thought.action_steps && thought.action_steps.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-900">Original Action Steps:</h4>
                                    <div className="space-y-2">
                                      {thought.action_steps.map((actionStep, i) => {
                                        const stepInsight = deeperStepInsights[thought.id]?.[i];
                                        const isGeneratingStepInsight = isGeneratingInsight === `${thought.id}-${i}`;

                                        return (
                                          <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-start gap-2">
                                              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center flex-shrink-0">{i + 1}</span>
                                              <div className="flex-1 space-y-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 break-words">{actionStep.step}</p>
                                                {actionStep.recommendation && (
                                                  <p className="text-xs text-gray-600 italic break-words">💡 {actionStep.recommendation}</p>
                                                )}
                                                {actionStep.estimated_time && (
                                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{actionStep.estimated_time}</span>
                                                  </div>
                                                )}
                                                {actionStep.suggested_tools && actionStep.suggested_tools.length > 0 && (
                                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Wrench className="w-3 h-3" /> {/* Changed from Tool to Wrench */}
                                                    <span>{actionStep.suggested_tools.join(', ')}</span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => generateDeeperStepInsight(thought, actionStep, i)}
                                                  className="text-blue-600 hover:bg-blue-100 p-1 flex-shrink-0"
                                                  title="Explore this step"
                                                  disabled={isGeneratingStepInsight}
                                                >
                                                  {isGeneratingStepInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleCreateTaskFromInsight(actionStep.step)}
                                                  className="text-blue-600 hover:bg-blue-100 p-1 flex-shrink-0"
                                                  title="Turn into separate task"
                                                >
                                                  <Plus className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                            {stepInsight && (
                                              <AnimatePresence>
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: "auto", opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  className="mt-3 pt-3 border-t border-gray-200"
                                                >
                                                  {stepInsight.isLoading ? (
                                                    <div className="flex items-center justify-center gap-2 py-2">
                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                      <span className="text-sm text-blue-600">Exploring step...</span>
                                                    </div>
                                                  ) : stepInsight.data ? (
                                                    <div className="space-y-3 text-sm">
                                                      {Object.entries(stepInsight.data).map(([key, value]) => (
                                                        <InteractiveInsight
                                                          key={key}
                                                          insightKey={key.replace(/_/g, ' ')}
                                                          insightValue={value}
                                                          thoughtId={thought.id}
                                                          onCreateTask={handleCreateTaskFromInsight}
                                                        />
                                                      ))}
                                                    </div>
                                                  ) : null}
                                                </motion.div>
                                              </AnimatePresence>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* AI Task Assistant Section */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-gray-900">AI Task Assistant:</h4>
                                  {!insightData && isGeneratingInsight !== thought.id && (
                                    <Button 
                                      size="sm" 
                                      className="w-full bg-blue-500 hover:bg-blue-600"
                                      onClick={() => generateTaskInsights(thought)}
                                    >
                                      <Sparkles className="w-4 h-4 mr-2"/>
                                      Generate Interactive Insights
                                    </Button>
                                  )}
                                  {isGeneratingInsight === thought.id && (
                                    <div className="flex items-center justify-center gap-2 text-gray-600 p-4">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <p className="text-sm">Building your interactive insights...</p>
                                    </div>
                                  )}
                                  {insightData && (
                                    <div className="space-y-3">
                                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                                        {insightData.estimated_time && (
                                          <div className="flex items-center gap-2 mb-3">
                                            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            <span className="text-sm font-medium text-blue-700">
                                              Estimated time: {insightData.estimated_time}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {insightData.motivational_insight && (
                                          <p className="text-sm italic text-blue-700 p-2 bg-blue-50 rounded-md mb-3 break-words">
                                            💪 {insightData.motivational_insight}
                                          </p>
                                        )}
                                      </div>
                                      
                                      <div className="space-y-2">
                                        {Object.entries(insightData).map(([key, value]) => (
                                          key !== 'estimated_time' && key !== 'motivational_insight' && (
                                            <InteractiveInsight
                                              key={key}
                                              insightKey={key}
                                              insightValue={value}
                                              thoughtId={thought.id}
                                              onCreateTask={handleCreateTaskFromInsight}
                                            />
                                          )
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteThought} onOpenChange={() => setDeleteThought(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Action Step</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete this? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteThought(deleteThought)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
