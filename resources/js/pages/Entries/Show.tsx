// resources/js/pages/Entries/Show.tsx
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, Clock } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

interface Need {
    id: number;
    name: string;
    name_ar: string;
    pivot: {
        is_fulfilled: boolean;
        notes: string | null;
    };
}

interface Props {
    entry: {
        id: number;
        form_id: string | null;
        entry_number: string | null;
        date_submitted: string | null;
        submitter_name: string | null;
        location: string | null;
        status: string | null;
        InternalLink: string | null;
        host: any | null;
        displacedFamilies: any[];
        martyrs: any[];
        shelters: any[];
        hosted_families_count: number;
        martyrs_count: number;
        shelters_count: number;
    };
    allNeeds: Need[];
    stats: {
        total_displaced_families: number;
        total_needs: number;
        fulfilled_needs: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Form Entries', href: '/form-entries' },
    { title: 'View', href: '' },
];

function renderField(label: string, value: any) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <p className="mb-2">
            <strong className="text-gray-700">{label}:</strong>
            <span className="ml-2">{value}</span>
        </p>
    );
}

function renderImageLinks(images: string | null) {
    if (!images || images === '') return null;

    try {
        const urls = JSON.parse(images);
        if (!Array.isArray(urls) || urls.length === 0) return null;

        return (
            <div className="flex flex-col gap-1">
                {urls.map((url, idx) => (
                    <a
                        key={idx}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 flex gap-1 items-center hover:underline"
                    >
                        Image {idx + 1} <ExternalLink className="w-4 h-4" />
                    </a>
                ))}
            </div>
        );
    } catch (error) {
        const urls = images.split(',').filter(url => url.trim() !== '');
        if (urls.length === 0) return null;

        return (
            <div className="flex flex-col gap-1">
                {urls.map((url, idx) => (
                    <a
                        key={idx}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 flex gap-1 items-center hover:underline"
                    >
                        Image {idx + 1} <ExternalLink className="w-4 h-4" />
                    </a>
                ))}
            </div>
        );
    }
}

function renderStatus(status: string | null) {
    if (!status || status === '') return null;
    const statuses = status.split(',').filter(s => s.trim() !== '');
    if (statuses.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1">
            {statuses.map((status, index) => (
                <Badge key={index} variant="outline">{status}</Badge>
            ))}
        </div>
    );
}

