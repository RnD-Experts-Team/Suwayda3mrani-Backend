import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import TimelineEventForm from './_TimelineEventForm';
import { type BreadcrumbItem } from '@/types';

interface Props {
  /** provided by controller */
  mediaItems: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Timeline Events', href: '/timeline-events' },
  { title: 'Create', href: '/timeline-events/create' },
];

export default function Create({ mediaItems }: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Timeline Event" />

      <h1 className="text-2xl font-bold mb-6">Create Timeline Event</h1>

      <TimelineEventForm
        mediaItems={mediaItems}
        submitUrl="/timeline-events"
        method="post"
      />
    </AppLayout>
  );
}
