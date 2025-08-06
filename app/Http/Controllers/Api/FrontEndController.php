<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Localization;
use App\Models\Media;
use App\Models\AidOrganization;
use App\Models\Testimony;
use App\Models\HomeSection;
use App\Models\TimelineEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Cases;
use App\Models\Story;

class FrontEndController extends Controller
{
    // ===================================
    // CONFIGURATION CONSTANTS
    // ===================================
    
    private const CACHE_DURATION = [
        'short' => 300,   // 5 minutes for dynamic content
        'medium' => 900,  // 15 minutes for semi-static content
        'long' => 1800,   // 30 minutes for static content
        'extended' => 3600 // 1 hour for rarely changing content
    ];

    private const PAGINATION_LIMITS = [
        'gallery' => 12,
        'testimonials' => 20,
        'featured' => 6,
        'home_media' => 10
    ];

    // ===================================
    // LAYOUT & NAVIGATION (OPTIMIZED)
    // ===================================
    
    public function layoutFront()
    {
        return Cache::remember('layout_frontend_data_v3', self::CACHE_DURATION['extended'], function () {
            // Single optimized query with minimal data
            $requiredKeys = [
                'title', 'home', 'crisesArchive', 'media', 'aidEfforts', 'organizations', 
                'information', 'stories', 'news', 'timeline', 'dataOverview',
                'seeStories', 'takeAction', 'copyright', 'privacyPolicy', 
                'termsOfService', 'contact', 'switchToLight', 'switchToDark', 
                'toggleMenu', 'switchLanguage'
            ];

            // ✅ Single query with proper indexing
            $localizations = Localization::select(['language', 'group', 'key', 'value'])
                ->where('is_active', true)
                ->whereIn('language', ['en', 'ar'])
                ->whereIn('key', $requiredKeys)
                ->get();

            // ✅ Optimize grouping with single loop
            $result = ['en' => [], 'ar' => []];
            
            foreach ($localizations as $localization) {
                $lang = $localization->language;
                $key = $localization->key;
                $value = $localization->value;
                
                if (is_null($localization->group)) {
                    $result[$lang][$key] = $value;
                } else {
                    $result[$lang][$localization->group][$key] = $value;
                }
            }

            // ✅ Static logo path (avoid Storage::disk call on every request)
            $result['logo'] = asset('storage/general/suwayda3mrani.png');

            return $result;
        });
    }

    // ===================================
// HOME PAGE (OPTIMIZED)
// ===================================
public function homeFront()
{
    return Cache::remember(
        'home_frontend_data_v3',
        self::CACHE_DURATION['medium'],
        function () {

            $homeData = [];

            // FIX: drop the non-existent column
            $homeSections = HomeSection::select([
                    'id',
                    'type',
                    'sort_order',
                    'title_key',
                    'description_key'
                    // 'background_image_path',   <-- removed
                    // or use the real one:
                    // 'background_image',
                ])
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->keyBy('type');

            $this->buildHeroSection($homeSections, $homeData);
            $this->buildFeaturedMediaSection($homeData);
            $this->buildFeaturedOrganizationsSection($homeData);
            $this->buildFeaturedTestimoniesSection($homeData);
            $this->buildDynamicSections($homeSections, $homeData);

            usort(
                $homeData,
                fn ($a, $b) => ($a['sort_order'] ?? 999) <=> ($b['sort_order'] ?? 999)
            );

            return response()->json(
                array_map(
                    fn ($item) => array_diff_key($item, ['sort_order' => null]),
                    $homeData
                )
            );
        }
    );
}

    /**
     * ✅ Optimized hero section builder
     */
    private function buildHeroSection($homeSections, array &$homeData): void
{
    // Make sure we have a hero section
    if (!$homeSections->has('hero')) {
        return;
    }

    $heroSection = $homeSections->get('hero');

    // Pull translations with the correct model method
    $heroContent = [
        'en' => $heroSection->getTranslatedContent('en'),
        'ar' => $heroSection->getTranslatedContent('ar'),
    ];

    $homeData[] = [
        'id'         => "hero-{$heroSection->id}",
        'type'       => 'hero',
        'sort_order' => $heroSection->sort_order,
        'content'    => [
            'en' => [
                'title' => $heroContent['en']['title']        ?? '',
                'image' => $heroContent['en']['image']        ?? '',
                'description' => $heroContent['en']['description'] ?? '',
                'buttonText'   => $heroContent['en']['buttonText'] ?? '',
                'buttonVariant'=> $heroContent['en']['buttonVariant'] ?? '',
            ],
            'ar' => [
                'title' => $heroContent['ar']['title']        ?? '',
                'image' => $heroContent['ar']['image']        ?? '',
                'description' => $heroContent['ar']['description'] ?? '',
                'buttonText'   => $heroContent['ar']['buttonText'] ?? '',
                'buttonVariant'=> $heroContent['ar']['buttonVariant'] ?? '',
            ],
        ],
    ];
}

    /**
     * ✅ Optimized featured media section builder
     */
    private function buildFeaturedMediaSection(&$homeData)
    {
        // ✅ Use exists() check instead of count()
        if (!Media::where('is_active', true)->where('featured_on_home', true)->exists()) {
            return;
        }

        $featuredMedia = Media::select(['id', 'media_id', 'type', 'title_key', 'description_key', 'file_path', 'google_drive_id', 'external_url', 'thumbnail_path', 'source_url'])
            ->where('is_active', true)
            ->where('featured_on_home', true)
            ->orderBy('sort_order')
            ->limit(self::PAGINATION_LIMITS['home_media'])
            ->get();

        if ($featuredMedia->isEmpty()) return;

        // ✅ Bulk load translations
        $mediaItems = $this->transformMediaCollectionWithBulkTranslations($featuredMedia);

        $homeData[] = [
            'id' => 'media-gallery-1',
            'type' => 'media_gallery',
            'sort_order' => 100,
            'content' => [
                'title' => [
                    'en' => 'Media Gallery',
                    'ar' => 'معرض الوسائط'
                ],
                'mediaItems' => $mediaItems,
            ],
        ];
    }

