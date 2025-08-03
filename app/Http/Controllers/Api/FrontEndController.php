<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Localization;
use App\Models\Media;
use App\Models\AidOrganization;
use App\Models\Testimony;
use App\Models\HomeSection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use App\Models\Cases;
use App\Models\Story;

class FrontEndController extends Controller
{
    public function layoutFront()
    {
        // Define only the keys you need for the frontend layout
        $requiredKeys = [
            'title',
            'home', 'crisesArchive', 'media', 'aidEfforts', 'organizations', 
            'information', 'stories', 'news', 'timeline', 'dataOverview',
            'seeStories', 'takeAction',
            'copyright', 'privacyPolicy', 'termsOfService', 'contact',
            'switchToLight', 'switchToDark', 'toggleMenu', 'switchLanguage'
        ];

        $result = Localization::select(['language', 'group', 'key', 'value'])
            ->where('is_active', true)
            ->whereIn('language', ['en', 'ar'])
            ->whereIn('key', $requiredKeys)
            ->get()
            ->groupBy('language')
            ->map(function ($languageTranslations) {
                $result = [];
                
                foreach ($languageTranslations as $translation) {
                    if (is_null($translation->group)) {
                        $result[$translation->key] = $translation->value;
                    } else {
                        $result[$translation->group][$translation->key] = $translation->value;
                    }
                }
                
                return $result;
            })
            ->toArray();

        $result['logo'] = Storage::disk('public')->url('general/suwayda3mrani.png');

        return response()->json($result);
    }

