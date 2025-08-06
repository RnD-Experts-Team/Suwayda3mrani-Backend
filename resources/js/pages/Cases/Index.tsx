// resources/js/pages/Cases/Index.tsx (FULLY FIXED VERSION)

import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Trash2, Edit, Plus, Search, Filter, RotateCcw, Eye, Star, StarOff, Calendar, MapPin, FileText
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface CaseDetail {
  key: { en: string; ar: string };
  value: { en: string; ar: string };
  sort_order: number;
}

interface Case {
  id: number;
  case_id: string;
  type: string;
  url_slug: string;
  external_url?: string;
  incident_date: string;
  location: string;
  translated_content: {
    title: { en: string; ar: string };
    description?: { en: string; ar: string } | null;
    imagePath?: string;
    details: CaseDetail[];
  } | string; // ✅ Allow string for parsing
  media_count: number;
  is_active: boolean;
  is_featured: boolean;
}

interface Props {
  cases: {
    data: Case[];
    links: any[] | string; // ✅ Allow string for parsing
    meta: {
      current_page: number;
      last_page: number;
      total: number;
      per_page: number;
      from: number | null;
      to: number | null;
    };
  } | null;
  caseTypes: Record<string, { en: string; ar: string } | string>; // ✅ Allow string for parsing
  filters: {
    type?: string;
    featured?: string;
    search?: string;
  } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Cases', href: '/cases' },
];

