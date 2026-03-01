import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export type StagingStyle =
  | "modern"
  | "scandinavian"
  | "luxury"
  | "coastal"
  | "industrial"
  | "traditional"
  | "bohemian"
  | "japandi"
  | "farmhouse"
  | "art_deco"
  | "mediterranean"
  | "mid_century"
  | "minimalist"
  | "maximalist"
  | "contemporary"
  | "rustic"
  | "eclectic"
  | "french_country"
  | "hamptons"
  | "tropical"
  | "wabi_sabi"
  | "hollywood_regency"
  | "craftsman"
  | "victorian"
  | "bauhaus"
  | "biophilic"
  | "zen"
  | "urban_modern"
  | "dark_academia"
  | "cottagecore"
  | "southwestern"
  | "moroccan"
  | "japanese_modern"
  | "korean_minimal"
  | "chinoiserie"
  | "italian_villa"
  | "tuscan"
  | "parisian"
  | "brooklyn_loft"
  | "alpine"
  | "transitional"
  | "organic_modern"
  | "moody_dark"
  | "retro_70s"
  | "futuristic"
  | "grandmillennial"
  | "art_nouveau"
  | "neoclassical"
  | "ski_chalet"
  | "renovation"
  | "declutter";

const STYLE_PROMPTS: Record<StagingStyle, string> = {
  modern:
    "modern interior design, clean lines, neutral color palette, minimalist furniture, contemporary decor, natural light, professional real estate photography",
  scandinavian:
    "scandinavian interior design, hygge, white walls, light wood furniture, cozy textiles, minimalist nordic style, professional real estate photography",
  luxury:
    "luxury interior design, high-end furniture, marble accents, gold fixtures, elegant decor, premium materials, sophisticated ambiance, professional real estate photography",
  coastal:
    "coastal beach house interior design, light blue and white palette, natural textures, driftwood accents, linen fabrics, airy atmosphere, professional real estate photography",
  industrial:
    "industrial interior design, exposed brick, metal accents, leather furniture, raw textures, urban loft aesthetic, warm lighting, professional real estate photography",
  traditional:
    "traditional interior design, classic furniture, warm colors, ornate details, crown molding, timeless elegance, professional real estate photography",
  bohemian:
    "bohemian interior design, eclectic mix of patterns and textures, vibrant colors, macrame wall hangings, layered rugs, plants, vintage furniture, free-spirited atmosphere, professional real estate photography",
  japandi:
    "japandi interior design, Japanese-Scandinavian fusion, wabi-sabi aesthetics, natural wood, muted earthy tones, minimal clutter, paper lanterns, zen-like serenity, professional real estate photography",
  farmhouse:
    "modern farmhouse interior design, shiplap walls, reclaimed wood, neutral whites and grays, vintage accents, cozy textiles, barn-style details, warm and inviting atmosphere, professional real estate photography",
  art_deco:
    "art deco interior design, bold geometric patterns, gold and black accents, mirrored surfaces, velvet upholstery, glamorous lighting, 1920s inspired luxury, professional real estate photography",
  mediterranean:
    "mediterranean interior design, warm terracotta tones, cobalt blue accents, arched doorways, wrought iron details, mosaic tiles, whitewashed walls, rustic wood beams, professional real estate photography",
  mid_century:
    "mid-century modern interior design, retro 1950s-1960s furniture, organic shapes, teak wood, iconic Eames-style chairs, bold accent colors, open floor plan, professional real estate photography",
  minimalist:
    "minimalist interior design, bare white walls, single statement piece of furniture, negative space, monochrome palette, no clutter, clean surfaces, serene and calming atmosphere, professional real estate photography",
  maximalist:
    "maximalist interior design, bold layered patterns, rich jewel tones, gallery walls, abundant plants, collected objects, ornate rugs, lush textiles, vibrant and expressive space, professional real estate photography",
  contemporary:
    "contemporary interior design, current design trends, neutral base with bold accents, mixed materials, sculptural lighting, streamlined furniture, open and airy, professional real estate photography",
  rustic:
    "rustic interior design, raw natural wood beams, stone fireplace, rough-hewn furniture, earth tones, wool blankets, antler decor, cozy and warm cabin feel, professional real estate photography",
  eclectic:
    "eclectic interior design, curated mix of styles and eras, unexpected combinations, bold colors, vintage and modern pieces together, personal and layered aesthetic, professional real estate photography",
  french_country:
    "french country interior design, Provence inspired, soft linens, floral patterns, distressed wood furniture, warm butter yellows and sage greens, wrought iron accents, charming and romantic, professional real estate photography",
  hamptons:
    "hamptons interior design, preppy coastal elegance, crisp white and navy palette, wainscoting, rattan furniture, nautical accents, linen upholstery, bright and breezy, professional real estate photography",
  tropical:
    "tropical interior design, lush indoor plants, banana leaf prints, rattan and bamboo furniture, vibrant greens and bright accents, natural materials, resort-style paradise feel, professional real estate photography",
  wabi_sabi:
    "wabi-sabi interior design, beauty in imperfection, weathered textures, handmade ceramics, raw linen, unfinished wood, muted organic palette, asymmetric compositions, peaceful and authentic, professional real estate photography",
  hollywood_regency:
    "Hollywood Regency interior design, old Hollywood glamour, lacquered surfaces, mirrored furniture, bold zebra and leopard prints, jewel tones, dramatic lighting, Art Deco flourishes, professional real estate photography",
  craftsman:
    "craftsman interior design, handcrafted woodwork, built-in bookshelves, exposed joinery, warm brown and green tones, simple functional furniture, arts and crafts movement, professional real estate photography",
  victorian:
    "victorian interior design, ornate carved wood furniture, rich burgundy and forest green tones, tufted velvet sofas, heavy drapes, framed portraits, detailed moldings, dramatic and grand, professional real estate photography",
  bauhaus:
    "Bauhaus interior design, form follows function, geometric shapes, primary color accents, steel and glass, flat surfaces, no ornamentation, rationalist and clean, professional real estate photography",
  biophilic:
    "biophilic interior design, large indoor plants, living green walls, natural wood and stone, abundant natural light, water features, organic shapes, nature-infused serene living, professional real estate photography",
  zen: "zen interior design, Buddhist-inspired minimalism, tatami mat flooring, shoji screens, bonsai tree, smooth river stones, neutral sand and white tones, meditative and tranquil atmosphere, professional real estate photography",
  urban_modern:
    "urban modern interior design, city loft aesthetic, polished concrete floors, floor-to-ceiling windows, sleek dark metals, statement art, curated collection of plants, professional real estate photography",
  dark_academia:
    "dark academia interior design, rich mahogany bookshelves floor to ceiling, oxblood leather chair, antique globes and maps, warm candlelight, dark wallpaper, scholarly and moody, professional real estate photography",
  cottagecore:
    "cottagecore interior design, whimsical English countryside, hand-painted florals, vintage china cabinets, gingham textiles, herb pots on windowsill, floral wallpaper, romantically nostalgic, professional real estate photography",
  southwestern:
    "southwestern interior design, adobe walls, desert terracotta palette, Navajo-pattern rugs, hammered copper accents, cactus plants, turquoise accessories, warm sand and clay tones, professional real estate photography",
  moroccan:
    "Moroccan interior design, richly patterned zellige tiles, lantern pendant lights, arched doorways, jewel-toned poufs and cushions, plaster walls, intricate carved wood, exotic and warm, professional real estate photography",
  japanese_modern:
    "modern Japanese interior design, tatami and hardwood mix, sliding shoji screens, neutral rice-paper tones, low-profile furniture, ikebana floral arrangement, clean and serene, professional real estate photography",
  korean_minimal:
    "Korean minimal interior design, soft cream and off-white tones, curved gentle furniture, warm lighting, subtle texture, cozy yet refined, clean lines, understated elegance, professional real estate photography",
  chinoiserie:
    "Chinoiserie interior design, hand-painted Asian botanical wallpaper, lacquered red and gold furniture, blue and white porcelain vases, silk cushions, bamboo and cherry blossom motifs, opulent and exotic, professional real estate photography",
  italian_villa:
    "Italian villa interior design, soaring ceilings with frescoes, polished travertine floors, ornate gilded mirrors, silk draperies, antique marble busts, rich and opulent European grandeur, professional real estate photography",
  tuscan:
    "Tuscan interior design, warm terracotta and golden ochre walls, rough plaster finish, heavy wooden beams, wrought iron chandeliers, stone floors, old-world Italian countryside warmth, professional real estate photography",
  parisian:
    "Parisian interior design, Haussmann apartment, herringbone parquet floors, marble fireplace, antique gilded mirror, linen curtains, effortlessly chic neutral palette, sophisticated and light-filled, professional real estate photography",
  brooklyn_loft:
    "Brooklyn loft interior design, exposed red brick wall, raw concrete ceiling, reclaimed wood floors, Edison bulb pendants, industrial steel windows, curated art prints, creative urban energy, professional real estate photography",
  alpine:
    "alpine ski chalet interior design, warm pine cladding walls, stone fireplace, plaid wool throws, antler chandeliers, bear-skin rug, mountain views, cozy and inviting winter retreat, professional real estate photography",
  transitional:
    "transitional interior design, perfect balance of traditional and modern, neutral color palette, clean-lined upholstered furniture with classic proportions, subtle textures, timeless and sophisticated, professional real estate photography",
  organic_modern:
    "organic modern interior design, natural curved shapes, stone and clay textures, earthy neutral palette, raw linen, live-edge wood tables, bouclé upholstery, warm sculptural lighting, professional real estate photography",
  moody_dark:
    "moody dark interior design, deep charcoal and forest green walls, dark wood floors, black steel windows, velvet jewel-toned furniture, dramatic lighting, rich and theatrical atmosphere, professional real estate photography",
  retro_70s:
    "retro 1970s interior design, harvest gold and burnt sienna palette, shag carpet, macrame wall art, mushroom lamp, barrel chairs, walnut wood paneling, groovy vintage warmth, professional real estate photography",
  futuristic:
    "futuristic interior design, white curved walls, integrated LED strip lighting, smart tech surfaces, chrome and perspex furniture, floating shelves, monochrome space-age aesthetic, professional real estate photography",
  grandmillennial:
    "grandmillennial interior design, granny chic reimagined, chintz floral upholstery, ruffled lampshades, Gallery wall of family portraits, needlepoint pillows, warm and layered nostalgia, professional real estate photography",
  art_nouveau:
    "Art Nouveau interior design, sinuous organic curves, stained glass windows, botanical motifs carved in wood, peacock and lily patterns, pastel greens and lavenders, flowing elegant lines, professional real estate photography",
  neoclassical:
    "neoclassical interior design, symmetrical layout, Greco-Roman columns, white marble flooring, gilded furnishings, ornate plasterwork ceiling, draped silk curtains, grand and formal, professional real estate photography",
  ski_chalet:
    "luxury ski chalet interior design, vaulted timber ceilings, stone and wood feature wall, oversized fireplace, sheepskin throws, mountain-view floor-to-ceiling windows, warm amber lighting, professional real estate photography",
  renovation:
    "post-renovation interior design, fresh paint, updated fixtures, modern finishes, bright and open space, new hardwood floors, clean and polished look, showing full potential of the property, professional real estate photography",
  declutter:
    "completely empty and clean room, all furniture and items removed, freshly painted white walls, clean bare floors, bright natural light, minimal and neutral, ready for staging, professional real estate photography",
};

