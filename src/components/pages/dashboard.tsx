import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, FileCode, GitFork, Plus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GistService, Gist } from '@/lib/api/gist-service';
import { useAuth } from '@/lib/auth/auth-provider';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user, octokit } = useAuth();
  const [recentGists, setRecentGists] = useState<Gist[]>([]);
  const [starredGists, setStarredGists] = useState<Gist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!octokit) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const gistService = new GistService(octokit);
        const [gists, starred] = await Promise.all([
          gistService.getGists(),
          gistService.getStarredGists(),
        ]);

        // Sort by updated_at for recent gists
        const sortedGists = [...gists].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        // Sort by stars for starred gists
        const sortedStarred = [...starred].sort(
          (a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)
        );

        setRecentGists(sortedGists.slice(0, 5));
        setStarredGists(sortedStarred.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [octokit]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || user?.login}!
        </h1>
        <p className="text-muted-foreground">
          Manage and organize your GitHub Gists with ease.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Gists</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentGists.length}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Starred Gists</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{starredGists.length}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Forked Gists</CardTitle>
              <GitFork className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Your Gists</h2>
          <Button asChild>
            <Link to="/gists/create" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>New Gist</span>
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="recent" className="mt-4">
          <TabsList>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="starred">Most Starred</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="mt-4">
            {recentGists.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">You don't have any gists yet.</p>
                  <Button asChild className="mt-4">
                    <Link to="/gists/create">Create Your First Gist</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2"
              >
                {recentGists.map((gist) => (
                  <motion.div key={gist.id} variants={item}>
                    <GistCard gist={gist} />
                  </motion.div>
                ))}

                <motion.div variants={item}>
                  <Link to="/gists" className="block">
                    <Card className="h-full border-dashed hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="flex flex-col items-center justify-center h-full py-8">
                        <p className="text-center text-muted-foreground">View all gists</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="starred" className="mt-4">
            {starredGists.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">You don't have any starred gists yet.</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/gists">Browse Your Gists</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2"
              >
                {starredGists.map((gist) => (
                  <motion.div key={gist.id} variants={item}>
                    <GistCard gist={gist} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GistCard({ gist }: { gist: Gist }) {
  const fileEntries = Object.entries(gist.files);
  const firstFile = fileEntries[0]?.[1];

  return (
    <Link to={`/gists/${gist.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1">
            {gist.description || firstFile?.filename || 'Untitled Gist'}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>Updated {formatDistanceToNow(new Date(gist.updated_at))} ago</span>
            {gist.public ? (
              <Badge variant="outline">Public</Badge>
            ) : (
              <Badge variant="outline" className="bg-muted">Private</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {fileEntries.length} file{fileEntries.length !== 1 ? 's' : ''}: {fileEntries.map(([_, file]) => file.filename).join(', ')}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground pt-0">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>{gist.stargazers_count || 0}</span>
          </div>
          <div>
            {new Date(gist.created_at).toLocaleDateString()}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}