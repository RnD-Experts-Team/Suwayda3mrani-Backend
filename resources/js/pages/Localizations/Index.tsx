// resources/js/pages/Localizations/Index.tsx

import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Trash2, Edit, Plus, Search, Filter, RotateCcw, Database } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Localization {
    id: number;
    language: string;
    group: string | null;
    key: string;
    value: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    localizations?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        data: Localization[];
        links: PaginationLink[];
        first_page_url: string;
        last_page_url: string;
        next_page_url: string | null;
        prev_page_url: string | null;
        path: string;
    } | null;
    languages?: string[] | null;
    groups?: string[] | null;
    filters?: {
        language?: string;
        group?: string;
        search?: string;
        status?: string;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Localizations', href: '/localizations' },
];

export default function LocalizationsIndex(props: Props) {
    const {
        localizations = null,
        languages = null,
        groups = null,
        filters = null
    } = props || {};

    // Create safe data objects
    const safeLocalizations = {
        data: localizations?.data || [],
        links: localizations?.links || [],
        meta: {
            current_page: localizations?.current_page || 1,
            last_page: localizations?.last_page || 1,
            per_page: localizations?.per_page || 15,
            total: localizations?.total || 0,
            from: localizations?.from || null,
            to: localizations?.to || null,
        }
    };

    const safeLanguages: string[] = Array.isArray(languages) ? languages : [];
    const safeGroups: string[] = Array.isArray(groups) ? groups : [];
    const safeFilters = filters || {};

    // Helper functions to convert between display and filter values
    const getFilterValue = (displayValue: string) => {
        if (displayValue === '__all__') return '';
        if (displayValue === '__null__') return 'null';
        return displayValue;
    };

    const getDisplayValue = (filterValue: string, type: 'group' | 'language' | 'status') => {
        if (!filterValue) return '__all__';
        if (filterValue === 'null' && type === 'group') return '__null__';
        return filterValue;
    };

    // State management with safe initial values
    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [selectedLanguage, setSelectedLanguage] = useState(
        getDisplayValue(safeFilters.language || '', 'language')
    );
    const [selectedGroup, setSelectedGroup] = useState(
        getDisplayValue(safeFilters.group || '', 'group')
    );
    const [selectedStatus, setSelectedStatus] = useState(
        getDisplayValue(safeFilters.status || '', 'status')
    );
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Add a flag to track if we should trigger filter on search change
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Handle filter changes with debounce for search - FIXED
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

    // FIXED: Single filter application function that uses current state
    const applyFilters = () => {
        const params: Record<string, string> = {};
        
        if (searchTerm?.trim()) params.search = searchTerm.trim();
        
        const languageFilter = getFilterValue(selectedLanguage);
        if (languageFilter) params.language = languageFilter;
        
        const groupFilter = getFilterValue(selectedGroup);
        if (groupFilter) params.group = groupFilter;
        
        const statusFilter = getFilterValue(selectedStatus);
        if (statusFilter) params.status = statusFilter;

        console.log('Applying filters with params:', params);

        router.get('/localizations', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // FIXED: Function that applies filters with specific values (not dependent on state)
    const applyFiltersWithValues = (overrides: {
        language?: string;
        group?: string;
        status?: string;
        search?: string;
    } = {}) => {
        const params: Record<string, string> = {};
        
        const searchValue = overrides.search !== undefined ? overrides.search : searchTerm;
        const languageValue = overrides.language !== undefined ? overrides.language : selectedLanguage;
        const groupValue = overrides.group !== undefined ? overrides.group : selectedGroup;
        const statusValue = overrides.status !== undefined ? overrides.status : selectedStatus;
        
        if (searchValue?.trim()) params.search = searchValue.trim();
        
        const languageFilter = getFilterValue(languageValue);
        if (languageFilter) params.language = languageFilter;
        
        const groupFilter = getFilterValue(groupValue);
        if (groupFilter) params.group = groupFilter;
        
        const statusFilter = getFilterValue(statusValue);
        if (statusFilter) params.status = statusFilter;

        console.log('Applying filters with values:', params, 'overrides:', overrides);

        router.get('/localizations', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedLanguage('__all__');
        setSelectedGroup('__all__');
        setSelectedStatus('__all__');
        router.get('/localizations');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked && safeLocalizations.data.length > 0) {
            setSelectedItems(safeLocalizations.data.map(item => item.id));
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
            router.delete(`/localizations/${itemToDelete}`, {
                onSuccess: () => {
                    console.log('Localization deleted successfully');
                },
                onError: () => {
                    console.error('Failed to delete localization');
                }
            });
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true);
    };

    const confirmBulkDelete = () => {
        if (selectedItems.length > 0) {
            router.post('/localizations/bulk-delete', {
                ids: selectedItems
            }, {
                onSuccess: () => {
                    setSelectedItems([]);
                    console.log(`${selectedItems.length} localizations deleted successfully`);
                },
                onError: () => {
                    console.error('Failed to delete localizations');
                }
            });
        }
        setBulkDeleteDialogOpen(false);
    };

    // Safe calculations
    const hasActiveFilters = Boolean(
        searchTerm?.trim() || 
        selectedLanguage !== '__all__' || 
        selectedGroup !== '__all__' || 
        selectedStatus !== '__all__'
    );
    const hasData = safeLocalizations.data.length > 0;
    const isEmpty = safeLocalizations.meta.total === 0;
    const totalResults = safeLocalizations.meta.total;
    const fromResult = safeLocalizations.meta.from;
    const toResult = safeLocalizations.meta.to;

    // Helper function to render results info
    const renderResultsInfo = () => {
        if (isEmpty && !hasActiveFilters) {
            return "No localizations found. Create your first localization to get started.";
        } else if (isEmpty && hasActiveFilters) {
            return "No results match your current filters.";
        } else if (fromResult && toResult) {
            return `Showing ${fromResult} to ${toResult} of ${totalResults} results`;
        } else if (totalResults > 0) {
            return `${totalResults} result${totalResults !== 1 ? 's' : ''}`;
        } else {
            return "Loading results...";
        }
    };

    // Empty state component
    const EmptyState = () => (
        <Card className="overflow-hidden">
            <CardContent className="py-16">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Database className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            {hasActiveFilters ? "No results found" : "No localizations yet"}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {hasActiveFilters 
                                ? "Try adjusting your filters or search terms to find what you're looking for."
                                : "Get started by creating your first localization entry to manage translations."
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
                        <Link href="/localizations/create">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Localization
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Localizations" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Localizations</h1>
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
                        <Link href="/localizations/create">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Localization
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card className="overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Filters
                            </CardTitle>
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
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search keys, values, groups..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value || '')}
                                    className="pl-10"
                                />
                            </div>
                            
                            {/* Language Select - FIXED */}
                            <Select value={selectedLanguage} onValueChange={(value) => {
                                setSelectedLanguage(value);
                                // Apply filters immediately with the new value
                                applyFiltersWithValues({ language: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Languages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Languages</SelectItem>
                                    {safeLanguages.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Group Select - FIXED */}
                            <Select value={selectedGroup} onValueChange={(value) => {
                                setSelectedGroup(value);
                                // Apply filters immediately with the new value
                                applyFiltersWithValues({ group: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Groups" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Groups</SelectItem>
                                    <SelectItem value="__null__">No Group</SelectItem>
                                    {safeGroups.map((group) => (
                                        <SelectItem key={group} value={group}>
                                            {group}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Status Select - FIXED */}
                            <Select value={selectedStatus} onValueChange={(value) => {
                                setSelectedStatus(value);
                                // Apply filters immediately with the new value
                                applyFiltersWithValues({ status: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Conditional rendering: Empty state or Table */}
                {isEmpty ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Table */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-4 w-12">
                                                    <Checkbox
                                                        checked={selectedItems.length === safeLocalizations.data.length && safeLocalizations.data.length > 0}
                                                        onCheckedChange={handleSelectAll}
                                                    />
                                                </TableHead>
                                                <TableHead className="px-4">Language</TableHead>
                                                <TableHead className="px-4">Group</TableHead>
                                                <TableHead className="px-4">Key</TableHead>
                                                <TableHead className="px-4 min-w-[200px]">Value</TableHead>
                                                <TableHead className="px-4">Status</TableHead>
                                                <TableHead className="px-4 w-24">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {safeLocalizations.data.map((localization) => (
                                                <TableRow key={localization.id} className="hover:bg-muted/50">
                                                    <TableCell className="px-4 py-3">
                                                        <Checkbox
                                                            checked={selectedItems.includes(localization.id)}
                                                            onCheckedChange={(checked) => handleSelectItem(localization.id, Boolean(checked))}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <Badge variant="outline">
                                                            {(localization.language || '').toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        {localization.group ? (
                                                            <Badge variant="secondary">
                                                                {localization.group}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">No group</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 font-mono text-sm">
                                                        {localization.key || ''}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <div className="truncate" title={localization.value || ''}>
                                                            {localization.value || ''}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <Badge variant={localization.is_active ? "default" : "destructive"}>
                                                            {localization.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <Link href={`/localizations/${localization.id}/edit`}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(localization.id)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pagination */}
                        {safeLocalizations.meta.last_page > 1 && (
                            <div className="flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {safeLocalizations.links.map((link, index) => (
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
                            This action cannot be undone. This will permanently delete the localization.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedItems.length} localizations?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected localizations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
