import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  AlertTriangle,
  Plus,
  FileCode,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth/auth-provider";
import { GistService, Gist } from "@/lib/api/gist-service";
import { formatDistanceToNow } from "date-fns";

type SortField = "updated" | "created" | "stars";
type SortOrder = "asc" | "desc";
type FilterVisibility = "all" | "public" | "private";

export default function GistListPage() {
  const { octokit } = useAuth();
  const [gists, setGists] = useState<Gist[]>([]);
  const [starredGists, setStarredGists] = useState<Gist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updated");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterVisibility, setFilterVisibility] =
    useState<FilterVisibility>("all");

  useEffect(() => {
    const fetchGists = async () => {
      if (!octokit) return;

      try {
        setIsLoading(true);
        setError(null);

        const gistService = new GistService(octokit);
        const [myGists, starred] = await Promise.all([
          gistService.getGists(),
          gistService.getStarredGists(),
        ]);

        setGists(myGists);
        setStarredGists(starred);
      } catch (err) {
        console.error("Error fetching gists:", err);
        setError("Failed to load gists. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGists();
  }, [octokit]);

  const filteredGists = (list: Gist[]) => {
    return list
      .filter((gist) => {
        // Apply visibility filter
        if (filterVisibility === "public" && !gist.public) return false;
        if (filterVisibility === "private" && gist.public) return false;

        // Apply search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const descriptionMatch = gist.description
            ?.toLowerCase()
            .includes(searchLower);
          const filesMatch = Object.values(gist.files).some((file) =>
            file.filename.toLowerCase().includes(searchLower)
          );
          return descriptionMatch || filesMatch;
        }

        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        let comparison = 0;

        if (sortField === "updated") {
          comparison =
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        } else if (sortField === "created") {
          comparison =
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortField === "stars") {
          comparison = (b.stargazers_count || 0) - (a.stargazers_count || 0);
        }

        return sortOrder === "asc" ? -comparison : comparison;
      });
  };

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

  const sortedGists = filteredGists(gists);
  const sortedStarredGists = filteredGists(starredGists);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Your Gists</h1>
          <Button asChild>
            <Link to="/gists/create" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>New Gist</span>
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          Browse and manage all your GitHub Gists in one place.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gists..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={filterVisibility}
            onValueChange={(value) =>
              setFilterVisibility(value as FilterVisibility)
            }
          >
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gists</SelectItem>
              <SelectItem value="public">Public only</SelectItem>
              <SelectItem value="private">Private only</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
          >
            <SelectTrigger className="w-[140px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last updated</SelectItem>
              <SelectItem value="created">Created date</SelectItem>
              <SelectItem value="stars">Star count</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortOrder === "desc" ? (
                  <ArrowDownNarrowWide className="h-4 w-4" />
                ) : (
                  <ArrowUpNarrowWide className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as SortOrder)}
              >
                <DropdownMenuRadioItem value="desc">
                  Descending
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="asc">
                  Ascending
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-initial">
            All Gists
          </TabsTrigger>
          <TabsTrigger
            value="starred"
            className="flex-1 sm:flex-initial text-white dark"
          >
            Starred
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {sortedGists.length === 0 ? (
            <div className="mt-8 text-center">
              {searchQuery || filterVisibility !== "all" ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No gists found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">
                    You don't have any gists yet
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Create your first gist to get started
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/gists/create">Create Gist</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sortedGists.map((gist, index) => (
                <motion.div
                  key={gist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GistCard gist={gist} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="starred">
          {sortedStarredGists.length === 0 ? (
            <div className="mt-8 text-center">
              {searchQuery || filterVisibility !== "all" ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">
                    No starred gists found
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">
                    You don't have any starred gists
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Star gists that you want to keep track of
                  </p>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sortedStarredGists.map((gist, index) => (
                <motion.div
                  key={gist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GistCard gist={gist} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
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
            {gist.description || firstFile?.filename || "Untitled Gist"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {gist.public ? (
              <Badge variant="outline">Public</Badge>
            ) : (
              <Badge variant="outline" className="bg-muted">
                Private
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{gist.stargazers_count || 0}</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {fileEntries.length} file{fileEntries.length !== 1 ? "s" : ""}:{" "}
            {fileEntries.map(([_, file]) => file.filename).join(", ")}
          </p>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(gist.updated_at))} ago
        </CardFooter>
      </Card>
    </Link>
  );
}
