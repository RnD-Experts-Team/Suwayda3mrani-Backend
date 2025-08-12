// resources/js/pages/Entries/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Filter, RotateCcw, Eye, MapPin, FileText, Download } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

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

interface Props {
    entries: {
        data: Entry[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number | null;
        to: number | null;
    };
    filters?: {
        entry_number?: string;
        submitter_name?: string;
        location?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Entries', href: '/entries' },
];

export default function EntriesIndex({ entries, filters = {} }: Props) {
    const applyFilters = (newFilters = {}) => {
        router.get('/entries', { ...filters, ...newFilters }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const resetFilters = () => {
        router.get('/entries');
    };

    const exportFilteredEntries = () => {
        router.visit('/entries/export', {
            method: 'get',
            data: filters,
            force: true, // Forces a direct request to handle file download
            onSuccess: () => {
                // Optional: Handle success if needed (e.g., show a toast)
            },
            onError: (errors) => {
                console.error('Export failed:', errors);
                // Optional: Show error message to user
            }
        });
    };

    const isEmpty = entries.data.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Entries" />

            <div className="space-y-4 p-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Entries</h1>
                        <p className="text-sm text-muted-foreground">
                            {isEmpty ? "No entries found" : `Showing ${entries.from ?? 'N/A'}-${entries.to ?? 'N/A'} of ${entries.total} entries`}
                        </p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                        <Button size="sm" variant="secondary" onClick={exportFilteredEntries}>
                            <Download className="w-4 h-4 mr-1" /> Export
                        </Button>
                        <Link href="/entries/create">
                            <Button size="sm">
                                <Plus className="w-4 h-4" /> Create Entry
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="px-6 py-4 border-b flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            <CardTitle>Filters</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                            <RotateCcw className="w-4 h-4" /> Reset
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        <Input
                            placeholder="Entry Number"
                            defaultValue={filters?.entry_number || ''}
                            onBlur={(e) => applyFilters({ entry_number: e.target.value })}
                        />
                        <Input
                            placeholder="Submitter Name"
                            defaultValue={filters?.submitter_name || ''}
                            onBlur={(e) => applyFilters({ submitter_name: e.target.value })}
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
                                <SelectItem value="قرية/مكان إيواء (أو إيجار)">قرية/مكان إيواء (أو إيجار)</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Entries List */}
                {isEmpty ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <FileText className="mx-auto w-10 h-10 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">No entries found</p>
                            <div className="mt-4">
                                <Link href="/entries/create">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" /> Create Entry
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {entries.data.map((entry) => (
                            <Card key={entry.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">Entry #{entry.entry_number}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {entry.submitter_name || 'No submitter'}
                                            </p>
                                        </div>
                                        {entry.status && (
                                            <div className="flex flex-wrap gap-1">
                                                {entry.status.split(',').map((status, index) => (
                                                    <Badge key={index} variant="outline">{status}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {entry.location && (
                                        <p className="flex items-center gap-1 text-sm">
                                            <MapPin className="w-4 h-4" /> {entry.location}
                                        </p>
                                    )}

                                    <p className="text-sm">
                                        Submitted: {new Date(entry.date_submitted).toLocaleDateString()}
                                    </p>

                                    <div className="flex justify-between text-sm">
                                        <span>Families: {entry.hosted_families_count}</span>
                                        <span>Martyrs: {entry.martyrs_count}</span>
                                        <span>Shelters: {entry.shelters_count}</span>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/entries/${entry.id}`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Eye className="w-4 h-4 mr-2" /> View
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="flex justify-center mt-6">
                        <div className="flex gap-1">
                            {entries.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(entries.links[0].url)}
                                >
                                    Previous
                                </Button>
                            )}

                            {Array.from({ length: entries.last_page }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={page === entries.current_page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => router.get(`/entries?page=${page}`)}
                                >
                                    {page}
                                </Button>
                            ))}

                            {entries.current_page < entries.last_page && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(entries.links[entries.links.length - 1].url)}
                                >
                                    Next
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