    /**
     * ✅ Optimized featured organizations section builder
     */
    private function buildFeaturedOrganizationsSection(&$homeData)
    {
        if (!AidOrganization::where('is_active', true)->where('is_featured', true)->exists()) {
            return;
        }

        $featuredOrganizations = AidOrganization::select(['id', 'organization_id', 'type', 'name_key', 'description_key', 'background_image_path', 'website_url', 'contact_url'])
            ->with(['categories:id,slug'])
            ->where('is_active', true)
            ->where('is_featured', true)
            ->orderBy('sort_order')
            ->limit(self::PAGINATION_LIMITS['featured'])
            ->get();

        if ($featuredOrganizations->isEmpty()) return;

        $organizationContent = $featuredOrganizations->map(function ($org) {
            $content = $org->getMultilingualContent();
            return [
                'id' => "aid-org-{$org->id}",
                'type' => $org->type,
                'website_url' => $org->website_url,
                'contact_url' => $org->contact_url,
                'categories' => $org->categories->pluck('slug')->toArray(),
                'en' => $content['en'] ?? ['name' => '', 'description' => '', 'backgroundImage' => '', 'url' => ''],
                'ar' => $content['ar'] ?? ['name' => '', 'description' => '', 'backgroundImage' => '', 'url' => ''],
            ];
        })->toArray();

        $homeData[] = [
            'id' => 'aid-organizations',
            'type' => 'aid_organizations',
            'sort_order' => 200,
            'title' => [
                'en' => 'Aid and Response',
                'ar' => 'المساعدات والاستجابة'
            ],
            'content' => $organizationContent,
        ];
    }

    /**
     * ✅ Optimized featured testimonies section builder
     */
    private function buildFeaturedTestimoniesSection(&$homeData)
    {
        if (!Testimony::where('is_active', true)->where('is_featured', true)->exists()) {
            return;
        }

        $featuredTestimonies = Testimony::select(['id', 'testimony_id', 'title_key', 'description_key', 'background_image_path', 'survivor_name', 'survivor_age', 'survivor_location', 'date_of_incident'])
            ->where('is_active', true)
            ->where('is_featured', true)
            ->orderBy('sort_order')
            ->limit(4)
            ->get();

        if ($featuredTestimonies->isEmpty()) return;

        foreach ($featuredTestimonies as $index => $testimony) {
            $content = $testimony->getMultilingualContent();
            $homeData[] = [
                'id' => "testimonial-{$testimony->id}",
                'type' => 'testimonial',
                'sort_order' => 300 + $index,
                'content' => [
                    'en' => [
                        'category' => $content['category']['en'] ?? 'Testimony',
                        'title' => $content['title']['en'] ?? '',
                        'description' => $content['description']['en'] ?? '',
                        'imageUrl' => $content['imageUrl'] ?? '',
                    ],
                    'ar' => [
                        'category' => $content['category']['ar'] ?? 'شهادة',
                        'title' => $content['title']['ar'] ?? '',
                        'description' => $content['description']['ar'] ?? '',
                        'imageUrl' => $content['imageUrl'] ?? '',
                    ],
                    'url' => $content['url'] ?? '',
                    'survivor_name' => $testimony->survivor_name,
                    'survivor_age' => $testimony->survivor_age,
                    'survivor_location' => $testimony->survivor_location,
                    'date_of_incident' => $testimony->date_of_incident,
                ],
            ];
        }
    }

    /**
     * ✅ Optimized dynamic sections builder
     */
    private function buildDynamicSections($homeSections, array &$homeData): void
{
    // Ignore the hero – everything else is “dynamic”
    $dynamicSections = $homeSections->reject(fn ($s) => $s->type === 'hero');

    foreach ($dynamicSections as $section) {
        // Pull translations with the correct model method
        $contentEn = $section->getTranslatedContent('en');
        $contentAr = $section->getTranslatedContent('ar');

        $sectionData = [
            'id'         => "{$section->type}-{$section->id}",
            'type'       => $section->type,
            'sort_order' => $section->sort_order,
        ];

        switch ($section->type) {
            // Cards, key events, etc.
            case 'component_node':
            case 'key_events':
                $sectionData['content'] = [
                    'en' => [
                        'title'        => $contentEn['title']        ?? '',
                        'description'  => $contentEn['description']  ?? '',
                        'imageUrl'     => $contentEn['image']        ?? '',
                        'buttonText'   => $contentEn['buttonText']   ?? '',
                        'buttonVariant'=> $contentEn['buttonVariant']?? '',
                    ],
                    'ar' => [
                        'title'        => $contentAr['title']        ?? '',
                        'description'  => $contentAr['description']  ?? '',
                        'imageUrl'     => $contentAr['image']        ?? '',
                        'buttonText'   => $contentAr['buttonText']   ?? '',
                        'buttonVariant'=> $contentAr['buttonVariant']?? '',
                    ],
                    // Optional: add a URL derived from the action_key column if you have one
                    'url' => $section->action_key ?? '',
                ];
                break;

            // A parent section that groups child sections
            case 'section_group':
                $sectionData['content'] = [
                    'title' => [
                        'en' => $contentEn['title'] ?? '',
                        'ar' => $contentAr['title'] ?? '',
                    ],
                    // Fill this if you load child sections elsewhere
                    'sections' => [],
                ];
                break;

            // Simple suggestion blocks
            case 'suggestions':
                $sectionData['content'] = [
                    'en' => $contentEn,
                    'ar' => $contentAr,
                ];
                break;
        }

        $homeData[] = $sectionData;
    }
}

    // ===================================
    // MEDIA GALLERY (ULTRA-OPTIMIZED)
    // ===================================
    
