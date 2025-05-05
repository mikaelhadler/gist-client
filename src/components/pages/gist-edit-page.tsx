import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  FileCode, 
  Plus, 
  X, 
  Save, 
  ArrowLeft, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/auth-provider';
import { GistService, Gist } from '@/lib/api/gist-service';

const gistFormSchema = z.object({
  description: z.string().optional(),
  files: z.array(
    z.object({
      originalFilename: z.string().optional(),
      filename: z.string().min(1, {
        message: 'Filename is required',
      }),
      content: z.string().min(1, {
        message: 'Content is required',
      }),
      isDeleted: z.boolean().default(false),
    })
  ).min(1, {
    message: 'At least one file is required',
  }),
});

type GistFormValues = z.infer<typeof gistFormSchema>;

export default function GistEditPage() {
  const { id } = useParams<{ id: string }>();
  const { octokit } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gist, setGist] = useState<Gist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GistFormValues>({
    resolver: zodResolver(gistFormSchema),
    defaultValues: {
      description: '',
      files: [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    name: 'files',
    control: form.control,
  });

  useEffect(() => {
    const fetchGist = async () => {
      if (!octokit || !id) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const gistService = new GistService(octokit);
        const gistData = await gistService.getGistById(id);
        
        setGist(gistData);

        // Populate form with gist data
        form.reset({
          description: gistData.description,
          files: Object.entries(gistData.files).map(([filename, file]) => ({
            originalFilename: filename,
            filename,
            content: file.content,
            isDeleted: false,
          })),
        });
      } catch (err) {
        console.error('Error fetching gist:', err);
        setError('Failed to load gist. It may have been deleted or you may not have permission to edit it.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGist();
  }, [octokit, id, form]);

  const onSubmit = async (data: GistFormValues) => {
    if (!octokit || !id) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const gistService = new GistService(octokit);
      
      // Convert files array to GitHub API format
      const filesObj: Record<string, { content: string } | null> = {};
      
      data.files.forEach((file) => {
        if (file.isDeleted && file.originalFilename) {
          // Mark file for deletion
          filesObj[file.originalFilename] = null;
        } else if (file.originalFilename && file.originalFilename !== file.filename) {
          // File was renamed
          filesObj[file.originalFilename] = null;
          filesObj[file.filename] = { content: file.content };
        } else {
          // New file or unchanged filename
          filesObj[file.filename] = { content: file.content };
        }
      });
      
      await gistService.updateGist(
        id,
        data.description || '',
        filesObj
      );
      
      toast({
        title: 'Gist updated successfully',
      });
      
      navigate(`/gists/${id}`);
    } catch (err) {
      console.error('Error updating gist:', err);
      setError('Failed to update gist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewFile = () => {
    append({ filename: '', content: '', isDeleted: false });
  };

  const markFileAsDeleted = (index: number) => {
    const file = form.getValues(`files.${index}`);
    
    if (file.originalFilename) {
      // Existing file, mark as deleted but keep in form
      form.setValue(`files.${index}.isDeleted`, true);
    } else {
      // New file, remove from form entirely
      remove(index);
    }
  };

  const restoreFile = (index: number) => {
    form.setValue(`files.${index}.isDeleted`, false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !gist) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Gist not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Gist</h1>
          <p className="text-muted-foreground mt-2">
            Make changes to your gist and save them.
          </p>
        </div>
        <Button 
          variant="outline" 
          asChild
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </motion.div>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gist Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a description for your gist (optional)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description helps others understand what your gist is about.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Public Gist</FormLabel>
                      <FormDescription>
                        {gist.public 
                          ? 'This gist is public and visible to everyone.' 
                          : 'This gist is private and only visible to you.'}
                      </FormDescription>
                    </div>
                    <Switch
                      checked={gist.public}
                      disabled={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Files</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewFile}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add File</span>
                </Button>
              </div>

              {fields.map((field, index) => {
                const isDeleted = form.watch(`files.${index}.isDeleted`);
                
                if (isDeleted) {
                  return (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0.6 }}
                    >
                      <Card className="border-dashed border-muted bg-muted/30">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <FileCode className="h-5 w-5 text-muted-foreground" />
                              <h3 className="font-medium line-through text-muted-foreground">
                                {form.watch(`files.${index}.filename`)}
                              </h3>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => restoreFile(index)}
                            >
                              Restore
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }
                
                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-medium">File {index + 1}</h3>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => markFileAsDeleted(index)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove file</span>
                          </Button>
                        </div>

                        <div className="grid gap-4">
                          <FormField
                            control={form.control}
                            name={`files.${index}.filename`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Filename</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., script.js, notes.md"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Include the file extension to help with syntax highlighting.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`files.${index}.content`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={10}
                                    placeholder="Enter your code or text here"
                                    className="font-mono text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}