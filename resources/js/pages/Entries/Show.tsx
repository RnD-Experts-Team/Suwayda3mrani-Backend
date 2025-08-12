// resources/js/pages/Entries/Show.tsx
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

interface Entry {
    id: number;
    form_id: string | null;
    entry_number: string | null;
    date_submitted: string | null;
    submitter_name: string | null;
    location: string | null;
    status: string | null;
    InternalLink: string | null;
    host: any | null;
    hostedFamilies: any[];
    martyrs: any[];
    shelters: any[];
    hosted_families_count: number;
    martyrs_count: number;
    shelters_count: number;
}

interface Props {
    entry: Entry;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Entries', href: '/entries' },
    { title: 'View', href: '' },
];

function renderField(label: string, value: any) {
    // Only render if value is not null, undefined, or empty string
    if (value === null || value === undefined || value === '') return null;
    return (
        <p>
            <strong>{label}</strong> {value}
        </p>
    );
}

function renderImageLinks(images: string | null) {
    if (!images || images === '') return null;
    const urls = images.split(',').filter(url => url.trim() !== '');
    if (urls.length === 0) return null;
    return (
        <div className="flex flex-col gap-1">
            {urls.map((url, idx) => (
                <a key={idx} href={url.trim()} target="_blank" rel="noopener noreferrer" className="text-blue-500 flex gap-1 items-center">
                    Image {idx + 1} <ExternalLink className="w-4 h-4" />
                </a>
            ))}
        </div>
    );
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

export default function Show({ entry }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Entry ${entry.entry_number || 'N/A'}`} />

            <div className="flex flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Entry #{entry.entry_number || 'N/A'}</h1>
                    <p className="text-sm text-muted-foreground">All details for this entry and related models</p>
                </div>

                {/* Entry Basic Details */}
                <Card>
                    <CardHeader><CardTitle>Entry Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            {renderField('ID:', entry.id)}
                            {renderField('Form ID:', entry.form_id)}
                            {renderField('Entry Number:', entry.entry_number)}
                            {renderField('Submitter Name:', entry.submitter_name)}
                            {renderField('Location:', entry.location)}
                            {entry.status && renderField('Status:', renderStatus(entry.status))}
                        </div>
                        <div>
                            {entry.InternalLink && renderField('Internal Link:', (
                                <a href={entry.InternalLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 flex gap-1 items-center">
                                    Link <ExternalLink className="w-4 h-4" />
                                </a>
                            ))}
                            {renderField('Date Submitted:', entry.date_submitted ? new Date(entry.date_submitted).toLocaleString() : null)}
                            {renderField('Hosted Families Count:', entry.hosted_families_count)}
                            {renderField('Martyrs Count:', entry.martyrs_count)}
                            {renderField('Shelters Count:', entry.shelters_count)}
                        </div>
                    </CardContent>
                </Card>

                {/* Host Details */}
                {entry.host && (
                    <Card>
                        <CardHeader><CardTitle>Host Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                {renderField('ID:', entry.host.id)}
                                {renderField('Full Name:', entry.host.full_name)}
                                {renderField('Family Count:', entry.host.family_count)}
                                {renderField('Location:', entry.host.location)}
                            </div>
                            <div>
                                {renderField('Address:', entry.host.address)}
                                {renderField('Phone:', entry.host.phone)}
                                {renderField('Family Book Number:', entry.host.family_book_number)}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Hosted Families */}
                {entry.hostedFamilies?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Hosted Families ({entry.hostedFamilies.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {entry.hostedFamilies.map(family => (
                                <Card key={family.id} className="mb-4">
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            {renderField('ID:', family.id)}
                                            {renderField('Individuals Count:', family.individuals_count)}
                                            {renderField('Contact:', family.contact)}
                                            {renderField('Wife Name:', family.wife_name)}
                                            {renderField('Children Info:', family.children_info)}
                                            {family.needs && renderField('Needs:', family.needs.split(',').filter(s => s.trim() !== '').join(', '))}
                                            {renderField('Assistance Type:', family.assistance_type)}
                                            {renderField('Provider:', family.provider)}
                                            {renderField('Date Received:', family.date_received)}
                                            {renderField('Notes:', family.notes)}
                                        </div>
                                        <div>
                                            {renderField('Return Possible:', family.return_possible)}
                                            {renderField('Previous Assistance:', family.previous_assistance)}
                                            {family.images && renderField('Images:', renderImageLinks(family.images))}
                                            {renderField('Family Book Number:', family.family_book_number)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Martyrs */}
                {entry.martyrs?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Martyrs ({entry.martyrs.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {entry.martyrs.map(martyr => (
                                <Card key={martyr.id} className="mb-4">
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            {renderField('ID:', martyr.id)}
                                            {renderField('Name:', martyr.name)}
                                            {renderField('Age:', martyr.age)}
                                            {renderField('Place:', martyr.place)}
                                        </div>
                                        <div>
                                            {renderField('Relative Contact:', martyr.relative_contact)}
                                            {martyr.images && renderField('Images:', renderImageLinks(martyr.images))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Shelters */}
                {entry.shelters?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Shelters ({entry.shelters.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {entry.shelters.map(shelter => (
                                <Card key={shelter.id} className="mb-4">
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            {renderField('ID:', shelter.id)}
                                            {renderField('Place:', shelter.place)}
                                            {renderField('Contact:', shelter.contact)}
                                            {shelter.images && renderField('Images:', renderImageLinks(shelter.images))}
                                        </div>
                                    </CardContent>
                                    {/* Nested Displaced Families */}
                                    {shelter.displacedFamilies?.length > 0 && (
                                        <div className="p-4">
                                            <h4 className="font-semibold mb-2">Displaced Families ({shelter.displacedFamilies.length})</h4>
                                            {shelter.displacedFamilies.map(family => (
                                                <Card key={family.id} className="mt-2 mb-2">
                                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            {renderField('ID:', family.id)}
                                                            {renderField('Individuals Count:', family.individuals_count)}
                                                            {renderField('Contact:', family.contact)}
                                                            {renderField('Wife Name:', family.wife_name)}
                                                            {renderField('Children Info:', family.children_info)}
                                                            {family.needs && renderField('Needs:', family.needs.split(',').filter(s => s.trim() !== '').join(', '))}
                                                            {renderField('Assistance Type:', family.assistance_type)}
                                                            {renderField('Provider:', family.provider)}
                                                            {renderField('Date Received:', family.date_received)}
                                                            {renderField('Notes:', family.notes)}
                                                        </div>
                                                        <div>
                                                            {renderField('Return Possible:', family.return_possible)}
                                                            {renderField('Previous Assistance:', family.previous_assistance)}
                                                            {family.images && renderField('Images:', renderImageLinks(family.images))}
                                                            {renderField('Family Book Number:', family.family_book_number)}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end">
                    <Button asChild variant="outline">
                        <Link href="/entries">Back to Entries</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