    public function homeFront()
    {
        // Cache for 15 minutes - highly optimized single query approach
        return Cache::remember('home_frontend_data_v2', 900, function () {
            $homeData = [];

            // Single optimized query for all active home sections, ordered by sort_order
            $homeSections = HomeSection::where('is_active', true)
                ->ordered()
                ->get()
                ->keyBy('type');

            // 1. Hero Section - Only if exists in database
            if ($homeSections->has('hero')) {
                $heroSection = $homeSections->get('hero');
                $heroContent = $heroSection->getMultilingualContent();
                
                $homeData[] = [
                    'id' => "hero-{$heroSection->id}",
                    'type' => 'hero',
                    'sort_order' => $heroSection->sort_order,
                    'content' => [
                        'en' => [
                            'title' => $heroContent['title']['en'] ?? '',
                            'image' => $heroContent['imageUrl'] ?? '',
                        ],
                        'ar' => [
                            'title' => $heroContent['title']['ar'] ?? '',
                            'image' => $heroContent['imageUrl'] ?? '',
                        ],
                    ],
                ];
            }

            // 2. Featured Media Gallery - Only if media exists
            $featuredMediaCount = Media::where('is_active', true)
                ->where('featured_on_home', true)
                ->count();

            if ($featuredMediaCount > 0) {
                $featuredMedia = Media::select(['id', 'media_id', 'type', 'title_key', 'description_key', 'file_path', 'google_drive_id', 'external_url', 'thumbnail_path', 'source_url'])
                    ->where('is_active', true)
                    ->where('featured_on_home', true)
                    ->ordered()
                    ->limit(10)
                    ->get();

                $mediaItems = $featuredMedia->map(function ($media) {
                    $content = $media->getMultilingualContent();
                    return [
                        'id' => "media-{$media->id}",
                        'url' => $content['url'] ?? '',
                        'thumbnail' => $content['thumbnail'] ?? $content['url'],
                        'title' => $content['title'] ?? ['en' => '', 'ar' => ''],
                        'description' => $content['description'] ?? ['en' => '', 'ar' => ''],
                        'sourceUrl' => $content['sourceUrl'] ?? '',
                        'type' => $media->type,
                    ];
                })->toArray();

                $homeData[] = [
                    'id' => 'media-gallery-1',
                    'type' => 'media_gallery',
                    'sort_order' => 100, // Default sort order
                    'content' => [
                        'title' => [
                            'en' => 'Media Gallery',
                            'ar' => 'معرض الوسائط'
                        ],
                        'mediaItems' => $mediaItems,
                    ],
                ];
            }

            // 3. Featured Aid Organizations - Only if organizations exist
            $featuredOrgsCount = AidOrganization::where('is_active', true)
                ->where('is_featured', true)
                ->count();

            if ($featuredOrgsCount > 0) {
                $featuredOrganizations = AidOrganization::select(['id', 'organization_id', 'type', 'name_key', 'description_key', 'background_image_path', 'website_url', 'contact_url'])
                    ->with(['categories:id,slug'])
                    ->where('is_active', true)
                    ->where('is_featured', true)
                    ->ordered()
                    ->limit(6)
                    ->get();

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
                    'sort_order' => 200, // Default sort order
                    'title' => [
                        'en' => 'Aid and Response',
                        'ar' => 'المساعدات والاستجابة'
                    ],
                    'content' => $organizationContent,
                ];
            }

            // 4. Featured Testimonies - Only if testimonies exist
            $featuredTestimoniesCount = Testimony::where('is_active', true)
                ->where('is_featured', true)
                ->count();

            if ($featuredTestimoniesCount > 0) {
                $featuredTestimonies = Testimony::select(['id', 'testimony_id', 'title_key', 'description_key', 'background_image_path', 'url_slug', 'survivor_name', 'survivor_age', 'survivor_location', 'date_of_incident'])
                    ->where('is_active', true)
                    ->where('is_featured', true)
                    ->ordered()
                    ->limit(4)
                    ->get();

                foreach ($featuredTestimonies as $index => $testimony) {
                    $content = $testimony->getMultilingualContent();
                    $homeData[] = [
                        'id' => "testimonial-{$testimony->id}",
                        'type' => 'testimonial',
                        'sort_order' => 300 + $index, // Sequential sort order
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

            // 5. Dynamic Home Sections (component_node, key_events, section_group)
            $dynamicSections = $homeSections->reject(function ($section) {
                return $section->type === 'hero'; // Already handled above
            });

            foreach ($dynamicSections as $section) {
                $content = $section->getMultilingualContent();
                
                $sectionData = [
                    'id' => "{$section->type}-{$section->id}",
                    'type' => $section->type,
                    'sort_order' => $section->sort_order,
                ];

                switch ($section->type) {
                    case 'component_node':
                    case 'key_events':
                        $sectionData['content'] = [
                            'en' => $content['en'] ?? ['category' => '', 'title' => '', 'description' => '', 'imageUrl' => ''],
                            'ar' => $content['ar'] ?? ['category' => '', 'title' => '', 'description' => '', 'imageUrl' => ''],
                            'url' => $content['url'] ?? '',
                        ];
                        break;

                    case 'section_group':
                        $sectionData['content'] = [
                            'title' => $content['title'] ?? ['en' => '', 'ar' => ''],
                            'sections' => $content['sections'] ?? [],
                        ];
                        break;

                    case 'suggestions':
                        $sectionData['content'] = $content['suggestions'] ?? [];
                        break;
                }

                $homeData[] = $sectionData;
            }

            // Sort all sections by sort_order
            usort($homeData, function ($a, $b) {
                return ($a['sort_order'] ?? 999) <=> ($b['sort_order'] ?? 999);
            });

            // Remove sort_order from final output (used only for sorting)
            $homeData = array_map(function ($item) {
                unset($item['sort_order']);
                return $item;
            }, $homeData);

            return response()->json($homeData);
        });
    }

    public function aboutPageFront()
{
    // Cache the about page data for 30 minutes
    return Cache::remember('about_page_frontend_data', 1800, function () {
        $aboutKeys = [
            // About Section
            'about_section_title',
            'about_section_description',
            
            // Historical Context
            'historical_context_title',
            'historical_context_description',
            
            // Affected Community
            'affected_community_title',
            'affected_community_description',
            
            // Archive Purpose
            'archive_purpose_title',
            'archive_purpose_description',
            'purpose_item_1_title',
            'purpose_item_1_description',
            'purpose_item_2_title',
            'purpose_item_2_description',
            'purpose_item_3_title',
            'purpose_item_3_description',
            'purpose_item_4_title',
            'purpose_item_4_description',
            'purpose_item_5_title',
            'purpose_item_5_description',
            
            // Key Facts
            'key_facts_title',
            'fact_start_date_label',
            'fact_start_date_value',
            'fact_peak_violence_label',
            'fact_peak_violence_value',
            'fact_casualties_label',
            'fact_casualties_value',
            'fact_displaced_label',
            'fact_displaced_value',
            'fact_recognition_label',
            'fact_recognition_value',
            
            // Mission Statement
            'mission_statement_title',
            'mission_statement_description',
        ];

        $localizations = Localization::select(['language', 'key', 'value'])
            ->where('is_active', true)
            ->where('group', 'about_page')
            ->whereIn('language', ['en', 'ar'])
            ->whereIn('key', $aboutKeys)
            ->get()
            ->groupBy('language')
            ->map(function ($languageTranslations) {
                return $languageTranslations->pluck('value', 'key')->toArray();
            })
            ->toArray();

        // Structure the data according to your required format
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
                        'secondLabel' => [
                            'en' => '',
                            'ar' => '',
                        ],
                        'secondValue' => [
                            'en' => '',
                            'ar' => '',
                        ],
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

public function dataOverviewFront()
{
    // Cache for 15 minutes
    return Cache::remember('data_overview_frontend_data', 900, function () {
        
        // Get page title from localizations
        $pageTitleKey = 'data_overview_page_title';
        $pageTitle = $this->getTranslationsForKey($pageTitleKey);

        // Get tab items (case types)
        $caseTypes = Cases::getCaseTypes();
        $tabItems = [];
        
        foreach ($caseTypes as $type => $labels) {
            $tabItems[] = [
                'id' => $type,
                'category' => $type,
                'label' => $labels
            ];
        }

        // Get all active cases grouped by type
        $dataRegistry = [];
        
        foreach (array_keys($caseTypes) as $type) {
            $cases = Cases::with(['details', 'media.media'])
                ->active()
                ->byType($type)
                ->ordered()
                ->get();

            $dataRegistry[$type] = $cases->map(function ($case) {
                $content = $case->getMultilingualContent();
                
                return [
                    'id' => $case->id,
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

// Helper method for getting translations
private function getTranslationsForKey($key)
{
    if (!$key) return ['en' => '', 'ar' => ''];

    $translations = Localization::where('key', $key)
        ->whereIn('language', ['en', 'ar'])
        ->pluck('value', 'language')
        ->toArray();

    return [
        'en' => $translations['en'] ?? '',
        'ar' => $translations['ar'] ?? ''
    ];
}

public function aidEffortsFront()
{
    // Cache for 15 minutes
    return Cache::remember('aid_efforts_frontend_data', 900, function () {
        
        // Get page content from localizations
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
            ->map(function ($translations) {
                return $translations->pluck('value', 'key')->toArray();
            })
            ->toArray();

        // Build the response structure exactly as you specified
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
                [
                    'text' => ['en' => 'Donate', 'ar' => 'تبرع'],
                    'url' => '/donate'
                ],
                [
                    'text' => ['en' => 'Volunteer', 'ar' => 'تطوع'], 
                    'url' => '/volunteer'
                ],
                [
                    'text' => ['en' => 'Get Involved', 'ar' => 'شارك معنا'],
                    'url' => '/get-involved'
                ]
            ],
            'sections' => []
        ];

        // 1. International Organizations Section
        $internationalOrgs = AidOrganization::with(['categories'])
            ->active()
            ->where('type', 'organizations')
            ->where('is_featured', true)
            ->ordered()
            ->limit(6)
            ->get();

        if ($internationalOrgs->count() > 0) {
            $orgItems = $internationalOrgs->map(function ($org) {
                $content = $org->getMultilingualContent();
                return [
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

        // 2. Local Groups Section (Initiatives)  
        $localGroups = AidOrganization::with(['categories'])
            ->active()
            ->where('type', 'initiatives')
            ->where('is_featured', true) 
            ->ordered()
            ->limit(6)
            ->get();

        if ($localGroups->count() > 0) {
            $initiativeItems = $localGroups->map(function ($initiative) {
                $content = $initiative->getMultilingualContent();
                return [
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

        // 3. Stories of Hope Section
        $storiesOfHope = Story::active()
            ->featured()
            ->ordered()
            ->limit(6)
            ->get();

        if ($storiesOfHope->count() > 0) {
            $storyItems = $storiesOfHope->map(function ($story) {
                $content = $story->getMultilingualContent();
                return [
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
                'type' => 'organizations', // Using organizations format for consistency
                'items' => $storyItems
            ];
        }

        return response()->json($aidEffortsData);
    });
}

public function testimonialsFront(Request $request)
{
    $page = $request->get('page', 1);
    $perPage = $request->get('per_page', 20);
    
    // Cache key includes pagination parameters
    $cacheKey = "testimonials_frontend_data_page_{$page}_per_{$perPage}";
    
    return Cache::remember($cacheKey, 900, function () use ($page, $perPage) {
        
        // Get page content from localizations
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
            ->map(function ($translations) {
                return $translations->pluck('value', 'key')->toArray();
            })
            ->toArray();

        // Build the response structure exactly as you specified
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
            ->ordered()
            ->limit(3)
            ->get();

        if ($featuredTestimonies->count() > 0) {
            $testimonialsData['featuredStories'] = $featuredTestimonies->map(function ($testimony, $index) {
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
                    'url' => $content['url'] ?? "/story/{$testimony->url_slug}"
                ];
            })->toArray();
        }

        // Get All Testimonials (excluding featured ones, or include all)
         $allTestimoniesPaginated = Testimony::with(['media'])
            ->active()
            ->ordered()
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
                    'url' => $content['url'] ?? "/story/{$testimony->url_slug}"
                ];
            })->toArray();

            // Add pagination metadata
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

public function organizationDetailFront($organizationId)
{
    return Cache::remember("organization_detail_frontend_data_{$organizationId}", 900, function () use ($organizationId) {
        
        // Get the current organization with all relationships
        $currentOrganization = AidOrganization::with(['categories', 'media'])
            ->active()
            ->where('id', $organizationId)
            ->orWhere('organization_id', $organizationId)
            ->orWhere('url_slug', $organizationId)
            ->first();

        if (!$currentOrganization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        // Get current organization content
        $currentContent = $currentOrganization->getMultilingualContent();

        // Get related organizations with intelligent matching
        $relatedOrganizations = AidOrganization::with(['media', 'categories'])
            ->active()
            ->where('id', '!=', $currentOrganization->id)
            ->where(function ($query) use ($currentOrganization) {
                // Same type organizations first
                $query->where('type', $currentOrganization->type);
                
                // Or organizations with similar categories
                if ($currentOrganization->categories->count() > 0) {
                    $categoryIds = $currentOrganization->categories->pluck('id')->toArray();
                    $query->orWhereHas('categories', function ($q) use ($categoryIds) {
                        $q->whereIn('aid_categories.id', $categoryIds);
                    });
                }
            })
            ->orderBy('is_featured', 'desc')
            ->orderBy('sort_order')
            ->limit(5)
            ->get();

        // Get page title and other content from localizations
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
            ->map(function ($translations) {
                return $translations->pluck('value', 'key')->toArray();
            })
            ->toArray();

        // Build organization detail data
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

        // Populate related organizations
        foreach ($relatedOrganizations as $relatedOrg) {
            $relatedContent = $relatedOrg->getMultilingualContent();
            
            // Get logo from first media item or background image
            $logoUrl = '';
            if ($relatedOrg->media->count() > 0) {
                $firstMedia = $relatedOrg->media->first();
                $mediaContent = $firstMedia->getMultilingualContent();
                $logoUrl = $mediaContent['thumbnail'] ?? $mediaContent['url'] ?? '';
            } elseif ($relatedContent['en']['backgroundImage']) {
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

        // Create action buttons with localized text
        $contactText = [
            'en' => $pageTranslations['en']['contact_button_text'] ?? 'Contact',
            'ar' => $pageTranslations['ar']['contact_button_text'] ?? 'اتصل بنا'
        ];
        
        $websiteText = [
            'en' => $pageTranslations['en']['website_button_text'] ?? 'Visit Website',
            'ar' => $pageTranslations['ar']['website_button_text'] ?? 'زيارة الموقع'
        ];

        // Add contact button if contact URL exists
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

        // Add website button if website URL exists
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

        // Fallback: create default contact if no URLs are available
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
    return Cache::remember("testimony_detail_frontend_data_{$testimonyId}", 900, function () use ($testimonyId) {
        
        // Get the testimony with all relationships
        $testimony = Testimony::with(['media'])
            ->active()
            ->where('id', $testimonyId)
            ->orWhere('testimony_id', $testimonyId)
            ->orWhere('url_slug', $testimonyId)
            ->first();

        if (!$testimony) {
            return response()->json(['error' => 'Testimony not found'], 404);
        }

        // Get testimony content
        $testimonyContent = $testimony->getMultilingualContent();
        
        // Get localized button text and other UI elements
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
            ->map(function ($translations) {
                return $translations->pluck('value', 'key')->toArray();
            })
            ->toArray();

        // Collect all media URLs (images and videos)
        $mediaItems = [];
        
        // Get media from relationships
        if ($testimony->media->count() > 0) {
            foreach ($testimony->media as $media) {
                $mediaContent = $media->getMultilingualContent();
                if (!empty($mediaContent['url'])) {
                    $mediaItems[] = $mediaContent['url'];
                }
            }
        }

        // Add background image if exists and no other media
        if (empty($mediaItems) && $testimony->background_image_path) {
            $mediaItems[] = Storage::disk('public')->url($testimony->background_image_path);
        }

        // Build enhanced content with survivor details
        $enhancedContent = [
            'en' => $testimonyContent['description']['en'] ?? 'No content available.',
            'ar' => $testimonyContent['description']['ar'] ?? 'لا يوجد محتوى متاح.'
        ];

        // Add survivor context if available
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
                $enhancedContent['ar'] .= $contextInfo; // You might want to translate this part
            }
        }

        // Build the response structure
        $testimonyDetailData = [
            'en' => [
                'title' => $testimonyContent['title']['en'] ?? 'Untitled Testimony',
                'buttonText' => $uiTranslations['en']['copy_link_button_text'] ?? 'copy link',
                'content' => $enhancedContent['en'],
                'images' => $mediaItems,
                // Additional metadata
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
                // Additional metadata (same as English)
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
}
