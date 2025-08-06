import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, Layout, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Localizations',
        href: '/localizations',
        icon: LayoutGrid,
    },
    {
        title: 'Home Sections',
        href: '/home-sections',
        icon: LayoutGrid,
    },
    {
        title: 'Media',
        href: '/media',
        icon: LayoutGrid,
    },
    {
        title: 'Testimonies',
        href: '/testimonies',
        icon: LayoutGrid,
    },
    {
        title: 'Aid Organizations',
        href: '/aid-organizations',
        icon: LayoutGrid,
    },
    {
        title: 'Aid Categories',
        href: '/aid-categories',
        icon: LayoutGrid,
    },
    {
        title: 'Cases',
        href: '/cases',
        icon: LayoutGrid,
    },
    {
        title: 'Stories',
        href: '/stories',
        icon: LayoutGrid,
    },
    {
        title: 'Timeline Events',
        href: '/timeline-events',
        icon: LayoutGrid,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/localizations" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
