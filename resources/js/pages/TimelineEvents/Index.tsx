// resources/js/pages/TimelineEvents/Index.tsx

import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
} from '@/components/ui/pagination';
import {
  Trash2, Edit, Plus, Search, Filter, RotateCcw, Eye, Star, StarOff, Calendar, Clock, FileText
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface TimelineEvent {
  id: number;
  timeline_event_id: string;
  period: string;
  is_highlighted: boolean;
  is_active: boolean;
  sort_order: number;
  translated_content: {
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    mediaType?: string;
    mediaUrl?: string;
  };
  media_count: number;
  created_at: string;
  updated_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Props {
  timelineEvents?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    data: TimelineEvent[];
    links: PaginationLink[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
  } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Timeline Events', href: '/timeline-events' },
];

export default function TimelineEventsIndex(props: Props) {
  const { timelineEvents = null } = props || {};

  // Create safe data objects
  const safeTimelineEvents = {
    data: timelineEvents?.data || [],
    links: timelineEvents?.links || [],
    meta: {
      current_page: timelineEvents?.current_page || 1,
      last_page: timelineEvents?.last_page || 1,
      per_page: timelineEvents?.per_page || 12,
      total: timelineEvents?.total || 0,
      from: timelineEvents?.from || null,
      to: timelineEvents?.to || null,
    }
  };

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked && safeTimelineEvents.data.length > 0) {
      setSelectedItems(safeTimelineEvents.data.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id));
    }
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      router.delete(`/timeline-events/${itemToDelete}`);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedItems.length > 0) {
      router.post('/timeline-events/bulk-delete', { ids: selectedItems });
    }
    setBulkDeleteDialogOpen(false);
    setSelectedItems([]);
  };

  const toggleHighlighted = (timelineEvent: TimelineEvent) => {
    router.patch(`/timeline-events/${timelineEvent.id}/toggle-highlighted`, {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Safe calculations
  const hasData = safeTimelineEvents.data.length > 0;
  const isEmpty = safeTimelineEvents.meta.total === 0;
  const totalResults = safeTimelineEvents.meta.total;
  const fromResult = safeTimelineEvents.meta.from;
  const toResult = safeTimelineEvents.meta.to;

  // Helper function to render results info
  const renderResultsInfo = () => {
    if (isEmpty) {
      return "No timeline events found. Create your first timeline event to get started.";
    } else if (fromResult && toResult) {
      return `Showing ${fromResult} to ${toResult} of ${totalResults} results`;
    } else if (totalResults > 0) {
      return `${totalResults} timeline event${totalResults !== 1 ? 's' : ''}`;
    } else {
      return "Loading timeline events...";
    }
  };

  const EmptyState = () => (
    <Card className="overflow-hidden">
      <CardContent className="py-16">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No timeline events yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create your first timeline event to start documenting historical events.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-4">
            <Link href="/timeline-events/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Timeline Event
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Timeline Events" />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Timeline Events</h1>
            <p className="text-sm text-muted-foreground">
              {renderResultsInfo()}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete} size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedItems.length})
              </Button>
            )}
            <Link href="/timeline-events/create">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Timeline Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedItems.length === safeTimelineEvents.data.length && safeTimelineEvents.data.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedItems.length} of {safeTimelineEvents.data.length} selected
                      </span>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeTimelineEvents.data.map((timelineEvent) => (
                <Card key={timelineEvent.id} className="overflow-hidden group">
                  <div className="relative">
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={selectedItems.includes(timelineEvent.id)}
                        onCheckedChange={(checked) => handleSelectItem(timelineEvent.id, Boolean(checked))}
                      />
                    </div>

                    {/* Highlighted Star */}
                    <button
                      onClick={() => toggleHighlighted(timelineEvent)}
                      className="absolute top-3 right-3 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {timelineEvent.is_highlighted ? (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>

                    {/* Media Preview */}
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                      {timelineEvent.translated_content?.mediaUrl ? (
                        timelineEvent.translated_content.mediaType === 'video' ? (
                          <video 
                            src={timelineEvent.translated_content.mediaUrl} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={timelineEvent.translated_content.mediaUrl}
                            alt={timelineEvent.translated_content?.title?.en || 'Timeline event'}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Clock className="w-8 h-8" />
                          <span className="text-xs">No media</span>
                        </div>
                      )}
                    </div>

                    {/* Period Badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {timelineEvent.period || 'No period'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Title */}
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {timelineEvent.translated_content?.title?.en || 'Untitled Timeline Event'}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {timelineEvent.translated_content?.description?.en || 'No description'}
                      </p>

                      {/* Event Info */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          ID: {timelineEvent.timeline_event_id || 'Unknown'}
                        </div>
                        {timelineEvent.media_count > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {timelineEvent.media_count} media item{timelineEvent.media_count !== 1 ? 's' : ''}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Order: {timelineEvent.sort_order ?? 0}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-1">
                          <Link href={`/timeline-events/${timelineEvent.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/timeline-events/${timelineEvent.id}/edit`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(timelineEvent.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex gap-1">
                          {timelineEvent.is_highlighted && (
                            <Badge variant="default" className="text-xs">
                              Highlighted
                            </Badge>
                          )}
                          {!timelineEvent.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {safeTimelineEvents.meta.last_page > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {safeTimelineEvents.links.map((link, index) => (
                      <PaginationItem key={index}>
                        {link.label === '&laquo; Previous' ? (
                          <PaginationPrevious 
                            href={link.url || '#'}
                            className={!link.url ? 'pointer-events-none opacity-50' : ''}
                          />
                        ) : link.label === 'Next &raquo;' ? (
                          <PaginationNext 
                            href={link.url || '#'}
                            className={!link.url ? 'pointer-events-none opacity-50' : ''}
                          />
                        ) : (
                          <PaginationLink 
                            href={link.url || '#'}
                            isActive={link.active}
                            className={!link.url ? 'pointer-events-none opacity-50' : ''}
                          >
                            {link.label}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the timeline event and all associated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} timeline events?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected timeline events and all associated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