    /**
     * Ultra-optimized media gallery with advanced caching and database optimization
     */
    public function getMediaItems(Request $request)
{
    // ✅ Minimal validation with custom rules
    $validated = $request->validate([
        'page' => 'integer|min:1|max:1000', // Prevent abuse
        'limit' => 'integer|min:1|max:24',   // Reasonable max
        'type' => 'in:image,video,all'
    ]);

    $page = $validated['page'] ?? 1;
    $limit = min($validated['limit'] ?? self::PAGINATION_LIMITS['gallery'], 24);
    $type = $validated['type'] ?? 'all';
    $offset = ($page - 1) * $limit;

    // ✅ Multi-layer cache strategy
    $mainCacheKey = "media_gallery_v2_{$type}_{$page}_{$limit}";
    $countCacheKey = "media_gallery_count_v2_{$type}";
    
    return Cache::remember($mainCacheKey, self::CACHE_DURATION['short'], function () use ($offset, $limit, $type, $countCacheKey, $page) {
        
        // ✅ Get total count from separate cache to avoid expensive COUNT queries
        $totalItems = Cache::remember($countCacheKey, self::CACHE_DURATION['medium'], function () use ($type) {
            $query = Media::where('is_active', true)->where('featured_on_home', true);
            
            if ($type !== 'all') {
                $query->where('type', $type);
            }
            
            return $query->count();
        });

        // ✅ Early return if no items - NOW WITH CORRECT VARIABLES
        if ($totalItems === 0) {
            return $this->buildEmptyGalleryResponse($totalItems, $limit, $page);
        }

        // ✅ Optimized query with only necessary columns and proper indexing
        $query = Media::select([
            'id', 'media_id', 'type', 'source_type', 'file_path', 
            'google_drive_id', 'external_url', 'thumbnail_path', 
            'title_key', 'description_key', 'source_url', 'created_at'
        ])
        ->where('is_active', true)
        ->where('featured_on_home', true);

        if ($type !== 'all') {
            $query->where('type', $type);
        }

        // ✅ Optimized ordering and pagination
        $items = $query->orderByDesc('created_at')
                      ->offset($offset)
                      ->limit($limit)
                      ->get();

        // ✅ Bulk load all translations in one query to avoid N+1
        $titleKeys = $items->pluck('title_key')->filter();
        $descriptionKeys = $items->pluck('description_key')->filter();
        $allKeys = $titleKeys->merge($descriptionKeys)->unique();

        $translations = [];
        if ($allKeys->isNotEmpty()) {
            $translations = Localization::whereIn('key', $allKeys)
                ->whereIn('language', ['en', 'ar'])
                ->where('is_active', true)
                ->get()
                ->groupBy('key')
                ->map(function ($keyTranslations) {
                    return $keyTranslations->pluck('value', 'language')->toArray();
                });
        }

        // ✅ Transform with pre-loaded translations
        $mediaItems = $items->map(function ($item) use ($translations) {
            return $this->transformMediaItemForGallery($item, $translations);
        });

        return $this->buildGalleryResponse($mediaItems, $totalItems, $page, $limit, $offset);
    });
}

    /**
     * ✅ Optimized media transformation with pre-loaded translations
     */
    private function transformMediaItemForGallery($item, $translations)
    {
        // Get translations efficiently
        $titleTrans = $translations[$item->title_key] ?? ['en' => '', 'ar' => ''];
        $descTrans = $translations[$item->description_key] ?? ['en' => '', 'ar' => ''];

        // ✅ Optimized URL generation
        $mediaUrl = $this->getOptimizedMediaUrl($item);
        $thumbnailUrl = $this->getOptimizedThumbnailUrl($item, $mediaUrl);

        return [
            'id' => $item->id,
            'media_id' => $item->media_id,
            'src' => $mediaUrl,
            'thumbnail' => $thumbnailUrl,
            'alt' => $titleTrans['en'] ?: "Media item {$item->id}",
            'title' => [
                'en' => $titleTrans['en'] ?? '',
                'ar' => $titleTrans['ar'] ?? ''
            ],
            'description' => [
                'en' => $descTrans['en'] ?? '',
                'ar' => $descTrans['ar'] ?? ''
            ],
            'type' => $item->type,
            'source_url' => $item->source_url,
            'created_at' => $item->created_at->toISOString()
        ];
    }

    /**
     * ✅ Bulk translation loading to prevent N+1 queries
     */
    private function transformMediaCollectionWithBulkTranslations($mediaCollection)
    {
        $titleKeys = $mediaCollection->pluck('title_key')->filter();
        $descriptionKeys = $mediaCollection->pluck('description_key')->filter();
        $allKeys = $titleKeys->merge($descriptionKeys)->unique();

        $translations = [];
        if ($allKeys->isNotEmpty()) {
            $translations = Localization::whereIn('key', $allKeys)
                ->whereIn('language', ['en', 'ar'])
                ->where('is_active', true)
                ->get()
                ->groupBy('key')
                ->map(fn($group) => $group->pluck('value', 'language')->toArray());
        }

        return $mediaCollection->map(function ($media) use ($translations) {
            $titleTrans = $translations[$media->title_key] ?? ['en' => '', 'ar' => ''];
            $descTrans = $translations[$media->description_key] ?? ['en' => '', 'ar' => ''];
            
            return [
                'id' => "media-{$media->id}",
                'url' => $this->getOptimizedMediaUrl($media),
                'thumbnail' => $this->getOptimizedThumbnailUrl($media, $this->getOptimizedMediaUrl($media)),
                'title' => $titleTrans,
                'description' => $descTrans,
                'sourceUrl' => $media->source_url,
                'type' => $media->type,
            ];
        })->toArray();
    }

    /**
     * ✅ Optimized URL generation without Storage::disk calls
     */
    private function getOptimizedMediaUrl($media)
    {
        switch ($media->source_type) {
            case 'upload':
                return $media->file_path ? asset("storage/{$media->file_path}") : null;
            case 'google_drive':
                return $media->google_drive_id ? "https://drive.google.com/uc?id={$media->google_drive_id}" : null;
            case 'external_link':
                return $media->external_url;
            default:
                return null;
        }
    }

    /**
     * ✅ Optimized thumbnail generation
     */
    private function getOptimizedThumbnailUrl($media, $fallbackUrl)
    {
        if ($media->thumbnail_path) {
            return asset("storage/{$media->thumbnail_path}");
        }

        if ($media->source_type === 'google_drive' && $media->type === 'image') {
            return "https://drive.google.com/thumbnail?id={$media->google_drive_id}&sz=w300";
        }

        return $media->type === 'image' ? $fallbackUrl : null;
    }

