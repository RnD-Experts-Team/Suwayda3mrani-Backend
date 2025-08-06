// resources/js/pages/Media/Index.tsx

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
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
    Pagination, 
    PaginationContent, 
    PaginationItem, 
    PaginationLink, 
    PaginationNext, 
    PaginationPrevious 
} from '@/components/ui/pagination';
import { 
    Trash2, Edit, Plus, Search, Filter, RotateCcw, 
    Database, Image, Video, Upload, Link as LinkIcon, 
    Star, StarOff, Eye
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Media {
    id: number;
    media_id: string;
    type: 'image' | 'video';
    source_type: 'upload' | 'google_drive' | 'external_link';
    file_path?: string;
    google_drive_id?: string;
    external_url?: string;
    thumbnail_path?: string;
    title_key: string;
    description_key?: string;
    source_url?: string;
    is_active: boolean;
    featured_on_home: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    translated_content: {
        id: string;
        type: string;
        source_type: string;
        url: string;
        sourceUrl?: string;
        thumbnail?: string;
        title?: { en: string; ar: string };
        description?: { en: string; ar: string };
    };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    media?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        data: Media[];
        links: PaginationLink[];
        first_page_url: string;
        last_page_url: string;
        next_page_url: string | null;
        prev_page_url: string | null;
        path: string;
    } | null;
    filters?: {
        type?: string;
        source_type?: string;
        featured?: string;
        search?: string;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Media', href: '/media' },
];

export default function MediaIndex(props: Props) {
    const {
        media = null,
        filters = null
    } = props || {};

    // Create safe data objects
    const safeMedia = {
        data: media?.data || [],
        links: media?.links || [],
        meta: {
            current_page: media?.current_page || 1,
            last_page: media?.last_page || 1,
            per_page: media?.per_page || 12,
            total: media?.total || 0,
            from: media?.from || null,
            to: media?.to || null,
        }
    };

    const safeFilters = filters || {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [selectedType, setSelectedType] = useState(safeFilters.type || '__all__');
    const [selectedSourceType, setSelectedSourceType] = useState(safeFilters.source_type || '__all__');
    const [selectedFeatured, setSelectedFeatured] = useState(safeFilters.featured || '__all__');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Add a flag to track if we should trigger filter on search change
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Handle filter changes with debounce for search
    useEffect(() => {
        // Don't trigger on initial load to prevent pagination reset
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Helper functions to convert between display and filter values
    const getFilterValue = (displayValue: string) => {
        if (displayValue === '__all__') return '';
        return displayValue;
    };

    const getDisplayValue = (filterValue: string) => {
        if (!filterValue) return '__all__';
        return filterValue;
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};
        
        if (searchTerm?.trim()) params.search = searchTerm.trim();
        
        const typeFilter = getFilterValue(selectedType);
        if (typeFilter) params.type = typeFilter;
        
        const sourceTypeFilter = getFilterValue(selectedSourceType);
        if (sourceTypeFilter) params.source_type = sourceTypeFilter;
        
        const featuredFilter = getFilterValue(selectedFeatured);
        if (featuredFilter) params.featured = featuredFilter;

        router.get('/media', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const applyFiltersWithValues = (overrides: {
        type?: string;
        source_type?: string;
        featured?: string;
        search?: string;
    } = {}) => {
        const params: Record<string, string> = {};
        
        const searchValue = overrides.search !== undefined ? overrides.search : searchTerm;
        const typeValue = overrides.type !== undefined ? overrides.type : selectedType;
        const sourceTypeValue = overrides.source_type !== undefined ? overrides.source_type : selectedSourceType;
        const featuredValue = overrides.featured !== undefined ? overrides.featured : selectedFeatured;
        
        if (searchValue?.trim()) params.search = searchValue.trim();
        
        const typeFilter = getFilterValue(typeValue);
        if (typeFilter) params.type = typeFilter;
        
        const sourceTypeFilter = getFilterValue(sourceTypeValue);
        if (sourceTypeFilter) params.source_type = sourceTypeFilter;
        
        const featuredFilter = getFilterValue(featuredValue);
        if (featuredFilter) params.featured = featuredFilter;

        router.get('/media', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedType('__all__');
        setSelectedSourceType('__all__');
        setSelectedFeatured('__all__');
        router.get('/media');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked && safeMedia.data.length > 0) {
            setSelectedItems(safeMedia.data.map(item => item.id));
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
            router.delete(`/media/${itemToDelete}`);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true);
    };

    const confirmBulkDelete = () => {
        if (selectedItems.length > 0) {
            router.post('/media/bulk-delete', { ids: selectedItems });
        }
        setBulkDeleteDialogOpen(false);
        setSelectedItems([]);
    };

    const toggleFeatured = (mediaItem: Media) => {
        router.patch(`/media/${mediaItem.id}/toggle-featured`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getSourceIcon = (sourceType: string) => {
        switch (sourceType) {
            case 'upload': return <Upload className="w-4 h-4" />;
            case 'google_drive': return <Database className="w-4 h-4" />;
            case 'external_link': return <LinkIcon className="w-4 h-4" />;
            default: return null;
        }
    };

    const getSourceBadgeColor = (sourceType: string) => {
        switch (sourceType) {
            case 'upload': return 'default';
            case 'google_drive': return 'secondary';
            case 'external_link': return 'outline';
            default: return 'default';
        }
    };

    // Safe calculations
    const hasActiveFilters = Boolean(
        searchTerm?.trim() || 
        selectedType !== '__all__' || 
        selectedSourceType !== '__all__' || 
        selectedFeatured !== '__all__'
    );
    const hasData = safeMedia.data.length > 0;
    const isEmpty = safeMedia.meta.total === 0;
    const totalResults = safeMedia.meta.total;
    const fromResult = safeMedia.meta.from;
    const toResult = safeMedia.meta.to;

    // Helper function to render results info
    const renderResultsInfo = () => {
        if (isEmpty && !hasActiveFilters) {
            return "No media items found. Upload your first media to get started.";
        } else if (isEmpty && hasActiveFilters) {
            return "No results match your current filters.";
        } else if (fromResult && toResult) {
            return `Showing ${fromResult} to ${toResult} of ${totalResults} results`;
        } else if (totalResults > 0) {
            return `${totalResults} media item${totalResults !== 1 ? 's' : ''}`;
        } else {
            return "Loading media...";
        }
    };

    const EmptyState = () => (
        <Card className="overflow-hidden">
            <CardContent className="py-16">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            {hasActiveFilters ? "No media found" : "No media yet"}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {hasActiveFilters 
                                ? "Try adjusting your filters to find what you're looking for."
                                : "Upload your first image or video to get started."
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
                        <Link href="/media/create">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Media
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
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
                        <Link href="/media/create">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Media
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
                            <div className="flex gap-2">
                                {hasActiveFilters && (
                                    <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-2">
                                        <RotateCcw className="w-4 h-4" />
                                        Clear Filters
                                    </Button>
                                )}
                                <div className="flex gap-1 border rounded-md p-1">
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                                            <div className="bg-current rounded-sm"></div>
                                            <div className="bg-current rounded-sm"></div>
                                            <div className="bg-current rounded-sm"></div>
                                            <div className="bg-current rounded-sm"></div>
                                        </div>
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <div className="flex flex-col gap-0.5 w-3">
                                            <div className="bg-current h-0.5 rounded"></div>
                                            <div className="bg-current h-0.5 rounded"></div>
                                            <div className="bg-current h-0.5 rounded"></div>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search media..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            {/* Type Filter */}
                            <Select value={selectedType} onValueChange={(value) => {
                                setSelectedType(value);
                                applyFiltersWithValues({ type: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Types</SelectItem>
                                    <SelectItem value="image">Images</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Source Type Filter */}
                            <Select value={selectedSourceType} onValueChange={(value) => {
                                setSelectedSourceType(value);
                                applyFiltersWithValues({ source_type: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Sources" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Sources</SelectItem>
                                    <SelectItem value="upload">Uploads</SelectItem>
                                    <SelectItem value="google_drive">Google Drive</SelectItem>
                                    <SelectItem value="external_link">External Links</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Featured Filter */}
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

                            {/* Manual Search Button (optional since we have auto-search) */}
                            <Button onClick={applyFilters} className="gap-2">
                                <Search className="w-4 h-4" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Conditional rendering: Empty state or Content */}
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
                                                checked={selectedItems.length === safeMedia.data.length && safeMedia.data.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {selectedItems.length} of {safeMedia.data.length} selected
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

                        {/* Media Grid/List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {safeMedia.data.map((item) => (
                                    <Card key={item.id} className="overflow-hidden group">
                                        <div className="relative">
                                            {/* Selection Checkbox */}
                                            <div className="absolute top-2 left-2 z-10">
                                                <Checkbox
                                                    checked={selectedItems.includes(item.id)}
                                                    onCheckedChange={(checked) => handleSelectItem(item.id, Boolean(checked))}
                                                />
                                            </div>

                                            {/* Featured Star */}
                                            <button
                                                onClick={() => toggleFeatured(item)}
                                                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {item.featured_on_home ? (
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                ) : (
                                                    <StarOff className="w-4 h-4" />
                                                )}
                                            </button>

                                            {/* Media Preview */}
                                            <div className="aspect-video bg-muted flex items-center justify-center">
                                                {item.translated_content?.thumbnail || item.translated_content?.url ? (
                                                    <img
                                                        src={item.translated_content.thumbnail || item.translated_content.url}
                                                        alt={item.translated_content?.title?.en || 'Media'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        {item.type === 'video' ? (
                                                            <Video className="w-8 h-8" />
                                                        ) : (
                                                            <Image className="w-8 h-8" />
                                                        )}
                                                        <span className="text-xs">No preview</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Video Indicator */}
                                            {item.type === 'video' && (
                                                <div className="absolute bottom-2 left-2">
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Video className="w-3 h-3" />
                                                        Video
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-sm truncate">
                                                        {item.translated_content?.title?.en || 'Untitled'}
                                                    </h3>
                                                    <Badge variant={getSourceBadgeColor(item.source_type)} className="gap-1 text-xs">
                                                        {getSourceIcon(item.source_type)}
                                                        {item.source_type.replace('_', ' ')}
                                                    </Badge>
                                                </div>

                                                {item.translated_content?.description?.en && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {item.translated_content.description.en}
                                                    </p>
                                                )}

                                                <div className="flex justify-between items-center pt-2">
                                                    <div className="flex gap-1">
                                                        <Link href={`/media/${item.id}`}>
                                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/media/${item.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(item.id)}
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    {item.featured_on_home && (
                                                        <Badge variant="default" className="text-xs">
                                                            Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            /* List View */
                            <Card className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {safeMedia.data.map((item) => (
                                            <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                                                <Checkbox
                                                    checked={selectedItems.includes(item.id)}
                                                    onCheckedChange={(checked) => handleSelectItem(item.id, Boolean(checked))}
                                                />

                                                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                                                    {item.translated_content?.thumbnail || item.translated_content?.url ? (
                                                        <img
                                                            src={item.translated_content.thumbnail || item.translated_content.url}
                                                            alt={item.translated_content?.title?.en || 'Media'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        item.type === 'video' ? (
                                                            <Video className="w-6 h-6 text-muted-foreground" />
                                                        ) : (
                                                            <Image className="w-6 h-6 text-muted-foreground" />
                                                        )
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium truncate">
                                                            {item.translated_content?.title?.en || 'Untitled'}
                                                        </h3>
                                                        <Badge variant="outline" className="gap-1">
                                                            {item.type === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                                                            {item.type}
                                                        </Badge>
                                                        <Badge variant={getSourceBadgeColor(item.source_type)} className="gap-1">
                                                            {getSourceIcon(item.source_type)}
                                                            {item.source_type.replace('_', ' ')}
                                                        </Badge>
                                                        {item.featured_on_home && (
                                                            <Badge variant="default">Featured</Badge>
                                                        )}
                                                    </div>
                                                    {item.translated_content?.description?.en && (
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {item.translated_content.description.en}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleFeatured(item)}
                                                        className="p-1 rounded hover:bg-muted"
                                                    >
                                                        {item.featured_on_home ? (
                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        ) : (
                                                            <StarOff className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                    <Link href={`/media/${item.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/media/${item.id}/edit`}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pagination */}
                        {safeMedia.meta.last_page > 1 && (
                            <div className="flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {safeMedia.links.map((link, index) => (
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
                            This action cannot be undone. This will permanently delete the media item and all associated files.
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

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedItems.length} media items?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected media items and all associated files.
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
