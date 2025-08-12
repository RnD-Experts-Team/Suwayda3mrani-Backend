<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entry;
use App\Models\Host;
use App\Models\HostedFamily;
use App\Models\Martyr;
use App\Models\Shelter;
use App\Models\DisplacedFamily;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Convert potential arrays to strings for database storage.
     *
     * @param mixed $value
     * @return string|null
     */
    private function convertToString($value)
    {
        if (is_array($value)) {
            return implode(',', array_filter($value, 'is_scalar'));
        }
        return is_scalar($value) && !empty($value) ? (string) $value : null;
    }

    /**
     * Extract image URLs from nested structures.
     *
     * @param array $imagesData
     * @return string|null
     */
    private function extractImages($imagesData)
    {
        $urls = [];
        foreach ($imagesData as $item) {
            if (isset($item['تحميل'])) {
                foreach ($item['تحميل'] as $file) {
                    if (isset($file['File']) && !empty($file['File'])) {
                        $urls[] = $file['File'];
                    }
                }
            }
        }
        return !empty($urls) ? implode(',', $urls) : null;
    }

    public function handle(Request $request)
    {
        $data = $request->all();
        Log::info('Webhook received', ['data' => $data]);

        // Validate required fields for Entry
        if (!isset($data['Form']['Id'], $data['Entry']['Number'], $data['All'], $data['Entry']['InternalLink']) ||
            empty($data['Form']['Id']) || empty($data['Entry']['Number']) || empty($data['Entry']['InternalLink'])) {
            Log::error('Invalid webhook data', ['data' => $data]);
            return response()->json(['error' => 'Invalid data'], 400);
        }

        // Prevent duplicate entries
        if (Entry::where('entry_number', $data['Entry']['Number'])->exists()) {
            Log::warning('Duplicate entry number', ['entry_number' => $data['Entry']['Number']]);
            return response()->json(['error' => 'Duplicate entry number'], 409);
        }

        try {
            \DB::beginTransaction();

            // Create Entry
            $entry = Entry::create([
                'form_id' => $this->convertToString($data['Form']['Id']),
                'entry_number' => $this->convertToString($data['Entry']['Number']),
                'date_submitted' => $this->convertToString($data['Entry']['DateSubmitted'] ?? now()->toDateTimeString()),
                'submitter_name' => $this->convertToString($data['All']['اسمك']['FirstAndLast'] ?? null),
                'location' => $this->convertToString($data['All']['مكانالتواجد'] ?? null),
                'status' => $this->convertToString($data['All']['الحالة'] ?? null),
                'InternalLink' => $this->convertToString($data['Entry']['InternalLink']),
            ]);

            // Create Host if primary fields are present
            if (isset($data['All']['أولابياناتالمضيف'])) {
                $hostData = $data['All']['أولابياناتالمضيف'];
                $fullName = $this->convertToString($hostData['الاسمالكاملللمضيف']['FirstAndLast'] ?? null);
                if (!empty($fullName)) { // Check if primary field (full_name) is not null
                    Host::create([
                        'entry_id' => $entry->id,
                        'full_name' => $fullName,
                        'family_count' => $this->convertToString($hostData['عددأفرادعائلةالمضيفمعأعمارهم'] ?? null),
                        'location' => $this->convertToString($hostData['مكانالتواجد'] ?? null),
                        'address' => $this->convertToString($hostData['العنوان'] ?? null),
                        'phone' => $this->convertToString($hostData['رقمالهاتف2'] ?? null),
                        'family_book_number' => $this->convertToString($hostData['رقمدفترالعائلةإنوجد'] ?? null),
                    ]);
                }
            }

            // Create Hosted Families if primary fields are present
            if (isset($data['All']['ثانياالعائلةالمستضافة']) && is_array($data['All']['ثانياالعائلةالمستضافة'])) {
                foreach ($data['All']['ثانياالعائلةالمستضافة'] as $hosted) {
                    $contact = $this->convertToString($hosted['اسمربالعائلةرقمالتواصل'] ?? null);
                    $individualsCount = $this->convertToString($hosted['عددالأفراد'] ?? null);
                    if (!empty($contact) || !empty($individualsCount)) { // Check primary fields
                        $needsDetails = $hosted['الاحتياجاتالحاليةللعائلاتالمستضافة'] ?? [];
                        HostedFamily::create([
                            'entry_id' => $entry->id,
                            'individuals_count' => $individualsCount,
                            'contact' => $contact,
                            'wife_name' => $this->convertToString($hosted['اسمالزوجة'] ?? null),
                            'children_info' => $this->convertToString($hosted['أسماءوأعمارالأطفال'] ?? null),
                            'needs' => $this->convertToString($needsDetails['يرجىاختيارالاحتياجات'] ?? null),
                            'assistance_type' => $this->convertToString($needsDetails['نوعالمساعدة'] ?? null),
                            'provider' => $this->convertToString($needsDetails['الجهةالمقدمةللمساعدة'] ?? null),
                            'date_received' => $this->convertToString($needsDetails['تاريخالحصولعليها'] ?? null),
                            'notes' => $this->convertToString($needsDetails['ملاحظاتإضافية'] ?? null),
                            'return_possible' => $this->convertToString($needsDetails['إمكانيةالعودةللمنزل2'] ?? null),
                            'previous_assistance' => $this->convertToString($needsDetails['هلتمتلقيمساعداتسابقة2'] ?? null),
                            'images' => $this->extractImages($needsDetails['صوراوفيديوهاتللتوثيق2'] ?? []),
                            'family_book_number' => $this->convertToString($hosted['رقمدفترالعائلةإنوجد'] ?? null),
                        ]);
                    }
                }
            }

            // Create Martyrs if primary fields are present
            if (isset($data['All']['أسماءالشهداء']) && is_array($data['All']['أسماءالشهداء'])) {
                foreach ($data['All']['أسماءالشهداء'] as $martyr) {
                    $name = $this->convertToString($martyr['اسمالشهيد']['FirstAndLast'] ?? null);
                    if (!empty($name)) { // Check primary field (name)
                        Martyr::create([
                            'entry_id' => $entry->id,
                            'name' => $name,
                            'age' => (int) ($martyr['العمر'] ?? 0),
                            'place' => $this->convertToString($martyr['مكانالاستشهاد'] ?? null),
                            'relative_contact' => $this->convertToString($martyr['اسماحدالاقاربمعرقمللتواصل'] ?? null),
                            'images' => $this->extractImages([$martyr['صورةللشهيدانوجد'] ?? []]),
                        ]);
                    }
                }
            }

            // Create Shelters and Displaced Families if primary fields are present
            if (isset($data['All']['مكانالإيواء']) && is_array($data['All']['مكانالإيواء'])) {
                foreach ($data['All']['مكانالإيواء'] as $shelterData) {
                    $place = $this->convertToString($shelterData['مكانالإيواءاوالاجار'] ?? null);
                    if (!empty($place)) { // Check primary field (place)
                        $shelter = Shelter::create([
                            'entry_id' => $entry->id,
                            'place' => $place,
                            'contact' => $this->convertToString($shelterData['رقمالتواصل'] ?? null),
                            'images' => $this->extractImages($shelterData['صورةاوفيديوللمنزلالمتضررانوجد2'] ?? []),
                        ]);

                        if (isset($shelterData['العائلةالنازحة']) && is_array($shelterData['العائلةالنازحة'])) {
                            foreach ($shelterData['العائلةالنازحة'] as $displaced) {
                                $contact = $this->convertToString($displaced['اسمربالعائلةرقمالتواصل'] ?? null);
                                $individualsCount = $this->convertToString($displaced['عددالأفراد'] ?? null);
                                if (!empty($contact) || !empty($individualsCount)) { // Check primary fields
                                    $needsDetails = $displaced['الاحتياجاتالحالية'] ?? [];
                                    DisplacedFamily::create([
                                        'shelter_id' => $shelter->id,
                                        'individuals_count' => $individualsCount,
                                        'contact' => $contact,
                                        'wife_name' => $this->convertToString($displaced['اسمالزوجة'] ?? null),
                                        'children_info' => $this->convertToString($displaced['أسماءوأعمارالأطفال'] ?? null),
                                        'needs' => $this->convertToString($needsDetails['يرجىاختيارالاحتياجات'] ?? null),
                                        'assistance_type' => $this->convertToString($needsDetails['نوعالمساعدة'] ?? null),
                                        'provider' => $this->convertToString($needsDetails['الجهةالمقدمةللمساعدة'] ?? null),
                                        'date_received' => $this->convertToString($needsDetails['تاريخالحصولعليها'] ?? null),
                                        'notes' => $this->convertToString($needsDetails['ملاحظاتإضافية'] ?? null),
                                        'return_possible' => $this->convertToString($needsDetails['إمكانيةالعودةللمنزل2'] ?? null),
                                        'previous_assistance' => $this->convertToString($needsDetails['هلتمتلقيمساعداتسابقة2'] ?? null),
                                        'images' => $this->extractImages($needsDetails['صوراوفيديوهاتللتوثيق2'] ?? []),
                                        'family_book_number' => $this->convertToString($displaced['رقمدفترالعائلةإنوجد'] ?? null),
                                    ]);
                                }
                            }
                        }
                    }
                }
            }

            \DB::commit();
            return response()->json(['success' => true, 'entry_id' => $entry->id], 200);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Webhook processing failed', ['error' => $e->getMessage(), 'data' => $data]);
            return response()->json(['error' => 'Failed to process webhook: ' . $e->getMessage()], 500);
        }
    }
}
