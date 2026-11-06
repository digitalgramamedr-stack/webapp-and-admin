export interface DigiPrintItem {
  id: string;
  titleMl: string;
  titleEn: string;
  category: 'frames' | 'polaroid' | 'gifts' | 'hampers' | 'cases';
  price: number;
  originalPrice: number;
  priceRange: string;
  badge: string;
  descriptionMl: string;
  features: string[];
  colorClass: string;
}

export const DIGIPRINT_ITEMS: DigiPrintItem[] = [
  {
    id: 'a4-photo-frame',
    titleMl: 'A4 സൈസ് ഫോട്ടോ ഫ്രെയിം',
    titleEn: 'A4 Size Custom Photo Frame',
    category: 'frames',
    price: 349,
    originalPrice: 499,
    priceRange: '₹349',
    badge: 'Bestseller',
    descriptionMl: 'ഉയർന്ന ക്വാളിറ്റി പ്രിന്റും പ്രീമിയം ഗ്ലാസ്/മാറ്റ് ഫിനിഷുമുള്ള A4 ഫോട്ടോ ഫ്രെയിം. ജന്മദിനം, വിവാഹ വാർഷികം എന്നിവയ്ക്ക് അനുയോജ്യം.',
    features: ['8 x 12 Inches (A4)', 'HD Glossy / Matte Lamination', 'Custom Name & Wish Design', 'Wall Mount & Table Stand'],
    colorClass: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'a3-photo-frame',
    titleMl: 'A3 സൈസ് വലിയ ഫോട്ടോ ഫ്രെയിം',
    titleEn: 'A3 Size Premium Photo Frame',
    category: 'frames',
    price: 699,
    originalPrice: 899,
    priceRange: '₹699',
    badge: 'Premium Large',
    descriptionMl: 'വലിയ സൈസിൽ കുടുംബ ചിത്രങ്ങളും വെഡ്ഡിംഗ് ഫോട്ടോകളും കൊളാഷ് ഡിസൈനുകളും ഫ്രെയിം ചെയ്യാൻ മികച്ച A3 ഫ്രെയിം.',
    features: ['12 x 18 Inches (A3)', 'Synthetic Wood Border', 'Waterproof Matte Lamination', 'Free Collage Layout Design'],
    colorClass: 'from-indigo-600 to-purple-700',
  },
  {
    id: 'mini-photo-frame',
    titleMl: 'മിനി ഫോട്ടോ ഫ്രെയിമുകൾ',
    titleEn: 'Mini Table-Top Photo Frames',
    category: 'frames',
    price: 179,
    originalPrice: 249,
    priceRange: '₹179',
    badge: 'Cute Gift',
    descriptionMl: 'ടേബിളിലും ഷെൽഫിലും വെക്കാൻ മനോഹരമായ മിനി ഫോട്ടോ ഫ്രെയിമുകൾ (4x6, 5x7, 6x8 സൈസുകളിൽ).',
    features: ['Compact Table-Top Stand', 'Multiple Border Colors', 'Crystal Clear Print', 'Same-Day / Next-Day Ready'],
    colorClass: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'polaroid-photos',
    titleMl: 'പോളറോയിഡ് ഫോട്ടോസ് (Polaroid Prints - Set of 12)',
    titleEn: 'Custom Polaroid Photo Prints Set',
    category: 'polaroid',
    price: 129,
    originalPrice: 199,
    priceRange: '₹129 / Set',
    badge: 'Trending',
    descriptionMl: 'നിങ്ങളുടെ പ്രിയപ്പെട്ട മൊബൈൽ ചിത്രങ്ങൾ മനോഹരമായ വിന്റേജ് പോളറോയിഡ് കാർഡുകളായി പ്രിന്റ് ചെയ്യാം. ക്യാപ്ഷനും Spotify കോഡും ചേർക്കാം!',
    features: ['300 GSM Heavy Glossy/Luster Paper', 'Custom Text / Date / Spotify Barcode', 'Optional Fairy Lights & Wooden Clips', 'Fade-Resistant HD Ink'],
    colorClass: 'from-pink-500 to-rose-600',
  },
  {
    id: 'customized-keychain',
    titleMl: 'കസ്റ്റമൈസ്ഡ് കീചെയിൻ',
    titleEn: 'Customized Photo & Name Keychains',
    category: 'gifts',
    price: 99,
    originalPrice: 149,
    priceRange: '₹99',
    badge: 'Custom Gift',
    descriptionMl: 'ഫോട്ടോ, പേര്, വാഹന നമ്പർ അല്ലെങ്കിൽ Spotify കോഡ് പ്രിന്റ് ചെയ്ത അക്രിലിക്, മെറ്റൽ, വുഡൻ കീചെയിനുകൾ.',
    features: ['Double-Sided Photo Print', 'Acrylic / Metal / Wooden Shapes', 'Vehicle Number Plate Keychain', 'Spotify Plaque Keychain'],
    colorClass: 'from-amber-500 to-orange-600',
  },
  {
    id: 'gift-hampers',
    titleMl: 'കസ്റ്റമൈസ്ഡ് ഗിഫ്റ്റ് ഹാംപറുകൾ',
    titleEn: 'Curated Custom Gift Hampers',
    category: 'hampers',
    price: 799,
    originalPrice: 1099,
    priceRange: '₹799',
    badge: 'Special Occasion',
    descriptionMl: 'ഫോട്ടോ ഫ്രെയിം, പോളറോയിഡുകൾ, കീചെയിൻ, ചോക്ലേറ്റുകൾ, വിഷ് കാർഡ് എന്നിവ അടങ്ങിയ മനോഹരമായ ഗിഫ്റ്റ് ഹാംപർ ബോക്സ്.',
    features: ['Custom Theme Box Packing', 'Includes Polaroids + Mini Frame + Keychain', 'Chocolates & Personalized Message Card', 'Birthday / Anniversary / Bride-to-be'],
    colorClass: 'from-purple-600 to-pink-600',
  },
  {
    id: 'box-case-covers',
    titleMl: 'ബോക്സ് കേസ് & കസ്റ്റം മൊബൈൽ കവർ',
    titleEn: 'Customized Box Case & Phone Covers',
    category: 'cases',
    price: 249,
    originalPrice: 349,
    priceRange: '₹249',
    badge: 'All Models',
    descriptionMl: 'നിങ്ങളുടെ ഫോട്ടോയോ ഡിസൈനോ പ്രിന്റ് ചെയ്ത പ്രീമിയം ബോക്സ് കേസുകളും ഹാർഡ്/സിലിക്കൺ മൊബൈൽ ബാക്ക് കവറുകളും.',
    features: ['Available for All iPhone & Android Models', 'Scratch-Proof Sublimation / UV Print', 'Custom Gift Box Case Available', 'Vibrant Long-Lasting Colors'],
    colorClass: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'customized-gift-items',
    titleMl: 'മാജിക് മഗ് & ഫോട്ടോ ഗിഫ്റ്റ് ഐറ്റംസ്',
    titleEn: 'Magic Mug, LED Lamp, Cushion & Custom Gifts',
    category: 'gifts',
    price: 299,
    originalPrice: 449,
    priceRange: '₹299',
    badge: 'All-in-One',
    descriptionMl: 'മാജിക് മഗ്, വൈറ്റ് ഫോട്ടോ മഗ്, എൽഇഡി ഫോട്ടോ ലാമ്പ്, ഫോട്ടോ കുഷൻ പില്ലോ, കസ്റ്റം ടി-ഷർട്ട് പ്രിന്റിംഗ്.',
    features: ['Heat-Sensitive Magic Mugs', 'Acrylic 3D LED Night Lamps', 'Soft Fur Photo Pillows', 'Custom Logo / Event T-Shirts'],
    colorClass: 'from-teal-600 to-emerald-700',
  },
];