    /**
     * ✅ Optimized response builders
     */
    private function buildGalleryResponse($mediaItems, $totalItems, $page, $limit, $offset)
    {
        $hasMore = ($offset + $limit) < $totalItems;
        $totalPages = (int) ceil($totalItems / $limit);

        return response()->json([
            'success' => true,
            'data' => [
                'pageTitle' => [
                    'en' => 'Media Gallery',
                    'ar' => 'معرض الوسائط'
                ],
                'loadingMessages' => $this->getStaticLoadingMessages(),
                'mediaItems' => $mediaItems,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                    'total_items' => $totalItems,
                    'items_per_page' => $limit,
                    'has_more' => $hasMore,
                    'showing_from' => $offset + 1,
                    'showing_to' => min($offset + $limit, $totalItems)
                ]
            ]
        ]);
    }

    private function buildEmptyGalleryResponse($totalItems, $limit, $page)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'pageTitle' => [
                    'en' => 'Media Gallery',
                    'ar' => 'معرض الوسائط'
                ],
                'loadingMessages' => $this->getStaticLoadingMessages(),
                'mediaItems' => [],
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => 0,
                    'total_items' => $totalItems,
                    'items_per_page' => $limit,
                    'has_more' => false,
                    'showing_from' => 0,
                    'showing_to' => 0
                ]
            ]
        ]);
    }

    /**
     * ✅ Static loading messages to avoid repeated array creation
     */
    private function getStaticLoadingMessages()
    {
        static $messages = null;
        
        if ($messages === null) {
            $messages = [
                'loadingGallery' => [
                    'en' => 'Loading gallery...',
                    'ar' => 'جاري تحميل المعرض...'
                ],
                'loadingMore' => [
                    'en' => 'Loading more...',
                    'ar' => 'جاري تحميل المزيد...'
                ],
                'scrollForMore' => [
                    'en' => 'Scroll for more',
                    'ar' => 'مرر لرؤية المزيد'
                ],
                'noMoreItems' => [
                    'en' => 'No more items to load',
                    'ar' => 'لا توجد عناصر أخرى للتحميل'
                ],
                'videoNotSupported' => [
                    'en' => 'Your browser does not support the video tag.',
                    'ar' => 'متصفحك لا يدعم عنصر الفيديو.'
                ],
                'closeModal' => [
                    'en' => 'Close',
                    'ar' => 'إغلاق'
                ]
            ];
        }
        
        return $messages;
    }

    // ===================================
    // STATIC PAGES (OPTIMIZED)
    // ===================================

    public function aboutPageFront()
    {
        return Cache::remember('about_page_frontend_data_v2', self::CACHE_DURATION['long'], function () {
            $aboutKeys = [
                'about_section_title', 'about_section_description',
                'historical_context_title', 'historical_context_description',
                'affected_community_title', 'affected_community_description',
                'archive_purpose_title', 'archive_purpose_description',
                'purpose_item_1_title', 'purpose_item_1_description',
                'purpose_item_2_title', 'purpose_item_2_description',
                'purpose_item_3_title', 'purpose_item_3_description',
                'purpose_item_4_title', 'purpose_item_4_description',
                'purpose_item_5_title', 'purpose_item_5_description',
                'key_facts_title',
                'fact_start_date_label', 'fact_start_date_value',
                'fact_peak_violence_label', 'fact_peak_violence_value',
                'fact_casualties_label', 'fact_casualties_value',
                'fact_displaced_label', 'fact_displaced_value',
                'fact_recognition_label', 'fact_recognition_value',
                'mission_statement_title', 'mission_statement_description',
            ];

            $localizations = Localization::select(['language', 'key', 'value'])
                ->where('is_active', true)
                ->where('group', 'about_page')
                ->whereIn('language', ['en', 'ar'])
                ->whereIn('key', $aboutKeys)
                ->get()
                ->groupBy('language')
                ->map(fn($translations) => $translations->pluck('value', 'key')->toArray())
                ->toArray();

            $aboutData = [
                'aboutSection' => [
                    'title' => [
                        'en' => $localizations['en']['about_section_title'] ?? '',
                        'ar' => $localizations['ar']['about_section_title'] ?? '',
                    ],
                    'description' => [
                        'en' => $localizations['en']['about_section_description'] ?? '',
                        'ar' => $localizations['ar']['about_section_description'] ?? '',
                    ],
                ],
                'historicalContext' => [
                    'title' => [
                        'en' => $localizations['en']['historical_context_title'] ?? '',
                        'ar' => $localizations['ar']['historical_context_title'] ?? '',
                    ],
                    'description' => [
                        'en' => $localizations['en']['historical_context_description'] ?? '',
                        'ar' => $localizations['ar']['historical_context_description'] ?? '',
                    ],
                ],
                'affectedCommunity' => [
                    'title' => [
                        'en' => $localizations['en']['affected_community_title'] ?? '',
                        'ar' => $localizations['ar']['affected_community_title'] ?? '',
                    ],
                    'description' => [
                        'en' => $localizations['en']['affected_community_description'] ?? '',
                        'ar' => $localizations['ar']['affected_community_description'] ?? '',
                    ],
                ],
                'archivePurpose' => [
                    'title' => [
                        'en' => $localizations['en']['archive_purpose_title'] ?? '',
                        'ar' => $localizations['ar']['archive_purpose_title'] ?? '',
                    ],
                    'description' => [
                        'en' => $localizations['en']['archive_purpose_description'] ?? '',
                        'ar' => $localizations['ar']['archive_purpose_description'] ?? '',
                    ],
                    'items' => [
                        [
                            'number' => '1',
                            'title' => [
                                'en' => $localizations['en']['purpose_item_1_title'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_1_title'] ?? '',
                            ],
                            'description' => [
                                'en' => $localizations['en']['purpose_item_1_description'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_1_description'] ?? '',
                            ],
                        ],
                        [
                            'number' => '2',
                            'title' => [
                                'en' => $localizations['en']['purpose_item_2_title'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_2_title'] ?? '',
                            ],
                            'description' => [
                                'en' => $localizations['en']['purpose_item_2_description'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_2_description'] ?? '',
                            ],
                        ],
                        [
                            'number' => '3',
                            'title' => [
                                'en' => $localizations['en']['purpose_item_3_title'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_3_title'] ?? '',
                            ],
                            'description' => [
                                'en' => $localizations['en']['purpose_item_3_description'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_3_description'] ?? '',
                            ],
                        ],
                        [
                            'number' => '4',
                            'title' => [
                                'en' => $localizations['en']['purpose_item_4_title'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_4_title'] ?? '',
                            ],
                            'description' => [
                                'en' => $localizations['en']['purpose_item_4_description'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_4_description'] ?? '',
                            ],
                        ],
                        [
                            'number' => '5',
                            'title' => [
                                'en' => $localizations['en']['purpose_item_5_title'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_5_title'] ?? '',
                            ],
                            'description' => [
                                'en' => $localizations['en']['purpose_item_5_description'] ?? '',
                                'ar' => $localizations['ar']['purpose_item_5_description'] ?? '',
                            ],
                        ],
                    ],
                ],
                'keyFacts' => [
                    'title' => [
                        'en' => $localizations['en']['key_facts_title'] ?? '',
                        'ar' => $localizations['ar']['key_facts_title'] ?? '',
                    ],
                    'facts' => [
                        [
                            'label' => [
                                'en' => $localizations['en']['fact_start_date_label'] ?? '',
                                'ar' => $localizations['ar']['fact_start_date_label'] ?? '',
                            ],
                            'value' => [
                                'en' => $localizations['en']['fact_start_date_value'] ?? '',
                                'ar' => $localizations['ar']['fact_start_date_value'] ?? '',
                            ],
                            'secondLabel' => [
                                'en' => $localizations['en']['fact_peak_violence_label'] ?? '',
                                'ar' => $localizations['ar']['fact_peak_violence_label'] ?? '',
                            ],
                            'secondValue' => [
                                'en' => $localizations['en']['fact_peak_violence_value'] ?? '',
                                'ar' => $localizations['ar']['fact_peak_violence_value'] ?? '',
                            ],
                        ],
                        [
                            'label' => [
                                'en' => $localizations['en']['fact_casualties_label'] ?? '',
                                'ar' => $localizations['ar']['fact_casualties_label'] ?? '',
                            ],
                            'value' => [
                                'en' => $localizations['en']['fact_casualties_value'] ?? '',
                                'ar' => $localizations['ar']['fact_casualties_value'] ?? '',
                            ],
                            'secondLabel' => [
                                'en' => $localizations['en']['fact_displaced_label'] ?? '',
                                'ar' => $localizations['ar']['fact_displaced_label'] ?? '',
                            ],
                            'secondValue' => [
                                'en' => $localizations['en']['fact_displaced_value'] ?? '',
                                'ar' => $localizations['ar']['fact_displaced_value'] ?? '',
                            ],
                        ],
                        [
                            'label' => [
                                'en' => $localizations['en']['fact_recognition_label'] ?? '',
                                'ar' => $localizations['ar']['fact_recognition_label'] ?? '',
                            ],
                            'value' => [
                                'en' => $localizations['en']['fact_recognition_value'] ?? '',
                                'ar' => $localizations['ar']['fact_recognition_value'] ?? '',
                            ],
                            'secondLabel' => ['en' => '', 'ar' => ''],
                            'secondValue' => ['en' => '', 'ar' => ''],
                        ],
                    ],
                ],
                'missionStatement' => [
                    'title' => [
                        'en' => $localizations['en']['mission_statement_title'] ?? '',
                        'ar' => $localizations['ar']['mission_statement_title'] ?? '',
                    ],
                    'description' => [
                        'en' => $localizations['en']['mission_statement_description'] ?? '',
                        'ar' => $localizations['ar']['mission_statement_description'] ?? '',
                    ],
                ],
            ];

            return response()->json($aboutData);
        });
    }

    // ===================================
    // DATA & CONTENT PAGES (OPTIMIZED)
    // ===================================

    public function dataOverviewFront()
    {
        return Cache::remember('data_overview_frontend_data_v2', self::CACHE_DURATION['medium'], function () {
            
            $pageTitleKey = 'data_overview_page_title';
            $pageTitle = $this->getTranslationsForKey($pageTitleKey);

            $caseTypes = Cases::getCaseTypes();
            $tabItems = [];
            
            foreach ($caseTypes as $type => $labels) {
                $tabItems[] = [
                    'id' => $type,
                    'category' => $type,
                    'label' => $labels
                ];
            }

            $dataRegistry = [];
            
            foreach (array_keys($caseTypes) as $type) {
                $cases = Cases::with(['details', 'media'])
                    ->active()
                    ->byType($type)
                    ->ordered()
                    ->get();

                $dataRegistry[$type] = $cases->map(function ($case) {
                    $content = $case->getMultilingualContent();
                    
                    return [
                        'id' => $case->case_id,
                        'title' => $content['title'],
                        'imagePath' => $content['imagePath'],
                        'url' => $content['url'],
                        'details' => $content['details']
                    ];
                })->toArray();
            }

            return response()->json([
                'pageTitle' => [
                    'en' => $pageTitle['en'] ?: 'Data Overview',
                    'ar' => $pageTitle['ar'] ?: 'نظرة عامة على البيانات'
                ],
                'tabItems' => $tabItems,
                'dataRegistry' => $dataRegistry
            ]);
        });
    }

    public function aidEffortsFront()
{
    return Cache::remember('aid_efforts_frontend_data_v2', self::CACHE_DURATION['medium'], function () {
        
        $pageContentKeys = [
            'aid_efforts_hero_title',
            'aid_efforts_hero_description', 
            'aid_efforts_section_title'
        ];

        $pageTranslations = Localization::select(['language', 'key', 'value'])
            ->where('is_active', true)
            ->where('group', 'aid_efforts')
            ->whereIn('language', ['en', 'ar'])
            ->whereIn('key', $pageContentKeys)
            ->get()
            ->groupBy('language')
            ->map(fn($translations) => $translations->pluck('value', 'key')->toArray())
            ->toArray();

        $aidEffortsData = [
            'pageContent' => [
                'heroTitle' => [
                    'en' => $pageTranslations['en']['aid_efforts_hero_title'] ?? 'Aid Efforts',
                    'ar' => $pageTranslations['ar']['aid_efforts_hero_title'] ?? 'جهود المساعدة'
                ],
                'heroDescription' => [
                    'en' => $pageTranslations['en']['aid_efforts_hero_description'] ?? 'Explore the organizations and initiatives dedicated to providing aid and support to those affected by the crisis. Learn about their work, impact, and how you can contribute.',
                    'ar' => $pageTranslations['ar']['aid_efforts_hero_description'] ?? 'استكشف المنظمات والمبادرات المكرسة لتقديم المساعدة والدعم للمتضررين من الأزمة. تعرف على عملهم وتأثيرهم وكيف يمكنك المساهمة.'
                ],
                'sectionTitle' => [
                    'en' => $pageTranslations['en']['aid_efforts_section_title'] ?? 'Aid Efforts',
                    'ar' => $pageTranslations['ar']['aid_efforts_section_title'] ?? 'جهود المساعدة'
                ]
            ],
            'actionButtons' => [
                ['text' => ['en' => 'Donate', 'ar' => 'تبرع'], 'url' => '/donate'],
                ['text' => ['en' => 'Volunteer', 'ar' => 'تطوع'], 'url' => '/volunteer'],
                ['text' => ['en' => 'Get Involved', 'ar' => 'شارك معنا'], 'url' => '/get-involved']
            ],
            'sections' => []
        ];

        // International Organizations Section
        $internationalOrgs = AidOrganization::with(['categories'])
            ->active()
            ->where('type', 'organizations')
            ->where('is_featured', true)
            ->orderBy('sort_order')
            ->limit(self::PAGINATION_LIMITS['featured'])
            ->get();

        if ($internationalOrgs->count() > 0) {
            $orgItems = $internationalOrgs->map(function ($org) {
                $content = $org->getMultilingualContent();
                return [
                    'id' => $org->organization_id, // Added ID
                    'en' => [
                        'name' => $content['en']['name'] ?? '',
                        'description' => $content['en']['description'] ?? '',
                        'backgroundImage' => $content['en']['backgroundImage'] ?? '',
                        'url' => $org->website_url ?: ($content['en']['url'] ?? '')
                    ],
                    'ar' => [
                        'name' => $content['ar']['name'] ?? '',
                        'description' => $content['ar']['description'] ?? '', 
                        'backgroundImage' => $content['ar']['backgroundImage'] ?? '',
                        'url' => $org->website_url ?: ($content['ar']['url'] ?? '')
                    ]
                ];
            })->toArray();

            $aidEffortsData['sections'][] = [
                'id' => 'international-organizations',
                'title' => [
                    'en' => 'International Organizations',
                    'ar' => 'المنظمات الدولية'
                ],
                'type' => 'organizations',
                'items' => $orgItems
            ];
        }

        // Local Groups Section (Initiatives)  
        $localGroups = AidOrganization::with(['categories'])
            ->active()
            ->where('type', 'initiatives')
            ->where('is_featured', true) 
            ->orderBy('sort_order')
            ->limit(self::PAGINATION_LIMITS['featured'])
            ->get();

        if ($localGroups->count() > 0) {
            $initiativeItems = $localGroups->map(function ($initiative) {
                $content = $initiative->getMultilingualContent();
                return [
                    'id' => $initiative->organization_id, // Added ID
                    'en' => [
                        'title' => $content['en']['name'] ?? '',
                        'description' => $content['en']['description'] ?? '',
                        'url' => $initiative->website_url ?: ($content['en']['url'] ?? '')
                    ],
                    'ar' => [
                        'title' => $content['ar']['name'] ?? '', 
                        'description' => $content['ar']['description'] ?? '',
                        'url' => $initiative->website_url ?: ($content['ar']['url'] ?? '')
                    ]
                ];
            })->toArray();

            $aidEffortsData['sections'][] = [
                'id' => 'local-groups',
                'title' => [
                    'en' => 'Local Groups',
                    'ar' => 'المجموعات المحلية'
                ],
                'type' => 'initiatives',
                'items' => $initiativeItems
            ];
        }

        // Stories of Hope Section
        $storiesOfHope = Story::active()
            ->featured()
            ->orderBy('sort_order')
            ->limit(self::PAGINATION_LIMITS['featured'])
            ->get();

        if ($storiesOfHope->count() > 0) {
            $storyItems = $storiesOfHope->map(function ($story) {
                $content = $story->getMultilingualContent();
                return [
                    'id' => $story->story_id, // Added ID
                    'en' => [
                        'name' => $content['title']['en'] ?? '',
                        'description' => $content['description']['en'] ?? '',
                        'backgroundImage' => $content['backgroundImage'] ?? '',
                        'url' => $content['url'] ?? ''
                    ],
                    'ar' => [
                        'name' => $content['title']['ar'] ?? '',
                        'description' => $content['description']['ar'] ?? '',
                        'backgroundImage' => $content['backgroundImage'] ?? '',
                        'url' => $content['url'] ?? ''
                    ]
                ];
            })->toArray();

            $aidEffortsData['sections'][] = [
                'id' => 'stories-of-hope',
                'title' => [
                    'en' => 'Stories of Hope',
                    'ar' => 'قصص الأمل'
                ],
                'type' => 'organizations',
                'items' => $storyItems
            ];
        }

        return response()->json($aidEffortsData);
    });
}


    // ===================================
    // TESTIMONIALS & STORIES (OPTIMIZED)
    // ===================================

    public function testimonialsFront(Request $request)
    {
        $page = $request->get('page', 1);
        $perPage = min($request->get('per_page', self::PAGINATION_LIMITS['testimonials']), 50);
        
        $cacheKey = "testimonials_frontend_data_v2_page_{$page}_per_{$perPage}";
        
        return Cache::remember($cacheKey, self::CACHE_DURATION['medium'], function () use ($page, $perPage) {
            
            $pageContentKeys = [
                'testimonials_page_title',
                'testimonials_page_description',
                'testimonials_featured_section_title',
                'testimonials_all_stories_title'
            ];

            $pageTranslations = Localization::select(['language', 'key', 'value'])
                ->where('is_active', true)
                ->where('group', 'testimonials_page')
                ->whereIn('language', ['en', 'ar'])
                ->whereIn('key', $pageContentKeys)
                ->get()
                ->groupBy('language')
                ->map(fn($translations) => $translations->pluck('value', 'key')->toArray())
                ->toArray();

            $testimonialsData = [
                'pageTitle' => [
                    'en' => $pageTranslations['en']['testimonials_page_title'] ?? 'Stories',
                    'ar' => $pageTranslations['ar']['testimonials_page_title'] ?? 'القصص'
                ],
                'pageDescription' => [
                    'en' => $pageTranslations['en']['testimonials_page_description'] ?? 'Explore personal accounts and narratives from the crisis, offering a deeper understanding of the human impact.',
                    'ar' => $pageTranslations['ar']['testimonials_page_description'] ?? 'استكشف الحسابات الشخصية والروايات من الأزمة، مما يوفر فهماً أعمق للتأثير الإنساني.'
                ],
                'featuredSectionTitle' => [
                    'en' => $pageTranslations['en']['testimonials_featured_section_title'] ?? 'Featured Stories',
                    'ar' => $pageTranslations['ar']['testimonials_featured_section_title'] ?? 'القصص المميزة'
                ],
                'allStoriesTitle' => [
                    'en' => $pageTranslations['en']['testimonials_all_stories_title'] ?? 'All Stories',
                    'ar' => $pageTranslations['ar']['testimonials_all_stories_title'] ?? 'جميع القصص'
                ],
                'featuredStories' => [],
                'allStories' => []
            ];

            // Get Featured Testimonials (limit 3 for featured section)
            $featuredTestimonies = Testimony::with(['media'])
                ->active()
                ->featured()
                ->orderBy('sort_order')
                ->limit(3)
                ->get();

            if ($featuredTestimonies->count() > 0) {
                $testimonialsData['featuredStories'] = $featuredTestimonies->map(function ($testimony) {
                    $content = $testimony->getMultilingualContent();
                    return [
                        'id' => $testimony->id,
                        'title' => [
                            'en' => $content['title']['en'] ?? 'Untitled Story',
                            'ar' => $content['title']['ar'] ?? 'قصة بدون عنوان'
                        ],
                        'description' => [
                            'en' => $content['description']['en'] ?? 'No description available',
                            'ar' => $content['description']['ar'] ?? 'لا يوجد وصف متاح'
                        ],
                        'imageUrl' => $content['imageUrl'] ?? null,
                        'url' => $content['url'] ?? "/story/{$testimony->id}"
                    ];
                })->toArray();
            }

            // Get All Testimonials (paginated)
            $allTestimoniesPaginated = Testimony::with(['media'])
                ->active()
                ->orderBy('sort_order')
                ->paginate($perPage, ['*'], 'page', $page);

            if ($allTestimoniesPaginated->count() > 0) {
                $testimonialsData['allStories'] = $allTestimoniesPaginated->map(function ($testimony) {
                    $content = $testimony->getMultilingualContent();
                    return [
                        'id' => $testimony->id,
                        'title' => [
                            'en' => $content['title']['en'] ?? 'Untitled Story',
                            'ar' => $content['title']['ar'] ?? 'قصة بدون عنوان'
                        ],
                        'imageUrl' => $content['imageUrl'] ?? null,
                        'url' => $content['url'] ?? "/story/{$testimony->id}"
                    ];
                })->toArray();

                $testimonialsData['pagination'] = [
                    'current_page' => $allTestimoniesPaginated->currentPage(),
                    'last_page' => $allTestimoniesPaginated->lastPage(),
                    'per_page' => $allTestimoniesPaginated->perPage(),
                    'total' => $allTestimoniesPaginated->total(),
                    'has_more' => $allTestimoniesPaginated->hasMorePages()
                ];
            }

            return response()->json($testimonialsData);
        });
    }

    // ===================================
    // DETAIL PAGES (OPTIMIZED & FIXED)
    // ===================================

    public function organizationDetailFront($organizationId)
    {
        return Cache::remember("organization_detail_frontend_data_v2_{$organizationId}", self::CACHE_DURATION['medium'], function () use ($organizationId) {
            
            $currentOrganization = AidOrganization::with(['categories', 'media'])
                ->active()
                ->where('id', $organizationId)
                ->orWhere('organization_id', $organizationId)
                ->first();

            if (!$currentOrganization) {
                return response()->json(['error' => 'Organization not found'], 404);
            }

            $currentContent = $currentOrganization->getMultilingualContent();

            $relatedOrganizations = AidOrganization::with(['media', 'categories'])
                ->active()
                ->where('id', '!=', $currentOrganization->id)
                ->where(function ($query) use ($currentOrganization) {
                    $query->where('type', $currentOrganization->type);
                    
                    if ($currentOrganization->categories->count() > 0) {
                        $categoryIds = $currentOrganization->categories->pluck('id')->toArray();
                        $query->orWhereHas('categories', function ($q) use ($categoryIds) {
                            $q->whereIn('aid_categories.id', $categoryIds);
                        });
                    }
                })
                ->orderByDesc('is_featured')
                ->orderBy('sort_order')
                ->limit(5)
                ->get();

            $pageContentKeys = [
                'organization_detail_page_title',
                'contact_button_text',
                'website_button_text'
            ];

            $pageTranslations = Localization::where('group', 'organization_detail')
                ->whereIn('language', ['en', 'ar'])
                ->whereIn('key', $pageContentKeys)
                ->get()
                ->groupBy('language')
                ->map(fn($translations) => $translations->pluck('value', 'key')->toArray())
                ->toArray();

            $organizationDetailData = [
                'en' => [
                    'relatedOrganizations' => [],
                    'currentOrganization' => [
                        'name' => $currentContent['en']['name'] ?? 'Unnamed Organization',
                        'imageUrl' => $currentContent['en']['backgroundImage'] ?? '',
                        'description' => $currentContent['en']['description'] ?? 'No description available.',
                        'type' => $currentOrganization->type,
                        'categories' => $currentOrganization->categories->pluck('name')->toArray(),
                        'organizationId' => $currentOrganization->organization_id,
                    ],
                    'actionButtons' => [],
                    'pageTitle' => $pageTranslations['en']['organization_detail_page_title'] ?? 'Organizations',
                ],
                'ar' => [
                    'relatedOrganizations' => [],
                    'currentOrganization' => [
                        'name' => $currentContent['ar']['name'] ?? 'منظمة بدون اسم',
                        'imageUrl' => $currentContent['ar']['backgroundImage'] ?? '',
                        'description' => $currentContent['ar']['description'] ?? 'لا يوجد وصف متاح.',
                        'type' => $currentOrganization->type,
                        'categories' => $currentOrganization->categories->pluck('name')->toArray(),
                        'organizationId' => $currentOrganization->organization_id,
                    ],
                    'actionButtons' => [],
                    'pageTitle' => $pageTranslations['ar']['organization_detail_page_title'] ?? 'المنظمات',
                ],
            ];

            foreach ($relatedOrganizations as $relatedOrg) {
                $relatedContent = $relatedOrg->getMultilingualContent();
                
                // ✅ FIXED: Safe array access for backgroundImage
                $logoUrl = '';
                if ($relatedOrg->media->isNotEmpty()) {
                    $firstMedia = $relatedOrg->media->first();
                    $mediaContent = $firstMedia->getMultilingualContent();
                    $logoUrl = $mediaContent['thumbnail'] ?? $mediaContent['url'] ?? '';
                } elseif (!empty($relatedContent['en']['backgroundImage'] ?? null)) {
                    $logoUrl = $relatedContent['en']['backgroundImage'];
                }

                $organizationDetailData['en']['relatedOrganizations'][] = [
                    'name' => $relatedContent['en']['name'] ?? 'Unnamed Organization',
                    'logoUrl' => $logoUrl,
                    'id' => $relatedOrg->id,
                    'organizationId' => $relatedOrg->organization_id,
                    'type' => $relatedOrg->type
                ];

                $organizationDetailData['ar']['relatedOrganizations'][] = [
                    'name' => $relatedContent['ar']['name'] ?? 'منظمة بدون اسم',
                    'logoUrl' => $logoUrl,
                    'id' => $relatedOrg->id,
                    'organizationId' => $relatedOrg->organization_id,
                    'type' => $relatedOrg->type
                ];
            }

            $contactText = [
                'en' => $pageTranslations['en']['contact_button_text'] ?? 'Contact',
                'ar' => $pageTranslations['ar']['contact_button_text'] ?? 'اتصل بنا'
            ];
            
            $websiteText = [
                'en' => $pageTranslations['en']['website_button_text'] ?? 'Visit Website',
                'ar' => $pageTranslations['ar']['website_button_text'] ?? 'زيارة الموقع'
            ];

            if ($currentOrganization->contact_url) {
                $organizationDetailData['en']['actionButtons'][] = [
                    'text' => $contactText['en'],
                    'url' => $currentOrganization->contact_url
                ];
                $organizationDetailData['ar']['actionButtons'][] = [
                    'text' => $contactText['ar'],
                    'url' => $currentOrganization->contact_url
                ];
            }

            if ($currentOrganization->website_url) {
                $organizationDetailData['en']['actionButtons'][] = [
                    'text' => $websiteText['en'],
                    'url' => $currentOrganization->website_url
                ];
                $organizationDetailData['ar']['actionButtons'][] = [
                    'text' => $websiteText['ar'],
                    'url' => $currentOrganization->website_url
                ];
            }

            if (empty($organizationDetailData['en']['actionButtons'])) {
                $defaultEmail = "info@organization.org";
                $organizationDetailData['en']['actionButtons'][] = [
                    'text' => $contactText['en'],
                    'url' => "mailto:{$defaultEmail}"
                ];
                $organizationDetailData['ar']['actionButtons'][] = [
                    'text' => $contactText['ar'],
                    'url' => "mailto:{$defaultEmail}"
                ];
            }

            return response()->json($organizationDetailData);
        });
    }

    public function testimonyDetailFront($testimonyId)
    {
        return Cache::remember("testimony_detail_frontend_data_v2_{$testimonyId}", self::CACHE_DURATION['medium'], function () use ($testimonyId) {
            
            $testimony = Testimony::with(['media'])
                ->active()
                ->where('id', $testimonyId)
                ->orWhere('testimony_id', $testimonyId)
                ->first();

            if (!$testimony) {
                return response()->json(['error' => 'Testimony not found'], 404);
            }

            $testimonyContent = $testimony->getMultilingualContent();
            
            $uiTranslationKeys = [
                'copy_link_button_text',
                'survivor_info_label',
                'age_label',
                'location_label',
                'date_label'
            ];

            $uiTranslations = Localization::where('group', 'testimony_detail')
                ->whereIn('language', ['en', 'ar'])
                ->whereIn('key', $uiTranslationKeys)
                ->get()
                ->groupBy('language')
                ->map(fn($translations) => $translations->pluck('value', 'key')->toArray())
                ->toArray();

            $mediaItems = [];
            
            if ($testimony->media->count() > 0) {
                foreach ($testimony->media as $media) {
                    $mediaContent = $media->getMultilingualContent();
                    if (!empty($mediaContent['url'])) {
                        $mediaItems[] = $mediaContent['url'];
                    }
                }
            }

            if (empty($mediaItems) && $testimony->background_image_path) {
                $mediaItems[] = asset("storage/{$testimony->background_image_path}");
            }

            $enhancedContent = [
                'en' => $testimonyContent['description']['en'] ?? 'No content available.',
                'ar' => $testimonyContent['description']['ar'] ?? 'لا يوجد محتوى متاح.'
            ];

            if ($testimony->survivor_name || $testimony->survivor_age || $testimony->survivor_location) {
                $survivorInfo = [];
                
                if ($testimony->survivor_name) {
                    $survivorInfo[] = "Survivor: {$testimony->survivor_name}";
                }
                if ($testimony->survivor_age) {
                    $survivorInfo[] = "Age at time of incident: {$testimony->survivor_age}";
                }
                if ($testimony->survivor_location) {
                    $survivorInfo[] = "Location: {$testimony->survivor_location}";
                }
                if ($testimony->date_of_incident) {
                    $survivorInfo[] = "Date of incident: " . $testimony->date_of_incident->format('F j, Y');
                }

                if (!empty($survivorInfo)) {
                    $contextInfo = "\n\n--- Survivor Information ---\n" . implode("\n", $survivorInfo);
                    $enhancedContent['en'] .= $contextInfo;
                    $enhancedContent['ar'] .= $contextInfo;
                }
            }

            $testimonyDetailData = [
                'en' => [
                    'title' => $testimonyContent['title']['en'] ?? 'Untitled Testimony',
                    'buttonText' => $uiTranslations['en']['copy_link_button_text'] ?? 'copy link',
                    'content' => $enhancedContent['en'],
                    'images' => $mediaItems,
                    'survivorName' => $testimony->survivor_name,
                    'survivorAge' => $testimony->survivor_age,
                    'survivorLocation' => $testimony->survivor_location,
                    'dateOfIncident' => $testimony->date_of_incident?->format('Y-m-d'),
                    'testimonyId' => $testimony->testimony_id,
                ],
                'ar' => [
                    'title' => $testimonyContent['title']['ar'] ?? 'شهادة بدون عنوان',
                    'buttonText' => $uiTranslations['ar']['copy_link_button_text'] ?? 'نسخ الرابط',
                    'content' => $enhancedContent['ar'],
                    'images' => $mediaItems,
                    'survivorName' => $testimony->survivor_name,
                    'survivorAge' => $testimony->survivor_age,
                    'survivorLocation' => $testimony->survivor_location,
                    'dateOfIncident' => $testimony->date_of_incident?->format('Y-m-d'),
                    'testimonyId' => $testimony->testimony_id,
                ]
            ];

            return response()->json($testimonyDetailData);
        });
    }

    // ===================================
    // TIMELINE EVENTS (NEW)
    // ===================================

    /**
     * Get timeline events for frontend display
     */
    public function timelineFront()
    {
        return Cache::remember('timeline_frontend_data_v1', self::CACHE_DURATION['medium'], function () {
            
            // Get all active timeline events
            $timelineEvents = TimelineEvent::with(['media'])
                ->active()
                ->ordered()
                ->get();

            // Transform events for both languages
            $timelineData = [];
            
            foreach (['en', 'ar'] as $language) {
                $timelineData[$language] = [
                    'title' => $language === 'en' ? 'Timeline of the Crisis' : 'الجدول الزمني للأزمة',
                    'items' => $timelineEvents->map(function ($event) use ($language) {
                        $content = $event->getMultilingualContent();
                        
                        return [
                            'title' => $content['title'][$language],
                            'period' => $event->period,
                            'description' => $content['description'][$language],
                            'isHighlighted' => $event->is_highlighted,
                            'mediaType' => $content['mediaType'] ?: 'image',
                            'mediaUrl' => $content['mediaUrl'] ?: 'https://images.unsplash.com/photo-1586829135343-132950070391?w=500&h=300&fit=crop'
                        ];
                    })->toArray()
                ];
            }

            return response()->json($timelineData);
        });
    }

    // ===================================
    // OPTIMIZED HELPER METHODS
    // ===================================

    /**
     * ✅ Ultra-fast translation helper with static caching
     */
    private function getTranslationsForKey($key)
    {
        static $cache = [];
        
        if (!$key) return ['en' => '', 'ar' => ''];
        
        if (!isset($cache[$key])) {
            $translations = Localization::where('key', $key)
                ->whereIn('language', ['en', 'ar'])
                ->where('is_active', true)
                ->pluck('value', 'language')
                ->toArray();

            $cache[$key] = [
                'en' => $translations['en'] ?? '',
                'ar' => $translations['ar'] ?? ''
            ];
        }

        return $cache[$key];
    }
}
