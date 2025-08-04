import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import TimelineEventForm from './_TimelineEventForm';
import { type BreadcrumbItem } from '@/types';

interface Props {
  timelineEvent: any;
  mediaItems: any[];
}

export default function Edit({ timelineEvent, mediaItems }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Timeline Events', href: '/timeline-events' },
    { title: timelineEvent.translated_content.title.en, href: `/timeline-events/${timelineEvent.id}` },
    { title: 'Edit', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit – ${timelineEvent.translated_content.title.en}`} />

      <h1 className="text-2xl font-bold mb-6">Edit Timeline Event</h1>

      <TimelineEventForm
        timelineEvent={timelineEvent}
        mediaItems={mediaItems}
        submitUrl={`/timeline-events/${timelineEvent.id}`}
        method="put"
      />
    </AppLayout>
  );
}
