import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Question {
  id: string;
  question_id: string | null;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_option: number;
  difficulty_level: string;
  created_at: string;
  created_by: string | null;
}

export default function QuestionsTable() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuestions(questions.filter(q => q.id !== id));
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCorrectOptionText = (question: Question) => {
    switch (question.correct_option) {
      case 1: return question.option_1;
      case 2: return question.option_2;
      case 3: return question.option_3;
      case 4: return question.option_4;
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Questions Database</h2>
        <Badge variant="outline">
          {questions.length} Total Questions
        </Badge>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No questions uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">1) Question ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">2) Question</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">3) Option 1</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">4) Option 2</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">5) Option 3</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">6) Option 4</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">7) Correct Option</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">8) Difficulty Level</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question, index) => (
                    <tr key={question.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        {question.question_id || `Q${String(index + 1).padStart(3, '0')}`}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={question.question}>
                        {question.question}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={question.option_1}>
                        {question.option_1}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={question.option_2}>
                        {question.option_2}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={question.option_3}>
                        {question.option_3}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={question.option_4}>
                        {question.option_4}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Option {question.correct_option}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={getDifficultyColor(question.difficulty_level)}>
                          {question.difficulty_level}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuestion(
                              selectedQuestion?.id === question.id ? null : question
                            )}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.id === question.created_by && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {selectedQuestion && (
              <div className="border-t p-4 bg-muted/20">
                <h3 className="font-semibold mb-3">Question Details:</h3>
                <div className="space-y-3">
                  <p><strong>Question:</strong> {selectedQuestion.question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className={`p-3 rounded border ${selectedQuestion.correct_option === 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <span className="font-medium">A) </span>{selectedQuestion.option_1}
                      {selectedQuestion.correct_option === 1 && <span className="text-green-600 ml-2">✓ Correct</span>}
                    </div>
                    <div className={`p-3 rounded border ${selectedQuestion.correct_option === 2 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <span className="font-medium">B) </span>{selectedQuestion.option_2}
                      {selectedQuestion.correct_option === 2 && <span className="text-green-600 ml-2">✓ Correct</span>}
                    </div>
                    <div className={`p-3 rounded border ${selectedQuestion.correct_option === 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <span className="font-medium">C) </span>{selectedQuestion.option_3}
                      {selectedQuestion.correct_option === 3 && <span className="text-green-600 ml-2">✓ Correct</span>}
                    </div>
                    <div className={`p-3 rounded border ${selectedQuestion.correct_option === 4 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <span className="font-medium">D) </span>{selectedQuestion.option_4}
                      {selectedQuestion.correct_option === 4 && <span className="text-green-600 ml-2">✓ Correct</span>}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Correct Answer:</strong> Option {selectedQuestion.correct_option} - {getCorrectOptionText(selectedQuestion)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}