export interface StagingResult {
  predictionId: string;
  outputUrl: string | null;
  status: "starting" | "processing" | "succeeded" | "failed";
}

function buildPrompt(style: StagingStyle, prompt: string): string {
  if (style === "declutter")
    return `${prompt}. Remove all furniture, clutter and personal items. Keep the exact same room structure, walls, floors, windows and doors.`;
  if (style === "renovation")
    return `${prompt}. Keep the same room dimensions and structure but update all surfaces, finishes and fixtures to look freshly renovated.`;
  return `Transform this empty room into a beautifully furnished and staged space with ${prompt}. Keep the same room layout, walls, windows and floors. Add furniture, decor, and lighting.`;
}

/** Legacy single-step generate (used by existing /staging/generate route) */
export async function generateStaging(
  imageUrl: string,
  style: StagingStyle,
): Promise<StagingResult> {
  const prompt = STYLE_PROMPTS[style];
  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-kontext-pro",
    input: {
      input_image: imageUrl,
      prompt: buildPrompt(style, prompt),
      output_quality: 90,
    },
  });
  return { predictionId: prediction.id, outputUrl: null, status: "starting" };
}

/**
 * Preview generation — lower output_quality for faster turnaround.
 * Result will be watermarked + resized to 1024px by the API layer.
 */