function renderNeeds(needs: Need[]) {
    if (!needs || needs.length === 0) return <span className="text-gray-500">No needs</span>;

    return (
        <div className="space-y-2">
            {needs.map((need) => (
                <div key={need.id} className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                    {need.pivot.is_fulfilled ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium">{need.name_ar}</span>
                    <Badge variant={need.pivot.is_fulfilled ? "default" : "secondary"}>
                        {need.pivot.is_fulfilled ? "✓" : "Pending"}
                    </Badge>
                    {need.pivot.notes && (
                        <span className="text-sm text-gray-600">({need.pivot.notes})</span>
                    )}
                </div>
            ))}
        </div>
    );
}

function renderBooleanField(value: string | null): string {
    if (value === 'نعم') return 'Yes';
    if (value === 'لا') return 'No';
    return value || 'N/A';
}

export default function Show({ entry, allNeeds, stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Entry ${entry.entry_number || 'N/A'}`} />

            <div className="flex flex-col gap-4 p-4">
                {/* Header with Statistics */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Entry #{entry.entry_number || 'N/A'}</h1>
                        <p className="text-sm text-muted-foreground">
                            {stats.total_displaced_families} families • {stats.total_needs} total needs • {stats.fulfilled_needs} fulfilled
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/form-entries">← Back to Entries</Link>
                    </Button>
                </div>

                {/* Entry Details */}
                <Card>
                    <CardHeader><CardTitle>Entry Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            {renderField('Form ID', entry.form_id)}
                            {renderField('Entry Number', entry.entry_number)}
                            {renderField('Submitter Name', entry.submitter_name)}
                            {renderField('Location', entry.location)}
                            {entry.status && renderField('Status', renderStatus(entry.status))}
                        </div>
                        <div>
                            {entry.InternalLink && renderField('Internal Link', (
                                <a href={entry.InternalLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 flex gap-1 items-center">
                                    View Form <ExternalLink className="w-4 h-4" />
                                </a>
                            ))}
                            {renderField('Date Submitted', entry.date_submitted ? new Date(entry.date_submitted).toLocaleString() : null)}
                            {renderField('Hosted Families Count', entry.hosted_families_count)}
                            {renderField('Martyrs Count', entry.martyrs_count)}
                            {renderField('Shelters Count', entry.shelters_count)}
                        </div>
                    </CardContent>
                </Card>

                {/* Host Details */}
                {entry.host && entry.host.full_name && (
                    <Card>
                        <CardHeader><CardTitle>Host Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                {renderField('Full Name', entry.host.full_name)}
                                {renderField('Family Count', entry.host.family_count)}
                                {renderField('Location', entry.host.location)}
                                {renderField('Address', entry.host.address)}
                                {renderField('Phone', entry.host.phone)}
                            </div>
                            <div>
                                {renderField('Family Book Number', entry.host.family_book_number)}
                                {renderField('Children Under 8 Months', renderBooleanField(entry.host.children_under_8_months))}
                                {entry.host.children_under_8_months === 'نعم' && renderField('Birth Details', entry.host.birth_details)}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Displaced Families */}
                {entry.displacedFamilies?.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Displaced Families ({entry.displacedFamilies.length})</CardTitle></CardHeader>
                        <CardContent>
                            {entry.displacedFamilies.map((family, index) => (
                                <Card key={family.id} className="mb-4">
                                    <CardHeader><CardTitle className="text-lg">Family {index + 1}</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            {renderField('Individuals Count', family.individuals_count)}
                                            {renderField('Contact', family.contact)}
                                            {renderField('Wife Name', family.wife_name)}
                                            {renderField('Children Info', family.children_info)}
                                            {renderField('Family Book Number', family.family_book_number)}
                                            {renderField('Assistance Type', family.assistance_type)}
                                            {renderField('Provider', family.provider)}
                                            {renderField('Date Received', family.date_received)}
                                            {renderField('Notes', family.notes)}
                                        </div>
                                        <div>
                                            {renderField('Return Possible', renderBooleanField(family.return_possible))}
                                            {renderField('Previous Assistance', renderBooleanField(family.previous_assistance))}
                                            {renderField('Children Under 8 Months', renderBooleanField(family.children_under_8_months))}
                                            {family.children_under_8_months === 'نعم' && renderField('Birth Details', family.birth_details)}
                                            {family.images && renderField('Images', renderImageLinks(family.images))}
                                        </div>
                                        <div className="md:col-span-2">
                                            <strong className="text-gray-700">Current Needs:</strong>
                                            <div className="mt-2">
                                                {renderNeeds(family.needs)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Martyrs */}
                {entry.martyrs?.filter(m => m.name).length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Martyrs ({entry.martyrs.filter(m => m.name).length})</CardTitle></CardHeader>
                        <CardContent>
                            {entry.martyrs.filter(m => m.name).map((martyr, index) => (
                                <Card key={martyr.id} className="mb-4">
                                    <CardHeader><CardTitle className="text-lg">Martyr {index + 1}</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            {renderField('Name', martyr.name)}
                                            {renderField('Age', martyr.age)}
                                            {renderField('Place of Martyrdom', martyr.place)}
                                        </div>
                                        <div>
                                            {renderField('Relative Contact', martyr.relative_contact)}
                                            {martyr.image && renderField('Images', renderImageLinks(martyr.image))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Shelters and their Families */}
                {entry.shelters?.filter(s => s.place || s.contact || (s.displacedFamilies && s.displacedFamilies.length > 0)).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Shelters ({entry.shelters.filter(s => s.place || s.contact || (s.displacedFamilies && s.displacedFamilies.length > 0)).length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {entry.shelters.filter(s => s.place || s.contact || (s.displacedFamilies && s.displacedFamilies.length > 0)).map((shelter, index) => (
                                <Card key={shelter.id} className="mb-4">
                                    <CardHeader><CardTitle className="text-lg">Shelter {index + 1}</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                {renderField('Place', shelter.place)}
                                                {renderField('Contact', shelter.contact)}
                                            </div>
                                            <div>
                                                {shelter.images && renderField('Images', renderImageLinks(shelter.images))}
                                            </div>
                                        </div>

                                        {/* Families in Shelter */}
                                        {shelter.displacedFamilies?.length > 0 && (
                                            <div className="border-t pt-4">
                                                <h4 className="font-semibold mb-3">Families in Shelter ({shelter.displacedFamilies.length})</h4>
                                                {shelter.displacedFamilies.map((family, familyIndex) => (
                                                    <Card key={family.id} className="mt-2 mb-2 bg-gray-50">
                                                        <CardHeader><CardTitle className="text-md">Family {familyIndex + 1}</CardTitle></CardHeader>
                                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                {renderField('Individuals Count', family.individuals_count)}
                                                                {renderField('Contact', family.contact)}
                                                                {renderField('Wife Name', family.wife_name)}
                                                                {renderField('Children Info', family.children_info)}
                                                                {renderField('Family Book Number', family.family_book_number)}
                                                                {renderField('Assistance Type', family.assistance_type)}
                                                                {renderField('Provider', family.provider)}
                                                                {renderField('Date Received', family.date_received)}
                                                                {renderField('Notes', family.notes)}
                                                            </div>
                                                            <div>
                                                                {renderField('Return Possible', renderBooleanField(family.return_possible))}
                                                                {renderField('Previous Assistance', renderBooleanField(family.previous_assistance))}
                                                                {renderField('Children Under 8 Months', renderBooleanField(family.children_under_8_months))}
                                                                {family.children_under_8_months === 'نعم' && renderField('Birth Details', family.birth_details)}
                                                                {family.images && renderField('Images', renderImageLinks(family.images))}
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <strong className="text-gray-700">Current Needs:</strong>
                                                                <div className="mt-2">
                                                                    {renderNeeds(family.needs)}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* All Available Needs Summary */}
                {allNeeds.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>All Available Needs ({allNeeds.length})</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {allNeeds.map(need => (
                                    <Badge key={need.id} variant="outline" className="justify-center">
                                        {need.name_ar}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
