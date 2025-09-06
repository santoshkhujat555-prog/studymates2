import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import QuestionsTable from '@/components/QuestionsTable';

interface QuestionData {
  question_id?: string;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_option: number;
  difficulty_level: string;
}

export default function QuestionUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResults(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive"
        });
      }
    }
  };

  const parseCSV = (csvText: string): QuestionData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const questions: QuestionData[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Enhanced CSV parsing to handle quoted values with commas
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last value
      
      if (values.length >= 8) {
        // Parse correct_option - handle multiple formats
        let correctOptionValue: number;
        const correctOptionText = values[6].toString().toLowerCase().trim().replace(/['"]/g, '');
        
        console.log(`Row ${i}: Processing correct_option value: "${values[6]}" -> "${correctOptionText}"`);
        
        // Handle various formats: "1", "Option 1", "option 2", "A", "B", "C", "D"
        if (correctOptionText.includes('option')) {
          // Extract number from "Option 1", "option 2", etc.
          const match = correctOptionText.match(/option\s*(\d+)/);
          correctOptionValue = match ? parseInt(match[1]) : NaN;
        } else if (['a', 'b', 'c', 'd'].includes(correctOptionText)) {
          // Convert A/B/C/D to 1/2/3/4
          const letterToNumber = { 'a': 1, 'b': 2, 'c': 3, 'd': 4 };
          correctOptionValue = letterToNumber[correctOptionText as keyof typeof letterToNumber];
        } else {
          // Direct number like "1", "2", etc.
          correctOptionValue = parseInt(correctOptionText);
        }
        
        // Skip if correct_option is not a valid number
        if (isNaN(correctOptionValue) || ![1, 2, 3, 4].includes(correctOptionValue)) {
          console.log(`Skipping row ${i}: Invalid correct_option value "${values[6]}" -> ${correctOptionValue}`);
          continue;
        }

        const question: QuestionData = {
          question_id: values[0] || undefined,
          question: values[1],
          option_1: values[2],
          option_2: values[3],
          option_3: values[4], 
          option_4: values[5],
          correct_option: correctOptionValue,
          difficulty_level: values[7].toLowerCase()
        };

        // Validate difficulty level
        if (!['easy', 'medium', 'hard'].includes(question.difficulty_level)) {
          question.difficulty_level = 'medium';
        }

        questions.push(question);
      }
    }

    return questions;
  };

  const handleUpload = async () => {
    if (!file || !user) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const csvText = await file.text();
      const questions = parseCSV(csvText);

      for (const question of questions) {
        const { error } = await supabase
          .from('questions')
          .insert({
            ...question,
            created_by: user.id
          });

        if (error) {
          errors.push(`Row ${successCount + 1}: ${error.message}`);
        } else {
          successCount++;
        }
      }

      setUploadResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Upload completed",
          description: `Successfully uploaded ${successCount} questions`
        });
      }

    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process the CSV file",
        variant: "destructive"
      });
    }

    setIsUploading(false);
  };

  const downloadTemplate = () => {
    const csvContent = `Question ID,Question,Option 1,Option 2,Option 3,Option 4,Correct Option,Difficulty Level
Q001,What is the capital of France?,London,Berlin,Paris,Madrid,3,easy
Q002,Which programming language is used for web development?,Python,JavaScript,C++,Java,2,medium
Q003,What is 2 + 2?,3,4,5,6,2,easy
Q004,What is the largest planet?,Earth,Jupiter,Mars,Venus,2,hard`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Question Upload Platform</h1>
          <p className="text-muted-foreground">
            Upload CSV files to bulk import quiz questions into the system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Template
            </CardTitle>
            <CardDescription>
              Download a sample CSV template with the correct format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Questions
            </CardTitle>
            <CardDescription>
              Upload your CSV file with questions following the template format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>

            {file && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ready to upload: {file.name} ({Math.round(file.size / 1024)} KB)
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {uploadResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResults.errors.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                Upload Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResults.success}
                  </div>
                  <div className="text-sm text-green-600">
                    Questions Uploaded
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadResults.errors.length}
                  </div>
                  <div className="text-sm text-red-600">
                    Errors
                  </div>
                </div>
              </div>

              {uploadResults.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Errors:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {uploadResults.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Column Order:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Question ID (optional, can be empty)</li>
                <li>Question (required)</li>
                <li>Option 1 (required)</li>
                <li>Option 2 (required)</li>
                <li>Option 3 (required)</li>
                <li>Option 4 (required)</li>
                <li>Correct Option (required: 1, 2, 3, or 4)</li>
                <li>Difficulty Level (required: easy, medium, or hard)</li>
              </ol>
              <p className="mt-4"><strong>Notes:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>First row should contain headers</li>
                <li>Correct Option must be a number from 1-4</li>
                <li>Difficulty Level must be: easy, medium, or hard</li>
                <li>Questions with invalid data will be skipped</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <QuestionsTable />
      </div>
    </div>
  );
}