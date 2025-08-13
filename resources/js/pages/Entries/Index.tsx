// resources/js/pages/Entries/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Filter, RotateCcw, Eye, MapPin, FileText, Download, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { BreadcrumbItem } from '@/types';

interface Need {
    id: number;
    name: string;
    name_ar: string;
}

interface Entry {
    id: number;
    entry_number: string;
    submitter_name: string | null;
    location: string | null;
    status: string | null;
    date_submitted: string;
    hosted_families_count: number;
    martyrs_count: number;
    shelters_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    entries: {
        data: Entry[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number | null;
        to: number | null;
    };
    needs: Need[];
    filters?: {
        entry_number?: string;
        submitter_name?: string;
        location?: string;
        status?: string;
        needs?: number[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Form Entries', href: '/form-entries' },
];

export default function EntriesIndex({ entries, needs, filters = {} }: Props) {
    // Initialize state properly from filters
    const [selectedNeeds, setSelectedNeeds] = useState<number[]>(() => {
        return filters?.needs ? filters.needs.map(id => parseInt(String(id))) : [];
    });
    const [needsPopoverOpen, setNeedsPopoverOpen] = useState(false);

    // Better effect to sync state with URL parameters
    useEffect(() => {
        const urlNeeds = filters?.needs ? filters.needs.map(id => parseInt(String(id))) : [];
        setSelectedNeeds(urlNeeds);
    }, [JSON.stringify(filters?.needs)]); // Use JSON.stringify to properly detect array changes

    const applyFilters = (newFilters = {}) => {
        const filterParams = { ...filters, ...newFilters };

        // Remove page when applying new filters (except for pagination clicks)
        if (!newFilters.hasOwnProperty('page')) {
            delete filterParams.page;
        }

        // Force update needs state if needs are being updated
        if (newFilters.hasOwnProperty('needs')) {
            setSelectedNeeds(newFilters.needs || []);
        }

        router.get('/form-entries', filterParams, {
            preserveState: true,
            preserveScroll: true,
            replace: false,
            onSuccess: () => {
                // Force state sync after successful navigation
                if (newFilters.hasOwnProperty('needs')) {
                    setSelectedNeeds(newFilters.needs || []);
                }
            }
        });
    };

    const resetFilters = () => {
        setSelectedNeeds([]);
        router.get('/form-entries', {}, {
            preserveState: false,
            preserveScroll: false
        });
    };

    const handleNeedsChange = (needId: number, checked: boolean) => {
        let updatedNeeds: number[];
        if (checked) {
            updatedNeeds = [...selectedNeeds, needId];
        } else {
            updatedNeeds = selectedNeeds.filter(id => id !== needId);
        }
        setSelectedNeeds(updatedNeeds);

        // Apply immediately for better UX
        applyFilters({ needs: updatedNeeds });
    };

    const applyNeedsFilter = () => {
        applyFilters({ needs: selectedNeeds });
        setNeedsPopoverOpen(false);
    };

    const clearNeedsFilter = () => {
        setSelectedNeeds([]);
        applyFilters({ needs: [] });
        setNeedsPopoverOpen(false);
    };

    const handlePaginationClick = (url: string | null) => {
        if (!url) return;

        const urlObj = new URL(url);
        const page = urlObj.searchParams.get('page');

        // Preserve all current filters when paginating
        router.get('/form-entries', {
            ...filters,
            page: page || 1
        }, {
            preserveState: true,
            preserveScroll: false
        });
    };

    const getSelectedNeedsNames = () => {
        return needs
            .filter(need => selectedNeeds.includes(need.id))
            .map(need => need.name_ar);
    };

    const isEmpty = entries.data.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Entries" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Form Entries</h1>
                        <p className="text-sm text-muted-foreground">
                            {isEmpty ? "No entries found" : `Showing ${entries.from ?? 'N/A'}-${entries.to ?? 'N/A'} of ${entries.total} entries`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <a href="/form-entries/export">
                            <Button variant="secondary" className="gap-1">
                                <Download className="h-4 w-4" /> Export
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Filters */}
                <Card className="overflow-hidden">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                        <div className="lg:col-span-1 flex gap-2">
                            <Button variant="outline" onClick={resetFilters} className="gap-1">
                                <RotateCcw className="h-4 w-4" /> Reset
                            </Button>
                        </div>

                        <Input
                            placeholder="Entry Number"
                            defaultValue={filters?.entry_number || ''}
                            onBlur={(e) => applyFilters({ entry_number: e.target.value })}
                            className="w-full"
                        />

                        <Input
                            placeholder="Submitter Name"
                            defaultValue={filters?.submitter_name || ''}
                            onBlur={(e) => applyFilters({ submitter_name: e.target.value })}
                            className="w-full"
                        />

                        <Select
                            value={filters?.location || 'all'}
                            onValueChange={(val) => applyFilters({ location: val === 'all' ? '' : val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                <SelectItem value="عائلة مضيفة">عائلة مضيفة</SelectItem>
                                <SelectItem value="مكان ايواء (او اجار)">مكان ايواء (او اجار)</SelectItem>
                                <SelectItem value="no-location">لا يوجد</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.status || 'all'}
                            onValueChange={(val) => applyFilters({ status: val === 'all' ? '' : val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="أسماء ضحايا">أسماء ضحايا</SelectItem>
                                <SelectItem value="منازل محترقة">منازل محترقة</SelectItem>
                                <SelectItem value="منازل مسروقة">منازل مسروقة</SelectItem>
                                <SelectItem value="نزوح">نزوح</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Needs Filter */}
                        <Popover open={needsPopoverOpen} onOpenChange={setNeedsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span>
                                        {selectedNeeds.length === 0
                                            ? 'Select Needs'
                                            : `${selectedNeeds.length} need${selectedNeeds.length > 1 ? 's' : ''} selected`
                                        }
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="start">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Filter by Needs</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {needs.map((need) => {
                                                const isChecked = selectedNeeds.includes(need.id);
                                                return (
                                                    <div key={need.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`need-${need.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => handleNeedsChange(need.id, checked as boolean)}
                                                        />
                                                        <Label htmlFor={`need-${need.id}`} className="text-sm font-normal cursor-pointer">
                                                            {need.name_ar}
                                                        </Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            onClick={applyNeedsFilter}
                                            className="flex-1"
                                            size="sm"
                                        >
                                            Apply Filter
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={clearNeedsFilter}
                                            size="sm"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>

                {/* Active Filters Display */}
                {(selectedNeeds.length > 0 || Object.values(filters).some(f => f && f !== 'all' && (Array.isArray(f) ? f.length > 0 : true))) && (
                    <div className="flex flex-wrap gap-2">
                        {filters?.entry_number && (
                            <Badge variant="secondary" className="gap-1">
                                Entry: {filters.entry_number}
                                <button
                                    onClick={() => applyFilters({ entry_number: '' })}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {filters?.submitter_name && (
                            <Badge variant="secondary" className="gap-1">
                                Submitter: {filters.submitter_name}
                                <button
                                    onClick={() => applyFilters({ submitter_name: '' })}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {filters?.location && filters.location !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                                Location: {filters.location}
                                <button
                                    onClick={() => applyFilters({ location: '' })}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {filters?.status && filters.status !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                                Status: {filters.status}
                                <button
                                    onClick={() => applyFilters({ status: '' })}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {getSelectedNeedsNames().map((needName, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                {needName}
                                <button
                                    onClick={() => {
                                        const needToRemove = needs.find(n => n.name_ar === needName);
                                        if (needToRemove) {
                                            const updatedNeeds = selectedNeeds.filter(id => id !== needToRemove.id);
                                            setSelectedNeeds(updatedNeeds);
                                            applyFilters({ needs: updatedNeeds });
                                        }
                                    }}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Content */}
                {isEmpty ? (
                    <Card className="text-center">
                        <CardContent className="py-16">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-3 text-lg font-medium">No entries found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Adjust your filters to see results
                            </p>
                            <div className="mt-4 flex justify-center gap-3">
                                <Button variant="outline" onClick={resetFilters}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entries.data.map((entry) => (
                            <Card key={entry.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex-1 flex flex-col">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h3 className="font-semibold leading-tight">Entry #{entry.entry_number}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.submitter_name || 'No submitter'}
                                                </p>
                                            </div>
                                            {entry.status && (
                                                <div className="flex flex-wrap gap-1">
                                                    {entry.status.split(',').map((status, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">{status.trim()}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {entry.location && (
                                            <p className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{entry.location}</span>
                                            </p>
                                        )}

                                        <p className="text-sm text-muted-foreground">
                                            Submitted: {new Date(entry.date_submitted).toLocaleDateString()}
                                        </p>

                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="space-y-1">
                                                <p className="font-medium">Families</p>
                                                <p>{entry.hosted_families_count}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">Martyrs</p>
                                                <p>{entry.martyrs_count}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">Shelters</p>
                                                <p>{entry.shelters_count}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t">
                                        <Link href={`/form-entries/${entry.id}`} className="w-full">
                                            <Button variant="default" className="w-full gap-2">
                                                <Eye className="h-4 w-4" /> View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Enhanced Pagination */}
                {entries.last_page > 1 && (
                    <div className="flex flex-col items-center gap-4 pt-4">
                        {/* Pagination Info */}
                        <div className="text-sm text-muted-foreground">
                            Page {entries.current_page} of {entries.last_page} ({entries.total} total entries)
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex gap-1 flex-wrap justify-center">
                            {entries.links.map((link, index) => {
                                // Skip disabled prev/next links
                                if (!link.url) {
                                    if (link.label.includes('Previous')) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                disabled
                                                className="gap-1"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                        );
                                    }
                                    if (link.label.includes('Next')) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                disabled
                                                className="gap-1"
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    return null;
                                }

                                // Handle prev/next buttons
                                if (link.label.includes('Previous')) {
                                    return (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            onClick={() => handlePaginationClick(link.url)}
                                            className="gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                    );
                                }

                                if (link.label.includes('Next')) {
                                    return (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            onClick={() => handlePaginationClick(link.url)}
                                            className="gap-1"
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    );
                                }

                                // Handle page numbers
                                return (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        onClick={() => handlePaginationClick(link.url)}
                                        className="min-w-[40px]"
                                    >
                                        {link.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
