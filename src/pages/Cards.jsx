
import React, { useState, useEffect } from "react";
import { Thought } from "@/api/entities";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, ArrowRight, Brain, Archive, CheckSquare, ChevronDown, ChevronUp, Lightbulb, Target, Clock, Zap, RotateCcw, Shuffle, Sparkles, Loader2, Plus, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InvokeLLM } from "@/api/integrations";

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
        **Context Type:** ${insightKey}

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
              },
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
    <div className="border border-indigo-200 rounded-lg p-3 bg-white/60">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 mb-1 capitalize">
            {insightKey.replace(/_/g, ' ')}:
          </p>
          {Array.isArray(insightValue) ? (
            <ul className="text-sm text-gray-700 space-y-1">
              {insightValue.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{typeof item === 'object' ? `${item.challenge}: ${item.solution}` : item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-700">{insightValue}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateTask(Array.isArray(insightValue) ? insightValue.join(', ') : insightValue)}
            className="text-purple-600 hover:bg-purple-100 p-1"
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
            className="text-indigo-600 hover:bg-indigo-100 p-1"
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
            className="mt-3 pt-3 border-t border-indigo-200"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-indigo-600">Exploring deeper...</span>
              </div>
            ) : deeperInsight ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-800 mb-1">Detailed Explanation:</p>
                  <p className="text-gray-700">{deeperInsight.detailed_explanation}</p>
                </div>

                {deeperInsight.specific_steps && (
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Specific Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                      {deeperInsight.specific_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span>{i + 1}.</span>
                          <span className="flex-1">{step}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateTask(step)}
                            className="text-purple-600 hover:bg-purple-100 p-1 ml-2"
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
                        <div key={i} className="bg-amber-50 border border-amber-200 rounded p-2">
                          <p className="font-medium text-amber-800 text-xs">Challenge: {item.challenge}</p>
                          <p className="text-amber-700 text-xs">Solution: {item.solution}</p>
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
                          <span className="text-green-500">→</span>
                          <span className="text-xs">{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {deeperInsight.pro_tip && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded p-2">
                    <p className="font-medium text-indigo-800 text-xs mb-1">💡 Pro Tip:</p>
                    <p className="text-indigo-700 text-xs italic">{deeperInsight.pro_tip}</p>
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

export default function Cards() {
  const [pendingThoughts, setPendingThoughts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [expandedInsights, setExpandedInsights] = useState(false);
  const [secondaryInsight, setSecondaryInsight] = useState(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [selectedThoughts, setSelectedThoughts] = useState(new Set());
  const [autoAdvance, setAutoAdvance] = useState(false);

  useEffect(() => {
    loadPendingThoughts();
  }, []);

  useEffect(() => {
    setExpandedInsights(false);
    setSecondaryInsight(null);
  }, [currentIndex]);

  useEffect(() => {
    if (autoAdvance && currentIndex < pendingThoughts.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoAdvance, pendingThoughts.length]);

  const loadPendingThoughts = async () => {
    setIsLoading(true);
    const thoughts = await Thought.filter({ status: "pending" }, "-created_date");
    setPendingThoughts(thoughts);
    setIsLoading(false);
  };

  const handleSwipe = async (direction, thoughtId) => {
    setSwipeDirection(direction);
    
    const newStatus = direction === "left" ? "memory_banked" : "actioned";
    const updateData = direction === "left" 
      ? { status: newStatus }
      : { status: newStatus, task_status: "not_started" };
    
    await Thought.update(thoughtId, updateData);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleSkip = () => {
    if (currentIndex < pendingThoughts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...pendingThoughts].sort(() => Math.random() - 0.5);
    setPendingThoughts(shuffled);
    setCurrentIndex(0);
  };

  const generateDeeperInsight = async (thought, insight) => {
    if (!thought || isGeneratingInsight) return;
    setIsGeneratingInsight(true);
    setSecondaryInsight(null);

    try {
      const response = await InvokeLLM({
        prompt: `You are a helpful AI life coach and world-class expert. A user is reflecting on a thought. Your advice must be non-obvious, highly specific, and objective-oriented. Avoid clichés.
        
        **Original Thought:** "${thought.processed_text}"
        **Category:** ${thought.category}
        **Initial Insight:** ${insight.summary}

        Based on this, generate comprehensive insights with interactive components. Make each insight detailed and actionable. Provide concrete strategies, name potential tools, and identify specific risks.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions_to_ponder: {
              type: "array",
              items: { type: "string" },
              description: "3-4 thought-provoking questions about the insight."
            },
            actionable_steps: {
              type: "array", 
              items: { type: "string" },
              description: "4-5 specific, immediate actions the user can take."
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
              description: "3-4 potential obstacles and specific solutions."
            },
            resources_and_tools: {
              type: "array",
              items: { type: "string" },
              description: "Specific tools, apps, or resources that would help."
            },
            motivational_insight: {
              type: "string",
              description: "An encouraging, personalized motivational insight."
            }
          }
        }
      });
      setSecondaryInsight(response);
    } catch (error) {
      console.error("Error generating deeper insight:", error);
      alert("There was an error generating a deeper insight. Please try again.");
    } finally {
      setIsGeneratingInsight(false);
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
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task. Please try again.");
    }
  };

  const handleBatchAction = async (action) => {
    const selectedIds = Array.from(selectedThoughts);
    for (const thoughtId of selectedIds) {
      const newStatus = action === "memory" ? "memory_banked" : "actioned";
      const updateData = action === "memory" 
        ? { status: newStatus }
        : { status: newStatus, task_status: "not_started" };
      await Thought.update(thoughtId, updateData);
    }
    
    const remainingThoughts = pendingThoughts.filter(t => !selectedIds.includes(t.id));
    setPendingThoughts(remainingThoughts);
    setSelectedThoughts(new Set());
    setShowBatchActions(false);
    setCurrentIndex(0);
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

  const currentThought = pendingThoughts[currentIndex];

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

  const getMoodEmoji = (score) => {
    if (score > 0.5) return "😊";
    if (score > 0) return "🙂";
    if (score > -0.5) return "😐";
    return "😟";
  };

  const getCategoryInsight = (thought) => {
    const insights = {
      task: {
        icon: <Target className="w-4 h-4" />,
        title: "Action Required",
        summary: "This requires concrete steps to complete",
        details: thought.action_steps?.length > 0 
          ? `${thought.action_steps.length} actionable steps identified`
          : "Consider breaking this down into smaller, manageable steps"
      },
      idea: {
        icon: <Lightbulb className="w-4 h-4" />,
        title: "Creative Spark",
        summary: "Interesting concept worth exploring",
        details: "Ideas benefit from research, validation, and iterative development. Consider documenting related thoughts or creating a prototype."
      },
      concern: {
        icon: <Clock className="w-4 h-4" />,
        title: "Needs Attention",
        summary: "This worry might need addressing",
        details: "Concerns often resolve better with action. Consider what specific steps could reduce this anxiety or who might help."
      },
      goal: {
        icon: <Zap className="w-4 h-4" />,
        title: "Growth Opportunity",
        summary: "Potential for personal development",
        details: "Goals are most achievable when broken into milestones. Consider setting a timeline and tracking progress."
      },
      reflection: {
        icon: <Brain className="w-4 h-4" />,
        title: "Self-Awareness",
        summary: "Valuable personal insight",
        details: "Reflections help build self-awareness. Consider journaling similar thoughts to identify patterns over time."
      },
      memory: {
        icon: <Archive className="w-4 h-4" />,
        title: "Worth Remembering",
        summary: "Meaningful moment or experience",
        details: "Memories become richer when connected to emotions and lessons learned. Consider what made this significant."
      },
      emotion: {
        icon: <Brain className="w-4 h-4" />,
        title: "Emotional Check-in",
        summary: "Important feeling to acknowledge",
        details: "Emotions provide valuable information. Consider what triggered this feeling and what it might be telling you."
      },
      observation: {
        icon: <Brain className="w-4 h-4" />,
        title: "Mindful Notice",
        summary: "Interesting observation about life",
        details: "Observations show mindful awareness. Consider how this connects to your broader understanding of the world."
      }
    };
    return insights[thought.category] || insights.observation;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-indigo-500 mx-auto animate-pulse" />
          <p className="text-gray-600">Loading your thoughts...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= pendingThoughts.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">All caught up!</h2>
          <p className="text-gray-600">No more thoughts to process right now.</p>
          <p className="text-sm text-gray-500">Record more thoughts to continue organizing your mind.</p>
        </div>
      </div>
    );
  }

  const insight = getCategoryInsight(currentThought);

  return (
    <div className="p-4 space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Process Your Thoughts
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-gray-600">
            {pendingThoughts.length - currentIndex} remaining
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={autoAdvance ? "bg-indigo-50 text-indigo-600" : ""}
            >
              <Zap className="w-4 h-4 mr-1" />
              Auto
            </Button>
            <Button variant="outline" size="sm" onClick={handleShuffle}>
              <Shuffle className="w-4 h-4 mr-1" />
              Shuffle
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowBatchActions(!showBatchActions)}
            >
              Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Batch Actions Panel */}
      <AnimatePresence>
        {showBatchActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20"
          >
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Batch Process ({selectedThoughts.size} selected)</h3>
              <div className="flex flex-wrap gap-2">
                {pendingThoughts.slice(currentIndex).map((thought, idx) => (
                  <button
                    key={thought.id}
                    onClick={() => toggleThoughtSelection(thought.id)}
                    className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                      selectedThoughts.has(thought.id)
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                        : "bg-white/60 text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {thought.processed_text.slice(0, 30)}...
                  </button>
                ))}
              </div>
              {selectedThoughts.size > 0 && (
                <div className="flex gap-3">
                  <Button 
                    size="sm" 
                    onClick={() => handleBatchAction("memory")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Archive className="w-4 h-4 mr-1" />
                    Send to Memory
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleBatchAction("action")}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Send to Actions
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkip}
          disabled={currentIndex >= pendingThoughts.length - 1}
        >
          Skip
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentIndex >= pendingThoughts.length - 1}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Swipe Instructions */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <ArrowLeft className="w-4 h-4" />
            <Archive className="w-4 h-4" />
            <span>Memory Bank</span>
          </div>
          <div className="flex items-center gap-2 text-purple-600">
            <span>Action Steps</span>
            <CheckSquare className="w-4 h-4" />
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Card Stack with Enhanced Interactive Features */}
      <div className="relative h-auto min-h-[24rem] mx-auto max-w-sm">
        <AnimatePresence mode="wait">
          {currentThought && (
            <motion.div
              key={currentThought.id}
              className="absolute inset-0"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ 
                x: swipeDirection === "left" ? -300 : swipeDirection === "right" ? 300 : 0,
                scale: 0.8,
                opacity: 0
              }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: -50, right: 50 }}
              onDragEnd={(event, info) => {
                if (Math.abs(info.offset.x) > 100) {
                  handleSwipe(info.offset.x > 0 ? "right" : "left", currentThought.id);
                }
              }}
              whileDrag={{ scale: 1.05 }}
            >
              <Card className="h-full bg-white shadow-xl border-0 overflow-hidden">
                <CardContent className="p-6 h-full flex flex-col">
                  {/* Category & Mood */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`${getCategoryColor(currentThought.category)} border`}>
                      {currentThought.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getMoodEmoji(currentThought.mood_score)}</span>
                      <span className={`text-xs font-medium ${
                        currentThought.priority === 'high' ? 'text-red-600' :
                        currentThought.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {currentThought.priority}
                      </span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Your Thought:</h3>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {currentThought.processed_text}
                      </p>
                    </div>

                    {/* Compact AI Insights */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {insight.icon}
                          <div>
                            <h4 className="font-medium text-sm text-gray-800">{insight.title}</h4>
                            <p className="text-xs text-gray-600">{insight.summary}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedInsights(!expandedInsights)}
                          className="p-1"
                        >
                          {expandedInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      <AnimatePresence>
                        {expandedInsights && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-indigo-200"
                          >
                            <p className="text-sm text-gray-700 leading-relaxed mb-4">
                              {insight.details}
                            </p>
                            
                            {/* Action Steps Preview */}
                            {currentThought.action_steps && currentThought.action_steps.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-xs font-semibold text-gray-600 mb-2">AI-Generated Steps:</h5>
                                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                  {currentThought.action_steps.slice(0, 2).map((step, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span>{step.step}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCreateTaskFromInsight(step.step)}
                                        className="text-purple-600 hover:bg-purple-100 p-1"
                                        title="Turn into task"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </li>
                                  ))}
                                  {currentThought.action_steps.length > 2 && (
                                    <li className="text-indigo-600">+{currentThought.action_steps.length - 2} more steps...</li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Interactive Deeper Analysis */}
                            {!secondaryInsight && !isGeneratingInsight && (
                              <Button 
                                size="sm" 
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white mt-4"
                                onClick={() => generateDeeperInsight(currentThought, insight)}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Interactive Insights
                              </Button>
                            )}
                            
                            {isGeneratingInsight && (
                              <div className="flex items-center justify-center gap-2 text-gray-600 mt-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <p className="text-sm">Generating interactive insights...</p>
                              </div>
                            )}

                            {secondaryInsight && (
                              <div className="space-y-3 mt-4">
                                <h5 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-indigo-500" />
                                  Interactive Insights:
                                </h5>
                                
                                <div className="space-y-2">
                                  {Object.entries(secondaryInsight).map(([key, value]) => (
                                    <InteractiveInsight
                                      key={key}
                                      insightKey={key}
                                      insightValue={value}
                                      thoughtId={currentThought.id}
                                      onCreateTask={handleCreateTaskFromInsight}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Tags */}
                    {currentThought.tags && currentThought.tags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {currentThought.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <motion.button
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      onClick={() => handleSwipe("left", currentThought.id)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Archive className="w-4 h-4" />
                      Memory Bank
                    </motion.button>
                    <motion.button
                      className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      onClick={() => handleSwipe("right", currentThought.id)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CheckSquare className="w-4 h-4" />
                      Action Steps
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next card preview */}
        {pendingThoughts[currentIndex + 1] && (
          <div className="absolute inset-0 -z-10 transform scale-95 opacity-50">
            <Card className="h-full bg-white shadow-lg">
              <CardContent className="p-6">
                <p className="text-gray-600 line-clamp-3">
                  {pendingThoughts[currentIndex + 1].processed_text}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced Progress indicator */}
      <div className="flex justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} of {pendingThoughts.length}
          </span>
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / pendingThoughts.length) * 100}%` }}
            />
          </div>
          {autoAdvance && (
            <div className="text-xs text-indigo-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Auto
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
