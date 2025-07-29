
import React, { useState, useEffect } from 'react';
import { Goal } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, CheckCircle, PauseCircle, PlayCircle, Trophy } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';

const GoalCard = ({ goal, onUpdate, onDelete }) => {
  const statusInfo = {
    active: { icon: <PlayCircle className="w-4 h-4 text-blue-500" />, text: 'Active' },
    paused: { icon: <PauseCircle className="w-4 h-4 text-gray-500" />, text: 'Paused' },
    completed: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Completed' },
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-gray-900">{goal.title}</CardTitle>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              {statusInfo[goal.status]?.icon}
              <span className="ml-2">{statusInfo[goal.status]?.text}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onUpdate(goal.id, { status: 'active' })}>
                <PlayCircle className="w-4 h-4 mr-2" /> Mark Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdate(goal.id, { status: 'paused' })}>
                <PauseCircle className="w-4 h-4 mr-2" /> Mark Paused
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdate(goal.id, { status: 'completed' })}>
                <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-red-500">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{goal.description}</p>
      </CardContent>
    </Card>
  );
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '' });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    const fetchedGoals = await Goal.list();
    setGoals(fetchedGoals);
    setIsLoading(false);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title) return;
    await Goal.create(newGoal);
    setNewGoal({ title: '', description: '' });
    setIsFormOpen(false);
    loadGoals();
  };

  const handleUpdateGoal = async (id, data) => {
    await Goal.update(id, data);
    loadGoals();
  };

  const handleDeleteGoal = async (id) => {
    await Goal.delete(id);
    loadGoals();
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading your goals..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
          <Button onClick={() => setIsFormOpen(true)} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" /> New Goal
          </Button>
        </div>

        {isFormOpen && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Create a New Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Goal title (e.g., Launch new website)"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="border-gray-200"
              />
              <Textarea
                placeholder="Goal description (e.g., A detailed plan for what success looks like)"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="border-gray-200"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsFormOpen(false)} className="border-gray-200">Cancel</Button>
                <Button onClick={handleCreateGoal} className="bg-blue-500 hover:bg-blue-600">Save Goal</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {goals.length === 0 && !isFormOpen ? (
          <div className="text-center py-12 space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">No Goals Defined</h2>
            <p className="text-gray-600">Define your goals to give the AI context for your thoughts.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