export default function CasesIndex(props: Props) {

  const {
    cases = null,
    caseTypes = {},
    filters = null
  } = props || {};

  // ✅ Helper function to parse translated content
  const parseTranslatedContent = (translatedContent: any) => {
    if (typeof translatedContent === 'string') {
      try {
        const parsed = JSON.parse(translatedContent);
        return parsed;
      } catch (e) {
        console.error('Error parsing case translated content:', e, 'Raw content:', translatedContent);
        return {
          title: { en: 'Untitled', ar: 'بدون عنوان' },
          description: { en: 'No description', ar: 'لا يوجد وصف' },
          details: [],
          imagePath: null
        };
      }
    }
    return translatedContent || {
      title: { en: 'Untitled', ar: 'بدون عنوان' },
      description: { en: 'No description', ar: 'لا يوجد وصف' },
      details: [],
      imagePath: null
    };
  };

  // ✅ Helper function to parse case types
  const parseCaseTypes = (types: Record<string, { en: string; ar: string } | string>) => {
    const parsed: Record<string, { en: string; ar: string }> = {};
    
    Object.entries(types).forEach(([key, value]) => {
      if (typeof value === 'string') {
        try {
          parsed[key] = JSON.parse(value);
        } catch (e) {
          console.error(`Error parsing case type ${key}:`, e);
          parsed[key] = { en: key, ar: key };
        }
      } else {
        parsed[key] = value;
      }
    });
    
    return parsed;
  };

  // ✅ Helper function to parse links if they're stringified
  const parseLinks = (links: any[] | string) => {
    if (typeof links === 'string') {
      try {
        return JSON.parse(links);
      } catch (e) {
        console.error('Error parsing links:', e);
        return [];
      }
    }
    return Array.isArray(links) ? links : [];
  };

  // ✅ Create safe data objects with proper parsing
  const safeCases = {
    data: cases?.data || [],
    links: parseLinks(cases?.links || []),
    meta: {
      current_page: cases?.meta?.current_page || 1,
      last_page: cases?.meta?.last_page || 1,
      total: cases?.meta?.total || 0,
      per_page: cases?.meta?.per_page || 12,
      from: cases?.meta?.from || null,
      to: cases?.meta?.to || null,
    }
  };

  const safeFilters = filters || {};
  const parsedCaseTypes = parseCaseTypes(caseTypes); // ✅ Parse the case types



  const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
  const [selectedType, setSelectedType] = useState(safeFilters.type || '__all__');
  const [selectedFeatured, setSelectedFeatured] = useState(safeFilters.featured || '__all__');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getFilterValue = (displayValue: string) => {
    return displayValue === '__all__' ? '' : displayValue;
  };

  const applyFilters = () => {
    const params: Record<string, string> = {};
    
    if (searchTerm?.trim()) params.search = searchTerm.trim();
    
    const typeFilter = getFilterValue(selectedType);
    if (typeFilter) params.type = typeFilter;
    
    const featuredFilter = getFilterValue(selectedFeatured);
    if (featuredFilter) params.featured = featuredFilter;

    router.get('/cases', Object.keys(params).length > 0 ? params : {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const applyFiltersWithValues = (overrides: {
    type?: string;
    featured?: string;
    search?: string;
  } = {}) => {
    const params: Record<string, string> = {};
    
    const searchValue = overrides.search !== undefined ? overrides.search : searchTerm;
    const typeValue = overrides.type !== undefined ? overrides.type : selectedType;
    const featuredValue = overrides.featured !== undefined ? overrides.featured : selectedFeatured;
    
    if (searchValue?.trim()) params.search = searchValue.trim();
    
    const typeFilter = getFilterValue(typeValue);
    if (typeFilter) params.type = typeFilter;
    
    const featuredFilter = getFilterValue(featuredValue);
    if (featuredFilter) params.featured = featuredFilter;

    router.get('/cases', Object.keys(params).length > 0 ? params : {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('__all__');
    setSelectedFeatured('__all__');
    router.get('/cases');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && safeCases.data.length > 0) {
      setSelectedItems(safeCases.data.map(item => item.id));
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
      router.delete(`/cases/${itemToDelete}`);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedItems.length > 0) {
      router.post('/cases/bulk-delete', { ids: selectedItems });
    }
    setBulkDeleteDialogOpen(false);
    setSelectedItems([]);
  };

  const toggleFeatured = (caseItem: Case) => {
    router.patch(`/cases/${caseItem.id}/toggle-featured`, {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const hasActiveFilters = Boolean(
    searchTerm?.trim() || 
    selectedType !== '__all__' || 
    selectedFeatured !== '__all__'
  );
  
  // ✅ FIXED: Check both data array length AND meta total
  const isEmpty = safeCases.data.length === 0 || safeCases.meta.total === 0;
  const totalResults = safeCases.meta.total;
  const fromResult = safeCases.meta.from;
  const toResult = safeCases.meta.to;



  const renderResultsInfo = () => {
    if (isEmpty && !hasActiveFilters) {
      return "No cases found. Create your first case to get started.";
    } else if (isEmpty && hasActiveFilters) {
      return "No results match your current filters.";
    } else if (fromResult && toResult) {
      return `Showing ${fromResult} to ${toResult} of ${totalResults} results`;
    } else if (totalResults > 0) {
      return `${totalResults} case${totalResults !== 1 ? 's' : ''}`;
    } else {
      return "Loading cases...";
    }
  };

  const EmptyState = () => (
    <Card className="overflow-hidden">
      <CardContent className="py-16">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {hasActiveFilters ? "No cases found" : "No cases yet"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {hasActiveFilters 
                ? "Try adjusting your filters to find what you're looking for."
                : "Create your first case to start documenting incidents."
              }
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-4">
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
            <Link href="/cases/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Case
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );



  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Cases" />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
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
            <Link href="/cases/create">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Case
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedType} onValueChange={(value) => {
                setSelectedType(value);
                applyFiltersWithValues({ type: value });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  {Object.entries(parsedCaseTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFeatured} onValueChange={(value) => {
                setSelectedFeatured(value);
                applyFiltersWithValues({ featured: value });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Items</SelectItem>
                  <SelectItem value="true">Featured Only</SelectItem>
                  <SelectItem value="false">Not Featured</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={applyFilters} className="gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ✅ ALWAYS SHOW CONTENT - Don't check isEmpty for now */}
        {safeCases.data.length === 0 ? (
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
                        checked={selectedItems.length === safeCases.data.length && safeCases.data.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedItems.length} of {safeCases.data.length} selected
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

            {/* ✅ Cases Grid - FIXED */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeCases.data.map((caseItem, index) => {
                console.log(`Rendering case ${index + 1}:`, caseItem.id, caseItem.case_id); // ✅ Debug log
                
                // ✅ Parse the translated content properly
                const translatedContent = parseTranslatedContent(caseItem.translated_content);
                
                console.log(`Case ${caseItem.id} translated content:`, translatedContent); // ✅ Debug log
                
                return (
                  <Card key={caseItem.id} className="overflow-hidden group">
                    <div className="relative">
                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={selectedItems.includes(caseItem.id)}
                          onCheckedChange={(checked) => handleSelectItem(caseItem.id, Boolean(checked))}
                        />
                      </div>

                      <button
                        onClick={() => toggleFeatured(caseItem)}
                        className="absolute top-3 right-3 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {caseItem.is_featured ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>

                      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                        {translatedContent.imagePath ? (
                          <img
                            src={translatedContent.imagePath}
                            alt={translatedContent.title?.en || 'Case image'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Case image failed to load:', translatedContent.imagePath);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="w-8 h-8" />
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="capitalize">
                          {parsedCaseTypes[caseItem.type]?.en || caseItem.type}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {translatedContent.title?.en || caseItem.case_id || 'Untitled'}
                        </h3>

                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {translatedContent.description?.en || 'No description'}
                        </p>

                        <div className="space-y-1">
                          {caseItem.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {caseItem.location}
                            </div>
                          )}
                          {caseItem.incident_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(caseItem.incident_date).toLocaleDateString()}
                            </div>
                          )}
                          {caseItem.media_count > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {caseItem.media_count} media item{caseItem.media_count !== 1 ? 's' : ''}
                            </div>
                          )}
                          {translatedContent.details && translatedContent.details.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {translatedContent.details.length} detail{translatedContent.details.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex gap-1">
                            <Link href={`/cases/${caseItem.id}`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/cases/${caseItem.id}/edit`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(caseItem.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex gap-1">
                            {caseItem.is_featured && (
                              <Badge variant="default" className="text-xs">
                                Featured
                              </Badge>
                            )}
                            {!caseItem.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {safeCases.meta.last_page > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {safeCases.links.map((link, index) => (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the case and all associated content.
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
            <AlertDialogTitle>Delete {selectedItems.length} cases?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected cases and all associated content.
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
