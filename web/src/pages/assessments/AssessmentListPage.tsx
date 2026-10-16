import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { assessmentsApi } from "@/services/assessments";
import { Plus, Clock, ChevronRight, ChevronLeft, Trash2, Edit2, AlertCircle } from "lucide-react";
import type { Assessment, PaginationMeta } from "@/types";

function SessionSummary({ session }: { session?: Assessment["latest_session"] }) {
  if (!session) return null;

  if (session.status === "active")
    return (
      <span className="flex items-center gap-1 text-xs text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Live now
      </span>
    );

  if (session.status === "ended" && session.end_reason === "error")
    return <span className="text-xs text-destructive">Last: failed</span>;

  if (session.status === "ended")
    return <span className="text-xs text-muted-foreground">Last: completed</span>;

  return <span className="text-xs text-muted-foreground">Awaiting candidate</span>;
}

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchAssessments = (pageToFetch: number) => {
    setLoading(true);
    setError(null);
    assessmentsApi
      .list(pageToFetch)
      .then((res) => {
        setAssessments(res.data.assessments || []);
        if (res.data.meta) {
          setMeta(res.data.meta);
        }
      })
      .catch(() => setError("Failed to load assessments. Please refresh the page."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssessments(page);
  }, [page]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this assessment?")) return;

    setDeletingId(id);
    try {
      await assessmentsApi.delete(id);
      fetchAssessments(page);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Cannot delete this assessment because candidates have interview sessions recorded.";
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Assessments</h1>
        <Button onClick={() => navigate("/assessments/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New Assessment
        </Button>
      </div>

      {error && (
        <div className="border border-destructive/40 bg-destructive/10 rounded-lg p-3 text-sm text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
          <p className="mb-3">No assessments yet.</p>
          <Button variant="outline" onClick={() => navigate("/assessments/new")}>
            <Plus className="h-4 w-4 mr-1.5" /> Create your first assessment
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {assessments.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(`/assessments/${a.id}/invite`)}
            >
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.time_limit_min} min
                    </span>
                    {a.latest_session && (
                      <>
                        <span>·</span>
                        <SessionSummary session={a.latest_session} />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Edit Assessment"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/assessments/${a.id}/edit`);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Delete Assessment"
                    disabled={deletingId === a.id}
                    onClick={(e) => handleDelete(e, a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
          <div>
            Showing Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