export async function generateStagingPreview(
  imageUrl: string,
  style: StagingStyle,
): Promise<StagingResult> {
  const prompt = STYLE_PROMPTS[style];
  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-kontext-pro",
    input: {
      input_image: imageUrl,
      prompt: buildPrompt(style, prompt),
      output_quality: 65, // fast preview — watermarked anyway
    },
  });
  return { predictionId: prediction.id, outputUrl: null, status: "starting" };
}

/**
 * HD generation — maximum quality, no watermark, full resolution.
 * Only called after preview is approved + credit deducted.
 */
export async function generateStagingHd(
  imageUrl: string,
  style: StagingStyle,
): Promise<StagingResult> {
  const prompt = STYLE_PROMPTS[style];
  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-kontext-pro",
    input: {
      input_image: imageUrl,
      prompt: buildPrompt(style, prompt),
      output_quality: 95, // maximum HD quality
    },
  });
  return { predictionId: prediction.id, outputUrl: null, status: "starting" };
}

export async function getPredictionStatus(
  predictionId: string,
): Promise<StagingResult> {
  const prediction = await replicate.predictions.get(predictionId);

  let outputUrl: string | null = null;
  if (prediction.status === "succeeded" && prediction.output) {
    outputUrl =
      typeof prediction.output === "string"
        ? prediction.output
        : (prediction.output as string[])[0];
  }

  return {
    predictionId: prediction.id,
    outputUrl,
    status: prediction.status as StagingResult["status"],
  };
}
